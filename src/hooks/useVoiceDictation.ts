import { useCallback, useEffect, useRef, useState } from 'react';

interface SpeechRecognitionAlternativeLike {
  transcript?: string;
}

interface SpeechRecognitionResultLike {
  isFinal?: boolean;
  length: number;
  [index: number]: SpeechRecognitionAlternativeLike;
}

interface SpeechRecognitionEventLike {
  resultIndex?: number;
  results: {
    length: number;
    [index: number]: SpeechRecognitionResultLike;
  };
}

interface SpeechRecognitionErrorEventLike {
  error?: string;
}

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onsoundstart: (() => void) | null;
  onspeechstart: (() => void) | null;
  onspeechend: (() => void) | null;
  onsoundend: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const win = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return win.SpeechRecognition || win.webkitSpeechRecognition || null;
}

function mergeDictatedText(baseText: string, spokenText: string): string {
  const spoken = spokenText.replace(/\s+/g, ' ').trim();
  if (!spoken) return baseText;
  if (!baseText.trim()) return spoken;
  const endsWithWhitespace = /\s$/.test(baseText);
  return `${baseText}${endsWithWhitespace ? '' : ' '}${spoken}`;
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      const commaIdx = result.indexOf(',');
      resolve(commaIdx >= 0 ? result.slice(commaIdx + 1) : '');
    };
    reader.onerror = () => reject(new Error('Failed to read recorded audio.'));
    reader.readAsDataURL(blob);
  });
}

export type VoiceDictationStatus = 'idle' | 'listening' | 'transcribing';

interface UseVoiceDictationOptions {
  text: string;
  onTextChange: (nextText: string) => void;
}

export function useVoiceDictation({
  text,
  onTextChange,
}: UseVoiceDictationOptions) {
  const [status, setStatus] = useState<VoiceDictationStatus>('idle');
  const [voiceLevel, setVoiceLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const textRef = useRef(text);
  textRef.current = text;
  const onTextChangeRef = useRef(onTextChange);
  onTextChangeRef.current = onTextChange;

  const baseTextRef = useRef('');
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const stoppedManuallyRef = useRef(false);
  const heardSpeechRef = useRef(false);
  const silenceTimerRef = useRef<number | null>(null);
  const idleTimeoutRef = useRef<number | null>(null);
  const levelDecayTimerRef = useRef<number | null>(null);

  // Fallback MediaRecorder refs
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const rafMeterRef = useRef<number | null>(null);

  const clearTimers = useCallback(() => {
    if (silenceTimerRef.current !== null) {
      window.clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (idleTimeoutRef.current !== null) {
      window.clearTimeout(idleTimeoutRef.current);
      idleTimeoutRef.current = null;
    }
    if (levelDecayTimerRef.current !== null) {
      window.clearTimeout(levelDecayTimerRef.current);
      levelDecayTimerRef.current = null;
    }
    if (rafMeterRef.current !== null) {
      window.cancelAnimationFrame(rafMeterRef.current);
      rafMeterRef.current = null;
    }
  }, []);

  const cleanupFallbackAudio = useCallback(() => {
    if (rafMeterRef.current !== null) {
      window.cancelAnimationFrame(rafMeterRef.current);
      rafMeterRef.current = null;
    }
    if (audioContextRef.current) {
      void audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    stoppedManuallyRef.current = true;
    clearTimers();

    if (recognitionRef.current) {
      const rec = recognitionRef.current;
      recognitionRef.current = null;
      try {
        rec.stop();
      } catch {
        // ignore stop errors
      }
      setVoiceLevel(0);
      setStatus('idle');
      return;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        cleanupFallbackAudio();
        setVoiceLevel(0);
        setStatus('idle');
      }
      return;
    }

    cleanupFallbackAudio();
    setVoiceLevel(0);
    setStatus('idle');
  }, [cleanupFallbackAudio, clearTimers]);

  const pulseVoiceLevel = useCallback((energy: number) => {
    setVoiceLevel(Math.min(1, Math.max(0.25, energy)));
    if (levelDecayTimerRef.current !== null) {
      window.clearTimeout(levelDecayTimerRef.current);
    }
    levelDecayTimerRef.current = window.setTimeout(() => {
      setVoiceLevel(0.16);
    }, 340);
  }, []);

  const startMediaRecorderFallback = useCallback(async () => {
    if (
      typeof navigator === 'undefined' ||
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === 'undefined'
    ) {
      setError('Microphone dictation is not supported in this browser.');
      setStatus('idle');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      audioChunksRef.current = [];

      const mimeCandidates = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
      ];
      const supportedMime = mimeCandidates.find(
        (m) => typeof MediaRecorder.isTypeSupported === 'function' && MediaRecorder.isTypeSupported(m)
      );
      const recorder = supportedMime
        ? new MediaRecorder(stream, { mimeType: supportedMime })
        : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) {
          audioChunksRef.current.push(ev.data);
        }
      };

      recorder.onstop = async () => {
        clearTimers();
        cleanupFallbackAudio();
        mediaRecorderRef.current = null;
        setVoiceLevel(0);

        const chunks = audioChunksRef.current;
        audioChunksRef.current = [];
        if (chunks.length === 0) {
          setStatus('idle');
          return;
        }

        const blob = new Blob(chunks, {
          type: recorder.mimeType || supportedMime || 'audio/webm',
        });

        setStatus('transcribing');
        try {
          const audioBase64 = await blobToBase64(blob);
          if (!audioBase64) {
            setStatus('idle');
            return;
          }
          const res = await fetch('/api/transcribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              audioBase64,
              mimeType: blob.type || 'audio/webm',
              language: navigator.language || 'en-US',
            }),
          });
          const data = (await res.json()) as { text?: string; error?: string };
          if (!res.ok) {
            throw new Error(data.error || 'Voice transcription failed.');
          }
          if (data.text) {
            onTextChangeRef.current(
              mergeDictatedText(baseTextRef.current, data.text)
            );
          }
        } catch (err) {
          setError(
            err instanceof Error ? err.message : 'Unable to transcribe voice.'
          );
        } finally {
          setStatus('idle');
        }
      };

      // Real-time microphone energy + automatic silence stop
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;

      if (AudioCtx) {
        const audioCtx = new AudioCtx();
        audioContextRef.current = audioCtx;
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 512;
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.fftSize);
        let speechActive = false;
        let lastSoundAt = Date.now();
        const startedAt = Date.now();

        const monitor = () => {
          if (!mediaRecorderRef.current || mediaRecorderRef.current.state !== 'recording') {
            return;
          }
          analyser.getByteTimeDomainData(dataArray);
          let sumSq = 0;
          for (let i = 0; i < dataArray.length; i += 1) {
            const centered = (dataArray[i] - 128) / 128;
            sumSq += centered * centered;
          }
          const rms = Math.sqrt(sumSq / dataArray.length);
          const normalized = Math.min(1, rms * 6.5);
          setVoiceLevel(normalized);

          const now = Date.now();
          if (rms > 0.032) {
            speechActive = true;
            lastSoundAt = now;
          }

          if (speechActive && now - lastSoundAt > 1600) {
            mediaRecorderRef.current.stop();
            return;
          }
          if (!speechActive && now - startedAt > 7500) {
            mediaRecorderRef.current.stop();
            return;
          }

          rafMeterRef.current = window.requestAnimationFrame(monitor);
        };
        rafMeterRef.current = window.requestAnimationFrame(monitor);
      } else {
        idleTimeoutRef.current = window.setTimeout(() => {
          if (mediaRecorderRef.current?.state === 'recording') {
            mediaRecorderRef.current.stop();
          }
        }, 7000);
      }

      setStatus('listening');
      recorder.start(250);
    } catch {
      cleanupFallbackAudio();
      setVoiceLevel(0);
      setStatus('idle');
      setError('Microphone access was denied.');
    }
  }, [cleanupFallbackAudio, clearTimers]);

  const start = useCallback(() => {
    setError(null);
    baseTextRef.current = textRef.current;
    stoppedManuallyRef.current = false;
    heardSpeechRef.current = false;
    clearTimers();

    const SpeechCtor = getSpeechRecognitionCtor();
    if (!SpeechCtor) {
      void startMediaRecorderFallback();
      return;
    }

    try {
      const recognition = new SpeechCtor();
      recognitionRef.current = recognition;

      const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
      const isAppleWebKit =
        /iPad|iPhone|iPod/.test(ua) ||
        (/Safari/.test(ua) && !/Chrome|Chromium|Edg/.test(ua));

      recognition.lang = (typeof navigator !== 'undefined' && navigator.language) || 'en-US';
      recognition.continuous = !isAppleWebKit;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      const scheduleAutoStopAfterSilence = (delayMs: number) => {
        if (silenceTimerRef.current !== null) {
          window.clearTimeout(silenceTimerRef.current);
        }
        silenceTimerRef.current = window.setTimeout(() => {
          if (recognitionRef.current === recognition) {
            try {
              recognition.stop();
            } catch {
              // ignore
            }
          }
        }, delayMs);
      };

      recognition.onstart = () => {
        setStatus('listening');
        setVoiceLevel(0.22);
        // Safety auto-stop if nothing is spoken within 7.5s
        idleTimeoutRef.current = window.setTimeout(() => {
          if (!heardSpeechRef.current && recognitionRef.current === recognition) {
            try {
              recognition.stop();
            } catch {
              // ignore
            }
          }
        }, 7500);
      };

      recognition.onsoundstart = () => {
        pulseVoiceLevel(0.5);
      };

      recognition.onspeechstart = () => {
        heardSpeechRef.current = true;
        if (idleTimeoutRef.current !== null) {
          window.clearTimeout(idleTimeoutRef.current);
          idleTimeoutRef.current = null;
        }
        pulseVoiceLevel(0.75);
      };

      recognition.onresult = (event) => {
        heardSpeechRef.current = true;
        if (idleTimeoutRef.current !== null) {
          window.clearTimeout(idleTimeoutRef.current);
          idleTimeoutRef.current = null;
        }

        const finals: string[] = [];
        const interims: string[] = [];
        for (let i = 0; i < event.results.length; i += 1) {
          const item = event.results[i];
          const rawTranscript = (item?.[0]?.transcript || '').trim();
          if (!rawTranscript) continue;
          if (item.isFinal) {
            const prevFinal = finals[finals.length - 1];
            if (prevFinal?.toLowerCase() !== rawTranscript.toLowerCase()) {
              finals.push(rawTranscript);
            }
          } else {
            interims.push(rawTranscript);
          }
        }

        const combinedSpeech = [...finals, ...interims]
          .filter(Boolean)
          .join(' ')
          .replace(/\s+([,.!?;:])/g, '$1')
          .trim();

        if (combinedSpeech) {
          onTextChangeRef.current(
            mergeDictatedText(baseTextRef.current, combinedSpeech)
          );
          pulseVoiceLevel(0.58 + Math.random() * 0.42);
        }

        // Auto-stop smoothly after user finishes speaking
        scheduleAutoStopAfterSilence(1850);
      };

      recognition.onspeechend = () => {
        setVoiceLevel(0.14);
        if (heardSpeechRef.current) {
          scheduleAutoStopAfterSilence(950);
        }
      };

      recognition.onsoundend = () => {
        setVoiceLevel(0.12);
      };

      recognition.onerror = (ev) => {
        const errCode = ev?.error || '';
        clearTimers();
        if (recognitionRef.current === recognition) {
          recognitionRef.current = null;
        }

        if (
          !stoppedManuallyRef.current &&
          (errCode === 'service-not-allowed' || errCode === 'language-not-supported')
        ) {
          void startMediaRecorderFallback();
          return;
        }

        setVoiceLevel(0);
        setStatus('idle');

        if (errCode === 'not-allowed' || errCode === 'audio-capture') {
          setError('Allow microphone access to use voice typing.');
        }
      };

      recognition.onend = () => {
        clearTimers();
        if (recognitionRef.current === recognition) {
          recognitionRef.current = null;
        }
        setVoiceLevel(0);
        setStatus('idle');
      };

      recognition.start();
    } catch {
      recognitionRef.current = null;
      void startMediaRecorderFallback();
    }
  }, [clearTimers, pulseVoiceLevel, startMediaRecorderFallback]);

  const toggle = useCallback(() => {
    if (status === 'transcribing') return;
    if (status === 'listening') {
      stop();
    } else {
      start();
    }
  }, [start, status, stop]);

  useEffect(() => {
    return () => {
      clearTimers();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
        recognitionRef.current = null;
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch {
          // ignore
        }
      }
      cleanupFallbackAudio();
    };
  }, [cleanupFallbackAudio, clearTimers]);

  return {
    status,
    isListening: status === 'listening',
    isTranscribing: status === 'transcribing',
    voiceLevel,
    error,
    clearError: () => setError(null),
    start,
    stop,
    toggle,
  };
}

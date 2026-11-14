import { useCallback, useEffect, useRef, useState } from 'react';

function cleanTextForSpeech(rawText: string): string {
  return rawText
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/[*_~#>]+/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

export function isSpeechSynthesisSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    typeof window.SpeechSynthesisUtterance !== 'undefined'
  );
}

/**
 * Call synchronously inside a user tap/submit event so mobile browsers
 * (especially iOS Safari) allow subsequent automatic narration after async fetch.
 */
export function unlockSpeechSynthesis(): void {
  if (!isSpeechSynthesisSupported()) return;
  try {
    window.speechSynthesis.getVoices();
    const primer = new window.SpeechSynthesisUtterance(' ');
    primer.volume = 0;
    primer.rate = 10;
    window.speechSynthesis.speak(primer);
  } catch {
    // ignore browser speech priming restrictions
  }
}

export function useSpeechNarration() {
  const [speakingTurnId, setSpeakingTurnId] = useState<string | null>(null);
  const supported = isSpeechSynthesisSupported();
  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const stop = useCallback(() => {
    if (!supported) return;
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore cancel errors
    }
    activeUtteranceRef.current = null;
    setSpeakingTurnId(null);
  }, [supported]);

  const speakTurn = useCallback(
    (turnId: string, rawText: string) => {
      if (!supported) return;
      const cleanText = cleanTextForSpeech(rawText);
      if (!cleanText) return;

      try {
        window.speechSynthesis.cancel();

        const utterance = new window.SpeechSynthesisUtterance(cleanText);
        utterance.rate = 1;
        utterance.pitch = 1;
        utterance.volume = 1;

        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          const langPrefix = (navigator.language || 'en').slice(0, 2).toLowerCase();
          const preferredVoice =
            voices.find(
              (v) =>
                v.lang.toLowerCase().startsWith(langPrefix) &&
                v.localService
            ) ||
            voices.find((v) => v.lang.toLowerCase().startsWith(langPrefix)) ||
            voices[0];
          if (preferredVoice) {
            utterance.voice = preferredVoice;
          }
        }

        utterance.onstart = () => {
          setSpeakingTurnId(turnId);
        };
        utterance.onend = () => {
          if (activeUtteranceRef.current === utterance) {
            activeUtteranceRef.current = null;
            setSpeakingTurnId(null);
          }
        };
        utterance.onerror = () => {
          if (activeUtteranceRef.current === utterance) {
            activeUtteranceRef.current = null;
            setSpeakingTurnId(null);
          }
        };

        activeUtteranceRef.current = utterance;
        setSpeakingTurnId(turnId);
        window.speechSynthesis.speak(utterance);
      } catch {
        activeUtteranceRef.current = null;
        setSpeakingTurnId(null);
      }
    },
    [supported]
  );

  useEffect(() => {
    if (!supported) return;
    // Trigger voice list population in Chromium/Safari
    window.speechSynthesis.getVoices();
    return () => {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    };
  }, [supported]);

  return {
    supported,
    speakingTurnId,
    speakTurn,
    stop,
  };
}

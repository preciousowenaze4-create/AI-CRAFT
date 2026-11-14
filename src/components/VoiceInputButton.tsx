import { Loader2, Mic } from 'lucide-react';
import { VoiceDictationStatus } from '../hooks/useVoiceDictation';

interface VoiceInputButtonProps {
  status: VoiceDictationStatus;
  voiceLevel: number;
  accentColor: string;
  disabled?: boolean;
  onClick: () => void;
  variant?: 'toolbar' | 'inline';
}

export function VoiceInputButton({
  status,
  voiceLevel,
  accentColor,
  disabled = false,
  onClick,
  variant = 'toolbar',
}: VoiceInputButtonProps) {
  const isListening = status === 'listening';
  const isTranscribing = status === 'transcribing';

  // 4 reactive vertical audio bars while tracking the user's real voice
  const barMultipliers = [0.55, 1, 0.72, 0.88];

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || isTranscribing}
      aria-pressed={isListening}
      aria-label={
        isListening
          ? 'Stop voice input'
          : isTranscribing
            ? 'Transcribing voice...'
            : 'Speak into chat'
      }
      title={
        isListening
          ? 'Listening — tap to stop'
          : isTranscribing
            ? 'Transcribing speech...'
            : 'Tap to speak'
      }
      style={
        isListening
          ? {
              borderColor: accentColor,
              backgroundColor: `${accentColor}16`,
              color: accentColor,
              boxShadow: `0 0 0 ${Math.round(2 + voiceLevel * 4)}px ${accentColor}1F`,
            }
          : undefined
      }
      className={`relative w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all duration-150 active:scale-95 disabled:opacity-45 disabled:cursor-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A68F6] ${
        isListening
          ? 'border'
          : variant === 'inline'
            ? 'border border-black/[0.08] bg-[#FAFAFC] text-[#3F3F46] hover:bg-[#F1F1F5] hover:text-[#111118]'
            : 'border border-black/[0.09] text-[#3F3F46] hover:bg-black/[0.03] hover:text-[#111118]'
      }`}
    >
      {isTranscribing ? (
        <Loader2 className="w-[16px] h-[16px] animate-spin" style={{ color: accentColor }} />
      ) : isListening ? (
        <span className="flex items-center justify-center gap-[2.5px] h-4" aria-hidden="true">
          {barMultipliers.map((mult, idx) => {
            const heightPx = Math.round(5 + Math.max(0.18, voiceLevel) * 11 * mult);
            return (
              <span
                key={idx}
                className="w-[2.5px] rounded-full transition-all duration-100"
                style={{
                  height: `${Math.min(16, Math.max(4, heightPx))}px`,
                  backgroundColor: accentColor,
                }}
              />
            );
          })}
        </span>
      ) : (
        <Mic className="w-[17px] h-[17px] stroke-[1.85]" />
      )}
    </button>
  );
}

import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowUp, Globe, Paperclip, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useVoiceDictation } from '../hooks/useVoiceDictation';
import {
  BuildMode,
  ComposerOptions,
  MODE_THEMES,
  OpenRouterModel,
} from '../types/craft';
import { ProcessedAttachment, readAttachmentFile } from '../utils/attachment';
import { ModelSelectorPopover } from './ModelSelectorPopover';
import { ProviderLogo } from './ProviderLogo';
import { VoiceInputButton } from './VoiceInputButton';

interface PromptComposerProps {
  mode: BuildMode;
  prompt: string;
  onPromptChange: (value: string) => void;
  models: OpenRouterModel[];
  selectedModel: string;
  modelsLoading: boolean;
  modelsError: string | null;
  onSelectModel: (modelId: string) => void;
  onRetryModels: () => void;
  onSubmit: (options: ComposerOptions) => void;
}

export function PromptComposer({
  mode,
  prompt,
  onPromptChange,
  models,
  selectedModel,
  modelsLoading,
  modelsError,
  onSelectModel,
  onRetryModels,
  onSubmit,
}: PromptComposerProps) {
  const theme = MODE_THEMES[mode];
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [isFocused, setIsFocused] = useState(false);
  const [reactEnabled, setReactEnabled] = useState(true);
  const [backendEnabled, setBackendEnabled] = useState(false);
  const [webSearchEnabled, setWebSearchEnabled] = useState(true);
  const [attachment, setAttachment] = useState<ProcessedAttachment | null>(null);

  const activeModel = useMemo(
    () => models.find((m) => m.id === selectedModel) ?? null,
    [models, selectedModel]
  );

  const {
    status: voiceStatus,
    isListening,
    isTranscribing,
    voiceLevel,
    error: voiceError,
    clearError: clearVoiceError,
    stop: stopVoice,
    toggle: toggleVoice,
  } = useVoiceDictation({
    text: prompt,
    onTextChange: onPromptChange,
  });

  useEffect(() => {
    if (!voiceError) return;
    const t = window.setTimeout(clearVoiceError, 3200);
    return () => window.clearTimeout(t);
  }, [voiceError, clearVoiceError]);

  const hasContent = prompt.trim().length > 0 || attachment !== null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const processed = await readAttachmentFile(file);
    setAttachment(processed);
  };

  const handleSend = () => {
    if (!hasContent) return;
    stopVoice();
    onSubmit({
      reactEnabled,
      backendEnabled,
      webSearchEnabled,
      attachmentName: attachment?.name ?? null,
      attachmentDataUrl: attachment?.dataUrl ?? null,
      attachmentMimeType: attachment?.mimeType ?? null,
      attachmentText: attachment?.textContent ?? null,
    });
    setAttachment(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      className="relative w-full rounded-[24px] bg-white border transition-all duration-300 px-4 pt-2.5 pb-3 flex flex-col justify-between"
      style={{
        borderColor: isFocused
          ? mode === 'mobile'
            ? 'rgba(245, 158, 11, 0.45)'
            : 'rgba(192, 38, 211, 0.40)'
          : 'rgba(15, 15, 25, 0.08)',
        boxShadow: isFocused
          ? mode === 'mobile'
            ? '0 10px 30px rgba(245, 185, 55, 0.14)'
            : '0 10px 30px rgba(217, 70, 239, 0.14)'
          : '0 6px 24px rgba(15, 15, 30, 0.045)',
      }}
    >
      {/* Selected AI Header Bar at the top of the chat box */}
      <div className="flex items-center justify-between gap-2 pb-1.5 mb-1 border-b border-black/[0.05]">
        <div className="flex items-center gap-2 min-w-0">
          <ProviderLogo
            provider={activeModel?.provider}
            modelId={activeModel?.id || selectedModel}
            size={20}
            trackingColor={theme.accentColor}
          />
          <span className="text-[12.5px] font-medium text-[#18181B] truncate">
            {activeModel?.name ??
              (modelsLoading ? 'Connecting AI...' : selectedModel || 'Select AI')}
          </span>
        </div>

        <div className="-mr-1 shrink-0">
          <ModelSelectorPopover
            mode={mode}
            models={models}
            selectedModel={selectedModel}
            modelsLoading={modelsLoading}
            modelsError={modelsError}
            onSelectModel={onSelectModel}
            onRetryModels={onRetryModels}
          />
        </div>
      </div>

      <textarea
        value={prompt}
        onChange={(e) => onPromptChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onKeyDown={handleKeyDown}
        placeholder={
          isListening
            ? 'Listening... speak now'
            : isTranscribing
              ? 'Transcribing speech...'
              : theme.placeholder
        }
        rows={2}
        aria-label={theme.placeholder}
        className="w-full resize-none bg-transparent text-[15.5px] leading-[1.45] text-[#0B0B0F] placeholder:text-[#A1A1AA] placeholder:font-normal focus:outline-none min-h-[60px] sm:min-h-[68px]"
      />

      {voiceError && (
        <p className="text-[11.5px] text-red-600 pb-1">{voiceError}</p>
      )}

      {/* Optional attached screenshot / file preview row */}
      {attachment && (
        <div className="flex items-center gap-2 pb-2 text-xs text-[#52525B]">
          {attachment.dataUrl ? (
            <img
              src={attachment.dataUrl}
              alt={attachment.name}
              className="w-10 h-10 rounded-lg object-cover border border-black/10 shrink-0"
            />
          ) : null}
          <span className="truncate max-w-[220px] font-medium">
            {attachment.name}
          </span>
          <button
            type="button"
            onClick={() => setAttachment(null)}
            aria-label="Remove attachment"
            className="p-0.5 rounded-full hover:bg-black/5 text-[#71717A]"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Bottom Action Toolbar */}
      <div className="flex items-center justify-between pt-1">
        {/* Left: Attachment Button */}
        <div>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileChange}
            accept="image/*,.pdf,.txt,.json"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Attach reference file"
            className="w-9 h-9 rounded-full border border-black/[0.09] flex items-center justify-center text-[#3F3F46] hover:bg-black/[0.03] active:scale-95 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A68F6]"
          >
            <Paperclip className="w-[17px] h-[17px] -rotate-45 stroke-[1.8]" />
          </button>
        </div>

        {/* Right: Feature Toggles + Send Button */}
        <div className="flex items-center gap-2">
          {/* React / Frontend Atom icon shown in Website mode */}
          <AnimatePresence initial={false}>
            {mode === 'web' && (
              <motion.button
                key="react-toggle"
                type="button"
                initial={{ opacity: 0, scale: 0.75 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.75 }}
                transition={{ duration: 0.18 }}
                onClick={() => setReactEnabled((v) => !v)}
                aria-pressed={reactEnabled}
                aria-label="Toggle React web stack"
                className={`w-9 h-9 rounded-full border flex items-center justify-center active:scale-95 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8] ${
                  reactEnabled
                    ? 'border-[#38BDF8]/40 bg-[#F0F9FF] text-[#38BDF8]'
                    : 'border-black/[0.09] text-[#71717A] hover:bg-black/[0.03]'
                }`}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="1.8" fill="currentColor" />
                  <ellipse cx="12" cy="12" rx="9.5" ry="3.8" />
                  <ellipse cx="12" cy="12" rx="9.5" ry="3.8" transform="rotate(60 12 12)" />
                  <ellipse cx="12" cy="12" rx="9.5" ry="3.8" transform="rotate(120 12 12)" />
                </svg>
              </motion.button>
            )}
          </AnimatePresence>

          {/* Voice Dictation Icon (matches screen 1 toolbar mark) */}
          <VoiceInputButton
            variant="toolbar"
            status={voiceStatus}
            voiceLevel={voiceLevel}
            accentColor={theme.accentColor}
            onClick={toggleVoice}
          />

          {/* Backend / Database Stack Icon */}
          <button
            type="button"
            onClick={() => setBackendEnabled((v) => !v)}
            aria-pressed={backendEnabled}
            aria-label="Toggle full-stack database"
            className={`w-9 h-9 rounded-full border flex items-center justify-center active:scale-95 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A68F6] ${
              backendEnabled
                ? 'border-[#7A68F6]/45 bg-[#F3F0FF] text-[#6D4AFF]'
                : 'border-black/[0.09] text-[#52525B] hover:bg-black/[0.03]'
            }`}
          >
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="4" y="5" width="16" height="5.5" rx="2.75" />
              <rect x="4" y="13.5" width="16" height="5.5" rx="2.75" />
              <circle cx="8" cy="7.75" r="0.8" fill="currentColor" />
              <circle cx="8" cy="16.25" r="0.8" fill="currentColor" />
            </svg>
          </button>

          {/* Globe / Web Grounding Icon */}
          <button
            type="button"
            onClick={() => setWebSearchEnabled((v) => !v)}
            aria-pressed={webSearchEnabled}
            aria-label="Toggle live web publishing"
            className={`w-9 h-9 rounded-full border flex items-center justify-center active:scale-95 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A68F6] ${
              webSearchEnabled
                ? 'border-[#7A68F6]/45 bg-[#F3F0FF] text-[#6D4AFF]'
                : 'border-black/[0.09] text-[#52525B] hover:bg-black/[0.03]'
            }`}
          >
            <Globe className="w-[17px] h-[17px] stroke-[1.75]" />
          </button>

          {/* Submit / Send Arrow Up Button */}
          <button
            type="button"
            onClick={handleSend}
            disabled={!hasContent}
            aria-label="Start building with AI Craft"
            style={{
              backgroundColor: hasContent ? theme.sendActiveBg : '#BEB5F9',
            }}
            className="w-9 h-9 rounded-full flex items-center justify-center text-white transition-all duration-200 active:scale-95 disabled:cursor-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A68F6] focus-visible:ring-offset-1"
          >
            <ArrowUp className="w-[18px] h-[18px] stroke-[2.4]" />
          </button>
        </div>
      </div>
    </div>
  );
}

interface ProviderLogoProps {
  provider?: string;
  modelId?: string;
  size?: number;
  isTracking?: boolean;
  trackingColor?: string;
}

function resolveProviderKey(provider?: string, modelId?: string): string {
  const raw = (provider || modelId?.split('/')[0] || 'openrouter')
    .toLowerCase()
    .trim();
  if (raw.includes('openai')) return 'openai';
  if (raw.includes('anthropic')) return 'anthropic';
  if (raw.includes('google')) return 'google';
  if (raw.includes('meta')) return 'meta';
  if (raw.includes('deepseek')) return 'deepseek';
  if (raw.includes('mistral')) return 'mistral';
  if (raw.includes('qwen') || raw.includes('alibaba')) return 'qwen';
  if (raw.includes('x-ai') || raw === 'xai') return 'xai';
  if (raw.includes('cohere')) return 'cohere';
  if (raw.includes('perplexity')) return 'perplexity';
  if (raw.includes('baidu')) return 'baidu';
  if (raw.includes('microsoft')) return 'microsoft';
  if (raw.includes('nvidia')) return 'nvidia';
  if (raw.includes('amazon')) return 'amazon';
  if (raw.includes('moonshot')) return 'moonshot';
  if (raw.includes('bytedance')) return 'bytedance';
  if (raw.includes('minimax')) return 'minimax';
  if (raw.includes('z-ai') || raw.includes('zai') || raw.includes('thudm')) return 'zai';
  if (raw.includes('groq')) return 'groq';
  if (raw.includes('openrouter')) return 'openrouter';
  return raw;
}

function hashHue(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) % 360;
  }
  return hash;
}

export function ProviderLogo({
  provider,
  modelId,
  size = 20,
  isTracking = false,
  trackingColor = '#7A68F6',
}: ProviderLogoProps) {
  const key = resolveProviderKey(provider, modelId);
  const iconSize = Math.round(size * 0.72);

  const renderMark = () => {
    switch (key) {
      case 'google':
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M12 2.5C12.9 7.8 16.2 11.1 21.5 12C16.2 12.9 12.9 16.2 12 21.5C11.1 16.2 7.8 12.9 2.5 12C7.8 11.1 11.1 7.8 12 2.5Z"
              fill="url(#geminiGrad)"
            />
            <defs>
              <linearGradient id="geminiGrad" x1="2.5" y1="2.5" x2="21.5" y2="21.5" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#4285F4" />
                <stop offset="35%" stopColor="#9B72CB" />
                <stop offset="70%" stopColor="#D96570" />
                <stop offset="100%" stopColor="#F4B400" />
              </linearGradient>
            </defs>
          </svg>
        );

      case 'openai':
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="#10A37F" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 3.2a4.4 4.4 0 0 1 3.8 2.2l3.3 1.9a4.4 4.4 0 0 1 1.6 6 4.4 4.4 0 0 1-1.6 6l-3.3 1.9a4.4 4.4 0 0 1-7.6 0l-3.3-1.9a4.4 4.4 0 0 1-1.6-6 4.4 4.4 0 0 1 1.6-6l3.3-1.9A4.4 4.4 0 0 1 12 3.2Z" />
            <polygon points="12,8 15.5,10 15.5,14 12,16 8.5,14 8.5,10" stroke="#10A37F" strokeWidth="1.5" />
          </svg>
        );

      case 'anthropic':
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M14.6 4.5H11.9L6.5 19.5H9.3L10.4 16.2H15.2L16.3 19.5H19.1L14.6 4.5ZM11.3 13.7L12.8 9.1L14.3 13.7H11.3Z"
              fill="#D97757"
            />
          </svg>
        );

      case 'meta':
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="#0668E1" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5.5 16.5C3.5 16.5 2.5 14.8 2.5 12.2C2.5 8.8 4.8 6.5 7.4 6.5C9.8 6.5 11.1 8.8 12 10.8C12.9 8.8 14.2 6.5 16.6 6.5C19.2 6.5 21.5 8.8 21.5 12.2C21.5 14.8 20.5 16.5 18.5 16.5C16.2 16.5 14.5 13.8 12 10.8C9.5 13.8 7.8 16.5 5.5 16.5Z" />
          </svg>
        );

      case 'deepseek':
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M4.2 13.5C4.2 8.9 7.8 5.4 12.6 5.4C16.3 5.4 19.3 7.5 20.5 10.7C18.5 10.1 16.8 10.6 15.6 12C14.7 13 13.4 13.6 11.9 13.6C9.8 13.6 8.3 12.2 7.8 10.6C6.9 12.1 6.7 14 7.7 15.7C8.9 17.7 11.4 18.6 14 18.1C16.3 17.7 18.1 16.2 19.2 14.5C18.2 17.8 15.2 20 11.5 20C7.3 20 4.2 17.2 4.2 13.5Z"
              fill="#4D6BFE"
            />
          </svg>
        );

      case 'mistral':
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="3" y="4" width="4" height="4" fill="#FFD800" />
            <rect x="17" y="4" width="4" height="4" fill="#FFD800" />
            <rect x="3" y="8" width="8" height="4" fill="#FFAF00" />
            <rect x="13" y="8" width="8" height="4" fill="#FFAF00" />
            <rect x="3" y="12" width="18" height="4" fill="#FF8205" />
            <rect x="3" y="16" width="4" height="4" fill="#FA500F" />
            <rect x="10" y="16" width="4" height="4" fill="#FA500F" />
            <rect x="17" y="16" width="4" height="4" fill="#FA500F" />
          </svg>
        );

      case 'qwen':
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M12 3L19.8 7.5V16.5L12 21L4.2 16.5V7.5L12 3Z"
              stroke="#615CED"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <circle cx="12" cy="12" r="3.2" fill="#615CED" />
            <path d="M14.2 14.2L17.5 17.5" stroke="#615CED" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        );

      case 'xai':
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M4.5 19.5L19.5 4.5M7 4.5L17 19.5" stroke="#0B0B0F" strokeWidth="2.4" strokeLinecap="round" />
          </svg>
        );

      case 'cohere':
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="8.5" cy="9" r="4.2" fill="#39594D" />
            <circle cx="15.8" cy="10.2" r="3.6" fill="#D18EE2" />
            <path d="M6.5 17.5C6.5 15 8.6 13.2 11.4 13.2H14.5C17 13.2 18.8 14.9 18.8 17.2C18.8 19.2 17.2 20.5 15 20.5H9.5C7.7 20.5 6.5 19.2 6.5 17.5Z" fill="#FF7759" />
          </svg>
        );

      case 'perplexity':
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="#20808D" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 3v18M5 7l7 5 7-5M5 17l7-5 7 5M5 7v10M19 7v10" />
          </svg>
        );

      case 'baidu':
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <ellipse cx="6.2" cy="9" rx="2.1" ry="2.8" fill="#2932E1" />
            <ellipse cx="10.2" cy="5.8" rx="2.1" ry="2.7" fill="#2932E1" />
            <ellipse cx="14.4" cy="6.2" rx="2.1" ry="2.7" fill="#2932E1" />
            <ellipse cx="18" cy="9.6" rx="2.1" ry="2.7" fill="#2932E1" />
            <path d="M7.5 16.4C7.5 13.7 9.6 11.5 12.1 11.5C14.7 11.5 16.9 13.7 16.9 16.4C16.9 18.2 15.6 19.4 13.8 19.4C12.9 19.4 12.4 19 12.1 19C11.8 19 11.3 19.4 10.4 19.4C8.7 19.4 7.5 18.2 7.5 16.4Z" fill="#2932E1" />
          </svg>
        );

      case 'microsoft':
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="3.5" y="3.5" width="7.8" height="7.8" rx="1" fill="#F25022" />
            <rect x="12.7" y="3.5" width="7.8" height="7.8" rx="1" fill="#7FBA00" />
            <rect x="3.5" y="12.7" width="7.8" height="7.8" rx="1" fill="#00A4EF" />
            <rect x="12.7" y="12.7" width="7.8" height="7.8" rx="1" fill="#FFB900" />
          </svg>
        );

      case 'nvidia':
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="#76B900" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3.5 12.5C6.5 7.5 12 6 17.5 8.5C19.5 9.5 20.5 11.5 20.5 13.5C20.5 16.8 17 19 12.8 19C9.5 19 7 17.2 7 14.5C7 12.2 9 10.6 11.5 10.6C13.5 10.6 15 11.8 15 13.4C15 14.8 13.9 15.8 12.5 15.8" />
          </svg>
        );

      case 'openrouter':
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="6" cy="12" r="2.5" fill="#6366F1" />
            <circle cx="18" cy="6.5" r="2.3" />
            <circle cx="18" cy="17.5" r="2.3" />
            <path d="M8.5 11L15.8 7.3M8.5 13L15.8 16.7" />
          </svg>
        );

      default: {
        const hue = hashHue(key);
        const label = (key.replace(/[^a-z0-9]/g, '').slice(0, 2) || 'AI').toUpperCase();
        return (
          <span
            className="font-display font-bold leading-none select-none"
            style={{
              fontSize: Math.max(9, Math.round(size * 0.42)),
              color: `hsl(${hue}, 72%, 40%)`,
            }}
          >
            {label}
          </span>
        );
      }
    }
  };

  return (
    <span
      className="relative inline-flex items-center justify-center rounded-full shrink-0 bg-white border border-black/[0.08] shadow-[0_1px_4px_rgba(11,11,15,0.06)]"
      style={{ width: size, height: size }}
    >
      {isTracking && (
        <span
          aria-hidden="true"
          className="absolute -inset-[3px] rounded-full border-2 border-transparent animate-spin"
          style={{
            borderTopColor: trackingColor,
            borderRightColor: trackingColor,
            animationDuration: '1.1s',
          }}
        />
      )}
      {renderMark()}
    </span>
  );
}

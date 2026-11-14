import { useState } from 'react';
import { Download, Share, Smartphone, WifiOff } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

interface PWAInstallButtonProps {
  variant?: 'compact' | 'card';
  onOpenInstallGuide?: () => void;
}

export function PWAInstallButton({
  variant = 'compact',
  onOpenInstallGuide,
}: PWAInstallButtonProps) {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showInlineGuide, setShowInlineGuide] = useState(false);

  if (variant === 'compact') {
    if (isInstalled) return null;

    if (isInstallable) {
      return (
        <button
          type="button"
          onClick={() => void install()}
          aria-label="Install AI Craft app to home screen"
          className="h-9 px-3 rounded-full bg-[#0B0B0F] text-white text-xs font-medium flex items-center gap-1.5 hover:bg-black/85 active:scale-95 transition-all whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A68F6]"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Install</span>
        </button>
      );
    }

    if (isIOS && onOpenInstallGuide) {
      return (
        <button
          type="button"
          onClick={onOpenInstallGuide}
          aria-label="Add AI Craft to iPhone Home Screen"
          className="h-9 px-3 rounded-full border border-black/15 bg-white/90 text-[#0B0B0F] text-xs font-medium flex items-center gap-1.5 hover:bg-black/[0.04] active:scale-95 transition-all whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A68F6]"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Add App</span>
        </button>
      );
    }

    return null;
  }

  // Card variant for Profile screen — compact home screen icon preview & install control
  return (
    <div className="rounded-[16px] border border-black/[0.08] bg-white p-2.5 shadow-[0_4px_16px_rgba(15,15,30,0.03)] flex flex-col gap-2 shrink-0">
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-[10px] bg-black overflow-hidden shrink-0 ring-1 ring-black/10 shadow-xs flex items-center justify-center">
          <img
            src="/pwa-192x192.png"
            alt="AI Craft home screen icon"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-display font-semibold text-[13px] text-[#0B0B0F] leading-tight">
            AI Craft Mobile App
          </p>
          <p className="text-[11px] text-[#71717A] mt-0.5 leading-snug truncate">
            {isInstalled
              ? 'Running in standalone app mode'
              : 'Add to your home screen to launch full-screen'}
          </p>
        </div>
      </div>

      {!isInstalled && (
        <>
          {isInstallable ? (
            <button
              type="button"
              onClick={() => void install()}
              className="w-full min-h-[36px] rounded-full bg-[#0B0B0F] text-white text-[12.5px] font-medium flex items-center justify-center gap-1.5 hover:bg-black/85 active:scale-[0.98] transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install App to Home Screen</span>
            </button>
          ) : (
            <div className="flex flex-col gap-1.5">
              <button
                type="button"
                onClick={() => setShowInlineGuide((v) => !v)}
                className="w-full min-h-[36px] rounded-full border border-black/15 text-[#0B0B0F] text-[12.5px] font-medium flex items-center justify-center gap-1.5 hover:bg-black/[0.03] active:scale-[0.98] transition-all"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>
                  {showInlineGuide ? 'Hide Install Steps' : 'How to Add to Home Screen'}
                </span>
              </button>

              {showInlineGuide && (
                <div className="rounded-xl bg-[#F8F8FA] p-2.5 text-[11px] text-[#3F3F46] leading-snug space-y-1">
                  {isIOS ? (
                    <>
                      <p className="font-semibold text-[#0B0B0F] flex items-center gap-1.5">
                        <Share className="w-3 h-3" />
                        <span>On iPhone / iPad (Safari):</span>
                      </p>
                      <p>1. Tap Share in Safari, then tap Add to Home Screen.</p>
                    </>
                  ) : (
                    <>
                      <p className="font-semibold text-[#0B0B0F]">
                        On Android / Chrome:
                      </p>
                      <p>1. Open the browser menu and tap Install app.</p>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export function OfflineIndicator() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      className="shrink-0 w-full bg-[#18181B] text-white text-xs font-medium py-1.5 px-4 flex items-center justify-center gap-2"
    >
      <WifiOff className="w-3.5 h-3.5 shrink-0" />
      <span>Offline Mode — Cached app ready</span>
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import {
  Check,
  Code2,
  LayoutGrid,
  MessageSquare,
  Rocket,
  RotateCw,
  Share2,
} from 'lucide-react';

interface FloatingLogoMenuProps {
  projectTitle: string;
  hasBuiltApp: boolean;
  isPublished: boolean;
  onBackToChat: () => void;
  onViewCode: () => void;
  onShare: () => Promise<string>;
  onPublish: () => void;
  onRefreshPreview: () => void;
  onOpenApps: () => void;
}

export function FloatingLogoMenu({
  projectTitle,
  hasBuiltApp,
  isPublished,
  onBackToChat,
  onViewCode,
  onShare,
  onPublish,
  onRefreshPreview,
  onOpenApps,
}: FloatingLogoMenuProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [yPercent, setYPercent] = useState(34);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const dragStateRef = useRef<{
    active: boolean;
    startY: number;
    startPercent: number;
    moved: boolean;
  }>({
    active: false,
    startY: 0,
    startPercent: 34,
    moved: false,
  });

  useEffect(() => {
    if (!statusMessage) return;
    const t = window.setTimeout(() => setStatusMessage(null), 2400);
    return () => window.clearTimeout(t);
  }, [statusMessage]);

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragStateRef.current = {
      active: true,
      startY: e.clientY,
      startPercent: yPercent,
      moved: false,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!dragStateRef.current.active) return;
    const dy = e.clientY - dragStateRef.current.startY;
    if (Math.abs(dy) > 5) {
      dragStateRef.current.moved = true;
    }
    const vh = window.innerHeight || 800;
    const deltaPct = (dy / vh) * 100;
    const nextPct = Math.min(84, Math.max(10, dragStateRef.current.startPercent + deltaPct));
    setYPercent(nextPct);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    const wasTap = !dragStateRef.current.moved;
    dragStateRef.current.active = false;
    if (wasTap) {
      setMenuOpen((v) => !v);
    }
  };

  const openUpward = yPercent > 55;

  const handleShareClick = async () => {
    const msg = await onShare();
    setStatusMessage(msg);
  };

  const handlePublishClick = () => {
    onPublish();
    setStatusMessage(`${projectTitle} published`);
  };

  return (
    <>
      {/* Transparent click-away backdrop only when menu is open */}
      {menuOpen && (
        <div
          aria-hidden="true"
          onClick={() => setMenuOpen(false)}
          className="fixed inset-0 z-40"
        />
      )}

      {/* Draggable / Scrollable Right-Side Round Blue Logo Handle */}
      <div
        className="fixed right-3 z-50 flex flex-col items-end"
        style={{ top: `${yPercent}%`, transform: 'translateY(-50%)' }}
      >
        <button
          type="button"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={() => {
            dragStateRef.current.active = false;
          }}
          aria-expanded={menuOpen}
          aria-label="AI Craft preview menu — tap to open or drag vertically"
          style={{ touchAction: 'none' }}
          className="w-12 h-12 rounded-full bg-white border border-black/[0.1] shadow-[0_6px_22px_rgba(15,15,30,0.18)] flex items-center justify-center active:scale-95 transition-transform duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D6BFF]"
        >
          <img
            src="/logo-mark.png"
            alt="AI Craft"
            draggable={false}
            className="w-7 h-7 object-contain pointer-events-none select-none"
          />
        </button>

        {/* Action Menu anchored cleanly to the Round Logo */}
        {menuOpen && (
          <div
            role="menu"
            aria-label="App preview actions"
            className={`absolute right-0 w-56 rounded-2xl bg-white border border-black/[0.09] shadow-[0_14px_40px_rgba(15,15,30,0.18)] p-1.5 flex flex-col gap-0.5 ${
              openUpward ? 'bottom-14' : 'top-14'
            }`}
          >
            <div className="px-3 py-2 border-b border-black/[0.06] flex items-center gap-2">
              <img
                src="/logo-mark.png"
                alt=""
                className="w-4 h-4 object-contain shrink-0"
              />
              <span className="font-display font-bold text-[13px] text-[#0B0B0F] truncate">
                {projectTitle}
              </span>
            </div>

            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setMenuOpen(false);
                onBackToChat();
              }}
              className="w-full min-h-[42px] px-3 rounded-xl text-left text-[13.5px] font-medium text-[#0B0B0F] hover:bg-black/[0.04] active:bg-black/[0.06] flex items-center gap-2.5"
            >
              <MessageSquare className="w-4 h-4 text-[#3F3F46] shrink-0" />
              <span>Back to Chat</span>
            </button>

            <button
              type="button"
              role="menuitem"
              disabled={!hasBuiltApp}
              onClick={() => {
                setMenuOpen(false);
                onViewCode();
              }}
              className="w-full min-h-[42px] px-3 rounded-xl text-left text-[13.5px] font-medium text-[#0B0B0F] hover:bg-black/[0.04] active:bg-black/[0.06] disabled:opacity-40 disabled:pointer-events-none flex items-center gap-2.5"
            >
              <Code2 className="w-4 h-4 text-[#3F3F46] shrink-0" />
              <span>View App Code</span>
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={() => void handleShareClick()}
              className="w-full min-h-[42px] px-3 rounded-xl text-left text-[13.5px] font-medium text-[#0B0B0F] hover:bg-black/[0.04] active:bg-black/[0.06] flex items-center gap-2.5"
            >
              <Share2 className="w-4 h-4 text-[#3F3F46] shrink-0" />
              <span>Share App</span>
            </button>

            <button
              type="button"
              role="menuitem"
              disabled={!hasBuiltApp}
              onClick={handlePublishClick}
              className="w-full min-h-[42px] px-3 rounded-xl text-left text-[13.5px] font-medium text-[#0B0B0F] hover:bg-black/[0.04] active:bg-black/[0.06] disabled:opacity-40 disabled:pointer-events-none flex items-center justify-between gap-2"
            >
              <span className="flex items-center gap-2.5">
                {isPublished ? (
                  <Check className="w-4 h-4 text-[#0D6BFF] shrink-0" />
                ) : (
                  <Rocket className="w-4 h-4 text-[#0D6BFF] shrink-0" />
                )}
                <span>{isPublished ? 'Published' : 'Publish App'}</span>
              </span>
            </button>

            <button
              type="button"
              role="menuitem"
              disabled={!hasBuiltApp}
              onClick={() => {
                setMenuOpen(false);
                onRefreshPreview();
              }}
              className="w-full min-h-[42px] px-3 rounded-xl text-left text-[13.5px] font-medium text-[#0B0B0F] hover:bg-black/[0.04] active:bg-black/[0.06] disabled:opacity-40 disabled:pointer-events-none flex items-center gap-2.5"
            >
              <RotateCw className="w-4 h-4 text-[#3F3F46] shrink-0" />
              <span>Refresh Preview</span>
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setMenuOpen(false);
                onOpenApps();
              }}
              className="w-full min-h-[42px] px-3 rounded-xl text-left text-[13.5px] font-medium text-[#0B0B0F] hover:bg-black/[0.04] active:bg-black/[0.06] flex items-center gap-2.5"
            >
              <LayoutGrid className="w-4 h-4 text-[#3F3F46] shrink-0" />
              <span>All Apps</span>
            </button>

            {statusMessage && (
              <div className="mt-1 px-3 py-1.5 rounded-lg bg-[#F4F4F6] text-xs font-medium text-[#0B0B0F]">
                {statusMessage}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

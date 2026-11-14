import { useRef, useState } from 'react';
import {
  Bell,
  Camera,
  Check,
  Crown,
  LogOut,
  Palette,
  Pencil,
  Smartphone,
  Sparkles,
  Trash2,
  Volume2,
} from 'lucide-react';
import { BuildMode, MODE_THEMES, UserProfile } from '../types/craft';
import { PRO_PLANS } from './ProUpgradeModal';
import { PWAInstallButton } from './PWAInstallButton';

interface ProfileSectionProps {
  profile: UserProfile;
  credits: number;
  proPlanId: string | null;
  projectCount: number;
  mode: BuildMode;
  dynamicColorEnabled: boolean;
  notificationsEnabled: boolean;
  autoReadEnabled: boolean;
  onUpdateProfile: (next: UserProfile) => void;
  onToggleNotifications: () => Promise<void> | void;
  onToggleAutoRead: () => void;
  onToggleDynamicColor: () => void;
  onToggleMode: () => void;
  onOpenProPlans: () => void;
  onClearProjects: () => void;
  onBackToCreate: () => void;
  onSignOut?: () => void;
}

export function DefaultProfileAvatar({ className = 'w-full h-full' }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="profileAvatarBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3B0764" />
          <stop offset="55%" stopColor="#1E1B4B" />
          <stop offset="100%" stopColor="#BE185D" />
        </linearGradient>
        <linearGradient id="profileHoodRim" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#F43F5E" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" fill="url(#profileAvatarBg)" />
      <circle
        cx="20"
        cy="18"
        r="13"
        fill="#0F172A"
        stroke="url(#profileHoodRim)"
        strokeWidth="1.8"
      />
      <path
        d="M11 38 C11 29, 29 29, 29 38 Z"
        fill="#090D16"
        stroke="#6366F1"
        strokeWidth="1.2"
      />
      <ellipse cx="16.2" cy="18.2" rx="1.6" ry="1.1" fill="#38BDF8" />
      <ellipse cx="23.8" cy="18.2" rx="1.6" ry="1.1" fill="#FB7185" />
      <path
        d="M13 13 Q20 7 27 13"
        stroke="#E0E7FF"
        strokeOpacity="0.45"
        strokeWidth="1.2"
        fill="none"
      />
    </svg>
  );
}

export function ProfileSection({
  profile,
  credits,
  proPlanId,
  projectCount,
  mode,
  dynamicColorEnabled,
  notificationsEnabled,
  autoReadEnabled,
  onUpdateProfile,
  onToggleNotifications,
  onToggleAutoRead,
  onToggleDynamicColor,
  onToggleMode,
  onOpenProPlans,
  onClearProjects,
  onBackToCreate,
  onSignOut,
}: ProfileSectionProps) {
  const theme = MODE_THEMES[mode];
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [editingIdentity, setEditingIdentity] = useState(false);
  const [draftName, setDraftName] = useState(profile.name);
  const [draftEmail, setDraftEmail] = useState(profile.email);
  const [confirmClear, setConfirmClear] = useState(false);

  const activePlanName = proPlanId
    ? PRO_PLANS.find((p) => p.id === proPlanId)?.name ?? 'Pro'
    : 'Free';

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const size = 192;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const minSide = Math.min(img.width, img.height);
        const sx = (img.width - minSide) / 2;
        const sy = (img.height - minSide) / 2;
        ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        onUpdateProfile({ ...profile, avatarDataUrl: dataUrl });
      };
      img.src = String(reader.result || '');
    };
    reader.readAsDataURL(file);
  };

  const handleSaveIdentity = (e: React.FormEvent) => {
    e.preventDefault();
    const nextName = draftName.trim() || profile.name;
    const nextEmail = draftEmail.trim() || profile.email;
    onUpdateProfile({
      ...profile,
      name: nextName,
      email: nextEmail,
    });
    setEditingIdentity(false);
  };

  return (
    <div className="flex-1 min-h-0 w-full max-w-[440px] mx-auto px-4 py-2.5 flex flex-col justify-between gap-2 overflow-hidden">
      {/* Compact Header Row */}
      <div className="flex items-center justify-between gap-2 px-0.5 shrink-0">
        <div className="flex items-center gap-2">
          <img
            src="/logo-mark.png"
            alt="AI Craft logo"
            className="w-5 h-5 object-contain shrink-0"
          />
          <h1 className="font-display font-bold text-[18px] tracking-tight text-[#0B0B0F] leading-none">
            Profile
          </h1>
        </div>

        <span className="text-[11px] font-medium text-[#71717A] tabular-nums">
          {projectCount} {projectCount === 1 ? 'app' : 'apps'} · {credits} credits
        </span>
      </div>

      {/* Compact Profile Identity Card (Picture, Name, Email, Plan) */}
      <div className="rounded-[16px] border border-black/[0.08] bg-white p-2.5 shadow-[0_4px_16px_rgba(15,15,30,0.03)] shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Change profile picture"
              className="w-[46px] h-[46px] rounded-full overflow-hidden ring-1 ring-black/10 hover:ring-black/25 active:scale-95 transition-all block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D5BFF]"
            >
              {profile.avatarDataUrl ? (
                <img
                  src={profile.avatarDataUrl}
                  alt={profile.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <DefaultProfileAvatar />
              )}
            </button>
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#0B0B0F] text-white border-[1.5px] border-white flex items-center justify-center"
            >
              <Camera className="w-2.5 h-2.5" />
            </span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="font-display font-bold text-[14px] text-[#0B0B0F] truncate leading-tight">
                {profile.name}
              </p>
              <span className="text-[11px] font-semibold text-[#0D5BFF] shrink-0">
                · {activePlanName}
              </span>
            </div>
            <p className="text-[11.5px] text-[#71717A] truncate mt-0.5">
              {profile.email}
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setDraftName(profile.name);
              setDraftEmail(profile.email);
              setEditingIdentity((v) => !v);
            }}
            aria-label={editingIdentity ? 'Close profile editor' : 'Edit name and email'}
            className="min-w-[32px] min-h-[32px] px-2.5 rounded-full border border-black/12 text-[11px] font-medium text-[#0B0B0F] hover:bg-black/[0.03] active:scale-95 transition-all flex items-center gap-1 shrink-0"
          >
            <Pencil className="w-3 h-3" />
            <span>{editingIdentity ? 'Close' : 'Edit'}</span>
          </button>
        </div>

        {editingIdentity && (
          <form
            onSubmit={handleSaveIdentity}
            className="mt-2.5 pt-2.5 border-t border-black/[0.06] flex flex-col gap-1.5"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              <input
                type="text"
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                placeholder="Display name"
                aria-label="Display name"
                className="h-8 px-2.5 rounded-lg border border-black/12 bg-[#FAFAFB] text-[12px] text-[#0B0B0F] focus:outline-none focus:border-[#0D5BFF]"
              />
              <input
                type="email"
                value={draftEmail}
                onChange={(e) => setDraftEmail(e.target.value)}
                placeholder="Email address"
                aria-label="Email address"
                className="h-8 px-2.5 rounded-lg border border-black/12 bg-[#FAFAFB] text-[12px] text-[#0B0B0F] focus:outline-none focus:border-[#0D5BFF]"
              />
            </div>

            <div className="flex items-center justify-between gap-2 pt-0.5">
              {profile.avatarDataUrl ? (
                <button
                  type="button"
                  onClick={() =>
                    onUpdateProfile({ ...profile, avatarDataUrl: null })
                  }
                  className="text-[11px] font-medium text-[#71717A] hover:text-[#0B0B0F]"
                >
                  Reset photo
                </button>
              ) : (
                <span className="text-[10.5px] text-[#71717A]">
                  Tap avatar above to upload photo
                </span>
              )}

              <button
                type="submit"
                className="h-7 px-3 rounded-full bg-[#0B0B0F] text-white text-[11.5px] font-medium inline-flex items-center gap-1 hover:bg-black/85 active:scale-95 transition-all"
              >
                <Check className="w-3 h-3" />
                <span>Save</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Compact Preferences & Account Upgrades Card */}
      <div className="rounded-[16px] border border-black/[0.08] bg-white divide-y divide-black/[0.06] shadow-[0_4px_16px_rgba(15,15,30,0.03)] shrink-0">
        {/* Notifications Toggle */}
        <div className="px-3 py-2 flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-6 h-6 rounded-md bg-[#F4F4F6] text-[#18181B] flex items-center justify-center shrink-0">
              <Bell className="w-3.5 h-3.5" />
            </span>
            <div className="min-w-0">
              <p className="font-display font-semibold text-[13px] text-[#0B0B0F] leading-tight">
                Notifications
              </p>
              <p className="text-[10.5px] text-[#71717A] truncate">
                {notificationsEnabled
                  ? 'Alerts enabled for finished builds'
                  : 'Get alerted when background builds finish'}
              </p>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={notificationsEnabled}
            aria-label="Toggle notifications"
            onClick={() => void onToggleNotifications()}
            className={`relative w-9 h-5 rounded-full transition-colors duration-200 shrink-0 ${
              notificationsEnabled ? 'bg-[#0D5BFF]' : 'bg-neutral-200'
            }`}
          >
            <span
              className={`block w-3.5 h-3.5 rounded-full bg-white shadow-xs transition-transform duration-200 ${
                notificationsEnabled ? 'translate-x-4.5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>

        {/* Voice Auto-Read (TTS) Toggle */}
        <div className="px-3 py-2 flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-6 h-6 rounded-md bg-[#F4F4F6] text-[#18181B] flex items-center justify-center shrink-0">
              <Volume2 className="w-3.5 h-3.5" />
            </span>
            <div className="min-w-0">
              <p className="font-display font-semibold text-[13px] text-[#0B0B0F] leading-tight">
                Auto-Read AI Replies
              </p>
              <p className="text-[10.5px] text-[#71717A] truncate">
                Speak finished answers aloud automatically
              </p>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={autoReadEnabled}
            aria-label="Toggle voice auto-read"
            onClick={onToggleAutoRead}
            className={`relative w-9 h-5 rounded-full transition-colors duration-200 shrink-0 ${
              autoReadEnabled ? 'bg-[#0B0B0F]' : 'bg-neutral-200'
            }`}
          >
            <span
              className={`block w-3.5 h-3.5 rounded-full bg-white shadow-xs transition-transform duration-200 ${
                autoReadEnabled ? 'translate-x-4.5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>

        {/* Real-Time Dynamic Color Toggle */}
        <div className="px-3 py-2 flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-6 h-6 rounded-md bg-[#F4F4F6] text-[#18181B] flex items-center justify-center shrink-0">
              <Palette className="w-3.5 h-3.5" />
            </span>
            <div className="min-w-0">
              <p className="font-display font-semibold text-[13px] text-[#0B0B0F] leading-tight">
                Real-Time Dynamic Color
              </p>
              <p className="text-[10.5px] text-[#71717A] truncate">
                Gold &amp; Orchid ambient glow
              </p>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={dynamicColorEnabled}
            aria-label="Toggle real-time dynamic color"
            onClick={onToggleDynamicColor}
            className={`relative w-9 h-5 rounded-full transition-colors duration-200 shrink-0 ${
              dynamicColorEnabled ? 'bg-[#0B0B0F]' : 'bg-neutral-200'
            }`}
          >
            <span
              className={`block w-3.5 h-3.5 rounded-full bg-white shadow-xs transition-transform duration-200 ${
                dynamicColorEnabled ? 'translate-x-4.5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>

        {/* Default Platform Target */}
        <div className="px-3 py-2 flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-6 h-6 rounded-md bg-[#F4F4F6] text-[#18181B] flex items-center justify-center shrink-0">
              <Smartphone className="w-3.5 h-3.5" />
            </span>
            <div className="min-w-0">
              <p className="font-display font-semibold text-[13px] text-[#0B0B0F] leading-tight">
                Default Target
              </p>
              <p className="text-[10.5px] text-[#71717A] truncate">
                Active: {theme.label}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onToggleMode}
            className="px-2.5 min-h-[28px] rounded-full border border-black/15 text-[11px] font-medium text-[#0B0B0F] hover:bg-black/[0.03] active:scale-95 transition-all shrink-0"
          >
            {mode === 'mobile' ? 'Website' : 'iOS&Android'}
          </button>
        </div>

        {/* AI Craft Pro & Credits */}
        <div className="px-3 py-2 flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-6 h-6 rounded-md bg-[#EEF4FF] text-[#0D5BFF] flex items-center justify-center shrink-0">
              <Crown className="w-3.5 h-3.5" />
            </span>
            <div className="min-w-0">
              <p className="font-display font-semibold text-[13px] text-[#0B0B0F] leading-tight">
                AI Craft Pro
              </p>
              <p className="text-[10.5px] text-[#71717A] tabular-nums truncate">
                {proPlanId
                  ? `${activePlanName} plan · ${credits} credits`
                  : `${credits} credits remaining`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenProPlans}
            className="px-3 min-h-[28px] rounded-full bg-[#0D5BFF] text-white text-[11px] font-semibold hover:bg-[#094EE0] active:scale-95 transition-all shrink-0"
          >
            {proPlanId ? 'Plans' : 'Upgrade'}
          </button>
        </div>

        {/* Saved Builds Cleanup */}
        {projectCount > 0 && (
          <div className="px-3 py-2 flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-6 h-6 rounded-md bg-[#F4F4F6] text-[#18181B] flex items-center justify-center shrink-0">
                <Trash2 className="w-3.5 h-3.5" />
              </span>
              <div className="min-w-0">
                <p className="font-display font-semibold text-[13px] text-[#0B0B0F] leading-tight">
                  Saved Projects
                </p>
                <p className="text-[10.5px] text-[#71717A] tabular-nums truncate">
                  {projectCount} saved locally on device
                </p>
              </div>
            </div>
            {confirmClear ? (
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setConfirmClear(false)}
                  className="px-2 min-h-[26px] rounded-full border border-black/15 text-[10.5px] font-medium text-[#52525B]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClearProjects();
                    setConfirmClear(false);
                  }}
                  className="px-2 min-h-[26px] rounded-full bg-red-600 text-white text-[10.5px] font-semibold"
                >
                  Clear
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmClear(true)}
                className="px-2.5 min-h-[28px] rounded-full border border-black/15 text-[11px] font-medium text-[#52525B] hover:text-red-600 hover:border-red-200 transition-colors shrink-0"
              >
                Clear
              </button>
            )}
          </div>
        )}
      </div>

      {/* Compact Home-Screen Install Card */}
      <PWAInstallButton variant="card" />

      <div className="flex items-center gap-2 shrink-0">
        {onSignOut && (
          <button
            type="button"
            onClick={onSignOut}
            className="min-h-[38px] px-4 rounded-full border border-black/15 text-[#0B0B0F] text-[13px] font-medium flex items-center justify-center gap-1.5 hover:bg-black/[0.03] active:scale-[0.98] transition-all shrink-0"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        )}
        <button
          type="button"
          onClick={onBackToCreate}
          className="flex-1 min-h-[38px] rounded-full bg-[#0B0B0F] text-white text-[13px] font-medium flex items-center justify-center gap-2 hover:bg-black/85 active:scale-[0.98] transition-all shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Back to Create</span>
        </button>
      </div>
    </div>
  );
}

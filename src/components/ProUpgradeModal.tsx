import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Bot,
  Calendar,
  CalendarDays,
  Check,
  CheckCircle2,
  Cloud,
  CreditCard,
  Database,
  DollarSign,
  Dumbbell,
  Gamepad2,
  Globe,
  MessageCircle,
  Music,
  Smartphone,
  Soup,
  Sparkles,
  TrendingUp,
  Wallet,
  X,
} from 'lucide-react';

export interface ProPlanOption {
  id: 'starter' | 'plus' | 'studio' | 'annual';
  name: string;
  subtitle: string;
  priceText: string;
  cadenceText: string;
  creditsToAdd: number;
  badgeText?: string;
}

export const PRO_PLANS: ProPlanOption[] = [
  {
    id: 'starter',
    name: 'Starter',
    subtitle: 'Pay ₦25,000.00 monthly',
    priceText: '₦25,000.00',
    cadenceText: 'per month',
    creditsToAdd: 100,
  },
  {
    id: 'plus',
    name: 'Plus',
    subtitle: 'Pay ₦48,000.00 monthly',
    priceText: '₦48,000.00',
    cadenceText: 'per month',
    creditsToAdd: 250,
  },
  {
    id: 'studio',
    name: 'Studio',
    subtitle: 'Pay ₦70,000.00 monthly',
    priceText: '₦70,000.00',
    cadenceText: 'per month',
    creditsToAdd: 500,
  },
  {
    id: 'annual',
    name: 'Annual',
    subtitle: 'Pay ₦800,000.00 yearly',
    priceText: '₦800,000.00',
    cadenceText: 'per year',
    creditsToAdd: 6000,
    badgeText: 'PRO YEARLY',
  },
];

const SHOWCASE_ROW_1 = [
  { id: 'r1-card', Icon: CreditCard, bg: 'linear-gradient(145deg, #16A34A 0%, #0D9448 100%)' },
  { id: 'r1-food', Icon: Soup, bg: 'linear-gradient(145deg, #FB923C 0%, #EA580C 100%)' },
  { id: 'r1-game', Icon: Gamepad2, bg: 'linear-gradient(145deg, #6382E8 0%, #4666D6 100%)' },
  { id: 'r1-gym', Icon: Dumbbell, bg: 'linear-gradient(145deg, #9333EA 0%, #7E22CE 100%)' },
  { id: 'r1-cal', Icon: Calendar, bg: 'linear-gradient(145deg, #10B981 0%, #059669 100%)' },
  { id: 'r1-chart', Icon: TrendingUp, bg: 'linear-gradient(145deg, #2563EB 0%, #1D4ED8 100%)' },
  { id: 'r1-music', Icon: Music, bg: 'linear-gradient(145deg, #F43F5E 0%, #E11D48 100%)' },
];

const SHOWCASE_ROW_2 = [
  { id: 'r2-check', Icon: CheckCircle2, bg: 'linear-gradient(145deg, #3B6CE8 0%, #2554D4 100%)' },
  { id: 'r2-phone', Icon: Smartphone, bg: 'linear-gradient(145deg, #5474CC 0%, #3F5DB8 100%)' },
  { id: 'r2-wallet', Icon: Wallet, bg: 'linear-gradient(145deg, #34A853 0%, #1E8E3E 100%)' },
  { id: 'r2-sched', Icon: CalendarDays, bg: 'linear-gradient(145deg, #2DD4BF 0%, #0D9488 100%)' },
  { id: 'r2-chat', Icon: MessageCircle, bg: 'linear-gradient(145deg, #4ADE80 0%, #16A34A 100%)' },
  { id: 'r2-spark', Icon: Sparkles, bg: 'linear-gradient(145deg, #60A5FA 0%, #3B82F6 100%)' },
  { id: 'r2-cloud', Icon: Cloud, bg: 'linear-gradient(145deg, #818CF8 0%, #4F46E5 100%)' },
];

const PRO_FEATURES = [
  { id: 'tools', Icon: Sparkles, label: 'AI tools' },
  { id: 'agents', Icon: Bot, label: 'Create your agents' },
  { id: 'db', Icon: Database, label: 'Databases' },
  { id: 'host', Icon: Globe, label: 'Publish and host live apps' },
  { id: 'credits', Icon: DollarSign, label: 'Monthly usage credits' },
];

interface ProUpgradeModalProps {
  open: boolean;
  credits: number;
  activePlanId: string | null;
  dynamicColorEnabled: boolean;
  onClose: () => void;
  onSelectActivatePlan: (plan: ProPlanOption) => void;
  onRestorePurchase: () => { restored: boolean; message: string };
}

export function ProUpgradeModal({
  open,
  credits,
  activePlanId,
  dynamicColorEnabled,
  onClose,
  onSelectActivatePlan,
  onRestorePurchase,
}: ProUpgradeModalProps) {
  const [selectedPlanId, setSelectedPlanId] = useState<ProPlanOption['id']>('annual');
  const [confirmingPlan, setConfirmingPlan] = useState(false);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const [legalSheet, setLegalSheet] = useState<'terms' | 'privacy' | null>(null);

  const selectedPlan =
    PRO_PLANS.find((p) => p.id === selectedPlanId) ?? PRO_PLANS[PRO_PLANS.length - 1];

  useEffect(() => {
    if (!open) {
      setConfirmingPlan(false);
      setStatusNotice(null);
      setLegalSheet(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!statusNotice) return;
    const t = window.setTimeout(() => setStatusNotice(null), 3000);
    return () => window.clearTimeout(t);
  }, [statusNotice]);

  const handleRestore = () => {
    const res = onRestorePurchase();
    setStatusNotice(res.message);
  };

  const handleConfirmActivate = () => {
    onSelectActivatePlan(selectedPlan);
    setConfirmingPlan(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="pro-upgrade-modal"
          role="dialog"
          aria-modal="true"
          aria-label="AI Craft Pro Upgrade"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 18 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-50 h-dvh w-full bg-white overflow-hidden overscroll-none flex flex-col justify-between"
        >
          {/* FIXED TOP SECTION: Royal Cobalt Header + Scrolling Showcase + Headline + Features */}
          <div className="shrink-0 w-full flex flex-col bg-white">
            <div
              className="relative w-full overflow-hidden pt-safe pb-3.5"
              style={{
                background: dynamicColorEnabled
                  ? 'linear-gradient(180deg, #0D47EE 0%, #1654F4 48%, #5B8BFB 77%, #C7D8FE 92%, #FFFFFF 100%)'
                  : 'linear-gradient(180deg, #1048E6 0%, #245EF5 52%, #DCE7FE 90%, #FFFFFF 100%)',
              }}
            >
              {dynamicColorEnabled && (
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -top-12 left-1/2 -translate-x-1/2 w-[130%] h-[150px] animate-aura-pulse"
                  style={{
                    background:
                      'radial-gradient(ellipse 65% 70% at 50% 35%, rgba(125, 178, 255, 0.38) 0%, rgba(13, 91, 255, 0) 75%)',
                  }}
                />
              )}

              {/* Top Controls: Close (left) & Restore (right) */}
              <div className="relative z-20 w-full max-w-[440px] mx-auto px-4 pt-1 pb-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close upgrade screen"
                  className="w-9 h-9 rounded-full bg-[#09299E]/45 backdrop-blur-md text-white flex items-center justify-center hover:bg-[#09299E]/60 active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  <X className="w-[18px] h-[18px] stroke-[2.4]" />
                </button>

                <button
                  type="button"
                  onClick={handleRestore}
                  className="h-8 px-3.5 rounded-full bg-[#09299E]/45 backdrop-blur-md text-white text-[13px] font-semibold tracking-[-0.01em] hover:bg-[#09299E]/60 active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  Restore
                </button>
              </div>

              {/* Dual Auto-Scrolling Compact App Tile Rows */}
              <div className="relative z-10 flex flex-col gap-1.5 overflow-hidden select-none">
                <div className="flex w-max animate-marquee-left">
                  {[0, 1].map((dup) => (
                    <div key={dup} className="flex items-center gap-2 pr-2">
                      {SHOWCASE_ROW_1.map(({ id, Icon, bg }) => (
                        <div
                          key={`${dup}-${id}`}
                          className="w-[44px] h-[44px] rounded-[12px] flex items-center justify-center shadow-[0_6px_14px_rgba(9,25,84,0.20)] shrink-0"
                          style={{ background: bg }}
                          aria-hidden="true"
                        >
                          <Icon className="w-[20px] h-[20px] text-white stroke-[2]" />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>

                <div className="flex w-max animate-marquee-right">
                  {[0, 1].map((dup) => (
                    <div key={dup} className="flex items-center gap-2 pr-2">
                      {SHOWCASE_ROW_2.map(({ id, Icon, bg }) => (
                        <div
                          key={`${dup}-${id}`}
                          className="w-[44px] h-[44px] rounded-[12px] flex items-center justify-center shadow-[0_6px_14px_rgba(9,25,84,0.16)] shrink-0"
                          style={{ background: bg }}
                          aria-hidden="true"
                        >
                          <Icon className="w-[20px] h-[20px] text-white stroke-[2]" />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>

                {/* Soft Bottom White Mist Fade */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-9"
                  style={{
                    background:
                      'linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0.88) 72%, #FFFFFF 100%)',
                  }}
                />
              </div>
            </div>

            {/* Fixed Top Content: AI CRAFT PRO + Headline + 5 Features */}
            <div className="relative z-20 w-full max-w-[440px] mx-auto px-5 pb-2">
              <div className="flex items-center justify-between gap-2 -mt-2 mb-2">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#141418] text-white shadow-[0_4px_12px_rgba(11,11,15,0.16)]">
                  <img
                    src="/logo-mark.png"
                    alt=""
                    className="w-3.5 h-3.5 object-contain brightness-200"
                  />
                  <span className="font-display font-bold text-[10px] tracking-[0.06em]">
                    AI CRAFT PRO
                  </span>
                </div>

                <span className="text-[11px] font-medium text-[#71717A] tabular-nums">
                  {credits} credits
                </span>
              </div>

              {statusNotice && (
                <div
                  role="status"
                  className="mb-2 rounded-xl bg-[#EEF4FF] border border-[#0D5BFF]/20 px-3 py-1.5 text-[11.5px] font-medium text-[#0B3AC7]"
                >
                  {statusNotice}
                </div>
              )}

              <h2 className="font-display font-extrabold text-[24px] sm:text-[26px] leading-[1.06] tracking-[-0.03em] text-[#0B0B0F] mb-3">
                Create <span className="text-[#0D5BFF]">unlimited</span>
                <br />
                AI apps
              </h2>

              <ul className="flex flex-col gap-1.5">
                {PRO_FEATURES.map(({ id, Icon, label }) => (
                  <li key={id} className="flex items-center gap-2.5 text-[#0B0B0F]">
                    <span className="w-4 h-4 flex items-center justify-center text-[#18181B] shrink-0">
                      <Icon className="w-[14px] h-[14px] stroke-[2]" />
                    </span>
                    <span className="text-[13px] font-medium tracking-[-0.01em] text-[#111118]">
                      {label}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* ONLY SCROLLABLE REGION: Token / Amount Plan List */}
          <div className="flex-1 min-h-0 w-full max-w-[440px] mx-auto px-5 py-2.5 overflow-y-auto overscroll-contain">
            <div
              role="radiogroup"
              aria-label="Choose AI Craft Pro plan"
              className="flex flex-col gap-2 pt-1.5 pb-1"
            >
              {PRO_PLANS.map((plan) => {
                const isSelected = selectedPlanId === plan.id;
                const isCurrent = activePlanId === plan.id;

                return (
                  <button
                    key={plan.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => {
                      setSelectedPlanId(plan.id);
                      setConfirmingPlan(false);
                    }}
                    className={`relative w-full text-left rounded-[14px] px-3.5 py-2.5 flex items-center justify-between gap-2.5 transition-all duration-150 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D5BFF] ${
                      isSelected
                        ? 'border-2 border-[#0D5BFF] bg-[#F5F8FF] shadow-[0_4px_14px_rgba(13,91,255,0.08)]'
                        : 'border-[1.5px] border-[#E4E4E7] bg-white hover:border-[#C7D2FE]'
                    }`}
                  >
                    {plan.badgeText && (
                      <span className="absolute -top-2 right-3 px-2 py-[1px] rounded-full bg-[#0D5BFF] text-white text-[9px] font-display font-bold tracking-[0.04em]">
                        {plan.badgeText}
                      </span>
                    )}

                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`w-[18px] h-[18px] rounded-full flex items-center justify-center shrink-0 transition-colors ${
                          isSelected
                            ? 'bg-[#0D5BFF] border-2 border-[#0D5BFF]'
                            : 'bg-white border-2 border-[#D4D4D8]'
                        }`}
                        aria-hidden="true"
                      >
                        {isSelected && (
                          <span className="w-1.5 h-1.5 rounded-full bg-white" />
                        )}
                      </span>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-display font-bold text-[14px] text-[#0B0B0F] leading-tight">
                            {plan.name}
                          </span>
                          {isCurrent && (
                            <span className="text-[10.5px] font-semibold text-[#0D5BFF]">
                              · Active
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#71717A] mt-0.5 truncate">
                          {plan.subtitle}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-display font-bold text-[14px] text-[#0B0B0F] tabular-nums leading-tight">
                        {plan.priceText}
                      </div>
                      <div className="text-[10.5px] text-[#71717A] mt-0.5">
                        {plan.cadenceText}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {confirmingPlan && (
              <div className="mt-2 rounded-[14px] border border-[#0D5BFF]/25 bg-[#F5F8FF] p-2.5 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-display font-bold text-[13px] text-[#0B0B0F] truncate">
                    {selectedPlan.name} · {selectedPlan.priceText}
                  </p>
                  <p className="text-[11px] text-[#52525B]">
                    +{selectedPlan.creditsToAdd.toLocaleString()} Craft credits
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleConfirmActivate}
                  className="shrink-0 h-8 px-3 rounded-full bg-[#0B0B0F] text-white font-display font-semibold text-[12px] flex items-center gap-1.5 hover:bg-black/85 active:scale-[0.98] transition-all"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Activate</span>
                </button>
              </div>
            )}

            {legalSheet && (
              <div className="mt-2 rounded-xl border border-black/[0.08] bg-[#FAFAFB] p-2.5 text-[11px] text-[#52525B] leading-relaxed flex items-start justify-between gap-2">
                <p>
                  {legalSheet === 'terms'
                    ? 'AI Craft Pro subscriptions renew automatically per selected billing cycle (Monthly or Annual) and can be cancelled anytime in Profile.'
                    : 'AI Craft stores your selected plan, project history, and preferences locally on your device without exposing private keys.'}
                </p>
                <button
                  type="button"
                  onClick={() => setLegalSheet(null)}
                  aria-label="Dismiss legal notice"
                  className="text-[#71717A] hover:text-[#0B0B0F] shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* FIXED BOTTOM GROUND FOOTER: Continue Button + Legal Links */}
          <div className="shrink-0 w-full bg-white pb-[max(0.5rem,env(safe-area-inset-bottom))]">
            <div className="w-full max-w-[440px] mx-auto px-5 pt-2 pb-1 flex flex-col items-center">
              <button
                type="button"
                onClick={() => {
                  if (confirmingPlan) {
                    handleConfirmActivate();
                  } else {
                    setConfirmingPlan(true);
                  }
                }}
                className="w-full h-[48px] rounded-full bg-[#0D5BFF] hover:bg-[#094EE0] active:scale-[0.98] text-white font-display font-bold text-[15.5px] tracking-[-0.01em] shadow-[0_6px_18px_rgba(13,91,255,0.24)] transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D5BFF] focus-visible:ring-offset-2"
              >
                {confirmingPlan ? `Confirm ${selectedPlan.priceText}` : 'Continue'}
              </button>

              <div className="mt-2 flex flex-col items-center gap-0.5">
                <p className="text-[11px] text-[#71717A] text-center">
                  Auto-renews · Cancel anytime
                </p>
                <div className="flex items-center justify-center gap-5 text-[11px] text-[#71717A]">
                  <button
                    type="button"
                    onClick={() =>
                      setLegalSheet((prev) => (prev === 'terms' ? null : 'terms'))
                    }
                    className="hover:text-[#0B0B0F] transition-colors"
                  >
                    Terms
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setLegalSheet((prev) => (prev === 'privacy' ? null : 'privacy'))
                    }
                    className="hover:text-[#0B0B0F] transition-colors"
                  >
                    Privacy
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

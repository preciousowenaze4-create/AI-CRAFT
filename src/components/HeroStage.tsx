import { AnimatePresence, motion } from 'motion/react';
import { BuildMode, MODE_THEMES } from '../types/craft';

interface HeroStageProps {
  mode: BuildMode;
  energyLevel: number;
}

export function HeroStage({ mode, energyLevel }: HeroStageProps) {
  const theme = MODE_THEMES[mode];
  const isMobile = mode === 'mobile';

  // Real-time dynamic color boost as the user interacts or types
  const glowScale = 1 + energyLevel * 0.08;
  const glowOpacity = 0.88 + energyLevel * 0.12;

  return (
    <div className="relative w-full flex-1 min-h-0 overflow-hidden flex flex-col items-center justify-center gap-2 py-1">
      {/* Hero Visual Stage with Cropped Sculpture + Real-Time Dynamic Glow */}
      <div className="relative w-full max-w-[min(355px,40dvh)] shrink aspect-[750/488] flex items-center justify-center">
        {/* Dynamic radial aura behind the sculpture & device */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-[-20%] transition-all duration-700 ease-out"
          style={{
            transform: `scale(${glowScale})`,
            opacity: glowOpacity,
            background: isMobile
              ? `radial-gradient(circle at 66% 42%, ${theme.glowPrimary} 0%, ${theme.glowSecondary} 38%, rgba(255,255,255,0) 70%)`
              : `radial-gradient(circle at 34% 40%, ${theme.glowPrimary} 0%, ${theme.glowSecondary} 40%, rgba(255,255,255,0) 70%)`,
          }}
        />

        {/* Animated Concentric Dynamic Rings */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 overflow-visible"
        >
          {[140, 210, 285, 360].map((size, idx) => (
            <div
              key={size}
              className="animate-ring-breath absolute rounded-full border transition-all duration-700 ease-out"
              style={{
                width: `${size}px`,
                height: `${size}px`,
                left: isMobile ? '66%' : '34%',
                top: isMobile ? '41%' : '39%',
                marginLeft: `-${size / 2}px`,
                marginTop: `-${size / 2}px`,
                borderColor: theme.ringColor,
                animationDelay: `${idx * 0.55}s`,
              }}
            />
          ))}
        </div>

        {/* Classical Sculpture + Retro Device Transition */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={mode}
            initial={{
              opacity: 0,
              x: isMobile ? -18 : 18,
              scale: 0.97,
            }}
            animate={{
              opacity: 1,
              x: 0,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              x: isMobile ? 18 : -18,
              scale: 0.97,
            }}
            transition={{
              duration: 0.36,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="relative w-full h-full overflow-hidden select-none"
            style={{
              maskImage:
                'linear-gradient(to bottom, transparent 0%, black 11%, black 86%, transparent 100%)',
              WebkitMaskImage:
                'linear-gradient(to bottom, transparent 0%, black 11%, black 86%, transparent 100%)',
            }}
          >
            <img
              src={theme.artworkSrc}
              alt={theme.artworkAlt}
              draggable={false}
              className="w-full h-auto max-w-none block pointer-events-none"
              style={{
                transform: 'translateY(-11.4%)',
              }}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Hero Headline & Subtitle */}
      <div className="relative z-10 shrink-0 w-full px-3 py-1 text-center">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={mode}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center gap-1.5"
          >
            <h1 className="font-display font-extrabold text-[clamp(1.38rem,4.6vw,1.9rem)] leading-[1.14] tracking-[-0.025em] text-[#0B0B0F] max-w-[350px] text-balance">
              {theme.headline}
            </h1>
            <p className="font-body font-light text-[14.5px] sm:text-[15.5px] leading-snug tracking-[-0.01em] text-[#27272F]">
              {theme.subtitle}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

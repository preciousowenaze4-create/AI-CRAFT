import { motion } from 'motion/react';
import { BuildMode, MODE_THEMES } from '../types/craft';

interface ModeSwitcherProps {
  mode: BuildMode;
  onChange: (mode: BuildMode) => void;
}

const MODES: BuildMode[] = ['mobile', 'web'];

export function ModeSwitcher({ mode, onChange }: ModeSwitcherProps) {
  return (
    <div
      role="tablist"
      aria-label="Target platform"
      className="inline-flex items-center p-[3px] rounded-full border border-[#22222A]/85 bg-white shadow-[0_2px_10px_rgba(0,0,0,0.03)]"
    >
      {MODES.map((item) => {
        const isActive = mode === item;
        const label = MODE_THEMES[item].label;

        return (
          <button
            key={item}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(item)}
            className={`relative px-4 sm:px-5 min-h-[38px] rounded-full text-[13.5px] sm:text-[14px] tracking-[-0.01em] whitespace-nowrap shrink-0 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A68F6] ${
              isActive
                ? 'text-white font-semibold'
                : 'text-[#14141B] font-medium hover:text-black'
            }`}
          >
            {isActive && (
              <motion.span
                layoutId="activePlatformPill"
                transition={{ type: 'spring', stiffness: 460, damping: 34 }}
                className="absolute inset-0 rounded-full bg-[#0B0B0F]"
              />
            )}
            <span className="relative z-10">{label}</span>
          </button>
        );
      })}
    </div>
  );
}

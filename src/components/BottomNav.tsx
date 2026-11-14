import { NavTab } from '../types/craft';

interface BottomNavProps {
  activeTab: NavTab;
  onChange: (tab: NavTab) => void;
}

export function BottomNav({ activeTab, onChange }: BottomNavProps) {
  return (
    <nav
      aria-label="Primary navigation"
      className="relative z-20 shrink-0 w-full bg-white pb-[max(0.25rem,calc(env(safe-area-inset-bottom,0px)*0.36))]"
    >
      <div className="w-full max-w-[540px] mx-auto grid grid-cols-3 h-[46px] items-center">
        {/* Tab 1: Apps */}
        <button
          type="button"
          onClick={() => onChange('apps')}
          aria-current={activeTab === 'apps' ? 'page' : undefined}
          className={`min-h-[42px] flex flex-col items-center justify-center gap-0.5 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A68F6] ${
            activeTab === 'apps'
              ? 'text-[#0B0B0F]'
              : 'text-[#8E8E98] hover:text-[#3F3F46]'
          }`}
        >
          <svg
            width="19"
            height="19"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={activeTab === 'apps' ? '2.1' : '1.75'}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="3.5" y="3.5" width="7" height="7" rx="2" />
            <rect x="13.5" y="3.5" width="7" height="7" rx="2" />
            <rect x="3.5" y="13.5" width="7" height="7" rx="2" />
            <rect x="13.5" y="13.5" width="7" height="7" rx="2" />
          </svg>
          <span
            className={`text-[10.5px] leading-none tracking-[-0.01em] whitespace-nowrap ${
              activeTab === 'apps' ? 'font-semibold' : 'font-medium'
            }`}
          >
            Apps
          </span>
        </button>

        {/* Tab 2: Create */}
        <button
          type="button"
          onClick={() => onChange('create')}
          aria-current={activeTab === 'create' ? 'page' : undefined}
          className={`min-h-[42px] flex flex-col items-center justify-center gap-0.5 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A68F6] ${
            activeTab === 'create'
              ? 'text-[#0B0B0F]'
              : 'text-[#8E8E98] hover:text-[#3F3F46]'
          }`}
        >
          <svg
            width="19"
            height="19"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <rect
              x="5.5"
              y="3"
              width="12"
              height="18"
              rx="2.6"
              fill={activeTab === 'create' ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth="1.8"
            />
            <circle
              cx="11.5"
              cy="17.5"
              r="1"
              fill={activeTab === 'create' ? '#FFFFFF' : 'currentColor'}
            />
            <circle
              cx="17.5"
              cy="6"
              r="4.2"
              fill="#FFFFFF"
            />
            <path
              d="M17.5 3.6V8.4M15.1 6H19.9"
              stroke="currentColor"
              strokeWidth="2.1"
              strokeLinecap="round"
            />
          </svg>
          <span
            className={`text-[10.5px] leading-none tracking-[-0.01em] whitespace-nowrap ${
              activeTab === 'create' ? 'font-semibold' : 'font-medium'
            }`}
          >
            Create
          </span>
        </button>

        {/* Tab 3: Profile */}
        <button
          type="button"
          onClick={() => onChange('setting')}
          aria-current={activeTab === 'setting' ? 'page' : undefined}
          className={`min-h-[42px] flex flex-col items-center justify-center gap-0.5 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A68F6] ${
            activeTab === 'setting'
              ? 'text-[#0B0B0F]'
              : 'text-[#8E8E98] hover:text-[#3F3F46]'
          }`}
        >
          <svg
            width="19"
            height="19"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={activeTab === 'setting' ? '2.1' : '1.75'}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle
              cx="12"
              cy="8"
              r="3.8"
              fill={activeTab === 'setting' ? 'currentColor' : 'none'}
            />
            <path
              d="M4.8 19.8C4.8 16.4 8.05 14 12 14C15.95 14 19.2 16.4 19.2 19.8"
              fill={activeTab === 'setting' ? 'currentColor' : 'none'}
            />
          </svg>
          <span
            className={`text-[10.5px] leading-none tracking-[-0.01em] whitespace-nowrap ${
              activeTab === 'setting' ? 'font-semibold' : 'font-medium'
            }`}
          >
            Profile
          </span>
        </button>
      </div>
    </nav>
  );
}

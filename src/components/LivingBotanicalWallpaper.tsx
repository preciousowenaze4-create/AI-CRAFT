import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import humanGardenImg from '../assets/images/wallpaper_human_garden_1794564052131.jpg';
import lotusMacroImg from '../assets/images/wallpaper_lotus_macro_1794564052260.jpg';
import humanMeadowImg from '../assets/images/wallpaper_human_meadow_1794564053571.jpg';
import botanicalRainImg from '../assets/images/wallpaper_botanical_rain_1794564053861.jpg';

interface LivingBotanicalWallpaperProps {
  isBuilding: boolean;
}

interface WallpaperSlide {
  id: string;
  imageSrc: string;
  imageAlt: string;
  topEdgeColor: string;
  fallbackGradient: string;
  panFrom: { scale: number; x: string; y: string };
  panTo: { scale: number; x: string; y: string };
}

const WALLPAPER_SLIDES: WallpaperSlide[] = [
  {
    id: 'human-garden',
    imageSrc: humanGardenImg,
    imageAlt: 'Person standing in a sunlit botanical greenhouse with blooming flowers',
    topEdgeColor: '#847C66',
    fallbackGradient: 'linear-gradient(180deg, #847C66 0%, #2D4A36 100%)',
    panFrom: { scale: 1.02, x: '0%', y: '0%' },
    panTo: { scale: 1.11, x: '-1.5%', y: '-1.5%' },
  },
  {
    id: 'lotus-macro',
    imageSrc: lotusMacroImg,
    imageAlt: 'Blooming lotus flower with morning dewdrops on lily pads',
    topEdgeColor: '#746E30',
    fallbackGradient: 'linear-gradient(180deg, #746E30 0%, #2A381D 100%)',
    panFrom: { scale: 1.04, x: '-1%', y: '0%' },
    panTo: { scale: 1.13, x: '1.5%', y: '-1%' },
  },
  {
    id: 'human-meadow',
    imageSrc: humanMeadowImg,
    imageAlt: 'Person walking gently through a golden-hour wildflower meadow',
    topEdgeColor: '#F5F0E8',
    fallbackGradient: 'linear-gradient(180deg, #F5F0E8 0%, #5B4326 100%)',
    panFrom: { scale: 1.02, x: '1%', y: '0%' },
    panTo: { scale: 1.11, x: '-1.5%', y: '-1%' },
  },
  {
    id: 'botanical-rain',
    imageSrc: botanicalRainImg,
    imageAlt: 'Lush tropical monstera and fern leaves glistening with raindrops',
    topEdgeColor: '#A7AF97',
    fallbackGradient: 'linear-gradient(180deg, #A7AF97 0%, #1B4233 100%)',
    panFrom: { scale: 1.03, x: '0%', y: '1%' },
    panTo: { scale: 1.12, x: '-1.5%', y: '-1.5%' },
  },
];

function AmbientLightParticles() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    if (prefersReducedMotion) return;

    let rafId = 0;
    let width = 0;
    let height = 0;

    const motes = Array.from({ length: 24 }, (_, i) => ({
      x: (i * 0.6180339) % 1,
      y: (i * 0.381966) % 1,
      r: 1.5 + (i % 4) * 1.1,
      speedY: 0.015 + (i % 5) * 0.004,
      drift: 0.02 + (i % 3) * 0.012,
      phase: i * 1.1,
    }));

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener('resize', resize);

    const tick = (ms: number) => {
      const t = ms * 0.001;
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < motes.length; i++) {
        const m = motes[i];
        const py = (1 + m.y - ((t * m.speedY) % 1)) % 1;
        const px = (m.x + Math.sin(t * 0.6 + m.phase) * m.drift + 2) % 1;
        const alpha = 0.28 + Math.sin(t * 1.8 + m.phase) * 0.18;

        ctx.beginPath();
        ctx.arc(px * width, py * height, m.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 250, 230, ${alpha.toFixed(3)})`;
        ctx.fill();
      }

      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('resize', resize);
      window.cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 w-full h-full"
    />
  );
}

export function LivingBotanicalWallpaper({
  isBuilding,
}: LivingBotanicalWallpaperProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  // Auto-scroll left continuously: pause calmly on each live scene, then glide left
  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % WALLPAPER_SLIDES.length);
    }, 4800);
    return () => window.clearInterval(timer);
  }, []);

  const currentSlide = WALLPAPER_SLIDES[activeIndex];
  const imgFailed = Boolean(failedImages[currentSlide.id]);

  // Sync status bar / html / body color directly to the current slide's top edge color
  // so there is never a mismatched white or black bar above the wallpaper
  useEffect(() => {
    let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'theme-color';
      document.head.appendChild(meta);
    }
    meta.content = currentSlide.topEdgeColor;
    document.documentElement.style.backgroundColor = currentSlide.topEdgeColor;
    document.body.style.backgroundColor = currentSlide.topEdgeColor;

    return () => {
      document.documentElement.style.backgroundColor = '#ffffff';
      document.body.style.backgroundColor = '#ffffff';
    };
  }, [currentSlide.topEdgeColor]);

  return (
    <div
      className="fixed inset-0 w-full h-full min-h-[100lvh] overflow-hidden select-none pointer-events-none"
      style={{ backgroundColor: currentSlide.topEdgeColor }}
      aria-label="App not ready live wallpaper preview"
    >
      {/* Continuous Left-Scrolling Realistic Live Wallpapers (No Corner Scroll Arrows) */}
      <AnimatePresence initial={false} mode="popLayout">
        <motion.div
          key={currentSlide.id}
          initial={{ x: '100%' }}
          animate={{ x: '0%' }}
          exit={{ x: '-100%' }}
          transition={{
            duration: 0.95,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="absolute inset-0 w-full h-full overflow-hidden"
          style={{ background: currentSlide.fallbackGradient }}
        >
          {!imgFailed && (
            <motion.img
              src={currentSlide.imageSrc}
              alt={currentSlide.imageAlt}
              referrerPolicy="no-referrer"
              onError={() =>
                setFailedImages((prev) => ({
                  ...prev,
                  [currentSlide.id]: true,
                }))
              }
              initial={currentSlide.panFrom}
              animate={currentSlide.panTo}
              transition={{
                duration: 5.8,
                ease: 'easeOut',
              }}
              className="w-full h-full object-cover object-center will-change-transform"
            />
          )}

          {/* Soft top edge blend matching the exact status-bar color + middle legibility scrim */}
          <div
            aria-hidden="true"
            className="absolute inset-x-0 top-0 h-16"
            style={{
              background: `linear-gradient(to bottom, ${currentSlide.topEdgeColor} 0%, transparent 100%)`,
            }}
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.44)_0%,rgba(0,0,0,0.18)_60%,rgba(0,0,0,0.08)_100%)]"
          />
        </motion.div>
      </AnimatePresence>

      {/* Drifting sunlit bokeh particles to enhance live-video feel */}
      <AmbientLightParticles />

      {/* Centered "App Not Ready" Notice */}
      <div className="relative z-10 h-full w-full flex flex-col items-center justify-center px-6 text-center">
        <h2 className="font-display font-bold text-[28px] sm:text-[32px] leading-tight tracking-[-0.02em] text-white drop-shadow-[0_2px_14px_rgba(0,0,0,0.55)]">
          App Not Ready
        </h2>
        <p className="mt-2 font-body text-[15px] sm:text-[16px] leading-relaxed text-white/95 max-w-[280px] drop-shadow-[0_1px_10px_rgba(0,0,0,0.5)]">
          {isBuilding
            ? 'Your app is still building — live preview will appear as soon as it finishes.'
            : 'Your app has not been built yet.'}
        </p>
      </div>
    </div>
  );
}

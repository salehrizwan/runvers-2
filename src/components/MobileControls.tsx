import React, { useEffect, useRef } from 'react';
import { ArrowLeft, ArrowRight, ArrowUp, ArrowDown } from 'lucide-react';

interface MobileControlsProps {
  onLeft: () => void;
  onRight: () => void;
  onJump: () => void;
  onSlide: () => void;
  haptics: boolean;
}

export const MobileControls: React.FC<MobileControlsProps> = ({
  onLeft,
  onRight,
  onJump,
  onSlide,
  haptics,
}) => {
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const triggerHaptic = () => {
    if (haptics && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(15);
      } catch {
        // vibration unsupported or blocked
      }
    }
  };

  // Global touch swipe listeners
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        touchStartRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
        };
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current || e.changedTouches.length === 0) return;

      const deltaX = e.changedTouches[0].clientX - touchStartRef.current.x;
      const deltaY = e.changedTouches[0].clientY - touchStartRef.current.y;
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      // Minimum swipe threshold
      const minSwipe = 35;

      if (Math.max(absX, absY) > minSwipe) {
        triggerHaptic();
        if (absX > absY) {
          // Horizontal swipe
          if (deltaX > 0) {
            onRight();
          } else {
            onLeft();
          }
        } else {
          // Vertical swipe
          if (deltaY > 0) {
            onSlide();
          } else {
            onJump();
          }
        }
      }

      touchStartRef.current = null;
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onLeft, onRight, onJump, onSlide, haptics]);

  return (
    <div className="absolute inset-x-0 bottom-6 z-15 pointer-events-none flex justify-between items-end px-5 md:px-8 select-none">
      {/* Left side: Lane steering buttons */}
      <div className="flex items-center gap-3 pointer-events-auto">
        <button
          onTouchStart={(e) => {
            e.preventDefault();
            triggerHaptic();
            onLeft();
          }}
          onClick={(e) => {
            triggerHaptic();
            onLeft();
          }}
          className="w-14 h-14 rounded-2xl bg-black/60 active:bg-amber-500/80 border border-white/20 active:border-amber-400 text-white flex items-center justify-center shadow-lg active:scale-90 transition-transform backdrop-blur-none cursor-pointer"
          aria-label="Lane Left"
        >
          <ArrowLeft className="w-7 h-7" />
        </button>

        <button
          onTouchStart={(e) => {
            e.preventDefault();
            triggerHaptic();
            onRight();
          }}
          onClick={(e) => {
            triggerHaptic();
            onRight();
          }}
          className="w-14 h-14 rounded-2xl bg-black/60 active:bg-amber-500/80 border border-white/20 active:border-amber-400 text-white flex items-center justify-center shadow-lg active:scale-90 transition-transform backdrop-blur-none cursor-pointer"
          aria-label="Lane Right"
        >
          <ArrowRight className="w-7 h-7" />
        </button>
      </div>

      {/* Right side: Jump & Slide action buttons */}
      <div className="flex flex-col gap-3 pointer-events-auto items-end">
        <button
          onTouchStart={(e) => {
            e.preventDefault();
            triggerHaptic();
            onJump();
          }}
          onClick={(e) => {
            triggerHaptic();
            onJump();
          }}
          className="w-16 h-16 rounded-2xl bg-amber-500/30 active:bg-amber-400 border border-amber-400/60 text-amber-300 active:text-black flex flex-col items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.3)] active:scale-90 transition-transform backdrop-blur-none cursor-pointer"
          aria-label="Jump"
        >
          <ArrowUp className="w-6 h-6 stroke-[3]" />
          <span className="text-[10px] font-display font-black tracking-wider uppercase">JUMP</span>
        </button>

        <button
          onTouchStart={(e) => {
            e.preventDefault();
            triggerHaptic();
            onSlide();
          }}
          onClick={(e) => {
            triggerHaptic();
            onSlide();
          }}
          className="w-16 h-16 rounded-2xl bg-cyan-500/30 active:bg-cyan-400 border border-cyan-400/60 text-cyan-300 active:text-black flex flex-col items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.3)] active:scale-90 transition-transform backdrop-blur-none cursor-pointer"
          aria-label="Slide"
        >
          <ArrowDown className="w-6 h-6 stroke-[3]" />
          <span className="text-[10px] font-display font-black tracking-wider uppercase">SLIDE</span>
        </button>
      </div>
    </div>
  );
};

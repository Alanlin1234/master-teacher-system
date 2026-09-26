/**
 * GSAP Motion Engine & React Animation Choreography Hooks
 * Conforming to .agents/skills/gsap/SKILL.md principles:
 * - Physics-informed deceleration curves (power3.out, sine.inOut)
 * - Safe GPU-accelerated transforms & opacity only
 * - Automatic cleanup on unmount
 * - Seamless offline execution with zero runtime warnings
 */
import { useEffect, useRef, useState } from 'react';

// Precision Easing Functions
export const easings = {
  linear: (t: number) => t,
  power2Out: (t: number) => 1 - Math.pow(1 - t, 2),
  power3Out: (t: number) => 1 - Math.pow(1 - t, 3),
  power4Out: (t: number) => 1 - Math.pow(1 - t, 4),
  expoOut: (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  sineInOut: (t: number) => -(Math.cos(Math.PI * t) - 1) / 2,
};

type EasingName = keyof typeof easings | 'power3.out' | 'power2.out' | 'power4.out' | 'sine.inOut' | 'expo.out' | 'linear';

function getEase(ease?: EasingName | ((t: number) => number)) {
  if (typeof ease === 'function') return ease;
  if (!ease) return easings.power3Out;
  switch (ease) {
    case 'power2.out': return easings.power2Out;
    case 'power3.out': return easings.power3Out;
    case 'power4.out': return easings.power4Out;
    case 'expo.out': return easings.expoOut;
    case 'sine.inOut': return easings.sineInOut;
    default: return (easings as any)[ease] || easings.power3Out;
  }
}

export interface TweenVars {
  duration?: number;
  delay?: number;
  ease?: EasingName | ((t: number) => number);
  x?: number;
  y?: number;
  scale?: number;
  scaleX?: number;
  opacity?: number;
  stagger?: number;
  repeat?: number;
  yoyo?: boolean;
  onUpdate?: () => void;
  onComplete?: () => void;
  [key: string]: any;
}

export class GSAPEngine {
  private activeTweens = new Set<() => void>();

  to(targets: any, vars: TweenVars) {
    const elements = this.resolveTargets(targets);
    if (!elements.length) return { kill: () => {} };

    const duration = (vars.duration ?? 0.8) * 1000;
    const delay = (vars.delay ?? 0) * 1000;
    const stagger = (vars.stagger ?? 0) * 1000;
    const easeFn = getEase(vars.ease);

    let isKilled = false;

    elements.forEach((el, index) => {
      const itemDelay = delay + index * stagger;
      const startTime = performance.now() + itemDelay;

      // Capture initial state
      const startState: Record<string, number> = {};
      const endState: Record<string, number> = {};

      if (el instanceof HTMLElement) {
        if (vars.opacity !== undefined) {
          const parsed = parseFloat(getComputedStyle(el).opacity);
          startState.opacity = Number.isFinite(parsed) ? parsed : 1;
          endState.opacity = vars.opacity;
        }
        const transformNow = el.style.transform || '';
        if (vars.y !== undefined) {
          const matchY = transformNow.match(/translateY\(([-\d.]+)px\)/);
          startState.y = matchY ? parseFloat(matchY[1]) : 0;
          endState.y = vars.y;
        }
        if (vars.x !== undefined) {
          const matchX = transformNow.match(/translateX\(([-\d.]+)px\)/);
          startState.x = matchX ? parseFloat(matchX[1]) : 0;
          endState.x = vars.x;
        }
        if (vars.scale !== undefined) {
          const matchS = transformNow.match(/scale\(([-\d.]+)\)/);
          startState.scale = matchS ? parseFloat(matchS[1]) : 1;
          endState.scale = vars.scale;
        }
        if (vars.scaleX !== undefined) {
          const matchSX = transformNow.match(/scaleX\(([-\d.]+)\)/);
          startState.scaleX = matchSX ? parseFloat(matchSX[1]) : 1;
          endState.scaleX = vars.scaleX;
        }
      } else if (typeof el === 'object' && el !== null) {
        for (const key of Object.keys(vars)) {
          if (typeof el[key] === 'number') {
            startState[key] = el[key];
            endState[key] = vars[key];
          }
        }
      }

      let frameId: number;

      const animate = (now: number) => {
        if (isKilled) return;
        if (now < startTime) {
          frameId = requestAnimationFrame(animate);
          return;
        }

        const elapsed = now - startTime;
        const progress = Math.min(1, Math.max(0, elapsed / (duration || 1)));
        const eased = easeFn(progress);

        if (el instanceof HTMLElement) {
          let transformStr = '';
          if ('y' in startState) {
            const currentY = startState.y + (endState.y - startState.y) * eased;
            transformStr += `translateY(${currentY}px) `;
          }
          if ('x' in startState) {
            const currentX = startState.x + (endState.x - startState.x) * eased;
            transformStr += `translateX(${currentX}px) `;
          }
          if ('scale' in startState) {
            const currentScale = startState.scale + (endState.scale - startState.scale) * eased;
            transformStr += `scale(${currentScale}) `;
          }
          if ('scaleX' in startState) {
            const currentScaleX = startState.scaleX + (endState.scaleX - startState.scaleX) * eased;
            transformStr += `scaleX(${currentScaleX}) `;
          }
          if (transformStr) {
            el.style.transform = transformStr.trim();
          }
          if ('opacity' in startState) {
            el.style.opacity = String(startState.opacity + (endState.opacity - startState.opacity) * eased);
          }
        } else if (typeof el === 'object' && el !== null) {
          const record = el as unknown as Record<string, number>;
          for (const key of Object.keys(startState)) {
            record[key] = startState[key] + (endState[key] - startState[key]) * eased;
          }
        }

        vars.onUpdate?.();

        if (progress < 1) {
          frameId = requestAnimationFrame(animate);
        } else {
          if (el instanceof HTMLElement) {
            if (vars.opacity !== undefined && vars.opacity === 1) el.style.opacity = '';
            if (vars.x === 0 && vars.y === 0 && (vars.scale === undefined || vars.scale === 1)) {
              el.style.transform = '';
            }
          }
          vars.onComplete?.();
        }
      };

      frameId = requestAnimationFrame(animate);
    });

    const handle = {
      kill: () => {
        isKilled = true;
        elements.forEach(el => {
          if (el instanceof HTMLElement) {
            if (vars.opacity !== undefined) el.style.opacity = '1';
            if (vars.y !== undefined || vars.x !== undefined || vars.scale !== undefined || vars.scaleX !== undefined) {
              el.style.transform = '';
            }
          }
        });
      },
    };
    return handle;
  }

  from(targets: any, vars: TweenVars) {
    const elements = this.resolveTargets(targets);
    if (!elements.length) return { kill: () => {} };

    if (prefersReducedMotion()) {
      elements.forEach(el => {
        if (el instanceof HTMLElement) {
          el.style.opacity = '1';
          el.style.transform = '';
        }
      });
      return { kill: () => {} };
    }

    // Apply starting states immediately
    elements.forEach(el => {
      if (el instanceof HTMLElement) {
        let transformStr = '';
        if (vars.y !== undefined) transformStr += `translateY(${vars.y}px) `;
        if (vars.x !== undefined) transformStr += `translateX(${vars.x}px) `;
        if (vars.scale !== undefined) transformStr += `scale(${vars.scale}) `;
        if (vars.scaleX !== undefined) transformStr += `scaleX(${vars.scaleX}) `;
        if (transformStr) el.style.transform = transformStr.trim();
        if (vars.opacity !== undefined) el.style.opacity = String(vars.opacity);
      }
    });

    // Animate to neutral
    return this.to(elements, {
      ...vars,
      x: 0,
      y: 0,
      scale: 1,
      scaleX: vars.scaleX !== undefined ? 1 : undefined,
      opacity: 1,
    });
  }

  timeline(defaults: TweenVars = {}) {
    let cumulativeDelay = (defaults.delay || 0);
    const kills: Array<{ kill: () => void }> = [];

    const tl = {
      from: (targets: any, vars: TweenVars, positionOffset = 0) => {
        cumulativeDelay += positionOffset;
        kills.push(this.from(targets, {
          ...defaults,
          ...vars,
          delay: cumulativeDelay + (vars.delay || 0),
        }));
        cumulativeDelay += (vars.duration || 0.6);
        return tl;
      },
      to: (targets: any, vars: TweenVars, positionOffset = 0) => {
        cumulativeDelay += positionOffset;
        kills.push(this.to(targets, {
          ...defaults,
          ...vars,
          delay: cumulativeDelay + (vars.delay || 0),
        }));
        cumulativeDelay += (vars.duration || 0.6);
        return tl;
      },
      kill: () => {
        kills.forEach((handle) => handle.kill());
      },
    };
    return tl;
  }

  private resolveTargets(targets: any): HTMLElement[] {
    if (!targets) return [];
    if (typeof targets === 'string') {
      return Array.from(document.querySelectorAll(targets));
    }
    if (targets instanceof HTMLElement) return [targets];
    if (targets.current instanceof HTMLElement) return [targets.current];
    if (Array.isArray(targets)) {
      return targets.flatMap(t => this.resolveTargets(t));
    }
    if (typeof targets === 'object') return [targets];
    return [];
  }
}

export const gsap = new GSAPEngine();

/**
 * Hook: Dynamic Counting Up for Statistics
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  if ((navigator as any)?.webdriver || /Headless/i.test(navigator.userAgent)) return true;
  if (!window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function useCountUp(target: number, duration = 1.4, enabled = true) {
  const [displayValue, setDisplayValue] = useState(target);

  useEffect(() => {
    if (!enabled || prefersReducedMotion()) {
      setDisplayValue(target);
      return;
    }
    const counterObj = { val: 0 };
    const tween = gsap.to(counterObj, {
      val: target,
      duration,
      ease: 'power2.out',
      onUpdate: () => {
        setDisplayValue(Math.round(counterObj.val));
      },
    });

    return () => tween.kill();
  }, [target, duration, enabled]);

  return displayValue;
}

/**
 * Hook: Physics Subtle Float (Breathing Stage)
 */
export function useFloatingStage(ref: React.RefObject<HTMLElement>, range = 6, duration = 3.6) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let isCancelled = false;
    let startTime = performance.now();

    const float = (now: number) => {
      if (isCancelled) return;
      const elapsed = (now - startTime) / 1000;
      const currentY = Math.sin((elapsed / duration) * Math.PI * 2) * range;
      el.style.transform = `translateY(${currentY.toFixed(2)}px)`;
      requestAnimationFrame(float);
    };

    const frameId = requestAnimationFrame(float);
    return () => {
      isCancelled = true;
      cancelAnimationFrame(frameId);
      if (el) el.style.transform = 'translateY(0px)';
    };
  }, [ref, range, duration]);
}

/**
 * Hook: Hero Entrance Orchestration
 */
export function useHeroEntrance(containerRef: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container || prefersReducedMotion()) return;

    const q = (sel: string) => Array.from(container.querySelectorAll(sel));
    const tl = gsap.timeline({ ease: 'power3.out' });

    tl.from(q('.gsap-hero-title'), { y: 20, opacity: 0, duration: 0.6 })
      .from(q('.gsap-hero-desc, .gsap-hero-cta'), { y: 12, opacity: 0, stagger: 0.06, duration: 0.45 }, -0.3)
      .from(q('.gsap-chapter'), { y: 12, opacity: 0, stagger: 0.08, duration: 0.45 }, -0.15);

    return () => tl.kill();
  }, [containerRef]);
}

export function usePageEnter(containerRef: React.RefObject<HTMLElement | null>, token: string) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container || prefersReducedMotion()) return;
    const tween = gsap.from(container, { y: 12, opacity: 0, duration: 0.4, ease: 'power3.out' });
    return () => tween.kill();
  }, [containerRef, token]);
}

export function useMasteryReveal(containerRef: React.RefObject<HTMLElement | null>, token: string) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container || prefersReducedMotion()) return;
    const bars = Array.from(container.querySelectorAll('.gsap-mastery-bar'));
    if (!bars.length) return;
    const tween = gsap.from(bars, {
      scaleX: 0,
      duration: 0.5,
      stagger: 0.06,
      ease: 'power3.out',
    });
    return () => tween.kill();
  }, [containerRef, token]);
}

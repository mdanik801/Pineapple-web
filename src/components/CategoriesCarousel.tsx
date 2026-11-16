"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Category } from "@/lib/data";
import { categoryHref } from "@/lib/slug";
import CategoryImage from "./CategoryImage";

type Props = { categories: Category[] };

const AUTO_MS = 3000;
const TRANSITION_MS = 500;
const INTERACTION_PAUSE_MS = 3000;

function useVisibleCount() {
  const [count, setCount] = useState(2);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia("(min-width: 1024px)");
    const update = () => setCount(mql.matches ? 4 : 2);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);
  return count;
}

export default function CategoriesCarousel({ categories }: Props) {
  const visible = useVisibleCount();
  const items = categories || [];
  const canLoop = items.length > visible;
  const clones = canLoop ? visible : 0;

  const extended = useMemo(() => {
    if (!canLoop) return items;
    return [...items.slice(-clones), ...items, ...items.slice(0, clones)];
  }, [items, canLoop, clones]);

  const [index, setIndex] = useState(0);
  const [transition, setTransition] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [stepPx, setStepPx] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);

  const wrapRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const autoRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resumeRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resetRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dragging = useRef(false);
  const moved = useRef(false);
  const suppressClick = useRef(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const pointerId = useRef<number | null>(null);
  const indexRef = useRef(index);
  const stepRef = useRef(stepPx);
  indexRef.current = index;
  stepRef.current = stepPx;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const up = () => setReducedMotion(mq.matches);
    up();
    mq.addEventListener("change", up);
    return () => mq.removeEventListener("change", up);
  }, []);

  const measure = useCallback(() => {
    const track = trackRef.current;
    const wrap = wrapRef.current;
    if (!track || !wrap) return;
    const first = track.children[0] as HTMLElement | undefined;
    if (!first) return;
    const w = first.getBoundingClientRect().width;
    const styles = window.getComputedStyle(track);
    const gap = parseFloat(styles.columnGap || (styles as any).gap || "0") || 0;
    const nextStep = w + gap;
    if (Number.isFinite(nextStep) && nextStep > 0) {
      setStepPx((prev) => (Math.abs(prev - nextStep) < 0.5 ? prev : nextStep));
    }
  }, []);

  useEffect(() => {
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => measure());
    if (wrapRef.current) ro.observe(wrapRef.current);
    if (trackRef.current) ro.observe(trackRef.current);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [measure, visible, extended.length, items.length]);

  // Keep index aligned to loop window without visible jump when layout/data/visibility changes.
  useEffect(() => {
    if (resetRef.current) clearTimeout(resetRef.current);
    setTransition(false);
    setDragOffset(0);
    setIndex(canLoop ? clones : 0);
    resetRef.current = setTimeout(() => setTransition(true), 40);
    return () => {
      if (resetRef.current) clearTimeout(resetRef.current);
      resetRef.current = null;
    };
  }, [canLoop, clones, items.length]);

  const next = useCallback(() => {
    if (!canLoop || items.length <= 1) return;
    setTransition(true);
    setIndex((i) => i + 1);
  }, [canLoop, items.length]);

  const prev = useCallback(() => {
    if (!canLoop || items.length <= 1) return;
    setTransition(true);
    setIndex((i) => i - 1);
  }, [canLoop, items.length]);

  const pauseForInteraction = useCallback((ms = INTERACTION_PAUSE_MS) => {
    setIsInteracting(true);
    if (resumeRef.current) clearTimeout(resumeRef.current);
    resumeRef.current = setTimeout(() => setIsInteracting(false), ms);
  }, []);

  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) {
        setIsInteracting(true);
        if (resumeRef.current) clearTimeout(resumeRef.current);
      } else {
        pauseForInteraction(1200);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [pauseForInteraction]);

  useEffect(() => {
    if (autoRef.current) clearInterval(autoRef.current);
    autoRef.current = null;
    if (!canLoop || isInteracting || reducedMotion || items.length <= 1 || stepPx <= 0) return;
    autoRef.current = setInterval(() => {
      if (!dragging.current) next();
    }, AUTO_MS);
    return () => {
      if (autoRef.current) clearInterval(autoRef.current);
      autoRef.current = null;
    };
  }, [canLoop, isInteracting, reducedMotion, items.length, next, stepPx]);

  useEffect(() => {
    return () => {
      if (autoRef.current) clearInterval(autoRef.current);
      if (resumeRef.current) clearTimeout(resumeRef.current);
      if (resetRef.current) clearTimeout(resetRef.current);
    };
  }, []);

  const snapIfNeeded = useCallback((currentIndex: number) => {
    if (!canLoop) return;
    const n = items.length;
    if (n <= 0) return;
    let target: number | null = null;
    if (currentIndex >= clones + n) target = clones + (currentIndex - (clones + n));
    else if (currentIndex < clones) target = clones + n - (clones - currentIndex);
    if (target == null) return;
    // Jump without transition after slide completes for seamless infinite loop.
    setTransition(false);
    setIndex(target);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setTransition(true));
    });
  }, [canLoop, clones, items.length]);

  const onTransitionEnd = (e: React.TransitionEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget || e.propertyName !== "transform") return;
    snapIfNeeded(indexRef.current);
  };

  const baseTranslate = -(index * stepPx);
  const currentTranslate = baseTranslate + dragOffset;

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    if (!canLoop && items.length <= visible) return;
    dragging.current = true;
    moved.current = false;
    suppressClick.current = false;
    startX.current = e.clientX;
    startY.current = e.clientY;
    pointerId.current = e.pointerId;
    setDragOffset(0);
    setTransition(false);
    pauseForInteraction();
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current || pointerId.current !== e.pointerId) return;
    const dx = e.clientX - startX.current;
    const dy = e.clientY - startY.current;
    if (!moved.current) {
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 6) {
        moved.current = true;
      } else if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 6) {
        // Vertical scroll intent.
        dragging.current = false;
        moved.current = false;
        pointerId.current = null;
        setDragOffset(0);
        setTransition(true);
        return;
      } else {
        return;
      }
    }
    e.preventDefault();
    setDragOffset(dx);
  };

  const finishDrag = (e?: React.PointerEvent) => {
    if (!dragging.current) return;
    if (e && pointerId.current != null && e.pointerId !== pointerId.current) return;

    const dx = dragOffset;
    const didMove = moved.current;
    dragging.current = false;
    moved.current = false;
    pointerId.current = null;

    setDragOffset(0);
    setTransition(true);

    const step = stepRef.current;
    if (didMove && step > 0) {
      suppressClick.current = true;
      window.setTimeout(() => {
        suppressClick.current = false;
      }, 350);
      const threshold = Math.min(70, step * 0.2);
      if (canLoop) {
        if (dx <= -threshold) setIndex((i) => i + 1);
        else if (dx >= threshold) setIndex((i) => i - 1);
      } else {
        const maxIdx = Math.max(0, items.length - visible);
        if (dx <= -threshold) setIndex((i) => Math.min(i + 1, maxIdx));
        else if (dx >= threshold) setIndex((i) => Math.max(i - 1, 0));
      }
    }

    pauseForInteraction();
  };

  const onClickCapture = (e: React.MouseEvent) => {
    if (suppressClick.current || moved.current || dragging.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const onDragStart = (e: React.DragEvent) => {
    e.preventDefault();
  };

  if (!items.length) return null;

  const trackStyle: React.CSSProperties = {
    transform: stepPx > 0 ? `translate3d(${currentTranslate}px,0,0)` : "translate3d(0,0,0)",
    transition: transition && !reducedMotion && !dragging.current ? `transform ${TRANSITION_MS}ms ease` : "none",
  };

  const trackClass = "flex touch-pan-y select-none gap-x-3 sm:gap-x-5 lg:gap-x-6 xl:gap-x-7 2xl:gap-x-8 [&_img]:pointer-events-none [&_img]:select-none [&_img]:[-webkit-user-drag:none]";

  if (!canLoop) {
    const maxIdx = Math.max(0, items.length - visible);
    const safeIndex = Math.min(index, maxIdx);
    const staticTranslate = -(safeIndex * stepPx) + dragOffset;
    const staticStyle: React.CSSProperties = {
      transform: stepPx > 0 ? `translate3d(${staticTranslate}px,0,0)` : "translate3d(0,0,0)",
      transition: transition && !reducedMotion && !dragging.current ? `transform ${TRANSITION_MS}ms ease` : "none",
    };
    return (
      <div ref={wrapRef} className="overflow-hidden">
        <div
          ref={trackRef}
          className={trackClass}
          style={staticStyle}
          onPointerDown={items.length > visible ? onPointerDown : undefined}
          onPointerMove={items.length > visible ? onPointerMove : undefined}
          onPointerUp={items.length > visible ? finishDrag : undefined}
          onPointerCancel={items.length > visible ? finishDrag : undefined}
          onPointerLeave={items.length > visible ? (e) => { if (dragging.current) finishDrag(e); } : undefined}
          onClickCapture={onClickCapture}
          onDragStart={onDragStart}
        >
          {items.map((category) => (
            <div key={category.id} className="min-w-0 shrink-0 basis-1/2 lg:basis-1/4">
              <Card category={category} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div ref={wrapRef} className="overflow-hidden">
      <div
        ref={trackRef}
        className={`${trackClass} will-change-transform`}
        style={trackStyle}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={finishDrag}
        onPointerCancel={finishDrag}
        onPointerLeave={(e) => { if (dragging.current) finishDrag(e); }}
        onTransitionEnd={onTransitionEnd}
        onClickCapture={onClickCapture}
        onDragStart={onDragStart}
      >
        {extended.map((category, i) => (
          <div key={`${category.id}-${i}`} className="min-w-0 shrink-0 basis-1/2 lg:basis-1/4">
            <Card category={category} />
          </div>
        ))}
      </div>
    </div>
  );
}

function Card({ category }: { category: Category }) {
  return (
    <Link href={categoryHref(category.slug)} className="group block" draggable={false} onDragStart={(e) => e.preventDefault()}>
      <div className="relative aspect-[3/4] overflow-hidden bg-neutral-100">
        <CategoryImage
          key={`${category.id}:${category.image_url ?? ""}`}
          src={category.image_url}
          alt={category.name}
          sizes="(max-width: 1023px) 50vw, 25vw"
        />
      </div>
      <div className="bg-white py-3 text-center">
        <h3 className="text-xs font-medium uppercase tracking-[.12em] text-neutral-900 sm:text-sm">
          {category.name}
        </h3>
      </div>
    </Link>
  );
}

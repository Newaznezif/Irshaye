'use client';

import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Scroll reveal without an animation library. The observer writes one attribute on
 * the node instead of holding React state, so a long landing page does not re-render
 * when a section comes into view, and the timing lives in the `.reveal` utility.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  id,
}: {
  children: ReactNode;
  className?: string;
  /** Stagger in milliseconds, passed to the CSS transition as a custom property. */
  delay?: number;
  id?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          node.setAttribute('data-visible', 'true');
          observer.unobserve(node);
        }
      },
      { rootMargin: '0px 0px -6% 0px', threshold: 0.06 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      id={id}
      ref={ref}
      data-visible="false"
      className={cn('reveal', className)}
      style={{ '--reveal-delay': `${delay}ms` } as CSSProperties}
    >
      {children}
    </div>
  );
}

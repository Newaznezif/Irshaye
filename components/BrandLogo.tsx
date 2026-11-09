'use client';

import Image from 'next/image';
import { useSyncExternalStore } from 'react';
import { useTheme } from '@/hooks/useTheme';

type BrandLogoSize = 'landing' | 'footer' | 'sidebar' | 'compact';

const NEXT_LOGO_KEY = 'irshaye.brand-logo.next-index';
let pageLogoIndex: number | null = null;

/**
 * Select one logo once per full page load. Every BrandLogo instance shares the
 * same selection, while the next index is persisted for the next refresh.
 */
function getPageLogoIndex(): number {
  if (pageLogoIndex !== null) return pageLogoIndex;

  try {
    const stored = Number(window.localStorage.getItem(NEXT_LOGO_KEY));
    const current = Number.isInteger(stored) && stored >= 0 && stored < 5 ? stored : 0;
    pageLogoIndex = current;
    window.localStorage.setItem(NEXT_LOGO_KEY, String((current + 1) % 5));
  } catch {
    pageLogoIndex = Math.floor(Math.random() * 5);
  }

  return pageLogoIndex;
}

function subscribeToLogoSelection(): () => void {
  return () => {};
}

function getLogoSnapshot(): number {
  return getPageLogoIndex();
}

function getServerLogoSnapshot(): number {
  return 0;
}

const LOGOS = [
  {
    light: '/Irshayelogos/derived/wordmark-light.png',
    dark: '/Irshayelogos/derived/wordmark-dark-teal.png',
    brandSurface: false,
  },
  {
    light: '/Irshayelogos/derived/wordmark-print.png',
    dark: '/Irshayelogos/derived/wordmark-dark.png',
    brandSurface: false,
  },
  {
    light: '/Irshayelogos/derived/wordmark-dark-teal.png',
    dark: '/Irshayelogos/derived/wordmark-dark-teal.png',
    brandSurface: false,
  },
  {
    light: '/Irshayelogos/derived/wordmark-print.png',
    dark: '/Irshayelogos/derived/wordmark-dark.png',
    brandSurface: false,
  },
  {
    light: '/Irshayelogos/derived/wordmark-on-brand.png',
    dark: '/Irshayelogos/derived/wordmark-on-brand.png',
    brandSurface: true,
  },
] as const;

const SIZE_CLASSES: Record<BrandLogoSize, string> = {
  landing: 'h-10 w-[116px] sm:h-11 sm:w-[128px]',
  footer: 'h-10 w-[120px]',
  sidebar: 'h-10 w-[126px]',
  compact: 'h-8 w-[94px]',
};

export function BrandLogo({
  size = 'sidebar',
  className = '',
}: {
  size?: BrandLogoSize;
  className?: string;
}) {
  const { dark } = useTheme();
  const index = useSyncExternalStore(
    subscribeToLogoSelection,
    getLogoSnapshot,
    getServerLogoSnapshot,
  );
  const logo = LOGOS[index] ?? LOGOS[0];
  const src = dark ? logo.dark : logo.light;

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden ${SIZE_CLASSES[size]} ${logo.brandSurface ? 'rounded-lg bg-brand-600 p-1.5' : ''} ${className}`}
    >
      <Image
        src={src}
        alt="Irshaye"
        width={260}
        height={104}
        priority={size === 'landing' || size === 'sidebar'}
        className="h-full w-full object-contain"
      />
    </span>
  );
}

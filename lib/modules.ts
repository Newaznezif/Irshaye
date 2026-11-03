import type { LucideIcon } from 'lucide-react';
import { Bot, CloudSun, Database, Layers, LayoutDashboard, Settings, Sprout, Store } from 'lucide-react';

export type ModuleGroup = 'Today' | 'Intelligence' | 'Advisory' | 'Platform';

export type AppModule = {
  href: string;
  label: string;
  /** Used on narrow rails and tiles where the full name does not fit. */
  shortLabel: string;
  description: string;
  group: ModuleGroup;
  icon: LucideIcon;
};

/**
 * The eight modules in the order of the working method — location, crop, climate
 * context, agricultural information, recommendation. The sidebar groups the same
 * list for navigation; this array is the single source for both.
 */
export const MODULES: AppModule[] = [
  {
    href: '/dashboard',
    label: 'Overview',
    shortLabel: 'Overview',
    description: 'Your location, crop, and the season context that matters right now.',
    group: 'Today',
    icon: LayoutDashboard,
  },
  {
    href: '/dashboard/climate',
    label: 'Climate Intelligence',
    shortLabel: 'Climate',
    description: 'Current weather, forecasts, rainfall patterns, and climate-risk indicators.',
    group: 'Intelligence',
    icon: CloudSun,
  },
  {
    href: '/dashboard/markets',
    label: 'Market Intelligence',
    shortLabel: 'Markets',
    description: 'Ethiopian commodity prices with sources and observation dates.',
    group: 'Intelligence',
    icon: Store,
  },
  {
    href: '/dashboard/crops',
    label: 'Crop Advisory',
    shortLabel: 'Crops',
    description: 'Crop profiles, planting guidance, and climate suitability for your area.',
    group: 'Advisory',
    icon: Sprout,
  },
  {
    href: '/dashboard/soil',
    label: 'Soil Management',
    shortLabel: 'Soil',
    description: 'Soil conservation and erosion-prevention guidance for Ethiopian farms.',
    group: 'Advisory',
    icon: Layers,
  },
  {
    href: '/dashboard/advisor',
    label: 'AI Agricultural Advisor',
    shortLabel: 'AI Advisor',
    description: 'Evidence-based recommendations built from validated platform data.',
    group: 'Advisory',
    icon: Bot,
  },
  {
    href: '/dashboard/sources',
    label: 'Data Sources',
    shortLabel: 'Sources',
    description: 'Every data publisher, its license, freshness, and value classification.',
    group: 'Platform',
    icon: Database,
  },
  {
    href: '/dashboard/settings',
    label: 'Settings',
    shortLabel: 'Settings',
    description: 'Your saved location and crop, appearance, and integration status.',
    group: 'Platform',
    icon: Settings,
  },
];

export const MODULE_GROUPS: ModuleGroup[] = ['Today', 'Intelligence', 'Advisory', 'Platform'];

export const moduleByHref = (href: string): AppModule | undefined =>
  MODULES.find((m) => (m.href === '/dashboard' ? href === m.href : href.startsWith(m.href)));

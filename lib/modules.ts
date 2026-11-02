export type AppModule = {
  href: string;
  label: string;
  description: string;
};

export const MODULES: AppModule[] = [
  {
    href: '/dashboard',
    label: 'Overview',
    description: 'Your location, crop, and the season context that matters right now.',
  },
  {
    href: '/dashboard/climate',
    label: 'Climate Intelligence',
    description: 'Current weather, forecasts, rainfall patterns, and climate-risk indicators.',
  },
  {
    href: '/dashboard/crops',
    label: 'Crop Advisory',
    description: 'Crop profiles, planting guidance, and climate suitability for your area.',
  },
  {
    href: '/dashboard/soil',
    label: 'Soil Management',
    description: 'Soil conservation and erosion-prevention guidance for Ethiopian farms.',
  },
  {
    href: '/dashboard/markets',
    label: 'Market Intelligence',
    description: 'Ethiopian commodity prices with sources and observation dates.',
  },
  {
    href: '/dashboard/advisor',
    label: 'AI Agricultural Advisor',
    description: 'Evidence-based recommendations built from validated platform data.',
  },
  {
    href: '/dashboard/sources',
    label: 'Data Sources',
    description: 'Every data publisher, its license, freshness, and value classification.',
  },
  {
    href: '/dashboard/settings',
    label: 'Settings',
    description: 'Your saved location and crop, appearance, and integration status.',
  },
];

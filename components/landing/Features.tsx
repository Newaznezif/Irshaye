'use client';

import {
  BookOpen,
  CalendarDays,
  ChartLine,
  CloudRain,
  CloudSun,
  Clock,
  Gauge,
  Layers,
  MapPin,
  Mountain,
  Scale,
  Store,
  Timer,
  TriangleAlert,
} from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { FeatureSplit } from './FeatureSplit';

/**
 * The four evidence modules. Every claim here is a description of what the
 * application actually renders — source names, cadences and value kinds come
 * from the same registries the pages read, so this section cannot drift from
 * the product.
 */
export function Features() {
  const { t } = useLanguage();

  return (
    <div id="intelligence">
      <FeatureSplit
        eyebrow={t('module.climate.label')}
        title={t('features.climate.title')}
        lede={t('features.climate.lede')}
        image={{ src: '/images/climate-sky.jpg', alt: t('features.climate.alt') }}
        href="/dashboard/climate"
        ctaLabel={t('landing.openModule', { module: t('module.climate.label') })}
        bullets={[
          {
            icon: CloudSun,
            title: t('features.climate.b1Title'),
            body: t('features.climate.b1Body'),
          },
          {
            icon: CloudRain,
            title: t('features.climate.b2Title'),
            body: t('features.climate.b2Body'),
          },
          {
            icon: Gauge,
            title: t('features.climate.b3Title'),
            body: t('features.climate.b3Body'),
          },
          {
            icon: TriangleAlert,
            title: t('features.climate.b4Title'),
            body: t('features.climate.b4Body'),
          },
        ]}
      />

      <FeatureSplit
        tone="brand"
        flip
        eyebrow={t('module.crops.label')}
        title={t('features.crops.title')}
        lede={t('features.crops.lede')}
        image={{ src: '/images/teff-field.jpg', alt: t('features.crops.alt') }}
        href="/dashboard/crops"
        ctaLabel={t('landing.openModule', { module: t('module.crops.label') })}
        bullets={[
          {
            icon: CalendarDays,
            title: t('features.crops.b1Title'),
            body: t('features.crops.b1Body'),
          },
          {
            icon: MapPin,
            title: t('features.crops.b2Title'),
            body: t('features.crops.b2Body'),
          },
          {
            icon: BookOpen,
            title: t('features.crops.b3Title'),
            body: t('features.crops.b3Body'),
          },
          {
            icon: Scale,
            title: t('features.crops.b4Title'),
            body: t('features.crops.b4Body'),
          },
        ]}
      />

      <FeatureSplit
        eyebrow={t('module.soil.label')}
        title={t('features.soil.title')}
        lede={t('features.soil.lede')}
        image={{ src: '/images/soil-conservation.jpg', alt: t('features.soil.alt') }}
        href="/dashboard/soil"
        ctaLabel={t('landing.openModule', { module: t('module.soil.label') })}
        bullets={[
          {
            icon: Layers,
            title: t('features.soil.b1Title'),
            body: t('features.soil.b1Body'),
          },
          {
            icon: Mountain,
            title: t('features.soil.b2Title'),
            body: t('features.soil.b2Body'),
          },
          {
            icon: Timer,
            title: t('features.soil.b3Title'),
            body: t('features.soil.b3Body'),
          },
        ]}
      />

      <FeatureSplit
        tone="brand"
        flip
        eyebrow={t('module.markets.label')}
        title={t('features.markets.title')}
        lede={t('features.markets.lede')}
        image={{ src: '/images/grain-market.jpg', alt: t('features.markets.alt') }}
        href="/dashboard/markets"
        ctaLabel={t('landing.openModule', { module: t('module.markets.label') })}
        bullets={[
          {
            icon: Store,
            title: t('features.markets.b1Title'),
            body: t('features.markets.b1Body'),
          },
          {
            icon: ChartLine,
            title: t('features.markets.b2Title'),
            body: t('features.markets.b2Body'),
          },
          {
            icon: Clock,
            title: t('features.markets.b3Title'),
            body: t('features.markets.b3Body'),
          },
        ]}
      />
    </div>
  );
}

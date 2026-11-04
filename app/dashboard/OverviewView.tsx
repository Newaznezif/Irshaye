'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import {
  ArrowRight,
  CalendarClock,
  CloudRain,
  Droplets,
  LayoutDashboard,
  RefreshCw,
  Thermometer,
  Wind,
} from 'lucide-react';
import { useWorkbench } from '@/context/WorkbenchContext';
import { LocationPicker } from '@/components/data/LocationPicker';
import { CropPicker } from '@/components/CropPicker';
import { ProvenanceLabel, SourceUnavailable } from '@/components/data/ProvenanceLabel';
import {
  Badge,
  Button,
  ButtonLink,
  Loading,
  Metric,
  PageHeader,
  Panel,
  Refreshing,
  SectionLabel,
  StatCard,
  dayLabel,
  fmt,
  monthLong,
  stamp,
} from '@/components/ui';
import { useLanguage } from '@/hooks/useLanguage';
import { useLiveData } from '@/hooks/useLiveData';
import type { ProvenanceView } from '@/components/data/ProvenanceLabel';
import type { WeatherSeries } from '@/lib/data/types';
import { getCrop } from '@/lib/crops/catalog';
import { MODULES } from '@/lib/modules';

type WeatherPayload = WeatherSeries;

export default function OverviewPage() {
  const { t, locale } = useLanguage();
  const { place, cropId, setPlace, setCropId, ready } = useWorkbench();

  const params = `lat=${place.latitude}&lon=${place.longitude}`;
  const weather = useLiveData<WeatherPayload, ProvenanceView>(
    ready ? `/api/data/weather?${params}&days=7&pastDays=0&hourly=0` : null,
  );

  const daily = useMemo(() => weather.data?.daily ?? [], [weather.data]);
  const forecast = daily.filter((d) => d.isForecast);
  const rainNext7 = forecast.reduce((sum, d) => sum + (d.precipitationSumMm ?? 0), 0);
  const nextRainDay = forecast.find((d) => (d.precipitationSumMm ?? 0) >= 1);
  const outlookMaxTemps = forecast.map((d) => d.temperatureMaxC).filter((v): v is number => v !== null);
  const outlookMinTemps = forecast.map((d) => d.temperatureMinC).filter((v): v is number => v !== null);
  const maxOutlookTemp = outlookMaxTemps.length > 0 ? Math.max(...outlookMaxTemps) : null;
  const minOutlookTemp = outlookMinTemps.length > 0 ? Math.min(...outlookMinTemps) : null;
  const crop = getCrop(cropId);
  const now = new Date();
  const month = now.getMonth() + 1;

  const plantingNow = crop?.plantingWindows.some(
    (w) => w.startMonth <= month && month <= w.endMonth,
  );
  const harvestNow = crop?.harvestWindows.some(
    (w) => w.startMonth <= month && month <= w.endMonth,
  );

  const current = weather.data?.current ?? null;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t('nav.group.Today')}
        title={t('overview.title')}
        icon={LayoutDashboard}
        description={t('overview.description')}
        status={
          weather.data !== null ? (
            <Badge tone="brand" dot>
              {t('overview.badgeLive')}
            </Badge>
          ) : weather.loading ? (
            <Badge tone="neutral">{t('overview.badgeConnecting')}</Badge>
          ) : (
            <Badge tone="clay" dot>
              {t('overview.badgeNoReading')}
            </Badge>
          )
        }
        actions={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={weather.reload}
              disabled={weather.loading || weather.refreshing}
              leading={<RefreshCw size={14} className={weather.refreshing ? 'animate-spin' : undefined} />}
            >
              {t('common.refresh')}
            </Button>
            <ButtonLink variant="ghost" size="sm" href="/dashboard/settings" className="hidden sm:inline-flex">
              {t('overview.changeContext')}
            </ButtonLink>
          </>
        }
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <LocationPicker value={place} onChange={setPlace} label={t('overview.yourLocation')} />
        <CropPicker value={cropId} onChange={setCropId} />
      </div>

      <Panel
        title={t('overview.seasonContext', { place: place.name })}
        icon={CloudRain}
        hint={t('overview.seasonHint', { month: monthLong(now, locale) })}
        right={weather.refreshing ? <Refreshing /> : undefined}
        footer={
          weather.data !== null ? (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11.5px] text-ink-faint">
              <span className="inline-flex items-center gap-1.5 font-semibold text-ink-muted">
                <Thermometer size={12} className="text-brand-600 dark:text-brand-400" />
                {place.name}
              </span>
              {current && (
                <>
                  <span className="tabular inline-flex items-center gap-1.5">
                    <CloudRain size={12} /> {t('overview.rainNow', { value: fmt(current.precipitationMm, 1, locale) })}
                  </span>
                  <span className="tabular inline-flex items-center gap-1.5">
                    <Wind size={12} /> {fmt(current.windSpeedKmh, 0, locale)} km/h
                  </span>
                  <span className="tabular inline-flex items-center gap-1.5">
                    <Droplets size={12} /> {fmt(current.relativeHumidityPct, 0, locale)}%
                  </span>
                </>
              )}
              <ProvenanceLabel provenance={weather.provenance} compact />
            </div>
          ) : undefined
        }
      >
        {weather.loading && <Loading label={t('overview.loadingWeather')} />}

        {!weather.loading && weather.data === null && weather.error && (
          <SourceUnavailable error={weather.error} source="Open-Meteo" />
        )}

        {weather.data !== null && (
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                icon={Thermometer}
                label={t('overview.tempNow')}
                value={fmt(current?.temperatureC, 1, locale)}
                unit="°C"
                supporting={
                  current
                    ? t('overview.observedAt', { when: stamp(current.observedAt ?? weather.fetchedAt ?? '', locale) })
                    : t('overview.noObservation')
                }
              />
              <StatCard
                icon={CloudRain}
                label={t('hero.rainOutlook')}
                value={forecast.length > 0 ? fmt(rainNext7, 1, locale) : '—'}
                unit="mm"
                tone={rainNext7 > 25 ? 'brand' : rainNext7 > 0 ? 'gold' : 'clay'}
                supporting={
                  forecast.length > 0 ? t('overview.rainOutlookNote') : t('overview.noForecastDays')
                }
              />
              <StatCard
                icon={CalendarClock}
                label={t('overview.nextRainDay')}
                value={nextRainDay ? dayLabel(nextRainDay.date, locale) : t('overview.noneIn7d')}
                supporting={t('overview.nextRainDayNote')}
                tone="info"
              />
              <StatCard
                icon={Droplets}
                label={t('overview.humidityNow')}
                value={fmt(current?.relativeHumidityPct, 0, locale)}
                unit="%"
                supporting={t('overview.humidityNote')}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <Metric
                label={t('overview.forecastDays')}
                value={forecast.length.toLocaleString(locale)}
                note={t('overview.forecastDaysNote')}
              />
              <Metric
                label={t('overview.warmest')}
                value={fmt(maxOutlookTemp, 1, locale)}
                unit="°C"
                note={t('overview.warmestNote')}
              />
              <Metric
                label={t('overview.cooliest')}
                value={fmt(minOutlookTemp, 1, locale)}
                unit="°C"
                note={t('overview.cooliestNote')}
              />
            </div>

            <div className="rounded-xl border border-line bg-canvas/60 p-4">
              {crop ? (
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-baseline gap-x-2.5 text-[15px] font-extrabold tracking-tight text-ink">
                      {crop.name}
                      {crop.amharicName && (
                        <span lang="am" className="ethiopic text-[13px] font-bold text-brand-700 dark:text-brand-300">
                          — {crop.amharicName}
                        </span>
                      )}
                      <Badge tone={plantingNow ? 'brand' : harvestNow ? 'gold' : 'neutral'}>
                        {plantingNow
                          ? t('overview.plantingWindow')
                          : harvestNow
                            ? t('overview.harvestWindow')
                            : t('overview.outsideWindows')}
                      </Badge>
                    </p>
                    <p className="mt-2 max-w-2xl text-[12.5px] leading-relaxed text-ink-muted">
                      {plantingNow
                        ? t('overview.plantingNowNote')
                        : harvestNow
                          ? t('overview.harvestNowNote')
                          : t('overview.outsideWindowsNote')}
                    </p>
                  </div>
                  <Link
                    href="/dashboard/crops"
                    className="group inline-flex items-center gap-1.5 self-start rounded-xl bg-brand px-3.5 py-2 text-[13px] font-bold text-brand-ink transition-colors hover:bg-brand-hover md:self-auto"
                  >
                    {t('overview.openCrops')}
                    <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </div>
              ) : (
                <p className="text-[12.5px] leading-relaxed text-ink-muted">{t('overview.noCropProfileNote')}</p>
              )}
            </div>
          </div>
        )}
      </Panel>

      <section aria-label={t('overview.modulesAria')}>
        <SectionLabel>{t('overview.goDeeper')}</SectionLabel>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MODULES.filter((m) => m.href !== '/dashboard').map((m) => {
            const Icon = m.icon;
            return (
              <Link
                key={m.href}
                href={m.href}
                className="group flex items-start gap-4 rounded-2xl border border-line bg-surface p-5 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-lift"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand-700 ring-1 ring-inset ring-brand/15 dark:text-brand-300">
                  <Icon size={18} strokeWidth={2.1} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-[13.5px] font-extrabold tracking-tight text-ink">
                      {t(`module.${m.id}.label`)}
                    </span>
                    <ArrowRight
                      size={15}
                      className="shrink-0 text-ink-faint transition-all group-hover:translate-x-0.5 group-hover:text-brand"
                    />
                  </span>
                  <span className="mt-1.5 block text-[12px] leading-relaxed text-ink-muted">
                    {t(`module.${m.id}.description`)}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}

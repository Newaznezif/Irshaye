import type { Metadata } from 'next';
import { ClimateMonitor } from '@/components/data/ClimateMonitor';

export const metadata: Metadata = {
  title: 'Climate Intelligence',
  description:
    'Current weather, 7-day forecast, rainfall patterns and agro-climate context for Ethiopian locations, from Open-Meteo and NASA POWER with full provenance.',
};

export default function ClimatePage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black tracking-tight">Climate Intelligence</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400 max-w-2xl">
          Live conditions and forecast from Open-Meteo, rainfall history and 30-year normals from
          NASA POWER, and satellite observations for the same point. Observed, forecast, modelled,
          and derived values are always labelled as what they are.
        </p>
      </div>
      <ClimateMonitor />
    </div>
  );
}

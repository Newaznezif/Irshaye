import type { Metadata } from 'next';
import { ClimateMonitor } from '@/components/data/ClimateMonitor';

export const metadata: Metadata = {
  title: 'Climate Intelligence',
  description:
    'Current weather, 7-day forecast, rainfall patterns and agro-climate context for Ethiopian locations, from Open-Meteo and NASA POWER with full provenance.',
};

export default function ClimatePage() {
  return <ClimateMonitor />;
}

import type { Metadata } from 'next';
import CropsView from './CropsView';

export const metadata: Metadata = {
  title: 'Crop Advisory',
  description:
    'Source-cited crop profiles for Ethiopian staples with planting guidance and climate-suitability comparison against live data.',
};

export default function CropsPage() {
  return <CropsView />;
}

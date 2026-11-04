import type { Metadata } from 'next';
import SoilView from './SoilView';

export const metadata: Metadata = {
  title: 'Soil Management',
  description:
    'Soil conservation and erosion-prevention guidance for Ethiopian farms, with observed rainfall context and a clear measured-vs-modelled distinction.',
};

export default function SoilPage() {
  return <SoilView />;
}

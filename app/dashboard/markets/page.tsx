import type { Metadata } from 'next';
import { MarketIntelligence } from '@/components/data/MarketIntelligence';

export const metadata: Metadata = {
  title: 'Market Intelligence',
  description:
    'Ethiopian commodity prices surveyed by WFP rEMS and the FEWS NET weekly market survey, with publisher attribution, observation dates, units, freshness, and price-quality flags. Sources that do not answer are shown as unavailable.',
};

export default function MarketsPage() {
  return <MarketIntelligence />;
}

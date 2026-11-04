import type { Metadata } from 'next';
import { MarketIntelligence } from '@/components/data/MarketIntelligence';

export const metadata: Metadata = {
  title: 'Market Intelligence',
  description:
    'Ethiopian commodity prices from the WFP rEMS market survey, with source attribution, observation months, and price-quality flags.',
};

export default function MarketsPage() {
  return <MarketIntelligence />;
}

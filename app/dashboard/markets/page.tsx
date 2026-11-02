import type { Metadata } from 'next';
import { MarketIntelligence } from '@/components/data/MarketIntelligence';

export const metadata: Metadata = {
  title: 'Market Intelligence',
  description:
    'Ethiopian commodity prices from the WFP rEMS market survey, with source attribution, observation months, and price-quality flags.',
};

export default function MarketsPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black tracking-tight">Market Intelligence</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400 max-w-2xl">
          Retail and wholesale prices for actual Ethiopian market centres, published by the WFP
          rEMS survey via HDX. Every price carries its market, its month, and the publisher&rsquo;s own
          quality flag. No price is ever estimated by this platform.
        </p>
      </div>
      <MarketIntelligence />
    </div>
  );
}

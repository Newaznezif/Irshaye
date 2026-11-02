import type { Metadata } from 'next';
import { SourceStatusPanel } from '@/components/data/SourceStatusPanel';

export const metadata: Metadata = {
  title: 'Data Sources',
  description:
    'Every publisher behind IRSHAYE: license, cadence, freshness, and how values are classified.',
};

export default function SourcesPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black tracking-tight">Data Sources</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400 max-w-2xl">
          IRSHAYE serves open data from named publishers and nothing else. An empty card means the
          publisher did not answer — there are no fixtures, examples, or placeholder values in the
          serving path.
        </p>
      </div>
      <SourceStatusPanel />
    </div>
  );
}

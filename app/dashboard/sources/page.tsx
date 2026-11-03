import type { Metadata } from 'next';
import { Database } from 'lucide-react';
import { SourceStatusPanel } from '@/components/data/SourceStatusPanel';
import { ValueKindLegend } from '@/components/data/ValueKindLegend';
import { PageHeader } from '@/components/ui';

export const metadata: Metadata = {
  title: 'Data Sources',
  description:
    'Every publisher behind IRSHAYE: license, cadence, freshness, and how values are classified.',
};

export default function SourcesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Platform"
        title="Data Sources"
        icon={Database}
        description="IRSHAYE serves open data from named publishers and nothing else. An empty card means the publisher did not answer — there are no fixtures, examples, or placeholder values in the serving path."
      />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <SourceStatusPanel />
        <ValueKindLegend />
      </div>
    </div>
  );
}

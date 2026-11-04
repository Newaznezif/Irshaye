import type { Metadata } from 'next';
import SourcesView from './SourcesView';

export const metadata: Metadata = {
  title: 'Data Sources',
  description:
    'Every publisher behind IRSHAYE: license, cadence, freshness, and how values are classified.',
};

export default function SourcesPage() {
  return <SourcesView />;
}

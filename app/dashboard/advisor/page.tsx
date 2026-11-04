import type { Metadata } from 'next';
import AdvisorView from './AdvisorView';

export const metadata: Metadata = {
  title: 'AI Agricultural Advisor',
  description:
    'Evidence-based recommendations assembled from validated platform data, with citations, uncertainty, and abstention when evidence is insufficient.',
};

export default function AdvisorPage() {
  return <AdvisorView />;
}

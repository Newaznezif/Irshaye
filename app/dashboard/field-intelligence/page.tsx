import type { Metadata } from 'next';
import { FieldIntelligenceView } from './FieldIntelligenceView';

export const metadata: Metadata = {
  title: 'Field Intelligence',
  description:
    'Registered field devices, their sites, stored sensor history, configured alert rules and device positions, scoped to the cooperatives you belong to. Figures come from authorized database queries; a device that has not reported is shown as silent, not as zero.',
};

export default function FieldIntelligencePage() {
  return <FieldIntelligenceView />;
}

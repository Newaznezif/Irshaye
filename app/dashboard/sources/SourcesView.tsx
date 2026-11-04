'use client';

import { Database } from 'lucide-react';
import { SourceStatusPanel } from '@/components/data/SourceStatusPanel';
import { ValueKindLegend } from '@/components/data/ValueKindLegend';
import { PageHeader } from '@/components/ui';
import { useLanguage } from '@/hooks/useLanguage';

export default function SourcesView() {
  const { t } = useLanguage();
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t('nav.group.Platform')}
        title={t('module.sources.label')}
        icon={Database}
        description={t('sources.pageDescription')}
      />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <SourceStatusPanel />
        <ValueKindLegend />
      </div>
    </div>
  );
}

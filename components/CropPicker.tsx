'use client';

import { Sprout } from 'lucide-react';
import { CROP_PROFILES } from '@/lib/crops/catalog';
import { useLanguage } from '@/hooks/useLanguage';
import { Field, Panel, Select } from '@/components/ui';

export const CropPicker = ({
  value,
  onChange,
  id = 'crop-select',
}: {
  value: string;
  onChange: (cropId: string) => void;
  id?: string;
}) => {
  const { t } = useLanguage();
  const selected = CROP_PROFILES.find((c) => c.id === value);

  return (
    <Panel
      title={t('crops.yourCrop')}
      icon={Sprout}
      right={
        selected?.amharicName ? (
          <span lang="am" className="ethiopic text-[13px] font-bold text-brand-700 dark:text-brand-300">
            {selected.amharicName}
          </span>
        ) : undefined
      }
      hint={t('crops.pickerHint')}
    >
      <Field label={t('crops.cropProfile')} htmlFor={id}>
        <Select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
          {CROP_PROFILES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
              {c.amharicName ? ` — ${c.amharicName}` : ''}
            </option>
          ))}
        </Select>
      </Field>
    </Panel>
  );
};

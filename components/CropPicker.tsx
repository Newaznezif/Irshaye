'use client';

import { Sprout } from 'lucide-react';
import { CROP_PROFILES } from '@/lib/crops/catalog';
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
  const selected = CROP_PROFILES.find((c) => c.id === value);

  return (
    <Panel
      title="Your crop"
      icon={Sprout}
      right={
        selected?.amharicName ? (
          <span lang="am" className="ethiopic text-[13px] font-bold text-brand-700 dark:text-brand-300">
            {selected.amharicName}
          </span>
        ) : undefined
      }
      hint="Guidance is curated reference material with citations. Suitability compares it with live climate data and is labelled as modelled guidance, never as a measurement."
    >
      <Field label="Crop profile" htmlFor={id}>
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

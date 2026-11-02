'use client';

import { Sprout } from 'lucide-react';
import { CROP_PROFILES } from '@/lib/crops/catalog';

export const CropPicker = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (cropId: string) => void;
}) => {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm p-4 md:p-5">
      <label
        htmlFor="crop-select"
        className="text-xs font-black uppercase tracking-widest text-gray-400"
      >
        Crop
      </label>
      <div className="mt-1.5 flex items-center gap-2">
        <Sprout size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
        <select
          id="crop-select"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent text-sm font-semibold text-gray-900 dark:text-white focus:outline-none"
        >
          {CROP_PROFILES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
              {c.amharicName ? ` — ${c.amharicName}` : ''}
            </option>
          ))}
        </select>
      </div>
      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-3">
        Crop guidance is curated reference material with citations. Suitability compares it with
        live climate data and is labelled as modelled guidance, never as a measurement.
      </p>
    </div>
  );
};

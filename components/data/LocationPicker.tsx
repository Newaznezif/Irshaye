'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { Compass, MapPin } from 'lucide-react';
import { Badge, Button, Field, Input, Panel, Select, StateNotice } from '@/components/ui';

export interface SelectedPlace {
  name: string;
  admin1: string | null;
  admin2: string | null;
  latitude: number;
  longitude: number;
}

interface PlaceRow {
  name: string;
  admin1: string;
  admin2: string;
  latitude: number;
  longitude: number;
}

interface LocationsPayload {
  places: PlaceRow[];
  default: PlaceRow;
}

/**
 * Location selection for the Ethiopian data views.
 *
 * The list is not a hardcoded array in the bundle: it comes from `/api/data/locations`,
 * which is generated from WFP's own market reference table, so a chosen town always
 * carries the publisher's coordinates and its region/zone labels. A typed coordinate
 * is offered separately and is labelled as the user's own point.
 */
export const LocationPicker = ({
  value,
  onChange,
  label = 'Location',
}: {
  value: SelectedPlace;
  onChange: (place: SelectedPlace) => void;
  label?: string;
}) => {
  const [places, setPlaces] = useState<PlaceRow[] | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const [lat, setLat] = useState(String(value.latitude));
  const [lon, setLon] = useState(String(value.longitude));
  const [coordError, setCoordError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/data/locations', { headers: { accept: 'application/json' } })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((body: { data: LocationsPayload }) => {
        if (!cancelled) setPlaces(body.data.places);
      })
      .catch(() => {
        if (!cancelled) setFailed('Location list could not be loaded; the coordinate box still works.');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const grouped = useMemo(() => {
    const byRegion = new Map<string, PlaceRow[]>();
    for (const p of places ?? []) {
      const list = byRegion.get(p.admin1);
      if (list) list.push(p);
      else byRegion.set(p.admin1, [p]);
    }
    return [...byRegion.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [places]);

  const isCustom = !places?.some((p) => p.name === value.name);

  const applyCustom = () => {
    const latitude = Number(lat);
    const longitude = Number(lon);
    if (lat.trim() === '' || lon.trim() === '' || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      setCoordError('Enter a latitude and a longitude as numbers.');
      return;
    }
    if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
      setCoordError('Latitude must be between −90 and 90, longitude between −180 and 180.');
      return;
    }
    setCoordError(null);
    onChange({ name: 'Selected coordinate', admin1: null, admin2: null, latitude, longitude });
  };

  return (
    <Panel
      title={label}
      icon={MapPin}
      right={
        <Badge tone={value.admin1 ? 'brand' : 'outline'} dot={Boolean(value.admin1)}>
          {value.admin1 ? 'Survey market' : 'Own point'}
        </Badge>
      }
      hint="Towns come from WFP’s published market reference table, so a selection carries the publisher’s own coordinates and region labels."
    >
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <Field label="Market centre" htmlFor="market-place">
          <Select
            id="market-place"
            value={isCustom ? '__custom__' : value.name}
            onChange={(e) => {
              const found = places?.find((p) => p.name === e.target.value);
              if (!found) return;
              setLat(String(found.latitude));
              setLon(String(found.longitude));
              onChange({
                name: found.name,
                admin1: found.admin1,
                admin2: found.admin2,
                latitude: found.latitude,
                longitude: found.longitude,
              });
            }}
          >
            {isCustom && <option value="__custom__">Custom coordinate</option>}
            {grouped.length === 0 && <option>{value.name}</option>}
            {grouped.map(([region, list]) => (
              <optgroup key={region} label={region}>
                {list.map((p) => (
                  <option key={`${region}-${p.name}`} value={p.name}>
                    {p.name}
                    {p.admin2 ? ` — ${p.admin2}` : ''}
                  </option>
                ))}
              </optgroup>
            ))}
          </Select>
        </Field>

        <Field label="Or type your own point" htmlFor="custom-latitude" hint="Used as given; no administrative names are attached to a typed coordinate.">
          <div className="flex flex-wrap items-end gap-2">
            <Input
              id="custom-latitude"
              aria-label="Latitude"
              inputMode="decimal"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              className="w-[7.5rem]"
            />
            <Input
              aria-label="Longitude"
              inputMode="decimal"
              value={lon}
              onChange={(e) => setLon(e.target.value)}
              className="w-[7.5rem]"
            />
            <Button size="md" variant="secondary" leading={<Compass size={15} />} onClick={applyCustom} className="shrink-0">
              Apply
            </Button>
          </div>
        </Field>
      </div>

      <p className="mt-5 border-t border-line pt-4 text-[11.5px] leading-relaxed text-ink-faint">
        <span className="tabular font-bold text-ink-muted">
          {value.latitude.toFixed(3)}, {value.longitude.toFixed(3)}
        </span>
        {value.admin1
          ? ` — ${value.name}, ${value.admin1}${value.admin2 ? ` · ${value.admin2}` : ''}. Region and zone names are as published by WFP.`
          : ` — ${value.name}, your own point.`}
      </p>

      {coordError && (
        <StateNotice tone="gold" title="Check the coordinates" className="mt-4">
          {coordError}
        </StateNotice>
      )}
      {failed && (
        <StateNotice tone="clay" title="Location list unavailable" className="mt-4">
          {failed}
        </StateNotice>
      )}
    </Panel>
  );
};

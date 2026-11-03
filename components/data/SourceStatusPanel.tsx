'use client';
import React, { useState } from 'react';
import { Database, RefreshCw } from 'lucide-react';

import { useLiveData } from '@/hooks/useLiveData';
import { Badge, Button, Panel, Refreshing, SectionLabel, SegmentedControl, StateNotice, stamp } from '@/components/ui';
import type { BadgeTone } from '@/components/ui';

interface SourceRow {
  id: string;
  name: string;
  category: string;
  cadence: string;
  homeUrl: string;
  license: string;
  requiresKey: boolean;
  state: 'connected' | 'stale' | 'unavailable' | 'auth_required' | 'disabled';
  detail: string;
  observedAt: string | null;
  retrievedAt: string | null;
  stale: boolean;
}

interface SyncRow {
  sourceKey: string;
  status: 'succeeded' | 'partial' | 'failed' | 'skipped_overlap';
  finishedAt: string | null;
  rowsWritten: number;
  observedAt: string | null;
  errorMessage: string | null;
}

interface StatusPayload {
  checkedAt: string;
  counts: Record<string, number>;
  sources: SourceRow[];
  /** Absent when the caller did not ask for it; empty when configured but never run. */
  sync?: SyncRow[];
}

const SYNC_LABEL: Record<SyncRow['status'], string> = {
  succeeded: 'last run wrote everything',
  partial: 'last run wrote some publishers',
  failed: 'last run wrote nothing',
  skipped_overlap: 'skipped, another run was active',
};

const STATE_STYLE: Record<SourceRow['state'], { label: string; tone: BadgeTone }> = {
  connected: { label: 'Connected', tone: 'brand' },
  stale: { label: 'Behind schedule', tone: 'gold' },
  unavailable: { label: 'Unavailable', tone: 'clay' },
  auth_required: { label: 'Credentials needed', tone: 'info' },
  disabled: { label: 'Turned off', tone: 'neutral' },
};

/**
 * Reports each publisher's actual connection state, from a live probe of that
 * source — not from a config flag. The cadence column is the guard against
 * misreading a monthly or annual series as a real-time figure.
 */
export const SourceStatusPanel = () => {
  const [scope, setScope] = useState<'light' | 'all'>('light');
  const { data, loading, refreshing, error, reload } = useLiveData<StatusPayload>(
    `/api/data/status?sources=${scope}&persisted=1`,
  );

  const rows = data?.sources ?? [];

  return (
    <Panel
      title="Source status"
      icon={Database}
      hint="Each row is one live probe of the publisher itself. A source we cannot reach is reported as unreachable with the reason, never hidden or replaced."
      right={
        <div className="flex shrink-0 items-center gap-2">
          {refreshing && <Refreshing />}
          <Button
            variant="secondary"
            size="sm"
            onClick={reload}
            disabled={loading || refreshing}
            aria-label="Re-check sources"
            leading={<RefreshCw size={14} className={refreshing ? 'animate-spin' : undefined} />}
            className="px-2.5"
          >
            <span className="hidden lg:inline">Re-check</span>
          </Button>
        </div>
      }
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SegmentedControl
          label="Probe scope"
          size="sm"
          value={scope}
          onChange={setScope}
          options={[
            { value: 'light', label: 'Core sources' },
            { value: 'all', label: 'All sources' },
          ]}
        />
        {data && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            {Object.entries(data.counts).map(([state, n]) => {
              const style = STATE_STYLE[state as SourceRow['state']];
              return (
                <span key={state} className="flex items-center gap-1.5 text-[11.5px] font-semibold text-ink-muted">
                  <span className="tabular text-ink">{n}</span>
                  {style ? style.label : state.replace('_', ' ')}
                </span>
              );
            })}
          </div>
        )}
      </div>

      {loading && (
        <div className="mt-5">
          <SectionLabel>Probing sources…</SectionLabel>
          <div className="mt-3 space-y-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-12 rounded-xl" />
            ))}
          </div>
        </div>
      )}
      {error && !loading && (
        <StateNotice tone="clay" title="Status probe failed" className="mt-5">
          {error.message}
        </StateNotice>
      )}

      {rows.length > 0 && (
        <div className="mt-5 overflow-x-auto rounded-xl border border-line">
          <table className="w-full min-w-[760px] text-[12.5px]">
            <thead className="bg-canvas">
              <tr className="border-b border-line text-left text-[10px] font-bold uppercase tracking-[0.12em] text-ink-faint">
                <th scope="col" className="px-4 py-2.5 font-bold">Source</th>
                <th scope="col" className="px-4 py-2.5 font-bold">State</th>
                <th scope="col" className="px-4 py-2.5 font-bold">Cadence</th>
                <th scope="col" className="px-4 py-2.5 font-bold">Newest observation</th>
                <th scope="col" className="px-4 py-2.5 font-bold">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((row) => {
                const style = STATE_STYLE[row.state] ?? STATE_STYLE.disabled;
                return (
                  <tr key={row.id} className="align-top transition-colors hover:bg-canvas/70">
                    <td className="px-4 py-3">
                      <a
                        href={row.homeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-bold text-ink underline decoration-line-strong underline-offset-2 transition-colors hover:text-brand-hover"
                      >
                        {row.name}
                      </a>
                      <p className="mt-1 max-w-sm text-[11px] leading-relaxed text-ink-faint">{row.license}</p>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge tone={style.tone} dot>
                        {style.label}
                      </Badge>
                      {row.requiresKey && <p className="mt-1.5 text-[10px] text-ink-faint">API key required</p>}
                    </td>
                    <td className="px-4 py-3 capitalize whitespace-nowrap text-ink-muted">{row.cadence}</td>
                    <td className="tabular px-4 py-3 whitespace-nowrap text-ink-muted">
                      {row.observedAt ?? <span className="text-ink-faint">—</span>}
                    </td>
                    <td className="max-w-md px-4 py-3 text-[11.5px] leading-relaxed text-ink-muted">{row.detail}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {data && (
        <p className="mt-4 text-[11.5px] leading-relaxed text-ink-faint">
          Probes ran at <span className="tabular font-semibold text-ink-muted">{stamp(data.checkedAt)}</span> EAT.{' '}
          {scope === 'light'
            ? '“All sources” also checks the large price and indicator feeds, which take longer.'
            : ''}
        </p>
      )}

      {data && (
        <div className="mt-5 border-t border-line pt-4">
          <SectionLabel>Stored pipeline</SectionLabel>
          {(data.sync ?? []).length === 0 ? (
            <p className="mt-2 text-[11.5px] leading-relaxed text-ink-muted">
              No sync run has been recorded for this database, so nothing above is served from storage — every figure
              on this dashboard came from the publisher in this request. That is the working configuration; the sync
              only adds history and survives a publisher outage.
            </p>
          ) : (
            <ul className="mt-2.5 space-y-2">
              {(data.sync ?? []).map((run) => (
                <li
                  key={run.sourceKey}
                  className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-[11.5px] text-ink-muted"
                >
                  <span className="font-bold text-ink">{run.sourceKey}</span>
                  <span>{SYNC_LABEL[run.status] ?? run.status}</span>
                  <span className="tabular">{run.rowsWritten.toLocaleString('en-US')} rows</span>
                  <span className="tabular">
                    {run.finishedAt ? stamp(run.finishedAt) : 'unfinished'}
                  </span>
                  {run.errorMessage && <span className="text-clay-600 dark:text-clay-300">{run.errorMessage}</span>}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Panel>
  );
};

"use client";

import { DatePresetControls } from "@/components/dashboard/date-preset-controls";
import { NeedsAttentionPanel } from "@/components/dashboard/needs-attention";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { StatusCards } from "@/components/dashboard/status-cards";
import { StatusChart } from "@/components/dashboard/status-chart";
import { SummaryMetricsCards } from "@/components/dashboard/summary-metrics";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import {
  DEFAULT_DATE_PRESET,
  getDatePresetLabel,
  getDateRange,
  type DatePresetId,
} from "@/lib/dashboard/date-presets";
import { getDemoQuotes } from "@/lib/dashboard/demo-data";
import {
  getNeedsAttention,
  getStatusCounts,
  getSummaryMetrics,
  type StatusCounts,
  type SummaryMetrics,
  type NeedsAttention,
} from "@/lib/dashboard/metrics";
import { QUOTE_STATUSES } from "@/types/quote";
import { startOfDay } from "@/lib/format";
import { useState, useSyncExternalStore } from "react";

const EMPTY_STATUS_COUNTS = Object.fromEntries(
  QUOTE_STATUSES.map((status) => [status, 0]),
) as StatusCounts;

const EMPTY_METRICS: SummaryMetrics = {
  quotesCreated: 0,
  quotesSent: 0,
  quotesAccepted: 0,
  acceptedQuoteValue: 0,
  expiringWithin7Days: 0,
};

const EMPTY_ATTENTION: NeedsAttention = {
  staleDrafts: [],
  expiringSoon: [],
  recentlySent: [],
};

let clientTodayMs: number | null = null;

function subscribeToNothing() {
  return () => {};
}

function getClientTodayMs(): number | null {
  if (clientTodayMs === null) {
    clientTodayMs = startOfDay(new Date()).getTime();
  }
  return clientTodayMs;
}

function getServerTodayMs(): number | null {
  return null;
}

/**
 * Resolve "today" only on the client so SSR/prerender
 * never freezes build-time dates into the HTML.
 */
function useClientToday(): Date | null {
  const ms = useSyncExternalStore(
    subscribeToNothing,
    getClientTodayMs,
    getServerTodayMs,
  );
  return ms === null ? null : new Date(ms);
}

export function DashboardView() {
  const [preset, setPreset] = useState<DatePresetId>(DEFAULT_DATE_PRESET);
  const today = useClientToday();
  const presetLabel = getDatePresetLabel(preset);

  const quotes = today ? getDemoQuotes(today) : [];
  const range = today ? getDateRange(preset, today) : null;
  const statusCounts = today ? getStatusCounts(quotes) : EMPTY_STATUS_COUNTS;
  const metrics =
    today && range
      ? getSummaryMetrics(quotes, range, today)
      : EMPTY_METRICS;
  const attention = today ? getNeedsAttention(quotes, today) : EMPTY_ATTENTION;

  return (
    <PageContainer className="gap-8" aria-busy={today ? undefined : true}>
      <PageHeader
        title="Dashboard"
        description="What needs attention · quick actions"
        actions={<DatePresetControls value={preset} onChange={setPreset} />}
      />

      <QuickActions />
      <StatusCards counts={statusCounts} />
      <SummaryMetricsCards metrics={metrics} presetLabel={presetLabel} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2 xl:gap-8">
        <StatusChart counts={statusCounts} />
        <NeedsAttentionPanel data={attention} />
      </div>
    </PageContainer>
  );
}

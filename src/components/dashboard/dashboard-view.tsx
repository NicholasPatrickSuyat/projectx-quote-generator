"use client";

import { DatePresetControls } from "@/components/dashboard/date-preset-controls";
import { NeedsAttentionPanel } from "@/components/dashboard/needs-attention";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { StatusCards } from "@/components/dashboard/status-cards";
import { StatusChart } from "@/components/dashboard/status-chart";
import { SummaryMetricsCards } from "@/components/dashboard/summary-metrics";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { useQuoteSession } from "@/components/session/quote-session-provider";
import {
  DEFAULT_DATE_PRESET,
  getDatePresetLabel,
  getDateRange,
  type DatePresetId,
} from "@/lib/dashboard/date-presets";
import {
  getNeedsAttention,
  getStatusCounts,
  getSummaryMetrics,
  type StatusCounts,
  type SummaryMetrics,
  type NeedsAttention,
} from "@/lib/dashboard/metrics";
import { QUOTE_STATUSES } from "@/types/quote";
import { useState } from "react";

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

export function DashboardView() {
  const [preset, setPreset] = useState<DatePresetId>(DEFAULT_DATE_PRESET);
  const { ready, today, quotes } = useQuoteSession();
  const presetLabel = getDatePresetLabel(preset);

  const range = today ? getDateRange(preset, today) : null;
  const statusCounts =
    ready && today ? getStatusCounts(quotes) : EMPTY_STATUS_COUNTS;
  const metrics =
    ready && today && range
      ? getSummaryMetrics(quotes, range, today)
      : EMPTY_METRICS;
  const attention =
    ready && today ? getNeedsAttention(quotes, today) : EMPTY_ATTENTION;

  return (
    <PageContainer className="gap-8" aria-busy={ready ? undefined : true}>
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

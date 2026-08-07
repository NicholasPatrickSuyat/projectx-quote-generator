export const QUOTE_STATUSES = [
  "Draft",
  "Sent",
  "Accepted",
  "Rejected",
  "Expired",
] as const;

export type QuoteStatus = (typeof QUOTE_STATUSES)[number];

export type DemoQuote = {
  id: string;
  number: string;
  customerName: string;
  status: QuoteStatus;
  total: number;
  createdAt: string;
  sentAt?: string;
  acceptedAt?: string;
  expiresAt?: string;
  archived?: boolean;
};

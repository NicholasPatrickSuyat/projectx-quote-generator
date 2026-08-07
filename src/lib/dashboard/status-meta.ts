import type { QuoteStatus } from "@/types/quote";
import type { ComponentType, SVGProps } from "react";
import {
  IconCheckCircle,
  IconClock,
  IconFileText,
  IconSend,
  IconXCircle,
} from "@/components/icons";

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

export const STATUS_META: Record<
  QuoteStatus,
  {
    label: string;
    icon: IconComponent;
    cardClass: string;
    barClass: string;
    href: string;
  }
> = {
  Draft: {
    label: "Draft",
    icon: IconFileText,
    cardClass: "bg-[var(--px-status-draft-bg)] text-[var(--px-status-draft-text)]",
    barClass: "bg-[var(--px-status-draft-text)]",
    href: "/quotes?status=Draft",
  },
  Sent: {
    label: "Sent",
    icon: IconSend,
    cardClass: "bg-[var(--px-status-sent-bg)] text-[var(--px-status-sent-text)]",
    barClass: "bg-[var(--px-status-sent-text)]",
    href: "/quotes?status=Sent",
  },
  Accepted: {
    label: "Accepted",
    icon: IconCheckCircle,
    cardClass:
      "bg-[var(--px-status-accepted-bg)] text-[var(--px-status-accepted-text)]",
    barClass: "bg-[var(--px-status-accepted-text)]",
    href: "/quotes?status=Accepted",
  },
  Rejected: {
    label: "Rejected",
    icon: IconXCircle,
    cardClass:
      "bg-[var(--px-status-rejected-bg)] text-[var(--px-status-rejected-text)]",
    barClass: "bg-[var(--px-status-rejected-text)]",
    href: "/quotes?status=Rejected",
  },
  Expired: {
    label: "Expired",
    icon: IconClock,
    cardClass:
      "bg-[var(--px-status-expired-bg)] text-[var(--px-status-expired-text)]",
    barClass: "bg-[var(--px-status-expired-text)]",
    href: "/quotes?status=Expired",
  },
};

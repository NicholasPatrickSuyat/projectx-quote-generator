import {
  IconCatalog,
  IconCustomers,
  IconFilePlus,
  IconQuotes,
  IconUserPlus,
} from "@/components/icons";
import { buttonClassName } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import Link from "next/link";

const actions = [
  {
    label: "New Quote",
    href: "/quotes/new",
    icon: IconFilePlus,
    primary: true,
  },
  {
    label: "New Customer",
    href: "/customers?create=1",
    icon: IconUserPlus,
  },
  {
    label: "View All Quotes",
    href: "/quotes",
    icon: IconQuotes,
  },
  {
    label: "View Customers",
    href: "/customers",
    icon: IconCustomers,
  },
  {
    label: "Service Catalog",
    href: "/catalog",
    icon: IconCatalog,
  },
] as const;

export function QuickActions() {
  return (
    <section aria-labelledby="quick-actions-heading" className="space-y-4">
      <h2
        id="quick-actions-heading"
        className="text-xs font-semibold tracking-wider text-text-secondary uppercase"
      >
        Quick Actions
      </h2>
      <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
        {actions.map((action) => {
          const Icon = action.icon;
          const primary = "primary" in action && action.primary;
          return (
            <Link
              key={action.href + action.label}
              href={action.href}
              className={cn(
                buttonClassName({
                  variant: primary ? "primary" : "secondary",
                  size: "md",
                }),
                primary &&
                  "h-11 min-w-[10.5rem] px-5 text-[0.9375rem] font-semibold shadow-md ring-1 ring-primary/25 hover:ring-primary/40",
              )}
            >
              <Icon className={cn("size-4 shrink-0", primary && "size-[1.125rem]")} />
              {action.label}
            </Link>
          );
        })}
      </div>
    </section>
  );
}

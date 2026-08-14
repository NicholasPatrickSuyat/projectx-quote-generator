import { DEMO_COMPANY_DEFAULTS, getDemoCompanySettings } from "@/lib/company/demo-defaults";
import { DEMO_CUSTOMER_IDS } from "@/lib/customers/demo-data";
import { withRecalculatedTotals } from "@/lib/quotes/calculations";
import { createQuotePdfSnapshot } from "@/lib/pdf/snapshot";
import { nextQuoteNumberFromExisting } from "@/lib/persistence/numbering";
import { addDays, startOfDay, toIsoDate } from "@/lib/format";
import type { Customer } from "@/types/customer";
import { customerDisplayName } from "@/types/customer";
import type {
  DiscountType,
  LineCategory,
  Quote,
  QuoteCustomerSnapshot,
  QuoteLineItem,
  QuoteStatus,
} from "@/types/quote";

function daysFrom(today: Date, offset: number): string {
  return toIsoDate(addDays(startOfDay(today), offset));
}

/** Stable demo quote UUIDs (routes / session keys). */
export const DEMO_QUOTE_IDS = {
  quo1042: "b2001042-0000-4000-8000-000000001042",
  quo1048: "b2001048-0000-4000-8000-000000001048",
  quo1055: "b2001055-0000-4000-8000-000000001055",
  quo1056: "b2001056-0000-4000-8000-000000001056",
  quo1031: "b2001031-0000-4000-8000-000000001031",
  quo1049: "b2001049-0000-4000-8000-000000001049",
  quo1052: "b2001052-0000-4000-8000-000000001052",
  quo1022: "b2001022-0000-4000-8000-000000001022",
  quo1038: "b2001038-0000-4000-8000-000000001038",
  quo1044: "b2001044-0000-4000-8000-000000001044",
  quo1051: "b2001051-0000-4000-8000-000000001051",
  quo1028: "b2001028-0000-4000-8000-000000001028",
  quo1040: "b2001040-0000-4000-8000-000000001040",
  quo1015: "b2001015-0000-4000-8000-000000001015",
  quo1033: "b2001033-0000-4000-8000-000000001033",
} as const;

function snapshot(
  customerId: string,
  customerNumber: string,
  customerName: string,
  companyName: string,
  phone: string,
  email: string,
  street: string,
  city: string,
  state: string,
  zip: string,
): QuoteCustomerSnapshot {
  return {
    customerId,
    customerNumber,
    customerName,
    companyName,
    phone,
    email,
    street,
    city,
    state,
    zip,
  };
}

export function customerToSnapshot(customer: Customer): QuoteCustomerSnapshot {
  return {
    customerId: customer.id,
    customerNumber: customer.customerNumber,
    customerName: customerDisplayName(customer),
    companyName: customer.companyName,
    phone: customer.phone,
    email: customer.email,
    street: customer.street,
    city: customer.city,
    state: customer.state,
    zip: customer.zip,
  };
}

function line(
  category: LineCategory,
  description: string,
  quantity: number,
  unitPrice: number,
  unit = "ea",
  internalNotes = "",
): Omit<QuoteLineItem, "lineTotal" | "sortOrder"> {
  return {
    id: crypto.randomUUID(),
    category,
    description,
    quantity,
    unitPrice,
    unit,
    internalNotes,
  };
}

type SeedInput = {
  id: string;
  quoteNumber: string;
  customer: QuoteCustomerSnapshot;
  jobDescription: string;
  status: QuoteStatus;
  quoteDateOffset: number;
  validUntilOffset: number | null;
  preparedBy: string;
  createdOffset: number;
  updatedOffset: number;
  sentOffset?: number | null;
  acceptedOffset?: number | null;
  rejectedOffset?: number | null;
  expiredOffset?: number | null;
  archived?: boolean;
  archivedOffset?: number | null;
  statusBeforeArchive?: QuoteStatus | null;
  taxRate?: number;
  discountType?: DiscountType;
  discountValue?: number;
  internalNotes?: string;
  customerFacingMessage?: string;
  termsAndConditions?: string;
  lines: Omit<QuoteLineItem, "lineTotal" | "sortOrder">[];
};

/**
 * 15 demo quotes — Spec §15.2 mix: 4 Draft, 3 Sent, 4 Accepted, 2 Rejected, 2 Expired.
 * One Accepted quote is also archived to exercise restore.
 */
export function getDemoQuotes(today: Date = new Date()): Quote[] {
  const jane = snapshot(
    DEMO_CUSTOMER_IDS.jane,
    "CUST-000001",
    "Jane Doe",
    "",
    "(214) 555-0142",
    "jane.doe@email.com",
    "1842 Maple Avenue",
    "Dallas",
    "TX",
    "75204",
  );
  const marcus = snapshot(
    DEMO_CUSTOMER_IDS.marcus,
    "CUST-000002",
    "Marcus Nguyen",
    "Northline Offices",
    "(972) 555-0198",
    "marcus@northlineoffices.com",
    "900 Legacy Drive Suite 200",
    "Plano",
    "TX",
    "75024",
  );
  const elena = snapshot(
    DEMO_CUSTOMER_IDS.elena,
    "CUST-000003",
    "Elena Ruiz",
    "",
    "(469) 555-0117",
    "elena.ruiz@gmail.com",
    "512 Walnut Creek Blvd",
    "Garland",
    "TX",
    "75040",
  );
  const david = snapshot(
    DEMO_CUSTOMER_IDS.david,
    "CUST-000004",
    "David Chen",
    "Summit Dental Group",
    "(214) 555-0166",
    "dchen@summitdental.com",
    "3300 Preston Road",
    "Richardson",
    "TX",
    "75080",
  );
  const priya = snapshot(
    DEMO_CUSTOMER_IDS.priya,
    "CUST-000005",
    "Priya Patel",
    "",
    "(817) 555-0133",
    "priya.patel@outlook.com",
    "78 Riverview Court",
    "Arlington",
    "TX",
    "76010",
  );
  const owen = snapshot(
    DEMO_CUSTOMER_IDS.owen,
    "CUST-000006",
    "Owen Brooks",
    "Oak & Iron Brewery",
    "(972) 555-0184",
    "owen@oakironbrewery.com",
    "1101 Industrial Blvd",
    "Irving",
    "TX",
    "75061",
  );
  const sophia = snapshot(
    DEMO_CUSTOMER_IDS.sophia,
    "CUST-000007",
    "Sophia Martinez",
    "BrightPath Academy",
    "(469) 555-0175",
    "smartinez@brightpath.edu",
    "4500 Independence Pkwy",
    "Frisco",
    "TX",
    "75035",
  );
  const liam = snapshot(
    DEMO_CUSTOMER_IDS.liam,
    "CUST-000008",
    "Liam Foster",
    "",
    "(214) 555-0109",
    "liam.foster@email.com",
    "2211 Mockingbird Lane",
    "Dallas",
    "TX",
    "75235",
  );
  const ava = snapshot(
    DEMO_CUSTOMER_IDS.ava,
    "CUST-000009",
    "Ava Kim",
    "Westfield Logistics",
    "(972) 555-0121",
    "ava.kim@westfieldlogistics.com",
    "6700 Belt Line Road",
    "Irving",
    "TX",
    "75063",
  );

  const defaults = DEMO_COMPANY_DEFAULTS;

  const seeds: SeedInput[] = [
    {
      id: DEMO_QUOTE_IDS.quo1042,
      quoteNumber: "QUO-1042",
      customer: jane,
      jobDescription: "Attic insulation and duct sealing",
      status: "Draft",
      quoteDateOffset: -18,
      validUntilOffset: 12,
      preparedBy: "Alex Rivera",
      createdOffset: -18,
      updatedOffset: -18,
      taxRate: 8.25,
      lines: [
        line("Services", "Attic insulation assessment", 1, 129, "ea"),
        line("Materials", "Blown-in insulation", 40, 48, "bag"),
        line("Labor", "Duct sealing labor", 6, 110, "hr"),
      ],
    },
    {
      id: DEMO_QUOTE_IDS.quo1048,
      quoteNumber: "QUO-1048",
      customer: marcus,
      jobDescription: "Rooftop package unit maintenance",
      status: "Draft",
      quoteDateOffset: -11,
      validUntilOffset: 19,
      preparedBy: "Alex Rivera",
      createdOffset: -11,
      updatedOffset: -10,
      lines: [
        line("Services", "Rooftop unit seasonal maintenance", 1, 450, "ea"),
        line("Materials", "Filter Replacement Pack", 4, 48, "ea"),
        line("Labor", "Service Labor", 3, 115, "hr"),
      ],
    },
    {
      id: DEMO_QUOTE_IDS.quo1055,
      quoteNumber: "QUO-1055",
      customer: elena,
      jobDescription: "Thermostat upgrade and calibration",
      status: "Draft",
      quoteDateOffset: -3,
      validUntilOffset: 27,
      preparedBy: "Jordan Lee",
      createdOffset: -3,
      updatedOffset: -3,
      lines: [
        line("Services", "Smart thermostat install and configuration", 1, 285, "ea"),
        line("Labor", "Calibration and walkthrough", 1, 115, "hr"),
      ],
    },
    {
      id: DEMO_QUOTE_IDS.quo1056,
      quoteNumber: "QUO-1056",
      customer: david,
      jobDescription: "Dental suite condenser replacement",
      status: "Draft",
      quoteDateOffset: -1,
      validUntilOffset: 29,
      preparedBy: "Jordan Lee",
      createdOffset: -1,
      updatedOffset: -1,
      discountType: "percent",
      discountValue: 5,
      taxRate: 8.25,
      lines: [
        line("Materials", "Standard outdoor condenser unit", 1, 2450, "ea"),
        line("Materials", "Matched evaporator coil", 1, 875, "ea"),
        line("Labor", "Installation labor", 8, 125, "hr"),
      ],
    },
    {
      id: DEMO_QUOTE_IDS.quo1031,
      quoteNumber: "QUO-1031",
      customer: owen,
      jobDescription: "Walk-in cooler compressor service",
      status: "Sent",
      quoteDateOffset: -14,
      validUntilOffset: 5,
      preparedBy: "Alex Rivera",
      createdOffset: -14,
      updatedOffset: -12,
      sentOffset: -12,
      taxRate: 8.25,
      lines: [
        line("Services", "Compressor diagnostic", 1, 129, "ea"),
        line("Materials", "Compressor service kit", 1, 620, "ea"),
        line("Labor", "Service Labor", 4, 115, "hr"),
      ],
    },
    {
      id: DEMO_QUOTE_IDS.quo1049,
      quoteNumber: "QUO-1049",
      customer: sophia,
      jobDescription: "Campus HVAC seasonal startup",
      status: "Sent",
      quoteDateOffset: -9,
      validUntilOffset: 3,
      preparedBy: "Morgan Blake",
      createdOffset: -9,
      updatedOffset: -8,
      sentOffset: -8,
      taxRate: 8.25,
      discountType: "fixed",
      discountValue: 250,
      lines: [
        line("Services", "Multi-zone seasonal startup", 1, 2200, "ea"),
        line("Materials", "Filter Replacement Pack", 24, 48, "ea"),
        line("Labor", "Service Labor", 16, 115, "hr"),
      ],
    },
    {
      id: DEMO_QUOTE_IDS.quo1052,
      quoteNumber: "QUO-1052",
      customer: ava,
      jobDescription: "Warehouse make-up air unit install",
      status: "Sent",
      quoteDateOffset: -5,
      validUntilOffset: 16,
      preparedBy: "Alex Rivera",
      createdOffset: -5,
      updatedOffset: -4,
      sentOffset: -4,
      taxRate: 8.25,
      lines: [
        line("Materials", "Make-up air unit", 1, 1850, "ea"),
        line("Labor", "Installation labor", 6, 125, "hr"),
        line("Services", "Startup and balancing", 1, 280, "ea"),
      ],
    },
    {
      id: DEMO_QUOTE_IDS.quo1022,
      quoteNumber: "QUO-1022",
      customer: marcus,
      jobDescription: "Office VRF zone expansion",
      status: "Accepted",
      quoteDateOffset: -28,
      validUntilOffset: -5,
      preparedBy: "Jordan Lee",
      createdOffset: -28,
      updatedOffset: -20,
      sentOffset: -26,
      acceptedOffset: -20,
      taxRate: 8.25,
      lines: [
        line("Materials", "VRF indoor cassette", 3, 1680, "ea"),
        line("Materials", "Refrigerant line set", 3, 240, "ea"),
        line("Labor", "Installation labor", 24, 125, "hr"),
        line("Services", "Commissioning", 1, 650, "ea"),
      ],
    },
    {
      id: DEMO_QUOTE_IDS.quo1038,
      quoteNumber: "QUO-1038",
      customer: jane,
      jobDescription: "Whole-home heat pump install",
      status: "Accepted",
      quoteDateOffset: -16,
      validUntilOffset: 2,
      preparedBy: "Morgan Blake",
      createdOffset: -16,
      updatedOffset: -10,
      sentOffset: -15,
      acceptedOffset: -10,
      taxRate: 8.25,
      lines: [
        line("Materials", "Heat pump outdoor unit", 1, 3200, "ea"),
        line("Materials", "Matched air handler", 1, 1450, "ea"),
        line("Labor", "Installation labor", 14, 125, "hr"),
      ],
    },
    {
      id: DEMO_QUOTE_IDS.quo1044,
      quoteNumber: "QUO-1044",
      customer: david,
      jobDescription: "Server room dedicated cooling",
      status: "Accepted",
      quoteDateOffset: -8,
      validUntilOffset: 14,
      preparedBy: "Alex Rivera",
      createdOffset: -8,
      updatedOffset: -3,
      sentOffset: -7,
      acceptedOffset: -3,
      taxRate: 8.25,
      lines: [
        line("Materials", "Dedicated cooling unit", 1, 8900, "ea"),
        line("Materials", "Condensate pump kit", 1, 320, "ea"),
        line("Labor", "Installation labor", 20, 125, "hr"),
        line("Services", "Load calculation and design", 1, 750, "ea"),
      ],
    },
    {
      id: DEMO_QUOTE_IDS.quo1051,
      quoteNumber: "QUO-1051",
      customer: liam,
      jobDescription: "Furnace tune-up and filter package",
      status: "Accepted",
      quoteDateOffset: -40,
      validUntilOffset: -10,
      preparedBy: "Jordan Lee",
      createdOffset: -40,
      updatedOffset: -35,
      sentOffset: -38,
      acceptedOffset: -35,
      archived: true,
      archivedOffset: -5,
      statusBeforeArchive: "Accepted",
      lines: [
        line("Services", "Seasonal furnace inspection and tune-up", 1, 189, "ea"),
        line("Materials", "Filter Replacement Pack", 2, 48, "ea"),
        line("Labor", "Service Labor", 2, 115, "hr"),
      ],
    },
    {
      id: DEMO_QUOTE_IDS.quo1028,
      quoteNumber: "QUO-1028",
      customer: priya,
      jobDescription: "Mini-split install for bonus room",
      status: "Rejected",
      quoteDateOffset: -22,
      validUntilOffset: -1,
      preparedBy: "Morgan Blake",
      createdOffset: -22,
      updatedOffset: -18,
      sentOffset: -21,
      rejectedOffset: -18,
      taxRate: 8.25,
      lines: [
        line("Materials", "Single-zone mini-split", 1, 2800, "ea"),
        line("Labor", "Installation labor", 10, 125, "hr"),
        line("Services", "Electrical disconnect and startup", 1, 350, "ea"),
      ],
    },
    {
      id: DEMO_QUOTE_IDS.quo1040,
      quoteNumber: "QUO-1040",
      customer: owen,
      jobDescription: "Kitchen exhaust hood balancing",
      status: "Rejected",
      quoteDateOffset: -12,
      validUntilOffset: 8,
      preparedBy: "Alex Rivera",
      createdOffset: -12,
      updatedOffset: -9,
      sentOffset: -11,
      rejectedOffset: -9,
      taxRate: 8.25,
      lines: [
        line("Services", "Hood airflow balancing", 1, 980, "ea"),
        line("Labor", "Service Labor", 8, 115, "hr"),
        line("Materials", "Belt and damper kit", 1, 210, "ea"),
      ],
    },
    {
      id: DEMO_QUOTE_IDS.quo1015,
      quoteNumber: "QUO-1015",
      customer: elena,
      jobDescription: "Evaporator coil replacement",
      status: "Expired",
      quoteDateOffset: -45,
      validUntilOffset: -10,
      preparedBy: "Jordan Lee",
      createdOffset: -45,
      updatedOffset: -40,
      sentOffset: -40,
      expiredOffset: -10,
      taxRate: 8.25,
      lines: [
        line("Materials", "Matched evaporator coil", 1, 875, "ea"),
        line("Labor", "Installation labor", 6, 125, "hr"),
        line("Services", "System recharge and check", 1, 320, "ea"),
      ],
    },
    {
      id: DEMO_QUOTE_IDS.quo1033,
      quoteNumber: "QUO-1033",
      customer: ava,
      jobDescription: "Dock door air curtain install",
      status: "Expired",
      quoteDateOffset: -35,
      validUntilOffset: -4,
      preparedBy: "Morgan Blake",
      createdOffset: -35,
      updatedOffset: -33,
      sentOffset: -33,
      expiredOffset: -4,
      taxRate: 8.25,
      lines: [
        line("Materials", "Industrial air curtain", 1, 1120, "ea"),
        line("Labor", "Installation labor", 4, 125, "hr"),
        line("Services", "Electrical hookup and test", 1, 240, "ea"),
      ],
    },
  ];

  return seeds.map((seed) => {
    const base = {
      id: seed.id,
      quoteNumber: seed.quoteNumber,
      customerSnapshot: seed.customer,
      jobDescription: seed.jobDescription,
      status: seed.status,
      quoteDate: daysFrom(today, seed.quoteDateOffset),
      validUntil:
        seed.validUntilOffset === null
          ? null
          : daysFrom(today, seed.validUntilOffset),
      preparedBy: seed.preparedBy,
      preparedByUserId: null,
      internalNotes: seed.internalNotes ?? "",
      customerFacingMessage:
        seed.customerFacingMessage ?? defaults.customerFacingMessage,
      termsAndConditions:
        seed.termsAndConditions ?? defaults.termsAndConditions,
      taxRate: seed.taxRate ?? defaults.taxRate,
      discountType: seed.discountType ?? defaults.discountType,
      discountValue: seed.discountValue ?? defaults.discountValue,
      lineItems: seed.lines.map((item, index) => ({
        ...item,
        sortOrder: index,
        lineTotal: 0,
      })),
      subtotal: 0,
      discountAmount: 0,
      taxAmount: 0,
      grandTotal: 0,
      createdAt: daysFrom(today, seed.createdOffset),
      updatedAt: daysFrom(today, seed.updatedOffset),
      sentAt:
        seed.sentOffset === undefined || seed.sentOffset === null
          ? null
          : daysFrom(today, seed.sentOffset),
      acceptedAt:
        seed.acceptedOffset === undefined || seed.acceptedOffset === null
          ? null
          : daysFrom(today, seed.acceptedOffset),
      rejectedAt:
        seed.rejectedOffset === undefined || seed.rejectedOffset === null
          ? null
          : daysFrom(today, seed.rejectedOffset),
      expiredAt:
        seed.expiredOffset === undefined || seed.expiredOffset === null
          ? null
          : daysFrom(today, seed.expiredOffset),
      archivedAt:
        seed.archived && seed.archivedOffset != null
          ? daysFrom(today, seed.archivedOffset)
          : null,
      archived: Boolean(seed.archived),
      statusBeforeArchive: seed.statusBeforeArchive ?? null,
      pdfSnapshot: null,
    };
    const quote = withRecalculatedTotals(base);
    if (quote.status === "Draft") {
      return quote;
    }
    const settings = getDemoCompanySettings(today);
    const frozenAt = quote.sentAt ?? quote.updatedAt;
    return {
      ...quote,
      pdfSnapshot: createQuotePdfSnapshot(quote, settings, frozenAt),
    };
  });
}

/** Next business quote number (QUO-…) from existing session records. */
export function nextQuoteNumber(quotes: Quote[]): string {
  return nextQuoteNumberFromExisting(quotes.map((quote) => quote.quoteNumber));
}

/** Allocate a new line-item UUID. */
export function createLineId(): string {
  return crypto.randomUUID();
}

/** Known demo customer snapshots (fallback when customer store not yet hydrated). */
export const DEMO_CUSTOMER_SNAPSHOTS: QuoteCustomerSnapshot[] = [
  snapshot(
    DEMO_CUSTOMER_IDS.jane,
    "CUST-000001",
    "Jane Doe",
    "",
    "(214) 555-0142",
    "jane.doe@email.com",
    "1842 Maple Avenue",
    "Dallas",
    "TX",
    "75204",
  ),
  snapshot(
    DEMO_CUSTOMER_IDS.marcus,
    "CUST-000002",
    "Marcus Nguyen",
    "Northline Offices",
    "(972) 555-0198",
    "marcus@northlineoffices.com",
    "900 Legacy Drive Suite 200",
    "Plano",
    "TX",
    "75024",
  ),
  snapshot(
    DEMO_CUSTOMER_IDS.elena,
    "CUST-000003",
    "Elena Ruiz",
    "",
    "(469) 555-0117",
    "elena.ruiz@gmail.com",
    "512 Walnut Creek Blvd",
    "Garland",
    "TX",
    "75040",
  ),
  snapshot(
    DEMO_CUSTOMER_IDS.david,
    "CUST-000004",
    "David Chen",
    "Summit Dental Group",
    "(214) 555-0166",
    "dchen@summitdental.com",
    "3300 Preston Road",
    "Richardson",
    "TX",
    "75080",
  ),
  snapshot(
    DEMO_CUSTOMER_IDS.priya,
    "CUST-000005",
    "Priya Patel",
    "",
    "(817) 555-0133",
    "priya.patel@outlook.com",
    "78 Riverview Court",
    "Arlington",
    "TX",
    "76010",
  ),
  snapshot(
    DEMO_CUSTOMER_IDS.owen,
    "CUST-000006",
    "Owen Brooks",
    "Oak & Iron Brewery",
    "(972) 555-0184",
    "owen@oakironbrewery.com",
    "1101 Industrial Blvd",
    "Irving",
    "TX",
    "75061",
  ),
  snapshot(
    DEMO_CUSTOMER_IDS.sophia,
    "CUST-000007",
    "Sophia Martinez",
    "BrightPath Academy",
    "(469) 555-0175",
    "smartinez@brightpath.edu",
    "4500 Independence Pkwy",
    "Frisco",
    "TX",
    "75035",
  ),
  snapshot(
    DEMO_CUSTOMER_IDS.liam,
    "CUST-000008",
    "Liam Foster",
    "",
    "(214) 555-0109",
    "liam.foster@email.com",
    "2211 Mockingbird Lane",
    "Dallas",
    "TX",
    "75235",
  ),
  snapshot(
    DEMO_CUSTOMER_IDS.ava,
    "CUST-000009",
    "Ava Kim",
    "Westfield Logistics",
    "(972) 555-0121",
    "ava.kim@westfieldlogistics.com",
    "6700 Belt Line Road",
    "Irving",
    "TX",
    "75063",
  ),
  snapshot(
    DEMO_CUSTOMER_IDS.noah,
    "CUST-000010",
    "Noah Harris",
    "",
    "(469) 555-0150",
    "noah.harris@email.com",
    "88 Cedar Hill Drive",
    "Plano",
    "TX",
    "75023",
  ),
];

/**
 * Look up a demo snapshot by customer UUID or business number (CUST-…).
 */
export function findCustomerSnapshot(
  customerIdOrNumber: string,
): QuoteCustomerSnapshot | null {
  return (
    DEMO_CUSTOMER_SNAPSHOTS.find(
      (item) =>
        item.customerId === customerIdOrNumber ||
        item.customerNumber === customerIdOrNumber,
    ) ?? null
  );
}

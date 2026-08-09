import { addDays, startOfDay, toIsoDate } from "@/lib/format";
import type { Quote, QuoteCustomerSnapshot, QuoteStatus } from "@/types/quote";

function daysFrom(today: Date, offset: number): string {
  return toIsoDate(addDays(startOfDay(today), offset));
}

function snapshot(
  customerId: string,
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

type SeedInput = {
  id: string;
  customer: QuoteCustomerSnapshot;
  jobDescription: string;
  status: QuoteStatus;
  quoteDateOffset: number;
  validUntilOffset: number | null;
  preparedBy: string;
  grandTotal: number;
  createdOffset: number;
  updatedOffset: number;
  sentOffset?: number | null;
  acceptedOffset?: number | null;
  rejectedOffset?: number | null;
  expiredOffset?: number | null;
  archived?: boolean;
  archivedOffset?: number | null;
  statusBeforeArchive?: QuoteStatus | null;
};

/**
 * 15 demo quotes — Spec §15.2 mix: 4 Draft, 3 Sent, 4 Accepted, 2 Rejected, 2 Expired.
 * One Accepted quote is also archived to exercise restore.
 */
export function getDemoQuotes(today: Date = new Date()): Quote[] {
  const jane = snapshot(
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

  const seeds: SeedInput[] = [
    {
      id: "QUO-1042",
      customer: jane,
      jobDescription: "Attic insulation and duct sealing",
      status: "Draft",
      quoteDateOffset: -18,
      validUntilOffset: 12,
      preparedBy: "Alex Rivera",
      grandTotal: 4820,
      createdOffset: -18,
      updatedOffset: -18,
    },
    {
      id: "QUO-1048",
      customer: marcus,
      jobDescription: "Rooftop package unit maintenance",
      status: "Draft",
      quoteDateOffset: -11,
      validUntilOffset: 19,
      preparedBy: "Alex Rivera",
      grandTotal: 2150,
      createdOffset: -11,
      updatedOffset: -10,
    },
    {
      id: "QUO-1055",
      customer: elena,
      jobDescription: "Thermostat upgrade and calibration",
      status: "Draft",
      quoteDateOffset: -3,
      validUntilOffset: 27,
      preparedBy: "Jordan Lee",
      grandTotal: 960,
      createdOffset: -3,
      updatedOffset: -3,
    },
    {
      id: "QUO-1056",
      customer: david,
      jobDescription: "Dental suite condenser replacement",
      status: "Draft",
      quoteDateOffset: -1,
      validUntilOffset: 29,
      preparedBy: "Jordan Lee",
      grandTotal: 3340,
      createdOffset: -1,
      updatedOffset: -1,
    },
    {
      id: "QUO-1031",
      customer: owen,
      jobDescription: "Walk-in cooler compressor service",
      status: "Sent",
      quoteDateOffset: -14,
      validUntilOffset: 5,
      preparedBy: "Alex Rivera",
      grandTotal: 1875,
      createdOffset: -14,
      updatedOffset: -12,
      sentOffset: -12,
    },
    {
      id: "QUO-1049",
      customer: sophia,
      jobDescription: "Campus HVAC seasonal startup",
      status: "Sent",
      quoteDateOffset: -9,
      validUntilOffset: 3,
      preparedBy: "Morgan Blake",
      grandTotal: 6420,
      createdOffset: -9,
      updatedOffset: -8,
      sentOffset: -8,
    },
    {
      id: "QUO-1052",
      customer: ava,
      jobDescription: "Warehouse make-up air unit install",
      status: "Sent",
      quoteDateOffset: -5,
      validUntilOffset: 16,
      preparedBy: "Alex Rivera",
      grandTotal: 2780,
      createdOffset: -5,
      updatedOffset: -4,
      sentOffset: -4,
    },
    {
      id: "QUO-1022",
      customer: marcus,
      jobDescription: "Office VRF zone expansion",
      status: "Accepted",
      quoteDateOffset: -28,
      validUntilOffset: -5,
      preparedBy: "Jordan Lee",
      grandTotal: 9120,
      createdOffset: -28,
      updatedOffset: -20,
      sentOffset: -26,
      acceptedOffset: -20,
    },
    {
      id: "QUO-1038",
      customer: jane,
      jobDescription: "Whole-home heat pump install",
      status: "Accepted",
      quoteDateOffset: -16,
      validUntilOffset: 2,
      preparedBy: "Morgan Blake",
      grandTotal: 4560,
      createdOffset: -16,
      updatedOffset: -10,
      sentOffset: -15,
      acceptedOffset: -10,
    },
    {
      id: "QUO-1044",
      customer: david,
      jobDescription: "Server room dedicated cooling",
      status: "Accepted",
      quoteDateOffset: -8,
      validUntilOffset: 14,
      preparedBy: "Alex Rivera",
      grandTotal: 12850,
      createdOffset: -8,
      updatedOffset: -3,
      sentOffset: -7,
      acceptedOffset: -3,
    },
    {
      id: "QUO-1051",
      customer: liam,
      jobDescription: "Furnace tune-up and filter package",
      status: "Accepted",
      quoteDateOffset: -40,
      validUntilOffset: -10,
      preparedBy: "Jordan Lee",
      grandTotal: 780,
      createdOffset: -40,
      updatedOffset: -35,
      sentOffset: -38,
      acceptedOffset: -35,
      archived: true,
      archivedOffset: -5,
      statusBeforeArchive: "Accepted",
    },
    {
      id: "QUO-1028",
      customer: priya,
      jobDescription: "Mini-split install for bonus room",
      status: "Rejected",
      quoteDateOffset: -22,
      validUntilOffset: -1,
      preparedBy: "Morgan Blake",
      grandTotal: 5400,
      createdOffset: -22,
      updatedOffset: -18,
      sentOffset: -21,
      rejectedOffset: -18,
    },
    {
      id: "QUO-1040",
      customer: owen,
      jobDescription: "Kitchen exhaust hood balancing",
      status: "Rejected",
      quoteDateOffset: -12,
      validUntilOffset: 8,
      preparedBy: "Alex Rivera",
      grandTotal: 2890,
      createdOffset: -12,
      updatedOffset: -9,
      sentOffset: -11,
      rejectedOffset: -9,
    },
    {
      id: "QUO-1015",
      customer: elena,
      jobDescription: "Evaporator coil replacement",
      status: "Expired",
      quoteDateOffset: -45,
      validUntilOffset: -10,
      preparedBy: "Jordan Lee",
      grandTotal: 3675,
      createdOffset: -45,
      updatedOffset: -40,
      sentOffset: -40,
      expiredOffset: -10,
    },
    {
      id: "QUO-1033",
      customer: ava,
      jobDescription: "Dock door air curtain install",
      status: "Expired",
      quoteDateOffset: -35,
      validUntilOffset: -4,
      preparedBy: "Morgan Blake",
      grandTotal: 1980,
      createdOffset: -35,
      updatedOffset: -33,
      sentOffset: -33,
      expiredOffset: -4,
    },
  ];

  return seeds.map((seed) => ({
    id: seed.id,
    customerSnapshot: seed.customer,
    jobDescription: seed.jobDescription,
    status: seed.status,
    quoteDate: daysFrom(today, seed.quoteDateOffset),
    validUntil:
      seed.validUntilOffset === null
        ? null
        : daysFrom(today, seed.validUntilOffset),
    preparedBy: seed.preparedBy,
    grandTotal: seed.grandTotal,
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
  }));
}

export function nextQuoteId(quotes: Quote[]): string {
  const max = quotes.reduce((highest, quote) => {
    const match = /^QUO-(\d+)$/.exec(quote.id);
    if (!match) return highest;
    return Math.max(highest, Number(match[1]));
  }, 0);
  const next = max + 1;
  const width = Math.max(4, String(next).length);
  return `QUO-${String(next).padStart(width, "0")}`;
}

/** Known demo customer snapshots for Create Quote stubs. */
export const DEMO_CUSTOMER_SNAPSHOTS: QuoteCustomerSnapshot[] = [
  snapshot(
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
];

export function findCustomerSnapshot(
  customerId: string,
): QuoteCustomerSnapshot | null {
  return (
    DEMO_CUSTOMER_SNAPSHOTS.find((item) => item.customerId === customerId) ??
    null
  );
}

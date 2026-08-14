import { nextCustomerNumberFromExisting } from "@/lib/persistence/numbering";
import { addDays, startOfDay, toIsoDate } from "@/lib/format";
import type { Customer, CustomerFormValues } from "@/types/customer";

function daysFrom(today: Date, offset: number): string {
  return toIsoDate(addDays(startOfDay(today), offset));
}

/** Stable demo UUIDs — quote seeds reference these as customerSnapshot.customerId. */
export const DEMO_CUSTOMER_IDS = {
  jane: "a1000001-0000-4000-8000-000000000001",
  marcus: "a1000002-0000-4000-8000-000000000002",
  elena: "a1000003-0000-4000-8000-000000000003",
  david: "a1000004-0000-4000-8000-000000000004",
  priya: "a1000005-0000-4000-8000-000000000005",
  owen: "a1000006-0000-4000-8000-000000000006",
  sophia: "a1000007-0000-4000-8000-000000000007",
  liam: "a1000008-0000-4000-8000-000000000008",
  ava: "a1000009-0000-4000-8000-000000000009",
  noah: "a1000010-0000-4000-8000-000000000010",
} as const;

/** Identity/contact seed only — quote aggregates come from QuoteSession (M15). */
type CustomerSeedCore = Omit<
  Customer,
  | "totalQuotes"
  | "draftQuotes"
  | "acceptedQuotes"
  | "lastQuoteDate"
  | "recentQuotes"
>;

const NEUTRAL_QUOTE_AGGREGATES = {
  totalQuotes: 0,
  draftQuotes: 0,
  acceptedQuotes: 0,
  lastQuoteDate: null,
  recentQuotes: [] as Customer["recentQuotes"],
};

function withNeutralAggregates(core: CustomerSeedCore): Customer {
  return { ...core, ...NEUTRAL_QUOTE_AGGREGATES };
}

/** Seed 10 demo customers around Dallas. Session mutations clone this list. */
export function getDemoCustomers(today: Date = new Date()): Customer[] {
  const cores: CustomerSeedCore[] = [
    {
      id: DEMO_CUSTOMER_IDS.jane,
      customerNumber: "CUST-000001",
      firstName: "Jane",
      lastName: "Doe",
      phone: "(214) 555-0142",
      email: "jane.doe@email.com",
      companyName: "",
      street: "1842 Maple Avenue",
      city: "Dallas",
      state: "TX",
      zip: "75204",
      internalNotes: "Gate code 4412. Prefers afternoon appointments.",
      createdAt: daysFrom(today, -120),
      updatedAt: daysFrom(today, -3),
      archived: false,
    },
    {
      id: DEMO_CUSTOMER_IDS.marcus,
      customerNumber: "CUST-000002",
      firstName: "Marcus",
      lastName: "Nguyen",
      phone: "(972) 555-0198",
      email: "marcus@northlineoffices.com",
      companyName: "Northline Offices",
      street: "900 Legacy Drive Suite 200",
      city: "Plano",
      state: "TX",
      zip: "75024",
      internalNotes: "Ask for facilities desk on arrival.",
      createdAt: daysFrom(today, -95),
      updatedAt: daysFrom(today, -8),
      archived: false,
    },
    {
      id: DEMO_CUSTOMER_IDS.elena,
      customerNumber: "CUST-000003",
      firstName: "Elena",
      lastName: "Ruiz",
      phone: "(469) 555-0117",
      email: "elena.ruiz@gmail.com",
      companyName: "",
      street: "512 Walnut Creek Blvd",
      city: "Garland",
      state: "TX",
      zip: "75040",
      internalNotes: "Dog in backyard — call before arriving.",
      createdAt: daysFrom(today, -80),
      updatedAt: daysFrom(today, -14),
      archived: false,
    },
    {
      id: DEMO_CUSTOMER_IDS.david,
      customerNumber: "CUST-000004",
      firstName: "David",
      lastName: "Chen",
      phone: "(214) 555-0166",
      email: "dchen@summitdental.com",
      companyName: "Summit Dental Group",
      street: "3300 Preston Road",
      city: "Richardson",
      state: "TX",
      zip: "75080",
      internalNotes: "After-hours deliveries only.",
      createdAt: daysFrom(today, -60),
      updatedAt: daysFrom(today, -1),
      archived: false,
    },
    {
      id: DEMO_CUSTOMER_IDS.priya,
      customerNumber: "CUST-000005",
      firstName: "Priya",
      lastName: "Patel",
      phone: "(817) 555-0133",
      email: "priya.patel@outlook.com",
      companyName: "",
      street: "78 Riverview Court",
      city: "Arlington",
      state: "TX",
      zip: "76010",
      internalNotes: "",
      createdAt: daysFrom(today, -45),
      updatedAt: daysFrom(today, -20),
      archived: false,
    },
    {
      id: DEMO_CUSTOMER_IDS.owen,
      customerNumber: "CUST-000006",
      firstName: "Owen",
      lastName: "Brooks",
      phone: "(972) 555-0184",
      email: "owen@oakironbrewery.com",
      companyName: "Oak & Iron Brewery",
      street: "1101 Industrial Blvd",
      city: "Irving",
      state: "TX",
      zip: "75061",
      internalNotes: "Loading dock on west side.",
      createdAt: daysFrom(today, -30),
      updatedAt: daysFrom(today, -2),
      archived: false,
    },
    {
      id: DEMO_CUSTOMER_IDS.sophia,
      customerNumber: "CUST-000007",
      firstName: "Sophia",
      lastName: "Martinez",
      phone: "(469) 555-0175",
      email: "smartinez@brightpath.edu",
      companyName: "BrightPath Academy",
      street: "4500 Independence Pkwy",
      city: "Frisco",
      state: "TX",
      zip: "75035",
      internalNotes: "Contact facilities before quoting.",
      createdAt: daysFrom(today, -22),
      updatedAt: daysFrom(today, -9),
      archived: false,
    },
    {
      id: DEMO_CUSTOMER_IDS.liam,
      customerNumber: "CUST-000008",
      firstName: "Liam",
      lastName: "Foster",
      phone: "(214) 555-0109",
      email: "liam.foster@email.com",
      companyName: "",
      street: "2211 Mockingbird Lane",
      city: "Dallas",
      state: "TX",
      zip: "75235",
      internalNotes: "Existing customer since 2022.",
      createdAt: daysFrom(today, -200),
      updatedAt: daysFrom(today, -35),
      archived: false,
    },
    {
      id: DEMO_CUSTOMER_IDS.ava,
      customerNumber: "CUST-000009",
      firstName: "Ava",
      lastName: "Kim",
      phone: "(972) 555-0121",
      email: "ava.kim@westfieldlogistics.com",
      companyName: "Westfield Logistics",
      street: "6700 Belt Line Road",
      city: "Irving",
      state: "TX",
      zip: "75063",
      internalNotes: "PO required on all accepted quotes.",
      createdAt: daysFrom(today, -18),
      updatedAt: daysFrom(today, -5),
      archived: false,
    },
    {
      id: DEMO_CUSTOMER_IDS.noah,
      customerNumber: "CUST-000010",
      firstName: "Noah",
      lastName: "Harris",
      phone: "(469) 555-0150",
      email: "noah.harris@email.com",
      companyName: "",
      street: "88 Cedar Hill Drive",
      city: "Plano",
      state: "TX",
      zip: "75023",
      internalNotes: "Moved — verify address before quoting.",
      createdAt: daysFrom(today, -150),
      updatedAt: daysFrom(today, -60),
      archived: true,
    },
  ];

  return cores.map(withNeutralAggregates);
}

export function emptyCustomerForm(): CustomerFormValues {
  return {
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    companyName: "",
    street: "",
    city: "",
    state: "TX",
    zip: "",
    internalNotes: "",
  };
}

export function customerToFormValues(customer: Customer): CustomerFormValues {
  return {
    firstName: customer.firstName,
    lastName: customer.lastName,
    phone: customer.phone,
    email: customer.email,
    companyName: customer.companyName,
    street: customer.street,
    city: customer.city,
    state: customer.state,
    zip: customer.zip,
    internalNotes: customer.internalNotes,
  };
}

/** Allocate a new internal customer UUID. */
export function createCustomerId(): string {
  return crypto.randomUUID();
}

/** Next business customer number (CUST-######) from existing session records. */
export function nextCustomerNumber(customers: Customer[]): string {
  return nextCustomerNumberFromExisting(
    customers.map((customer) => customer.customerNumber),
  );
}

import { addDays, startOfDay, toIsoDate } from "@/lib/format";
import type { CatalogFormValues, CatalogItem } from "@/types/catalog";
import type { LineCategory } from "@/types/quote";

type SeedInput = {
  id: string;
  name: string;
  category: LineCategory;
  unit: string;
  unitPrice: number;
  description: string;
  createdOffset: number;
  updatedOffset: number;
  archived?: boolean;
};

const SEED: SeedInput[] = [
  {
    id: "CAT-001",
    name: "Diagnostic Fee",
    category: "Services",
    unit: "ea",
    unitPrice: 129,
    description: "On-site diagnostic and system evaluation",
    createdOffset: -90,
    updatedOffset: -12,
  },
  {
    id: "CAT-002",
    name: "Thermostat Installation",
    category: "Services",
    unit: "ea",
    unitPrice: 285,
    description: "Smart thermostat install and configuration",
    createdOffset: -88,
    updatedOffset: -8,
  },
  {
    id: "CAT-003",
    name: "Furnace Tune-Up",
    category: "Services",
    unit: "ea",
    unitPrice: 189,
    description: "Seasonal furnace inspection and tune-up",
    createdOffset: -80,
    updatedOffset: -20,
  },
  {
    id: "CAT-004",
    name: "AC Condenser Unit",
    category: "Materials",
    unit: "ea",
    unitPrice: 2450,
    description: "Standard outdoor condenser unit",
    createdOffset: -75,
    updatedOffset: -15,
  },
  {
    id: "CAT-005",
    name: "Evaporator Coil",
    category: "Materials",
    unit: "ea",
    unitPrice: 875,
    description: "Matched evaporator coil",
    createdOffset: -70,
    updatedOffset: -18,
  },
  {
    id: "CAT-006",
    name: "Flexible Duct (box)",
    category: "Materials",
    unit: "box",
    unitPrice: 96,
    description: "Insulated flexible duct supply",
    createdOffset: -65,
    updatedOffset: -10,
  },
  {
    id: "CAT-007",
    name: "Install Labor",
    category: "Labor",
    unit: "hr",
    unitPrice: 125,
    description: "Installation labor",
    createdOffset: -60,
    updatedOffset: -5,
  },
  {
    id: "CAT-008",
    name: "Service Labor",
    category: "Labor",
    unit: "hr",
    unitPrice: 115,
    description: "Service and repair labor",
    createdOffset: -55,
    updatedOffset: -4,
  },
  {
    id: "CAT-009",
    name: "Duct Sealing Labor",
    category: "Labor",
    unit: "hr",
    unitPrice: 110,
    description: "Duct sealing and balancing labor",
    createdOffset: -50,
    updatedOffset: -9,
  },
  {
    id: "CAT-010",
    name: "Filter Replacement Pack",
    category: "Materials",
    unit: "ea",
    unitPrice: 48,
    description: "Standard filter replacement pack",
    createdOffset: -45,
    updatedOffset: -3,
  },
  {
    id: "CAT-011",
    name: "AC System Install",
    category: "Services",
    unit: "ea",
    unitPrice: 4500,
    description: "Complete residential AC system installation",
    createdOffset: -40,
    updatedOffset: -6,
  },
  {
    id: "CAT-012",
    name: "Furnace Replacement",
    category: "Services",
    unit: "ea",
    unitPrice: 3800,
    description: "Furnace removal and replacement package",
    createdOffset: -35,
    updatedOffset: -7,
  },
  {
    id: "CAT-013",
    name: "Refrigerant Line Set",
    category: "Materials",
    unit: "ea",
    unitPrice: 220,
    description: "Insulated refrigerant line set",
    createdOffset: -30,
    updatedOffset: -14,
  },
  {
    id: "CAT-014",
    name: "Emergency After-Hours Labor",
    category: "Labor",
    unit: "hr",
    unitPrice: 175,
    description: "After-hours emergency service labor",
    createdOffset: -25,
    updatedOffset: -2,
  },
  {
    id: "CAT-015",
    name: "Water Heater Installation",
    category: "Services",
    unit: "ea",
    unitPrice: 1650,
    description: "Standard tank water heater installation",
    createdOffset: -20,
    updatedOffset: -1,
    archived: true,
  },
];

function daysFrom(today: Date, offset: number): string {
  return toIsoDate(addDays(startOfDay(today), offset));
}

export function getDemoCatalogItems(today: Date): CatalogItem[] {
  return SEED.map((seed) => ({
    id: seed.id,
    name: seed.name,
    category: seed.category,
    unit: seed.unit,
    unitPrice: seed.unitPrice,
    description: seed.description,
    createdAt: daysFrom(today, seed.createdOffset),
    updatedAt: daysFrom(today, seed.updatedOffset),
    archived: Boolean(seed.archived),
  }));
}

export function nextCatalogId(items: CatalogItem[]): string {
  const max = items.reduce((highest, item) => {
    const match = /^CAT-(\d+)$/.exec(item.id);
    if (!match) return highest;
    return Math.max(highest, Number(match[1]));
  }, 0);
  return `CAT-${String(max + 1).padStart(3, "0")}`;
}

export function emptyCatalogForm(): CatalogFormValues {
  return {
    name: "",
    category: "Services",
    unit: "",
    unitPrice: 0,
    description: "",
  };
}

export function catalogToFormValues(item: CatalogItem): CatalogFormValues {
  return {
    name: item.name,
    category: item.category,
    unit: item.unit,
    unitPrice: item.unitPrice,
    description: item.description,
  };
}

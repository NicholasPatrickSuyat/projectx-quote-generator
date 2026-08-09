import type { LineCategory } from "@/types/quote";

export type CatalogItem = {
  id: string;
  name: string;
  category: LineCategory;
  unit: string;
  unitPrice: number;
  description: string;
};

/** Minimal static catalog for in-Builder picker only (no admin). */
export const DEMO_CATALOG_ITEMS: CatalogItem[] = [
  {
    id: "CAT-001",
    name: "Diagnostic Fee",
    category: "Services",
    unit: "ea",
    unitPrice: 129,
    description: "On-site diagnostic and system evaluation",
  },
  {
    id: "CAT-002",
    name: "Thermostat Installation",
    category: "Services",
    unit: "ea",
    unitPrice: 285,
    description: "Smart thermostat install and configuration",
  },
  {
    id: "CAT-003",
    name: "Furnace Tune-Up",
    category: "Services",
    unit: "ea",
    unitPrice: 189,
    description: "Seasonal furnace inspection and tune-up",
  },
  {
    id: "CAT-004",
    name: "AC Condenser Unit",
    category: "Materials",
    unit: "ea",
    unitPrice: 2450,
    description: "Standard outdoor condenser unit",
  },
  {
    id: "CAT-005",
    name: "Evaporator Coil",
    category: "Materials",
    unit: "ea",
    unitPrice: 875,
    description: "Matched evaporator coil",
  },
  {
    id: "CAT-006",
    name: "Flexible Duct (box)",
    category: "Materials",
    unit: "box",
    unitPrice: 96,
    description: "Insulated flexible duct supply",
  },
  {
    id: "CAT-007",
    name: "Install Labor",
    category: "Labor",
    unit: "hr",
    unitPrice: 125,
    description: "Installation labor",
  },
  {
    id: "CAT-008",
    name: "Service Labor",
    category: "Labor",
    unit: "hr",
    unitPrice: 115,
    description: "Service and repair labor",
  },
  {
    id: "CAT-009",
    name: "Duct Sealing Labor",
    category: "Labor",
    unit: "hr",
    unitPrice: 110,
    description: "Duct sealing and balancing labor",
  },
  {
    id: "CAT-010",
    name: "Filter Replacement Pack",
    category: "Materials",
    unit: "ea",
    unitPrice: 48,
    description: "Standard filter replacement pack",
  },
];

export function filterCatalogItems(
  items: CatalogItem[],
  search: string,
  category: LineCategory | "all",
): CatalogItem[] {
  const q = search.trim().toLowerCase();
  return items.filter((item) => {
    if (category !== "all" && item.category !== category) return false;
    if (!q) return true;
    return (
      item.name.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q)
    );
  });
}

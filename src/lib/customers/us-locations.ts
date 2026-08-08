/**
 * Static US location helpers for the Customers form (demo / V1).
 *
 * Future production enhancement (NOT implemented yet):
 * After a valid 5-digit ZIP is entered, look up City and State from an
 * approved reliable data source, then auto-suggest or populate those fields.
 * Users must still be able to correct the populated City and State values.
 * Do not wire an external ZIP API until that source is explicitly approved.
 */

export type UsStateCode = string;

export type UsStateOption = {
  code: UsStateCode;
  name: string;
};

/** All 50 states + Washington, D.C. Display uses two-letter abbreviations. */
export const US_STATE_OPTIONS: UsStateOption[] = [
  { code: "AL", name: "Alabama" },
  { code: "AK", name: "Alaska" },
  { code: "AZ", name: "Arizona" },
  { code: "AR", name: "Arkansas" },
  { code: "CA", name: "California" },
  { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" },
  { code: "DE", name: "Delaware" },
  { code: "DC", name: "District of Columbia" },
  { code: "FL", name: "Florida" },
  { code: "GA", name: "Georgia" },
  { code: "HI", name: "Hawaii" },
  { code: "ID", name: "Idaho" },
  { code: "IL", name: "Illinois" },
  { code: "IN", name: "Indiana" },
  { code: "IA", name: "Iowa" },
  { code: "KS", name: "Kansas" },
  { code: "KY", name: "Kentucky" },
  { code: "LA", name: "Louisiana" },
  { code: "ME", name: "Maine" },
  { code: "MD", name: "Maryland" },
  { code: "MA", name: "Massachusetts" },
  { code: "MI", name: "Michigan" },
  { code: "MN", name: "Minnesota" },
  { code: "MS", name: "Mississippi" },
  { code: "MO", name: "Missouri" },
  { code: "MT", name: "Montana" },
  { code: "NE", name: "Nebraska" },
  { code: "NV", name: "Nevada" },
  { code: "NH", name: "New Hampshire" },
  { code: "NJ", name: "New Jersey" },
  { code: "NM", name: "New Mexico" },
  { code: "NY", name: "New York" },
  { code: "NC", name: "North Carolina" },
  { code: "ND", name: "North Dakota" },
  { code: "OH", name: "Ohio" },
  { code: "OK", name: "Oklahoma" },
  { code: "OR", name: "Oregon" },
  { code: "PA", name: "Pennsylvania" },
  { code: "RI", name: "Rhode Island" },
  { code: "SC", name: "South Carolina" },
  { code: "SD", name: "South Dakota" },
  { code: "TN", name: "Tennessee" },
  { code: "TX", name: "Texas" },
  { code: "UT", name: "Utah" },
  { code: "VT", name: "Vermont" },
  { code: "VA", name: "Virginia" },
  { code: "WA", name: "Washington" },
  { code: "WV", name: "West Virginia" },
  { code: "WI", name: "Wisconsin" },
  { code: "WY", name: "Wyoming" },
];

/**
 * Demo-only city suggestions by state. Not exhaustive.
 * States without an entry return no suggestions; free typing still works.
 */
export const CITY_SUGGESTIONS_BY_STATE: Record<string, readonly string[]> = {
  TX: [
    "Dallas",
    "Plano",
    "Irving",
    "Garland",
    "Richardson",
    "Frisco",
    "Arlington",
    "Fort Worth",
  ],
  CO: [
    "Colorado Springs",
    "Denver",
    "Aurora",
    "Pueblo",
    "Fort Collins",
    "Boulder",
  ],
};

export function getCitySuggestionsForState(stateCode: string): readonly string[] {
  return CITY_SUGGESTIONS_BY_STATE[stateCode.trim().toUpperCase()] ?? [];
}

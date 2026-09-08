export type Continent =
  | "Africa"
  | "Asia"
  | "Europe"
  | "North America"
  | "South America"
  | "Oceania";

export interface Country {
  code: string;
  name: string;
  continent: Continent;
}

export const COUNTRIES: Country[] = [
  { code: "ZA", name: "South Africa", continent: "Africa" },
  { code: "US", name: "United States", continent: "North America" },
  { code: "CA", name: "Canada", continent: "North America" },
  { code: "MX", name: "Mexico", continent: "North America" },
  { code: "GT", name: "Guatemala", continent: "North America" },
  { code: "CU", name: "Cuba", continent: "North America" },
  { code: "GB", name: "United Kingdom", continent: "Europe" },
  { code: "IE", name: "Ireland", continent: "Europe" },
  { code: "FR", name: "France", continent: "Europe" },
  { code: "DE", name: "Germany", continent: "Europe" },
  { code: "NL", name: "Netherlands", continent: "Europe" },
  { code: "BE", name: "Belgium", continent: "Europe" },
  { code: "ES", name: "Spain", continent: "Europe" },
  { code: "PT", name: "Portugal", continent: "Europe" },
  { code: "IT", name: "Italy", continent: "Europe" },
  { code: "CH", name: "Switzerland", continent: "Europe" },
  { code: "AT", name: "Austria", continent: "Europe" },
  { code: "SE", name: "Sweden", continent: "Europe" },
  { code: "NO", name: "Norway", continent: "Europe" },
  { code: "DK", name: "Denmark", continent: "Europe" },
  { code: "FI", name: "Finland", continent: "Europe" },
  { code: "PL", name: "Poland", continent: "Europe" },
  { code: "CZ", name: "Czechia", continent: "Europe" },
  { code: "RO", name: "Romania", continent: "Europe" },
  { code: "HU", name: "Hungary", continent: "Europe" },
  { code: "GR", name: "Greece", continent: "Europe" },
  { code: "UA", name: "Ukraine", continent: "Europe" },
  { code: "RU", name: "Russia", continent: "Europe" },
  { code: "TR", name: "Turkey", continent: "Europe" },
  { code: "IN", name: "India", continent: "Asia" },
  { code: "PK", name: "Pakistan", continent: "Asia" },
  { code: "BD", name: "Bangladesh", continent: "Asia" },
  { code: "CN", name: "China", continent: "Asia" },
  { code: "JP", name: "Japan", continent: "Asia" },
  { code: "KR", name: "South Korea", continent: "Asia" },
  { code: "SG", name: "Singapore", continent: "Asia" },
  { code: "MY", name: "Malaysia", continent: "Asia" },
  { code: "ID", name: "Indonesia", continent: "Asia" },
  { code: "PH", name: "Philippines", continent: "Asia" },
  { code: "TH", name: "Thailand", continent: "Asia" },
  { code: "VN", name: "Vietnam", continent: "Asia" },
  { code: "TW", name: "Taiwan", continent: "Asia" },
  { code: "AE", name: "United Arab Emirates", continent: "Asia" },
  { code: "SA", name: "Saudi Arabia", continent: "Asia" },
  { code: "IL", name: "Israel", continent: "Asia" },
  { code: "KZ", name: "Kazakhstan", continent: "Asia" },
  { code: "BR", name: "Brazil", continent: "South America" },
  { code: "AR", name: "Argentina", continent: "South America" },
  { code: "CL", name: "Chile", continent: "South America" },
  { code: "CO", name: "Colombia", continent: "South America" },
  { code: "PE", name: "Peru", continent: "South America" },
  { code: "UY", name: "Uruguay", continent: "South America" },
  { code: "VE", name: "Venezuela", continent: "South America" },
  { code: "AU", name: "Australia", continent: "Oceania" },
  { code: "NZ", name: "New Zealand", continent: "Oceania" },
  { code: "FJ", name: "Fiji", continent: "Oceania" },
  { code: "NG", name: "Nigeria", continent: "Africa" },
  { code: "KE", name: "Kenya", continent: "Africa" },
  { code: "EG", name: "Egypt", continent: "Africa" },
  { code: "MA", name: "Morocco", continent: "Africa" },
  { code: "GH", name: "Ghana", continent: "Africa" },
  { code: "ET", name: "Ethiopia", continent: "Africa" },
  { code: "TZ", name: "Tanzania", continent: "Africa" },
  { code: "SN", name: "Senegal", continent: "Africa" },
  { code: "TN", name: "Tunisia", continent: "Africa" },
];

export function getCountry(code?: string | null) {
  if (!code) return COUNTRIES[0];
  return COUNTRIES.find((c) => c.code === code) ?? COUNTRIES[0];
}

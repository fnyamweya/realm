export type ListingIntent = 'buy' | 'rent';
export type ListingStatus = 'active' | 'coming-soon' | 'new-construction';
export type PropertyType =
  | 'House'
  | 'Condo'
  | 'Townhome'
  | 'Loft'
  | 'Penthouse'
  | 'Apartment';

export type Listing = {
  id: string;
  slug: string;
  title: string;
  address: string;
  city: string;
  state: string;
  neighborhoodSlug: string;
  neighborhoodName: string;
  agentSlug: string;
  intent: ListingIntent;
  status: ListingStatus;
  propertyType: PropertyType;
  price: number;
  hoaMonthly?: number;
  estTaxMonthly: number;
  beds: number;
  baths: number;
  sqft: number;
  lotSqft?: number;
  yearBuilt: number;
  daysOnMarket: number;
  latitude: number;
  longitude: number;
  mapX: number;
  mapY: number;
  heroPalette: [string, string, string];
  badges: string[];
  highlights: string[];
  amenities: string[];
  description: string;
  openHouse: { date: string; start: string; end: string }[];
  priceHistory: { date: string; price: number; note: string }[];
  schoolsScore: number;
  walkScore: number;
  transitScore: number;
  bikeScore: number;
  energyScore: number;
  climateRisk: 'Low' | 'Moderate' | 'Elevated';
  virtualTour: boolean;
  fiberReady: boolean;
  evReady: boolean;
  aiMatchReasons: string[];
};

export type Agent = {
  slug: string;
  name: string;
  title: string;
  team: string;
  phone: string;
  email: string;
  markets: string[];
  specialties: string[];
  languages: string[];
  rating: number;
  reviewCount: number;
  yearsExperience: number;
  salesVolumeM: number;
  activeListings: number;
  bio: string;
  palette: [string, string];
};

export type Neighborhood = {
  slug: string;
  name: string;
  city: string;
  state: string;
  tagline: string;
  medianSalePrice: number;
  medianRent: number;
  yoyChangePct: number;
  avgDaysOnMarket: number;
  demandIndex: number;
  schoolsScore: number;
  walkScore: number;
  transitScore: number;
  bikeScore: number;
  commuteDowntownMin: number;
  highlights: string[];
  futureSignals: string[];
  palette: [string, string, string];
};

export type Development = {
  slug: string;
  name: string;
  city: string;
  state: string;
  deliveryWindow: string;
  priceFrom: number;
  unitsAvailable: number;
  developer: string;
  concept: string;
  amenities: string[];
  palette: [string, string, string];
};

export type InquiryLead = {
  id: string;
  name: string;
  listingSlug: string;
  source: 'Portal' | 'Ad Campaign' | 'Referral' | 'Open House';
  stage: 'New' | 'Qualified' | 'Tour Scheduled' | 'Offer';
  lastTouch: string;
  budget: number;
};

export type ListingsSort =
  | 'recommended'
  | 'price-asc'
  | 'price-desc'
  | 'newest'
  | 'sqft-desc';

export type ListingsView = 'grid' | 'map';

export type ListingsFilters = {
  q: string;
  city: string;
  intent: 'all' | ListingIntent;
  propertyType: 'all' | PropertyType;
  minBeds: number;
  minPrice?: number;
  maxPrice?: number;
  sort: ListingsSort;
  view: ListingsView;
  openHouseOnly: boolean;
  ecoOnly: boolean;
};

export type SearchParamsRecord = Record<string, string | string[] | undefined>;

const nfCurrency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const nfCompactCurrency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 1,
});

const nfNumber = new Intl.NumberFormat('en-US');

function one(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function num(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value.replace(/[,_$]/g, ''));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function int(value: string | undefined, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : fallback;
}

function bool(value: string | undefined): boolean {
  return value === '1' || value === 'true' || value === 'yes' || value === 'on';
}

export function formatCurrency(value: number, intent: ListingIntent = 'buy'): string {
  const formatted = nfCurrency.format(value);
  return intent === 'rent' ? `${formatted}/mo` : formatted;
}

export function formatCompactCurrency(value: number): string {
  return nfCompactCurrency.format(value);
}

export function formatInteger(value: number): string {
  return nfNumber.format(value);
}

export function formatPercent(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
}

function makePriceHistory(price: number): Listing['priceHistory'] {
  return [
    { date: '2025-10-10', price: Math.round(price * 1.05), note: 'Listed' },
    { date: '2025-12-01', price: Math.round(price * 1.02), note: 'Price adjusted' },
    { date: '2026-02-05', price, note: 'Current price' },
  ];
}

export const agents: Agent[] = [
  {
    slug: 'maya-chen',
    name: 'Maya Chen',
    title: 'Principal Broker',
    team: 'Harborline Collective',
    phone: '(206) 555-0184',
    email: 'maya@harborline.example',
    markets: ['Seattle', 'Bellevue'],
    specialties: ['Waterfront', 'Luxury Condos', 'Relocation'],
    languages: ['English', 'Mandarin'],
    rating: 4.9,
    reviewCount: 186,
    yearsExperience: 12,
    salesVolumeM: 148,
    activeListings: 16,
    bio: 'Maya advises design-forward buyers and relocation clients across Seattle’s urban core with a data-led pricing strategy and concierge transaction support.',
    palette: ['#10243f', '#3cc3c8'],
  },
  {
    slug: 'logan-rivera',
    name: 'Logan Rivera',
    title: 'Senior Listing Advisor',
    team: 'Sunline Realty',
    phone: '(305) 555-0119',
    email: 'logan@sunline.example',
    markets: ['Miami', 'Miami Beach'],
    specialties: ['New Development', 'Investment', 'Second Homes'],
    languages: ['English', 'Spanish'],
    rating: 4.8,
    reviewCount: 241,
    yearsExperience: 10,
    salesVolumeM: 172,
    activeListings: 21,
    bio: 'Logan works with investor-buyers and end users looking for modern inventory in Miami’s fast-moving coastal submarkets.',
    palette: ['#27113e', '#ff7f5c'],
  },
  {
    slug: 'imani-brooks',
    name: 'Imani Brooks',
    title: 'Neighborhood Specialist',
    team: 'Atlas Homes Group',
    phone: '(512) 555-0140',
    email: 'imani@atlashomes.example',
    markets: ['Austin'],
    specialties: ['Family Homes', 'Green Homes', 'First-time Buyers'],
    languages: ['English'],
    rating: 5,
    reviewCount: 129,
    yearsExperience: 8,
    salesVolumeM: 84,
    activeListings: 14,
    bio: 'Imani pairs local planning insight with affordability strategy, helping buyers compare long-term neighborhood upside across Austin.',
    palette: ['#143224', '#77d28e'],
  },
  {
    slug: 'noah-bennett',
    name: 'Noah Bennett',
    title: 'Urban Homes Advisor',
    team: 'North Anchor',
    phone: '(720) 555-0132',
    email: 'noah@northanchor.example',
    markets: ['Denver'],
    specialties: ['Townhomes', 'Transit-Oriented', 'Upsizers'],
    languages: ['English'],
    rating: 4.8,
    reviewCount: 97,
    yearsExperience: 7,
    salesVolumeM: 61,
    activeListings: 11,
    bio: 'Noah helps buyers balance lifestyle and commute with a focus on transit-rich neighborhoods and low-maintenance homes.',
    palette: ['#18243d', '#6fb2ff'],
  },
  {
    slug: 'sofia-alvarez',
    name: 'Sofia Alvarez',
    title: 'Luxury & Design Curator',
    team: 'Frame Estate',
    phone: '(212) 555-0177',
    email: 'sofia@frameestate.example',
    markets: ['New York City', 'Brooklyn'],
    specialties: ['Penthouses', 'Lofts', 'Design-led Renovations'],
    languages: ['English', 'Spanish'],
    rating: 4.9,
    reviewCount: 154,
    yearsExperience: 11,
    salesVolumeM: 203,
    activeListings: 18,
    bio: 'Sofia advises architecture-focused buyers seeking premium inventory and off-market opportunities throughout NYC and Brooklyn.',
    palette: ['#261810', '#f2b47b'],
  },
];

export const neighborhoods: Neighborhood[] = [
  {
    slug: 'south-lake-union',
    name: 'South Lake Union',
    city: 'Seattle',
    state: 'WA',
    tagline: 'Tech-forward waterfront living with walkable amenities and modern towers.',
    medianSalePrice: 925000,
    medianRent: 3350,
    yoyChangePct: 6.4,
    avgDaysOnMarket: 19,
    demandIndex: 83,
    schoolsScore: 8,
    walkScore: 92,
    transitScore: 88,
    bikeScore: 84,
    commuteDowntownMin: 11,
    highlights: ['Lakefront trails', 'High-rise inventory', 'Strong rental demand'],
    futureSignals: ['Biotech campus expansion', 'Protected bike lanes', 'Mixed-use pipeline'],
    palette: ['#0f172a', '#155e75', '#67e8f9'],
  },
  {
    slug: 'wynwood',
    name: 'Wynwood',
    city: 'Miami',
    state: 'FL',
    tagline: 'Creative district momentum with new luxury inventory and retail growth.',
    medianSalePrice: 874000,
    medianRent: 3650,
    yoyChangePct: 8.9,
    avgDaysOnMarket: 27,
    demandIndex: 79,
    schoolsScore: 7,
    walkScore: 91,
    transitScore: 63,
    bikeScore: 78,
    commuteDowntownMin: 14,
    highlights: ['Art district', 'New developments', 'Hospitality ecosystem'],
    futureSignals: ['Office-to-residential conversions', 'Transit upgrades', 'Hospitality-led foot traffic'],
    palette: ['#2d0d42', '#7c2d92', '#f472b6'],
  },
  {
    slug: 'mueller',
    name: 'Mueller',
    city: 'Austin',
    state: 'TX',
    tagline: 'Master-planned district with green space, schools, and energy-efficient homes.',
    medianSalePrice: 742000,
    medianRent: 2890,
    yoyChangePct: 4.2,
    avgDaysOnMarket: 24,
    demandIndex: 76,
    schoolsScore: 8,
    walkScore: 72,
    transitScore: 58,
    bikeScore: 85,
    commuteDowntownMin: 17,
    highlights: ['Planned parks', 'Family-friendly', 'Sustainable builds'],
    futureSignals: ['Retail densification', 'School capacity expansion', 'EV infrastructure growth'],
    palette: ['#16301f', '#2f855a', '#86efac'],
  },
  {
    slug: 'ri-no',
    name: 'RiNo',
    city: 'Denver',
    state: 'CO',
    tagline: 'Warehouse-to-residential district with strong nightlife and loft/townhome supply.',
    medianSalePrice: 689000,
    medianRent: 2795,
    yoyChangePct: 5.8,
    avgDaysOnMarket: 22,
    demandIndex: 75,
    schoolsScore: 7,
    walkScore: 88,
    transitScore: 71,
    bikeScore: 90,
    commuteDowntownMin: 10,
    highlights: ['Loft inventory', 'Dining scene', 'Transit access'],
    futureSignals: ['Adaptive reuse projects', 'Light rail ridership gains', 'Creative office demand'],
    palette: ['#111827', '#1d4ed8', '#93c5fd'],
  },
  {
    slug: 'dumbo',
    name: 'DUMBO',
    city: 'Brooklyn',
    state: 'NY',
    tagline: 'Iconic waterfront district with premium loft conversions and skyline views.',
    medianSalePrice: 1850000,
    medianRent: 6125,
    yoyChangePct: 7.1,
    avgDaysOnMarket: 31,
    demandIndex: 81,
    schoolsScore: 9,
    walkScore: 96,
    transitScore: 98,
    bikeScore: 89,
    commuteDowntownMin: 8,
    highlights: ['Waterfront parks', 'Historic lofts', 'Top-tier transit'],
    futureSignals: ['Waterfront resiliency upgrades', 'Retail repositioning', 'Premium rental growth'],
    palette: ['#27180f', '#92400e', '#fbbf24'],
  },
  {
    slug: 'mission-bay',
    name: 'Mission Bay',
    city: 'San Francisco',
    state: 'CA',
    tagline: 'Modern waterfront district anchored by life sciences and new residential towers.',
    medianSalePrice: 1320000,
    medianRent: 4680,
    yoyChangePct: 3.7,
    avgDaysOnMarket: 29,
    demandIndex: 74,
    schoolsScore: 8,
    walkScore: 85,
    transitScore: 82,
    bikeScore: 87,
    commuteDowntownMin: 13,
    highlights: ['New towers', 'Bayfront paths', 'Life science jobs'],
    futureSignals: ['Campus expansion', 'Public realm upgrades', 'Resiliency investment'],
    palette: ['#082f49', '#0369a1', '#7dd3fc'],
  },
];

export const listings: Listing[] = [
  {
    id: 'RLM-1001',
    slug: 'atlas-glasshouse-south-lake-union',
    title: 'Atlas Glasshouse Residence',
    address: '1818 Aurora Ave N #1204',
    city: 'Seattle',
    state: 'WA',
    neighborhoodSlug: 'south-lake-union',
    neighborhoodName: 'South Lake Union',
    agentSlug: 'maya-chen',
    intent: 'buy',
    status: 'active',
    propertyType: 'Condo',
    price: 1245000,
    hoaMonthly: 820,
    estTaxMonthly: 980,
    beds: 2,
    baths: 2,
    sqft: 1460,
    yearBuilt: 2022,
    daysOnMarket: 12,
    latitude: 47.625,
    longitude: -122.342,
    mapX: 62,
    mapY: 28,
    heroPalette: ['#0f172a', '#0ea5e9', '#67e8f9'],
    badges: ['Water View', 'EV Ready', 'Fiber'],
    highlights: ['Floor-to-ceiling glazing', 'Heated terrace', 'Building wellness lounge'],
    amenities: ['24/7 concierge', 'Pet spa', 'Co-working floor', 'Rooftop kitchen'],
    description: 'A corner residence with panoramic lake views, curated finishes, and a flexible media alcove designed for hybrid work.',
    openHouse: [
      { date: '2026-02-28', start: '11:00 AM', end: '2:00 PM' },
      { date: '2026-03-01', start: '12:00 PM', end: '3:00 PM' },
    ],
    priceHistory: makePriceHistory(1245000),
    schoolsScore: 8,
    walkScore: 93,
    transitScore: 90,
    bikeScore: 86,
    energyScore: 88,
    climateRisk: 'Low',
    virtualTour: true,
    fiberReady: true,
    evReady: true,
    aiMatchReasons: ['Strong rental fallback demand', 'Low-maintenance lifestyle', 'Transit-rich daily commute'],
  },
  {
    id: 'RLM-1002',
    slug: 'wynwood-canopy-residences',
    title: 'Canopy Residences Penthouse',
    address: '301 NW 24th St PH2',
    city: 'Miami',
    state: 'FL',
    neighborhoodSlug: 'wynwood',
    neighborhoodName: 'Wynwood',
    agentSlug: 'logan-rivera',
    intent: 'buy',
    status: 'new-construction',
    propertyType: 'Penthouse',
    price: 2980000,
    hoaMonthly: 1450,
    estTaxMonthly: 2140,
    beds: 3,
    baths: 3,
    sqft: 2325,
    yearBuilt: 2026,
    daysOnMarket: 6,
    latitude: 25.799,
    longitude: -80.199,
    mapX: 84,
    mapY: 70,
    heroPalette: ['#2d0d42', '#c026d3', '#fb7185'],
    badges: ['New Construction', 'Rooftop Plunge Pool', 'Smart Home'],
    highlights: ['Private roof deck', 'Italian millwork', 'Dedicated art wall lighting'],
    amenities: ['Valet', 'Fitness studio', 'Owners lounge', 'Cold storage'],
    description: 'A double-height penthouse tailored for collectors and entertainers, positioned in the center of Wynwood’s next wave of luxury residences.',
    openHouse: [{ date: '2026-03-07', start: '1:00 PM', end: '4:00 PM' }],
    priceHistory: makePriceHistory(2980000),
    schoolsScore: 7,
    walkScore: 95,
    transitScore: 65,
    bikeScore: 80,
    energyScore: 79,
    climateRisk: 'Moderate',
    virtualTour: true,
    fiberReady: true,
    evReady: true,
    aiMatchReasons: ['High appreciation submarket', 'Strong short/medium-term lease demand', 'New-build systems reduce maintenance'],
  },
  {
    id: 'RLM-1003',
    slug: 'mueller-parkline-townhome',
    title: 'Parkline Solar Townhome',
    address: '4412 Camacho St',
    city: 'Austin',
    state: 'TX',
    neighborhoodSlug: 'mueller',
    neighborhoodName: 'Mueller',
    agentSlug: 'imani-brooks',
    intent: 'buy',
    status: 'active',
    propertyType: 'Townhome',
    price: 835000,
    hoaMonthly: 210,
    estTaxMonthly: 1185,
    beds: 3,
    baths: 3,
    sqft: 2088,
    lotSqft: 2514,
    yearBuilt: 2021,
    daysOnMarket: 15,
    latitude: 30.299,
    longitude: -97.705,
    mapX: 38,
    mapY: 62,
    heroPalette: ['#153122', '#16a34a', '#86efac'],
    badges: ['Solar Panels', 'EV Charger', 'Greenbelt Access'],
    highlights: ['Battery backup system', 'Dual outdoor living zones', 'Low-VOC interior package'],
    amenities: ['Community pool', 'Pocket parks', 'Trail network', 'Farmers market'],
    description: 'A high-efficiency townhome with solar + storage, designed for flexible family living and low operating costs.',
    openHouse: [{ date: '2026-02-28', start: '10:00 AM', end: '1:00 PM' }],
    priceHistory: makePriceHistory(835000),
    schoolsScore: 8,
    walkScore: 74,
    transitScore: 56,
    bikeScore: 86,
    energyScore: 95,
    climateRisk: 'Low',
    virtualTour: true,
    fiberReady: true,
    evReady: true,
    aiMatchReasons: ['Energy cost savings', 'Family-oriented neighborhood inventory', 'High livability score'],
  },
  {
    id: 'RLM-1004',
    slug: 'rino-brickworks-loft',
    title: 'Brickworks Loft 3A',
    address: '2550 Blake St #3A',
    city: 'Denver',
    state: 'CO',
    neighborhoodSlug: 'ri-no',
    neighborhoodName: 'RiNo',
    agentSlug: 'noah-bennett',
    intent: 'buy',
    status: 'active',
    propertyType: 'Loft',
    price: 679000,
    hoaMonthly: 430,
    estTaxMonthly: 410,
    beds: 1,
    baths: 2,
    sqft: 1285,
    yearBuilt: 2019,
    daysOnMarket: 18,
    latitude: 39.757,
    longitude: -104.986,
    mapX: 48,
    mapY: 38,
    heroPalette: ['#111827', '#2563eb', '#93c5fd'],
    badges: ['Transit-Oriented', 'Maker Studio', 'Concrete + Steel'],
    highlights: ['14-foot ceilings', 'Oversized operable windows', 'Custom kitchen island'],
    amenities: ['Bike storage', 'Package room', 'Roof deck', 'Co-working lounge'],
    description: 'Warehouse-inspired loft living with refined finishes and immediate access to RiNo dining, art, and transit.',
    openHouse: [],
    priceHistory: makePriceHistory(679000),
    schoolsScore: 7,
    walkScore: 89,
    transitScore: 74,
    bikeScore: 91,
    energyScore: 82,
    climateRisk: 'Low',
    virtualTour: true,
    fiberReady: true,
    evReady: false,
    aiMatchReasons: ['High walkability', 'Strong rental comp support', 'Unique inventory profile'],
  },
  {
    id: 'RLM-1005',
    slug: 'dumbo-warehouse-skyline-loft',
    title: 'Warehouse Skyline Loft',
    address: '72 Jay St #8N',
    city: 'Brooklyn',
    state: 'NY',
    neighborhoodSlug: 'dumbo',
    neighborhoodName: 'DUMBO',
    agentSlug: 'sofia-alvarez',
    intent: 'buy',
    status: 'coming-soon',
    propertyType: 'Loft',
    price: 2195000,
    hoaMonthly: 1325,
    estTaxMonthly: 1630,
    beds: 2,
    baths: 2,
    sqft: 1870,
    yearBuilt: 1912,
    daysOnMarket: 3,
    latitude: 40.703,
    longitude: -73.989,
    mapX: 91,
    mapY: 18,
    heroPalette: ['#27180f', '#b45309', '#fde68a'],
    badges: ['Coming Soon', 'Landmark Conversion', 'Skyline Views'],
    highlights: ['Original timber beams', 'Library wall', 'Private keyed elevator'],
    amenities: ['Part-time doorman', 'Storage cage', 'Roof access', 'Package lockers'],
    description: 'A rare loft conversion with protected skyline views and custom millwork throughout a historic DUMBO building.',
    openHouse: [{ date: '2026-03-08', start: '12:00 PM', end: '2:00 PM' }],
    priceHistory: makePriceHistory(2195000),
    schoolsScore: 9,
    walkScore: 97,
    transitScore: 99,
    bikeScore: 90,
    energyScore: 73,
    climateRisk: 'Moderate',
    virtualTour: false,
    fiberReady: true,
    evReady: false,
    aiMatchReasons: ['Scarce loft inventory', 'Prime commute access', 'Long-term value retention in landmark assets'],
  },
  {
    id: 'RLM-1006',
    slug: 'mission-bay-bayfront-condo',
    title: 'Bayfront Panorama Condo',
    address: '455 China Basin St #1906',
    city: 'San Francisco',
    state: 'CA',
    neighborhoodSlug: 'mission-bay',
    neighborhoodName: 'Mission Bay',
    agentSlug: 'maya-chen',
    intent: 'buy',
    status: 'active',
    propertyType: 'Condo',
    price: 1590000,
    hoaMonthly: 980,
    estTaxMonthly: 1480,
    beds: 2,
    baths: 2,
    sqft: 1410,
    yearBuilt: 2020,
    daysOnMarket: 21,
    latitude: 37.771,
    longitude: -122.392,
    mapX: 14,
    mapY: 21,
    heroPalette: ['#082f49', '#0284c7', '#7dd3fc'],
    badges: ['Bayfront', 'Wellness Building', 'Hybrid Work Nook'],
    highlights: ['Bay-facing terrace', 'Acoustic office pod', 'Chef-grade appliances'],
    amenities: ['Concierge', 'Gym', 'Roof deck', 'Dog run'],
    description: 'High-rise condo living with a panoramic bay outlook and an efficient plan tuned for work-from-home routines.',
    openHouse: [{ date: '2026-03-01', start: '11:00 AM', end: '1:00 PM' }],
    priceHistory: makePriceHistory(1590000),
    schoolsScore: 8,
    walkScore: 86,
    transitScore: 84,
    bikeScore: 89,
    energyScore: 84,
    climateRisk: 'Moderate',
    virtualTour: true,
    fiberReady: true,
    evReady: true,
    aiMatchReasons: ['High job-center accessibility', 'Strong amenity set', 'Stable condo demand in district'],
  },
  {
    id: 'RLM-2001',
    slug: 'capitol-hill-skyline-rental-loft',
    title: 'Skyline Rental Loft',
    address: '121 Bellevue Ave E #504',
    city: 'Seattle',
    state: 'WA',
    neighborhoodSlug: 'south-lake-union',
    neighborhoodName: 'South Lake Union',
    agentSlug: 'maya-chen',
    intent: 'rent',
    status: 'active',
    propertyType: 'Apartment',
    price: 4200,
    estTaxMonthly: 0,
    beds: 2,
    baths: 2,
    sqft: 1180,
    yearBuilt: 2023,
    daysOnMarket: 9,
    latitude: 47.623,
    longitude: -122.325,
    mapX: 58,
    mapY: 33,
    heroPalette: ['#111827', '#4338ca', '#a5b4fc'],
    badges: ['Lease Incentive', 'Pet Friendly', 'Fiber'],
    highlights: ['2 months free on 14-month lease', 'Sky lounge access', 'Washer/dryer in-unit'],
    amenities: ['Gym', 'Coworking', 'Bike room', 'Pet wash'],
    description: 'Flexible lease-ready loft apartment with skyline views and premium resident amenities for hybrid professionals.',
    openHouse: [{ date: '2026-02-27', start: '5:00 PM', end: '7:00 PM' }],
    priceHistory: makePriceHistory(4200),
    schoolsScore: 8,
    walkScore: 94,
    transitScore: 89,
    bikeScore: 84,
    energyScore: 86,
    climateRisk: 'Low',
    virtualTour: true,
    fiberReady: true,
    evReady: false,
    aiMatchReasons: ['Fast move-in', 'Transit-friendly', 'Amenity-rich rental stock'],
  },
  {
    id: 'RLM-2002',
    slug: 'miami-design-district-rental-residence',
    title: 'Design District Corner Residence',
    address: '4020 NE 2nd Ave #1108',
    city: 'Miami',
    state: 'FL',
    neighborhoodSlug: 'wynwood',
    neighborhoodName: 'Wynwood',
    agentSlug: 'logan-rivera',
    intent: 'rent',
    status: 'active',
    propertyType: 'Apartment',
    price: 5900,
    estTaxMonthly: 0,
    beds: 2,
    baths: 2,
    sqft: 1320,
    yearBuilt: 2025,
    daysOnMarket: 14,
    latitude: 25.813,
    longitude: -80.192,
    mapX: 80,
    mapY: 66,
    heroPalette: ['#3b0764', '#db2777', '#fda4af'],
    badges: ['New Lease-Up', 'Resort Pool', 'EV Charging'],
    highlights: ['Corner exposure', 'Designer package', 'Concierge app entry'],
    amenities: ['Valet', 'Pool deck', 'Gym', 'Podcast studio'],
    description: 'A lease-up residence with hospitality-grade amenities, walkable to the Design District and Wynwood galleries.',
    openHouse: [{ date: '2026-03-03', start: '4:00 PM', end: '6:00 PM' }],
    priceHistory: makePriceHistory(5900),
    schoolsScore: 7,
    walkScore: 93,
    transitScore: 61,
    bikeScore: 77,
    energyScore: 81,
    climateRisk: 'Moderate',
    virtualTour: true,
    fiberReady: true,
    evReady: true,
    aiMatchReasons: ['High amenity-to-rent value', 'Prime lifestyle location', 'Modern lease-up incentives'],
  },
  {
    id: 'RLM-2003',
    slug: 'austin-eastside-garden-house-rental',
    title: 'Eastside Garden House Rental',
    address: '1807 E 11th St',
    city: 'Austin',
    state: 'TX',
    neighborhoodSlug: 'mueller',
    neighborhoodName: 'Mueller',
    agentSlug: 'imani-brooks',
    intent: 'rent',
    status: 'active',
    propertyType: 'House',
    price: 3650,
    estTaxMonthly: 0,
    beds: 3,
    baths: 2,
    sqft: 1680,
    lotSqft: 5200,
    yearBuilt: 2018,
    daysOnMarket: 11,
    latitude: 30.273,
    longitude: -97.723,
    mapX: 34,
    mapY: 68,
    heroPalette: ['#1f2937', '#22c55e', '#bbf7d0'],
    badges: ['Backyard Office', 'Solar Assist', 'Fenced Yard'],
    highlights: ['Detached studio office', 'Native landscaping', 'Low utility profile'],
    amenities: ['Smart irrigation', 'Storage shed', 'Covered patio'],
    description: 'A flexible Eastside rental with a detached backyard office and landscaped outdoor living designed for remote work households.',
    openHouse: [],
    priceHistory: makePriceHistory(3650),
    schoolsScore: 8,
    walkScore: 69,
    transitScore: 55,
    bikeScore: 82,
    energyScore: 90,
    climateRisk: 'Low',
    virtualTour: true,
    fiberReady: true,
    evReady: true,
    aiMatchReasons: ['Rare detached office', 'Family/pet friendly layout', 'Energy efficient rental'],
  },
  {
    id: 'RLM-1007',
    slug: 'denver-riverfront-modern-townhome',
    title: 'Riverfront Modern Townhome',
    address: '3217 Brighton Blvd',
    city: 'Denver',
    state: 'CO',
    neighborhoodSlug: 'ri-no',
    neighborhoodName: 'RiNo',
    agentSlug: 'noah-bennett',
    intent: 'buy',
    status: 'active',
    propertyType: 'Townhome',
    price: 985000,
    hoaMonthly: 295,
    estTaxMonthly: 620,
    beds: 3,
    baths: 4,
    sqft: 2210,
    yearBuilt: 2024,
    daysOnMarket: 8,
    latitude: 39.764,
    longitude: -104.974,
    mapX: 52,
    mapY: 42,
    heroPalette: ['#0f172a', '#0ea5e9', '#bae6fd'],
    badges: ['Roof Deck', 'EV Ready Garage', 'New Build'],
    highlights: ['Private rooftop hot tub rough-in', 'Flex guest suite', 'Designer stair gallery'],
    amenities: ['Micro-park access', 'HOA snow removal', 'Shared green lane'],
    description: 'Newly built multi-level townhome with a rooftop entertainment deck and lock-and-leave convenience near RiNo’s core.',
    openHouse: [{ date: '2026-03-01', start: '1:00 PM', end: '3:00 PM' }],
    priceHistory: makePriceHistory(985000),
    schoolsScore: 7,
    walkScore: 84,
    transitScore: 73,
    bikeScore: 88,
    energyScore: 87,
    climateRisk: 'Low',
    virtualTour: true,
    fiberReady: true,
    evReady: true,
    aiMatchReasons: ['New-build efficiency', 'Strong lifestyle-demand profile', 'Flexible multi-gen layout'],
  },
  {
    id: 'RLM-1008',
    slug: 'brooklyn-bridge-park-view-condo',
    title: 'Bridge Park View Condo',
    address: '1 John St #11D',
    city: 'Brooklyn',
    state: 'NY',
    neighborhoodSlug: 'dumbo',
    neighborhoodName: 'DUMBO',
    agentSlug: 'sofia-alvarez',
    intent: 'buy',
    status: 'active',
    propertyType: 'Condo',
    price: 1725000,
    hoaMonthly: 1085,
    estTaxMonthly: 1315,
    beds: 2,
    baths: 2,
    sqft: 1295,
    yearBuilt: 2017,
    daysOnMarket: 20,
    latitude: 40.7035,
    longitude: -73.994,
    mapX: 88,
    mapY: 22,
    heroPalette: ['#111827', '#f59e0b', '#fde68a'],
    badges: ['Bridge Views', 'Full Service', 'Home Office Niche'],
    highlights: ['Park-facing living room', 'Sound-insulated windows', 'Custom closets'],
    amenities: ['Doorman', 'Gym', 'Roof terrace', 'Kids room'],
    description: 'A full-service condo with bridge and park views, purpose-built for buyers who need premium location and flexible daily living.',
    openHouse: [{ date: '2026-03-06', start: '12:00 PM', end: '2:00 PM' }],
    priceHistory: makePriceHistory(1725000),
    schoolsScore: 9,
    walkScore: 95,
    transitScore: 97,
    bikeScore: 88,
    energyScore: 80,
    climateRisk: 'Moderate',
    virtualTour: true,
    fiberReady: true,
    evReady: false,
    aiMatchReasons: ['Premium location liquidity', 'Excellent commute index', 'Strong end-user demand'],
  },
];

export const developments: Development[] = [
  {
    slug: 'harbor-point-residences',
    name: 'Harbor Point Residences',
    city: 'Seattle',
    state: 'WA',
    deliveryWindow: 'Q4 2027',
    priceFrom: 940000,
    unitsAvailable: 36,
    developer: 'Northline Urban',
    concept: 'Waterfront wellness tower with flexible ownership + furnished rental-ready packages.',
    amenities: ['Cold plunge + spa', 'Marina shuttle', 'Resident maker lab', 'EV valet'],
    palette: ['#0f172a', '#0ea5e9', '#67e8f9'],
  },
  {
    slug: 'canvas-wynwood',
    name: 'Canvas Wynwood',
    city: 'Miami',
    state: 'FL',
    deliveryWindow: 'Q2 2028',
    priceFrom: 760000,
    unitsAvailable: 54,
    developer: 'Helio Developments',
    concept: 'Art-forward mixed-use residences with creator studios and hospitality partnerships.',
    amenities: ['Creator suites', 'Pool club', 'Recording booth', 'Valet + concierge'],
    palette: ['#3b0764', '#db2777', '#fda4af'],
  },
  {
    slug: 'meadow-circuit-homes',
    name: 'Meadow Circuit Homes',
    city: 'Austin',
    state: 'TX',
    deliveryWindow: 'Q3 2027',
    priceFrom: 615000,
    unitsAvailable: 72,
    developer: 'Praxis Neighborhoods',
    concept: 'All-electric neighborhood of modular-ready homes centered on walkable green corridors.',
    amenities: ['Solar microgrid', 'Community greenhouse', 'Mobility hub', 'Shared workshop'],
    palette: ['#14532d', '#22c55e', '#bbf7d0'],
  },
  {
    slug: 'foundry-yard-denver',
    name: 'Foundry Yard',
    city: 'Denver',
    state: 'CO',
    deliveryWindow: 'Q1 2028',
    priceFrom: 540000,
    unitsAvailable: 43,
    developer: 'Rangeform',
    concept: 'Transit-first condos and townhomes around adaptive reuse courtyards in RiNo.',
    amenities: ['Bike atelier', 'Roof greenhouse', 'Coworking club', 'Tool library'],
    palette: ['#172554', '#3b82f6', '#bfdbfe'],
  },
];

export const marketCityMetrics = [
  { city: 'Seattle', activeListings: 1142, medianPrice: 934000, avgDays: 22, yoyPct: 5.6, demandIndex: 81 },
  { city: 'Miami', activeListings: 1624, medianPrice: 878000, avgDays: 29, yoyPct: 7.4, demandIndex: 78 },
  { city: 'Austin', activeListings: 1396, medianPrice: 612000, avgDays: 31, yoyPct: 2.9, demandIndex: 70 },
  { city: 'Denver', activeListings: 1203, medianPrice: 641000, avgDays: 26, yoyPct: 4.7, demandIndex: 74 },
  { city: 'Brooklyn', activeListings: 988, medianPrice: 1285000, avgDays: 33, yoyPct: 6.1, demandIndex: 82 },
  { city: 'San Francisco', activeListings: 870, medianPrice: 1390000, avgDays: 34, yoyPct: 3.2, demandIndex: 73 },
] as const;

export const dashboardLeads: InquiryLead[] = [
  {
    id: 'LD-901',
    name: 'Hannah Lee',
    listingSlug: 'atlas-glasshouse-south-lake-union',
    source: 'Portal',
    stage: 'Tour Scheduled',
    lastTouch: '12m ago',
    budget: 1350000,
  },
  {
    id: 'LD-902',
    name: 'Marcus Patel',
    listingSlug: 'mueller-parkline-townhome',
    source: 'Ad Campaign',
    stage: 'Qualified',
    lastTouch: '1h ago',
    budget: 900000,
  },
  {
    id: 'LD-903',
    name: 'Olivia Sanchez',
    listingSlug: 'miami-design-district-rental-residence',
    source: 'Referral',
    stage: 'New',
    lastTouch: '3h ago',
    budget: 6500,
  },
  {
    id: 'LD-904',
    name: 'Daniel Kim',
    listingSlug: 'denver-riverfront-modern-townhome',
    source: 'Open House',
    stage: 'Offer',
    lastTouch: '1d ago',
    budget: 1025000,
  },
];

export const searchFilterDefaults: ListingsFilters = {
  q: '',
  city: 'all',
  intent: 'all',
  propertyType: 'all',
  minBeds: 0,
  sort: 'recommended',
  view: 'grid',
  openHouseOnly: false,
  ecoOnly: false,
};

export function parseListingsFilters(searchParams: SearchParamsRecord): ListingsFilters {
  const q = (one(searchParams.q) ?? '').trim();
  const city = (one(searchParams.city) ?? 'all').trim() || 'all';
  const intentRaw = one(searchParams.intent);
  const propertyTypeRaw = one(searchParams.type);
  const sortRaw = one(searchParams.sort);
  const viewRaw = one(searchParams.view);

  const intent: ListingsFilters['intent'] =
    intentRaw === 'buy' || intentRaw === 'rent' ? intentRaw : 'all';

  const propertyType: ListingsFilters['propertyType'] =
    propertyTypeRaw && propertyTypes.includes(propertyTypeRaw as PropertyType)
      ? (propertyTypeRaw as PropertyType)
      : 'all';

  const sort: ListingsSort =
    sortRaw && sortOptions.some((option) => option.value === sortRaw)
      ? (sortRaw as ListingsSort)
      : 'recommended';

  const view: ListingsView = viewRaw === 'map' ? 'map' : 'grid';

  return {
    q,
    city,
    intent,
    propertyType,
    minBeds: Math.min(int(one(searchParams.beds), 0), 8),
    minPrice: num(one(searchParams.minPrice)),
    maxPrice: num(one(searchParams.maxPrice)),
    sort,
    view,
    openHouseOnly: bool(one(searchParams.openHouse)),
    ecoOnly: bool(one(searchParams.eco)),
  };
}

export function buildSearchQuery(filters: Partial<ListingsFilters>): string {
  const params = new URLSearchParams();

  const entries: [keyof ListingsFilters, unknown][] = Object.entries(filters) as [
    keyof ListingsFilters,
    unknown,
  ][];

  for (const [key, rawValue] of entries) {
    if (rawValue === undefined || rawValue === null) continue;
    if (typeof rawValue === 'string' && rawValue.length === 0) continue;
    if (key === 'city' && rawValue === 'all') continue;
    if (key === 'intent' && rawValue === 'all') continue;
    if (key === 'propertyType' && rawValue === 'all') continue;
    if (key === 'minBeds' && rawValue === 0) continue;
    if (key === 'sort' && rawValue === 'recommended') continue;
    if (key === 'view' && rawValue === 'grid') continue;
    if (key === 'openHouseOnly' && rawValue === false) continue;
    if (key === 'ecoOnly' && rawValue === false) continue;

    const keyMap: Record<keyof ListingsFilters, string> = {
      q: 'q',
      city: 'city',
      intent: 'intent',
      propertyType: 'type',
      minBeds: 'beds',
      minPrice: 'minPrice',
      maxPrice: 'maxPrice',
      sort: 'sort',
      view: 'view',
      openHouseOnly: 'openHouse',
      ecoOnly: 'eco',
    };

    params.set(keyMap[key], String(rawValue));
  }

  const value = params.toString();
  return value ? `?${value}` : '';
}

export function filterListings(allListings: Listing[], filters: ListingsFilters): Listing[] {
  let result = allListings.filter((listing) => {
    if (filters.intent !== 'all' && listing.intent !== filters.intent) return false;
    if (filters.city !== 'all' && listing.city.toLowerCase() !== filters.city.toLowerCase()) return false;
    if (filters.propertyType !== 'all' && listing.propertyType !== filters.propertyType) return false;
    if (listing.beds < filters.minBeds) return false;
    if (filters.minPrice !== undefined && listing.price < filters.minPrice) return false;
    if (filters.maxPrice !== undefined && listing.price > filters.maxPrice) return false;
    if (filters.openHouseOnly && listing.openHouse.length === 0) return false;
    if (filters.ecoOnly && !(listing.energyScore >= 85 || listing.evReady)) return false;
    if (filters.q) {
      const haystack = [
        listing.title,
        listing.address,
        listing.city,
        listing.state,
        listing.neighborhoodName,
        ...listing.badges,
        ...listing.highlights,
      ]
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(filters.q.toLowerCase())) return false;
    }
    return true;
  });

  result = [...result].sort((a, b) => {
    switch (filters.sort) {
      case 'price-asc':
        return a.price - b.price;
      case 'price-desc':
        return b.price - a.price;
      case 'newest':
        return a.daysOnMarket - b.daysOnMarket;
      case 'sqft-desc':
        return b.sqft - a.sqft;
      case 'recommended':
      default:
        return scoreListing(b) - scoreListing(a);
    }
  });

  return result;
}

function scoreListing(listing: Listing): number {
  let score = 0;
  score += Math.max(0, 40 - listing.daysOnMarket);
  score += listing.energyScore / 4;
  score += listing.walkScore / 5;
  score += listing.aiMatchReasons.length * 3;
  if (listing.virtualTour) score += 4;
  if (listing.openHouse.length > 0) score += 6;
  if (listing.status === 'new-construction') score += 5;
  if (listing.intent === 'rent') score += 2;
  return score;
}

export const propertyTypes: PropertyType[] = [
  'House',
  'Condo',
  'Townhome',
  'Loft',
  'Penthouse',
  'Apartment',
];

export const sortOptions: { value: ListingsSort; label: string }[] = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'newest', label: 'Newest' },
  { value: 'price-asc', label: 'Price (Low to High)' },
  { value: 'price-desc', label: 'Price (High to Low)' },
  { value: 'sqft-desc', label: 'Largest First' },
];

export function uniqueCities(): string[] {
  return [...new Set(listings.map((listing) => listing.city))].sort();
}

export function getListingBySlug(slug: string): Listing | undefined {
  return listings.find((listing) => listing.slug === slug);
}

export function getAgentBySlug(slug: string): Agent | undefined {
  return agents.find((agent) => agent.slug === slug);
}

export function getNeighborhoodBySlug(slug: string): Neighborhood | undefined {
  return neighborhoods.find((neighborhood) => neighborhood.slug === slug);
}

export function getDevelopmentBySlug(slug: string): Development | undefined {
  return developments.find((development) => development.slug === slug);
}

export function listingAgent(listing: Listing): Agent {
  const agent = getAgentBySlug(listing.agentSlug);
  if (!agent) {
    throw new Error(`Missing agent for listing ${listing.slug}`);
  }
  return agent;
}

export function listingNeighborhood(listing: Listing): Neighborhood {
  const neighborhood = getNeighborhoodBySlug(listing.neighborhoodSlug);
  if (!neighborhood) {
    throw new Error(`Missing neighborhood for listing ${listing.slug}`);
  }
  return neighborhood;
}

export function getRelatedListings(slug: string, limit = 3): Listing[] {
  const current = getListingBySlug(slug);
  if (!current) return [];

  return listings
    .filter((listing) => listing.slug !== slug)
    .sort((a, b) => {
      let scoreA = 0;
      let scoreB = 0;

      if (a.city === current.city) scoreA += 3;
      if (b.city === current.city) scoreB += 3;
      if (a.intent === current.intent) scoreA += 2;
      if (b.intent === current.intent) scoreB += 2;
      if (a.propertyType === current.propertyType) scoreA += 1;
      if (b.propertyType === current.propertyType) scoreB += 1;

      scoreA -= Math.abs(a.price - current.price) / Math.max(current.price, 1);
      scoreB -= Math.abs(b.price - current.price) / Math.max(current.price, 1);

      return scoreB - scoreA;
    })
    .slice(0, limit);
}

export function estimateMonthlyPayment(listing: Listing, downPaymentPct = 20, ratePct = 6.35): number {
  if (listing.intent === 'rent') {
    return listing.price;
  }

  const principal = listing.price * (1 - downPaymentPct / 100);
  const monthlyRate = ratePct / 100 / 12;
  const months = 30 * 12;
  const mortgage =
    (principal * monthlyRate * (1 + monthlyRate) ** months) /
    ((1 + monthlyRate) ** months - 1);

  return mortgage + listing.estTaxMonthly + (listing.hoaMonthly ?? 0);
}

export function cityHeadline(city: string): string {
  const metric = marketCityMetrics.find((item) => item.city.toLowerCase() === city.toLowerCase());
  if (!metric) return `${city} listings and neighborhood trends`;
  return `${city}: ${formatInteger(metric.activeListings)} active listings, median ${formatCompactCurrency(metric.medianPrice)}`;
}

export function parseSlugList(searchParams: SearchParamsRecord, key = 'ids'): string[] {
  const raw = one(searchParams[key]) ?? '';
  return raw
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}

export function pickListingsBySlugs(slugs: string[], fallbackCount = 3): Listing[] {
  const picks = slugs
    .map((slug) => getListingBySlug(slug))
    .filter((listing): listing is Listing => Boolean(listing));

  if (picks.length > 0) return picks;

  return listings.slice(0, fallbackCount);
}

export function dashboardKpis() {
  return [
    { label: 'Active Inventory', value: '28', detail: '+4 this week' },
    { label: 'Lead Response SLA', value: '11m', detail: '92% within target' },
    { label: 'Tours Scheduled', value: '43', detail: 'Next 14 days' },
    { label: 'Pipeline Volume', value: '$18.4M', detail: 'Buyer + seller opportunities' },
  ] as const;
}

export function listingStatusLabel(status: ListingStatus): string {
  switch (status) {
    case 'active':
      return 'Active';
    case 'coming-soon':
      return 'Coming Soon';
    case 'new-construction':
      return 'New Construction';
    default:
      return status;
  }
}

export function statusTone(status: ListingStatus): 'emerald' | 'amber' | 'violet' {
  switch (status) {
    case 'active':
      return 'emerald';
    case 'coming-soon':
      return 'amber';
    case 'new-construction':
      return 'violet';
  }
}

export function toneClasses(tone: 'emerald' | 'amber' | 'violet' | 'slate' | 'sky'): string {
  switch (tone) {
    case 'emerald':
      return 'border-emerald-300/50 bg-emerald-500/10 text-emerald-300';
    case 'amber':
      return 'border-amber-300/50 bg-amber-500/10 text-amber-300';
    case 'violet':
      return 'border-violet-300/50 bg-violet-500/10 text-violet-300';
    case 'sky':
      return 'border-sky-300/50 bg-sky-500/10 text-sky-300';
    case 'slate':
    default:
      return 'border-white/15 bg-white/5 text-white/80';
  }
}

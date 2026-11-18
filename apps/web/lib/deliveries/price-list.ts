/**
 * Diatel Greater Accra & Tema price list (GH₵), from the "Diatel Delivery Ghana
 * Price List" PDF. Packages go to the hub closest to the pickup and are
 * delivered from there, so each area has a price range per hub. Traffic at the
 * delivery time picks the price inside the range (see TRAFFIC_WINDOWS).
 *
 * The PDF marks these as proposed operating rates, not yet final — edit the
 * ranges here to change prices. Coordinates come from OpenStreetMap (reviewed
 * by hand); entries marked `approx` had no OSM match and sit at a neighbour.
 */

export type HubId = "makola" | "ablekuma"

export type Hub = {
  id: HubId
  name: string
  lat: number
  lng: number
}

/**
 * Starting points. Makola = Makola Market. Ablekuma = Ablekuma town (Ga Central)
 * — confirm the exact hub addresses and update these points if they differ.
 */
export const HUBS: readonly Hub[] = [
  { id: "makola", name: "Makola", lat: 5.5481, lng: -0.2069 },
  { id: "ablekuma", name: "Ablekuma", lat: 5.6279, lng: -0.3135 },
]

export type PriceRange = readonly [low: number, high: number]

/**
 * Where a delivery lands inside an area's range depends on Accra traffic at
 * the delivery time (Africa/Accra, GMT):
 *   rush hour  → top of the range    (weekdays 06:30–09:30 and 16:00–19:30)
 *   daytime    → middle of the range (other weekday hours 09:30–16:00)
 *   quiet      → bottom of the range (before 06:30, after 19:30, weekends)
 */
export const TRAFFIC_WINDOWS = {
  morningRush: { start: "06:30", end: "09:30" },
  eveningRush: { start: "16:00", end: "19:30" },
} as const

/**
 * Extra charge for Large parcels ("large, heavy or urgent deliveries may
 * attract additional charges"). PLACEHOLDER — confirm the amount with ops.
 */
export const LARGE_SURCHARGE_GHS = 10

export type PriceArea = {
  name: string
  section: string
  /** Extra spellings / landmarks matched in addresses (lowercase). */
  aliases: readonly string[]
  lat: number
  lng: number
  prices: Record<HubId, PriceRange>
  approx?: string
}

const area = (
  section: string,
  name: string,
  makola: PriceRange,
  ablekuma: PriceRange,
  lat: number,
  lng: number,
  extra: { aliases?: string[]; approx?: string } = {},
): PriceArea => ({
  name,
  section,
  aliases: extra.aliases ?? [],
  lat,
  lng,
  prices: { makola, ablekuma },
  ...(extra.approx ? { approx: extra.approx } : {}),
})

export const PRICE_AREAS: readonly PriceArea[] = [
  // Central Accra
  area("Central Accra", "Makola / Accra Central", [20, 25], [25, 35], 5.5481, -0.2069, { aliases: ["makola", "accra central", "makorla"] }),
  area("Central Accra", "Tudu", [20, 30], [25, 35], 5.5527, -0.2096),
  area("Central Accra", "Okaishie", [20, 30], [25, 35], 5.5481, -0.2069, { approx: "next to Makola Market" }),
  area("Central Accra", "Rawlings Park", [20, 30], [25, 35], 5.5456, -0.2082),
  area("Central Accra", "Adabraka", [25, 35], [25, 35], 5.5625, -0.2129),
  area("Central Accra", "Ridge", [25, 35], [30, 40], 5.5568, -0.1959, { aliases: ["west ridge"] }),
  area("Central Accra", "North Ridge", [30, 40], [35, 45], 5.5697, -0.1956),
  area("Central Accra", "Kokomlemle", [25, 35], [30, 40], 5.5755, -0.2089),
  area("Central Accra", "Asylum Down", [25, 35], [30, 40], 5.5684, -0.2083),
  area("Central Accra", "New Town", [25, 35], [30, 40], 5.5826, -0.2087, { aliases: ["newtown accra"] }),
  area("Central Accra", "Nima", [25, 35], [30, 40], 5.5820, -0.1988),
  area("Central Accra", "Mamobi", [25, 35], [30, 40], 5.5915, -0.1940),
  area("Central Accra", "Osu", [30, 40], [35, 45], 5.5606, -0.1824, { aliases: ["oxford street", "oxford st"] }),
  area("Central Accra", "Ministries", [25, 35], [30, 40], 5.5510, -0.1963, { aliases: ["ministry", "ministry area"] }),
  area("Central Accra", "Jamestown", [25, 35], [30, 40], 5.5350, -0.2164, { aliases: ["james town"] }),
  area("Central Accra", "Ussher Town", [25, 35], [30, 40], 5.5385, -0.2099),
  area("Central Accra", "Korle Bu", [30, 40], [30, 40], 5.5383, -0.2268),
  area("Central Accra", "Korle Gonno", [30, 40], [30, 40], 5.5326, -0.2290),
  area("Central Accra", "Chorkor", [30, 40], [25, 35], 5.5276, -0.2445),
  area("Central Accra", "La", [30, 40], [35, 45], 5.5602, -0.1576, { aliases: ["labadi la"] }),
  area("Central Accra", "Labone", [30, 40], [35, 45], 5.5698, -0.1721),
  area("Central Accra", "Labadi", [35, 45], [40, 50], 5.5602, -0.1576, { aliases: ["labadi beach"] }),
  area("Central Accra", "Cantonments", [35, 45], [40, 50], 5.5842, -0.1692),
  area("Central Accra", "37", [30, 40], [35, 45], 5.5883, -0.1849, { aliases: ["37 military hospital", "37 station"] }),
  // Kaneshie & North Kaneshie
  area("Kaneshie & North Kaneshie", "Kaneshie Market", [25, 35], [20, 30], 5.5648, -0.2367, { aliases: ["kaneshie"] }),
  area("Kaneshie & North Kaneshie", "North Kaneshie", [25, 35], [20, 30], 5.5816, -0.2347),
  area("Kaneshie & North Kaneshie", "North Kaneshie First Light", [25, 35], [20, 30], 5.5695, -0.2417, { aliases: ["first light"] }),
  area("Kaneshie & North Kaneshie", "South Kaneshie", [25, 35], [20, 30], 5.5721, -0.2436),
  area("Kaneshie & North Kaneshie", "Abossey Okai", [25, 35], [20, 30], 5.5591, -0.2336, { aliases: ["abossey okai"] }),
  area("Kaneshie & North Kaneshie", "Lartebiokorshie", [25, 35], [20, 30], 5.5494, -0.2423),
  area("Kaneshie & North Kaneshie", "Bubuashie", [25, 35], [20, 30], 5.5796, -0.2453),
  area("Kaneshie & North Kaneshie", "Awudome", [25, 35], [25, 35], 5.5705, -0.2291, { aliases: ["awudome estates"] }),
  area("Kaneshie & North Kaneshie", "Mataheko", [30, 40], [25, 35], 5.5638, -0.2529),
  area("Kaneshie & North Kaneshie", "Mamprobi", [30, 40], [25, 35], 5.5350, -0.2427),
  area("Kaneshie & North Kaneshie", "New Mamprobi", [30, 40], [25, 35], 5.5431, -0.2440),
  area("Kaneshie & North Kaneshie", "Old Mamprobi", [30, 40], [25, 35], 5.5350, -0.2427),
  area("Kaneshie & North Kaneshie", "Sukura", [30, 40], [25, 35], 5.5484, -0.2525),
  area("Kaneshie & North Kaneshie", "Gbegbeyise", [35, 45], [30, 40], 5.5257, -0.2587),
  area("Kaneshie & North Kaneshie", "Darkuman", [30, 40], [25, 35], 5.5903, -0.2520),
  area("Kaneshie & North Kaneshie", "Odorkor", [30, 40], [25, 35], 5.5740, -0.2678),
  area("Kaneshie & North Kaneshie", "North Odorkor", [30, 40], [25, 35], 5.5817, -0.2716),
  area("Kaneshie & North Kaneshie", "South Odorkor", [35, 45], [30, 40], 5.5671, -0.2658),
  area("Kaneshie & North Kaneshie", "Ablekuma", [30, 40], [20, 30], 5.6279, -0.3135),
  area("Kaneshie & North Kaneshie", "Ablekuma Newtown", [30, 40], [20, 30], 5.6274, -0.3094, { aliases: ["ablekuma new town"] }),
  // Western Accra & Dansoman
  area("Western Accra & Dansoman", "Dansoman", [35, 45], [25, 35], 5.5448, -0.2681),
  area("Western Accra & Dansoman", "Dansoman Estates", [35, 45], [25, 35], 5.5448, -0.2681, { aliases: ["dansoman estate"], approx: "inside Dansoman" }),
  area("Western Accra & Dansoman", "Sakaman", [35, 45], [25, 35], 5.5734, -0.2724),
  area("Western Accra & Dansoman", "Mallam", [35, 45], [25, 35], 5.5698, -0.2859, { aliases: ["mallam junction"] }),
  area("Western Accra & Dansoman", "Gbawe", [40, 50], [30, 40], 5.5579, -0.3042),
  area("Western Accra & Dansoman", "New Gbawe", [40, 50], [30, 40], 5.5759, -0.2960),
  area("Western Accra & Dansoman", "Awoshie", [35, 45], [30, 40], 5.5873, -0.2781),
  area("Western Accra & Dansoman", "Anyaa", [40, 50], [30, 40], 5.6072, -0.2838),
  area("Western Accra & Dansoman", "Kwashieman", [35, 45], [30, 40], 5.5931, -0.2703),
  area("Western Accra & Dansoman", "Sowutuom", [40, 50], [35, 45], 5.6237, -0.2788),
  area("Western Accra & Dansoman", "Santa Maria", [40, 50], [35, 45], 5.6045, -0.2734),
  area("Western Accra & Dansoman", "McCarthy Hill", [40, 50], [30, 40], 5.5651, -0.2986, { aliases: ["mccarthy hills", "mc carthy hill"] }),
  area("Western Accra & Dansoman", "Weija", [45, 55], [35, 45], 5.5792, -0.3307),
  area("Western Accra & Dansoman", "New Weija", [45, 55], [35, 45], 5.5495, -0.3403),
  area("Western Accra & Dansoman", "Oblogo", [45, 55], [35, 45], 5.5674, -0.3220),
  area("Western Accra & Dansoman", "Tetegu", [45, 55], [40, 50], 5.5483, -0.3062),
  area("Western Accra & Dansoman", "Bortianor", [50, 60], [40, 50], 5.5079, -0.3362),
  area("Western Accra & Dansoman", "Kasoa", [55, 70], [45, 60], 5.5326, -0.4375),
  // Achimota, Lapaz & North-West
  area("Achimota, Lapaz & North-West", "Abeka", [30, 40], [25, 35], 5.6033, -0.2453),
  area("Achimota, Lapaz & North-West", "Abeka Lapaz", [30, 40], [25, 35], 5.6063, -0.2482),
  area("Achimota, Lapaz & North-West", "Lapaz", [30, 40], [25, 35], 5.6074, -0.2487),
  area("Achimota, Lapaz & North-West", "Tesano", [30, 40], [25, 35], 5.6006, -0.2263),
  area("Achimota, Lapaz & North-West", "Achimota", [30, 40], [25, 35], 5.6242, -0.2277),
  area("Achimota, Lapaz & North-West", "New Achimota", [35, 45], [30, 40], 5.6194, -0.2404),
  area("Achimota, Lapaz & North-West", "Achimota Mile 7", [35, 45], [30, 40], 5.6339, -0.2398, { aliases: ["mile 7"] }),
  area("Achimota, Lapaz & North-West", "Akweteyman", [30, 40], [25, 35], 5.6163, -0.2376),
  area("Achimota, Lapaz & North-West", "Apenkwa", [35, 45], [30, 40], 5.6088, -0.2262),
  area("Achimota, Lapaz & North-West", "Ofankor", [40, 50], [35, 45], 5.6636, -0.2652),
  area("Achimota, Lapaz & North-West", "Pokuase", [45, 55], [40, 50], 5.6892, -0.2826),
  area("Achimota, Lapaz & North-West", "Pobiman", [45, 55], [40, 50], 5.7331, -0.3121),
  area("Achimota, Lapaz & North-West", "Amasaman", [50, 60], [45, 55], 5.7033, -0.2991),
  area("Achimota, Lapaz & North-West", "Asofan", [45, 55], [40, 50], 5.6534, -0.2867),
  area("Achimota, Lapaz & North-West", "Taifa", [45, 55], [40, 50], 5.6474, -0.2488),
  area("Achimota, Lapaz & North-West", "Chantan", [40, 50], [35, 45], 5.6083, -0.2568),
  // Airport & East Legon
  area("Airport & East Legon", "Dzorwulu", [35, 45], [40, 50], 5.6123, -0.2038),
  area("Airport & East Legon", "Abelemkpe", [35, 45], [35, 45], 5.6082, -0.2140, { aliases: ["abelenkpe"] }),
  area("Airport & East Legon", "Roman Ridge", [35, 45], [40, 50], 5.6041, -0.1949),
  area("Airport & East Legon", "Airport Residential", [35, 45], [40, 50], 5.6054, -0.1833, { aliases: ["airport residential area"] }),
  area("Airport & East Legon", "Airport City", [35, 45], [40, 50], 5.6007, -0.1752),
  area("Airport & East Legon", "East Airport", [40, 50], [45, 55], 5.6246, -0.1314),
  area("Airport & East Legon", "East Legon", [45, 55], [50, 60], 5.6355, -0.1617),
  area("Airport & East Legon", "East Legon Hills", [50, 60], [55, 65], 5.6928, -0.1005),
  area("Airport & East Legon", "American House", [45, 55], [50, 60], 5.6488, -0.1508),
  area("Airport & East Legon", "Adjiringanor", [45, 55], [50, 60], 5.6458, -0.1340, { aliases: ["adjiriganor"] }),
  area("Airport & East Legon", "Shiashie", [40, 50], [45, 55], 5.6289, -0.1697),
  area("Airport & East Legon", "Okponglo", [40, 50], [45, 55], 5.6417, -0.1756),
  area("Airport & East Legon", "Bawaleshie", [40, 50], [45, 55], 5.6429, -0.1654, { aliases: ["la bawaleshie", "bawaleshi"] }),
  area("Airport & East Legon", "Trasacco Valley", [50, 60], [55, 65], 5.6576, -0.1124, { aliases: ["trasacco"] }),
  area("Airport & East Legon", "Airport Hills", [45, 55], [50, 60], 5.6115, -0.1430),
  area("Airport & East Legon", "Legon", [40, 50], [45, 55], 5.6477, -0.1960),
  area("Airport & East Legon", "University of Ghana", [40, 50], [45, 55], 5.6466, -0.1880, { aliases: ["ug legon"] }),
  // North-East Accra, Ashongman & Abokobi
  area("North-East Accra, Ashongman & Abokobi", "Dome", [40, 50], [40, 50], 5.6554, -0.2329),
  area("North-East Accra, Ashongman & Abokobi", "Dome Crossing", [40, 50], [40, 50], 5.6554, -0.2329),
  area("North-East Accra, Ashongman & Abokobi", "Dome Pillar 2", [45, 55], [40, 50], 5.6564, -0.2183, { aliases: ["pillar 2"] }),
  area("North-East Accra, Ashongman & Abokobi", "Atomic Junction", [40, 50], [45, 55], 5.6670, -0.1772, { aliases: ["atomic"] }),
  area("North-East Accra, Ashongman & Abokobi", "Haatso", [40, 50], [45, 55], 5.6707, -0.2034),
  area("North-East Accra, Ashongman & Abokobi", "Agbogba", [45, 55], [50, 60], 5.6919, -0.1984),
  area("North-East Accra, Ashongman & Abokobi", "Old Ashongman", [45, 55], [50, 60], 5.7035, -0.2099, { aliases: ["ashongman"] }),
  area("North-East Accra, Ashongman & Abokobi", "Ashongman Estate", [50, 60], [55, 65], 5.7022, -0.2358, { aliases: ["ashongman estates"] }),
  area("North-East Accra, Ashongman & Abokobi", "Abokobi", [55, 65], [60, 70], 5.7328, -0.2059),
  area("North-East Accra, Ashongman & Abokobi", "Abokobi Boi", [55, 65], [60, 70], 5.7299, -0.2069),
  area("North-East Accra, Ashongman & Abokobi", "Abokobi Sesemi", [55, 65], [60, 70], 5.7328, -0.2059, { approx: "part of Abokobi" }),
  area("North-East Accra, Ashongman & Abokobi", "Kwabenya", [45, 55], [45, 55], 5.6890, -0.2457),
  area("North-East Accra, Ashongman & Abokobi", "North Legon", [45, 55], [50, 60], 5.6615, -0.1664),
  area("North-East Accra, Ashongman & Abokobi", "Madina", [45, 55], [50, 60], 5.6865, -0.1677),
  area("North-East Accra, Ashongman & Abokobi", "Pantang", [55, 65], [60, 70], 5.7306, -0.1939),
  area("North-East Accra, Ashongman & Abokobi", "Oyarifa", [55, 65], [60, 70], 5.7441, -0.1765),
  area("North-East Accra, Ashongman & Abokobi", "Adenta", [50, 60], [55, 65], 5.7042, -0.1691, { aliases: ["adentan"] }),
  area("North-East Accra, Ashongman & Abokobi", "Frafraha", [55, 65], [60, 70], 5.7173, -0.1590),
  area("North-East Accra, Ashongman & Abokobi", "Lakeside Estate", [60, 70], [65, 75], 5.6973, -0.1271, { aliases: ["lakeside estates", "lakeside"] }),
  area("North-East Accra, Ashongman & Abokobi", "Ayi Mensah", [55, 65], [60, 70], 5.7829, -0.1817),
  area("North-East Accra, Ashongman & Abokobi", "Teiman", [55, 65], [60, 70], 5.7524, -0.1831),
  // Teshie, Nungua & Spintex
  area("Teshie, Nungua & Spintex", "Teshie", [40, 50], [45, 55], 5.5822, -0.1135),
  area("Teshie, Nungua & Spintex", "Teshie Nungua Estates", [40, 50], [45, 55], 5.5969, -0.0978, { aliases: ["teshie nungua estate"] }),
  area("Teshie, Nungua & Spintex", "Teshie Zongo", [40, 50], [45, 55], 5.5822, -0.1135),
  area("Teshie, Nungua & Spintex", "Nungua", [40, 50], [45, 55], 5.6011, -0.0704),
  area("Teshie, Nungua & Spintex", "Nungua Old Town", [40, 50], [45, 55], 5.6011, -0.0704),
  area("Teshie, Nungua & Spintex", "Tse Addo", [40, 50], [45, 55], 5.5858, -0.1397),
  area("Teshie, Nungua & Spintex", "Baatsona", [45, 55], [45, 55], 5.6277, -0.0871, { aliases: ["batsona"] }),
  area("Teshie, Nungua & Spintex", "Spintex", [45, 55], [50, 60], 5.6288, -0.0902, { aliases: ["spintex road", "spintex rd"] }),
  area("Teshie, Nungua & Spintex", "Manet", [50, 60], [55, 65], 5.6377, -0.1266, { aliases: ["manet junction"] }),
  area("Teshie, Nungua & Spintex", "Sakumono", [50, 60], [55, 65], 5.6253, -0.0570),
  area("Teshie, Nungua & Spintex", "Lashibi", [50, 60], [55, 65], 5.6382, -0.0628),
  area("Teshie, Nungua & Spintex", "Klagon", [50, 60], [55, 65], 5.6637, -0.0533),
  area("Teshie, Nungua & Spintex", "Community 18 Junction", [50, 60], [55, 65], 5.6470, -0.0708),
  area("Teshie, Nungua & Spintex", "Borteyman", [55, 65], [60, 70], 5.6687, -0.0827),
  area("Teshie, Nungua & Spintex", "Kpone", [60, 70], [65, 75], 5.6897, 0.0570),
  // Tema & surrounding communities
  area("Tema & surrounding communities", "Tema Industrial Area", [60, 70], [65, 75], 5.6201, -0.0210),
  area("Tema & surrounding communities", "Tema Harbour", [65, 75], [70, 80], 5.6311, 0.0019, { aliases: ["tema port"] }),
  area("Tema & surrounding communities", "Ashaiman", [60, 70], [65, 75], 5.6944, -0.0295),
  area("Tema & surrounding communities", "Ashaiman Lebanon", [60, 70], [65, 75], 5.7115, -0.0445),
  area("Tema & surrounding communities", "Zenu", [65, 75], [70, 80], 5.7219, -0.0559),
  area("Tema & surrounding communities", "Adjei Kojo", [65, 75], [70, 80], 5.6820, -0.0575),
  area("Tema & surrounding communities", "Prampram", [80, 95], [85, 100], 5.7149, 0.1061),
  area("Tema & surrounding communities", "Dawhenya", [80, 95], [85, 100], 5.7648, 0.0563),
  area("Tema & surrounding communities", "Afienya", [80, 95], [85, 100], 5.7981, 0.0052),
  area("Tema & surrounding communities", "Tema Community 1", [55, 65], [60, 70], 5.6448, 0.0003, { aliases: ["community 1", "comm 1", "tema comm 1"] }),
  area("Tema & surrounding communities", "Tema Community 2", [55, 65], [60, 70], 5.6323, -0.0174, { aliases: ["community 2", "comm 2", "tema comm 2"] }),
  area("Tema & surrounding communities", "Tema Community 3", [55, 65], [60, 70], 5.6259, -0.0306, { aliases: ["community 3", "comm 3", "tema comm 3"] }),
  area("Tema & surrounding communities", "Tema Community 4", [55, 65], [60, 70], 5.6565, -0.0079, { aliases: ["community 4", "comm 4", "tema comm 4"] }),
  area("Tema & surrounding communities", "Tema Community 5", [55, 65], [60, 70], 5.6434, -0.0150, { aliases: ["community 5", "comm 5", "tema comm 5"] }),
  area("Tema & surrounding communities", "Tema Community 6", [55, 65], [60, 70], 5.6508, -0.0199, { aliases: ["community 6", "comm 6", "tema comm 6"] }),
  area("Tema & surrounding communities", "Tema Community 7", [60, 70], [65, 75], 5.6647, -0.0112, { aliases: ["community 7", "comm 7", "tema comm 7"] }),
  area("Tema & surrounding communities", "Tema Community 8", [60, 70], [65, 75], 5.6706, -0.0130, { aliases: ["community 8", "comm 8", "tema comm 8"] }),
  area("Tema & surrounding communities", "Tema Community 9", [60, 70], [65, 75], 5.6792, -0.0166, { aliases: ["community 9", "comm 9", "tema comm 9"] }),
  area("Tema & surrounding communities", "Tema Community 10", [60, 70], [65, 75], 5.6568, -0.0239, { aliases: ["community 10", "comm 10", "tema comm 10"] }),
  area("Tema & surrounding communities", "Tema Community 11", [60, 70], [65, 75], 5.6640, -0.0272, { aliases: ["community 11", "comm 11", "tema comm 11"] }),
  area("Tema & surrounding communities", "Tema Community 12", [60, 70], [65, 75], 5.6704, -0.0321, { aliases: ["community 12", "comm 12", "tema comm 12"] }),
  area("Tema & surrounding communities", "Tema Community 13", [60, 70], [65, 75], 5.6205, -0.0579, { aliases: ["community 13", "comm 13", "tema comm 13"] }),
  area("Tema & surrounding communities", "Tema Community 14", [60, 70], [65, 75], 5.6323, -0.0583, { aliases: ["community 14", "comm 14", "tema comm 14"] }),
  area("Tema & surrounding communities", "Tema Community 15", [60, 70], [65, 75], 5.6266, -0.0703, { aliases: ["community 15", "comm 15", "tema comm 15"] }),
  area("Tema & surrounding communities", "Tema Community 17", [60, 70], [65, 75], 5.6378, -0.0706, { aliases: ["community 17", "comm 17", "tema comm 17"] }),
  area("Tema & surrounding communities", "Tema Community 18", [60, 70], [65, 75], 5.6470, -0.0708, { aliases: ["community 18", "comm 18", "tema comm 18"] }),
  area("Tema & surrounding communities", "Tema Community 19", [60, 70], [65, 75], 5.6535, -0.0608, { aliases: ["community 19", "comm 19", "tema comm 19"] }),
  area("Tema & surrounding communities", "Tema Community 20", [60, 70], [65, 75], 5.6548, -0.0701, { aliases: ["community 20", "comm 20", "tema comm 20"] }),
  area("Tema & surrounding communities", "Tema Community 22", [65, 75], [70, 80], 5.6942, -0.0169, { aliases: ["community 22", "comm 22", "tema comm 22"] }),
  area("Tema & surrounding communities", "Tema Community 25", [65, 75], [70, 80], 5.7382, 0.0336, { aliases: ["community 25", "comm 25", "tema comm 25"] }),
]

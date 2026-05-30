export interface BearTemplate {
  id: string;
  title: string;
  scientificName: string;
  category: "Grizzly" | "Polar" | "Panda" | "Kodiak" | "Black" | "Spirit";
  description: string;
  imageUrl: string;
  funFact: string;
  diet: string;
  habitat: string;
}

export const BEAR_TEMPLATES: BearTemplate[] = [
  {
    id: "grizzly-1",
    title: "The Grizzly Monarch",
    scientificName: "Ursus arctos horribilis",
    category: "Grizzly",
    description: "The peak predator of the North American forests. Renowned for its immense muscle hump on the shoulders, long sharp claws, and rugged amber-tinted fur.",
    imageUrl: "https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?auto=format&fit=crop&q=80&w=1200",
    funFact: "A grizzly's shoulder hump is a massive muscle group used purely for digging dens, tearing logs, and lifting stones.",
    diet: "Wild berries, roots, insects, spawning salmon, and small mammals.",
    habitat: "Subalpine meadows, dense coniferous forests, and river valleys."
  },
  {
    id: "polar-1",
    title: "The Arctic Sovereign",
    scientificName: "Ursus maritimus",
    category: "Polar",
    description: "The absolute king of the frozen wilderness. Possessing specialized white water-resistant hollow coats, thick insulating fat, and massive oars-like paws.",
    imageUrl: "https://images.unsplash.com/photo-1589656966895-2f33e7653819?auto=format&fit=crop&q=80&w=1200",
    funFact: "Unbelievably, polar bears actually have pitch black skin underneath their clear translucent fur coat to absorb the sun's warm rays.",
    diet: "Ringed and bearded seals, belugas, and ocean washed marine carcasses.",
    habitat: "Arctic marine pack ice, frozen coastlines, and open tundra waters."
  },
  {
    id: "panda-1",
    title: "The Bamboo Guardian",
    scientificName: "Ailuropoda melanoleuca",
    category: "Panda",
    description: "The beloved gentle giant of the misty Sichuan mountains. Characterized by prominent dark eye markings and a peaceful lifestyle dedicated to bamboo.",
    imageUrl: "https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?auto=format&fit=crop&q=80&w=1200",
    funFact: "Pandas have a highly specialized 'sixth thumb' – which is actually an enlarged wrist bone that helps tightly grip bamboo stalks.",
    diet: "Bamboo leaves, stems, fresh shoots, and occasional alpine grasses.",
    habitat: "Misty high-elevation bamboo woodlands in southwestern China."
  },
  {
    id: "spirit-1",
    title: "Rainforest Ghost 'Kermode'",
    scientificName: "Ursus americanus kermodei",
    category: "Spirit",
    description: "An incredibly rare cream-colored subspecies of the American black bear. Reveled as sacred 'Spirit Bears' by indigenous peoples of the Pacific coast.",
    imageUrl: "https://images.unsplash.com/photo-1470240731273-7821a6eeb6bd?auto=format&fit=crop&q=80&w=1200",
    funFact: "Spirit bears carry a recessive MC1R gene mutation. They are successful fishers because their light coats blend with the sky from a salmon's perspective.",
    diet: "Coastal spawning pink salmon, elderberries, and forest grass.",
    habitat: "The Great Bear Rainforest of British Columbia, Canada."
  },
  {
    id: "kodiak-1",
    title: "The Kodiak Giant",
    scientificName: "Ursus arctos middendorffi",
    category: "Kodiak",
    vibe: "titan",
    description: "The island giant and the largest subspecies of brown bears on earth. Growing to colossal sizes and living isolated on the Kodiak Archipelago for millennia.",
    imageUrl: "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&q=80&w=1200",
    funFact: "An adult male Kodiak can reach up to 1,500 pounds (680 kg) and top out at over 10 feet tall when standing erect on hind legs.",
    diet: "Rich marine salmon, beach rye grass, elderberries, and sedges.",
    habitat: "Dense, windswept grasslands and coastal fjords of Alaska."
  },
  {
    id: "black-1",
    title: "The Appalachian Explorer",
    scientificName: "Ursus americanus",
    category: "Black",
    description: "The nimble, highly adaptive forest climber of the Western Hemisphere. Exceptional climbers possessing great agility and incredible senses.",
    imageUrl: "https://images.unsplash.com/photo-1591824438708-ce405f36ba3d?auto=format&fit=crop&q=80&w=1200",
    funFact: "Despite their name, American Black Bears can range in color from coal black to deep cinnamon, silvery blue, and rich rusty brown.",
    diet: "Acorns, pine nuts, insect grubs, mountain honey, trout, and fawns.",
    habitat: "Coniferous forests, swamp wilderness, and rugged hillsides."
  }
] as any[];

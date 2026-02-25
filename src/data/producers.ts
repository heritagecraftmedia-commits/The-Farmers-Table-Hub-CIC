export interface Producer {
  id: string;
  name: string;
  type: string;
  location: string;
  description: string;
  image: string;
  tags: string[];
}

export const producers: Producer[] = [
  {
    id: '1',
    name: 'Green Valley Farm',
    type: 'Vegetables & Herbs',
    location: 'Farnham, Surrey',
    description: 'Organic, pesticide-free seasonal vegetables grown with love in the heart of the valley.',
    image: 'https://picsum.photos/seed/farm1/800/600',
    tags: ['Organic', 'Seasonal', 'Local'],
  },
  {
    id: '2',
    name: 'Old Mill Bakery',
    type: 'Bread & Pastries',
    location: 'Tilford, Surrey',
    description: 'Traditional sourdough and artisanal pastries baked daily using locally milled flour.',
    image: 'https://picsum.photos/seed/bakery/800/600',
    tags: ['Sourdough', 'Artisanal', 'Bakery'],
  },
  {
    id: '3',
    name: 'Surrey Hills Honey',
    type: 'Honey & Beeswax',
    location: 'Elstead, Surrey',
    description: 'Pure, raw honey collected from hives across the Surrey Hills. Natural and delicious.',
    image: 'https://picsum.photos/seed/honey/800/600',
    tags: ['Raw', 'Natural', 'Honey'],
  },
  {
    id: '4',
    name: 'River Orchard',
    type: 'Fruits & Juices',
    location: 'Farnham, Surrey',
    description: 'Fresh apples, pears, and cold-pressed juices from our heritage orchard.',
    image: 'https://picsum.photos/seed/orchard/800/600',
    tags: ['Fruit', 'Juice', 'Heritage'],
  },
  {
    id: '5',
    name: 'Blacksmith Hand Tools',
    type: 'Tool Maker',
    location: 'Farnham, Surrey',
    description: 'Traditional hand-forged chisels, tongs, and hammers for the modern craftsman.',
    image: 'https://picsum.photos/seed/tools1/800/600',
    tags: ['Handmade', 'Traditional', 'Metalwork'],
  },
  {
    id: '6',
    name: 'Linen & Wool Weavers',
    type: 'Artisan Clothing',
    location: 'Tilford, Surrey',
    description: 'Handwoven clothing and naturally dyed garments made from sustainable fibres.',
    image: 'https://picsum.photos/seed/clothing1/800/600',
    tags: ['Handwoven', 'Natural Dye', 'Sustainable'],
  },
  {
    id: '7',
    name: 'Heritage Leather Goods',
    type: 'Footwear & Leather',
    location: 'Elstead, Surrey',
    description: 'Hand-stitched belts, bags, and journals crafted with traditional techniques.',
    image: 'https://picsum.photos/seed/leather1/800/600',
    tags: ['Leather', 'Hand-stitched', 'Heritage'],
  },
  {
    id: '8',
    name: 'Green-Wood Furniture',
    type: 'Woodcraft & Furniture',
    location: 'Farnham, Surrey',
    description: 'Bespoke handmade furniture and green-wood turned bowls from local timber.',
    image: 'https://picsum.photos/seed/wood1/800/600',
    tags: ['Woodwork', 'Bespoke', 'Handmade'],
  },
  {
    id: '9',
    name: 'Willow & Hazel Baskets',
    type: 'Heritage Crafts',
    location: 'Tilford, Surrey',
    description: 'Traditional basket weaving and chair caning using locally harvested materials.',
    image: 'https://picsum.photos/seed/basket1/800/600',
    tags: ['Basketry', 'Traditional', 'Willow'],
  },
];

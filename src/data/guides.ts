export interface GuideStep {
    id: number;
    title: string;
    description: string;
    tip: string;
}

export interface ProjectGuideData {
    id: string;
    title: string;
    subtitle?: string;
    category: string;
    level: string;
    duration: string;
    season: string;
    outcome: string;
    introduction: string;
    equipment: string[];
    ingredients: string[];
    steps: GuideStep[];
    troubleshooting: {
        issue: string;
        solution: string;
    }[];
    icon: string;
}

export const guides: ProjectGuideData[] = [
    {
        id: 'jam',
        title: 'Seasonal Jam & Preserves',
        subtitle: 'Preserving the season',
        category: 'Food & Kitchen',
        level: 'Beginner',
        duration: '2–3 Hours',
        season: 'Spring / Summer',
        outcome: '3–4 Jars of preserve',
        introduction: "There's something deeply satisfying about a shelf lined with jars you've filled yourself. Jam and preserve making is one of the oldest forms of food storage — a way of capturing the best of summer and carrying it into the darker months. Once you understand the method, you can apply it to whatever fruit is in season near you.",
        equipment: [
            'Large heavy-bottomed pan (preserving pan or stockpot)',
            'Jam thermometer or cold plate for testing set',
            'Sterilised jars with lids (3–4 x 300–400ml)',
            'Wide-necked funnel (helpful but not essential)',
            'Ladle and wooden spoon',
            'Oven gloves'
        ],
        ingredients: [
            '1kg Fresh Seasonal Fruit (e.g. Strawberries, hulled)',
            '750g Granulated White Sugar',
            'Juice of 1 Lemon (or Pectin)',
            'Jam Jars & Lids (Sterilized)',
            'Wax Discs (Optional)',
            'Large Preserving Pan'
        ],
        steps: [
            {
                id: 1,
                title: 'Preparation & Sterilizing',
                description: 'Wash your jars and lids in hot soapy water, then place them in a preheated oven (100°C) for at least 30 minutes to sterilize.',
                tip: 'Place a few small plates in the freezer now — you\'ll need them to test the jam\'s setting point later.'
            },
            {
                id: 2,
                title: 'Macerate your fruit',
                description: 'Combine prepared fruit with sugar and lemon juice in your pan. Stir gently and leave for 30–60 minutes to draw out juices.',
                tip: 'Don\'t fill the pan more than half full; the jam will foam up as it boils.'
            },
            {
                id: 3,
                title: 'The Slow Dissolve',
                description: 'Heat gently, stirring occasionally, until all the sugar has completely dissolved. Do not let it boil yet.',
                tip: 'Run your wooden spoon along the bottom — if you can\'t feel any gritty sugar crystals, it\'s ready.'
            },
            {
                id: 4,
                title: 'The Rolling Boil',
                description: 'Turn up the heat and bring to a full rolling boil. Let it boil hard for about 5-10 minutes without stirring.',
                tip: 'Watch the pan closely! If it looks like it might boil over, remove from heat for a moment.'
            },
            {
                id: 5,
                title: 'The Wrinkle Test',
                description: 'Remove from heat. Place a spoonful of jam on a chilled plate from the freezer. Wait a minute, then push the edge with your finger.',
                tip: 'If it wrinkles, it\'s set! if not, boil for another 2 minutes and test again.'
            }
        ],
        troubleshooting: [
            {
                issue: "My jam didn't set",
                solution: "Undercooking is the main culprit. Re-boil and test again. Add more lemon juice or pectin if fruit was very ripe."
            },
            {
                issue: "My jam is too firm",
                solution: "It was overcooked. Use it as a glaze instead. Next time, test for set earlier."
            }
        ],
        icon: '🫙'
    },
    {
        id: 'sourdough',
        title: 'Sourdough Bread from Scratch',
        category: 'Food & Kitchen',
        level: 'Intermediate',
        duration: '3 Days (low effort)',
        season: 'All Year',
        outcome: '1 Loaf + live starter',
        introduction: "Sourdough is not a weekend project — it's a relationship. But it's far more forgiving than most people think. hands-on time is short; what takes three days is mostly waiting. Once your starter is active, you'll have it for years.",
        equipment: [
            'Large mixing bowl',
            'Kitchen scales (essential)',
            'Banneton (proofing basket) or cloth-lined bowl',
            'Dutch oven or lidded cast iron casserole',
            'Dough scraper (helpful)',
            'Sharp knife or lame for scoring'
        ],
        ingredients: [
            'Starter: Flour (Strong white & Wholemeal), Water',
            'Loaf: 450g Strong white bread flour',
            '50g Wholemeal flour',
            '375g Water',
            '100g Active starter',
            '10g Salt'
        ],
        steps: [
            {
                id: 1,
                title: 'Building Your Starter (Days 1-4)',
                description: 'Establish your wild yeast culture by feeding flour and water daily. Discard half and re-feed until bubbly and active.',
                tip: 'It\'s ready when it doubles in size within 4-8 hours of feeding and a spoonful floats in water.'
            },
            {
                id: 2,
                title: 'Mixing & Autolyse (Day 5)',
                description: 'Mix flours with 325g water. Rest for 30-60 minutes to develop gluten without kneading.',
                tip: 'This rest makes the dough much easier to handle later.'
            },
            {
                id: 3,
                title: 'Bulk Fermentation (4-6 Hours)',
                description: 'Add starter, salt and remaining water. Perform stretch and folds every 30 minutes for the first 2 hours.',
                tip: 'The dough should feel airy and jiggly when the bowl is shaken.'
            },
            {
                id: 4,
                title: 'Shape & Cold Proof',
                description: 'Shape the dough to build surface tension. Place in a floured banneton and refrigerate overnight.',
                tip: 'Cold proofing makes the dough easier to score and improves flavor.'
            },
            {
                id: 5,
                title: 'Bake Day (Day 6)',
                description: 'Preheat Dutch oven to 250°C. Score the dough and bake covered for 20 mins, then uncovered for 20-25 mins.',
                tip: 'Wait at least 1 hour before cutting or the crumb will be gummy.'
            }
        ],
        troubleshooting: [
            {
                issue: "My loaf came out flat",
                solution: "Starter wasn't active enough or dough was overproofed. Do the float test before using starter."
            },
            {
                issue: "My crust is too thick",
                solution: "Uncovered bake was too long. Reduce time by 5 mins or lower heat slightly."
            }
        ],
        icon: '🍞'
    },
    {
        id: 'wraps',
        title: 'Beeswax Wraps & Natural Packaging',
        category: 'Home & Eco',
        level: 'Beginner',
        duration: '1–2 Hours',
        season: 'All Year',
        outcome: '6 Wraps in assorted sizes',
        introduction: "Beeswax wraps are quick to make and work genuinely well. The warmth of your hands moulds them around bowls and food. They last a year and are fully compostable.",
        equipment: [
            'Baking tray',
            'Baking paper / parchment',
            'Fabric scissors or pinking shears',
            'Oven (preheated to 80-90°C)',
            'Pastry brush (optional)'
        ],
        ingredients: [
            '100% Cotton fabric (various sizes)',
            '150g Beeswax pellets (for 6 wraps)',
            'Pine resin pellets (optional for tackiness)',
            'Jojoba oil (optional for flexibility)'
        ],
        steps: [
            {
                id: 1,
                title: 'Cut & Prepare',
                description: 'Wash and dry fabric. Cut into squares (20cm, 30cm, 40cm). Use pinking shears to prevent fraying.',
                tip: 'Small wraps are great for half a lemon; large ones cover bread and big bowls.'
            },
            {
                id: 2,
                title: 'Apply Wax',
                description: 'Lay fabric on tray. Scatter beeswax pellets (and optional resin/oil) evenly across the surface.',
                tip: 'Scatter evenly but don\'t make a thick pile — you want just enough to soak in.'
            },
            {
                id: 3,
                title: 'Melt & Distribute',
                description: 'Place in oven for 4-6 minutes. Use a pastry brush to spread melted wax across dry patches if needed.',
                tip: 'Work quickly once it comes out of the oven before the wax hardens.'
            },
            {
                id: 4,
                title: 'Set & Finish',
                description: 'Peel off paper and wave in air for 20-30 seconds. The wrap will stiffen as it cools.',
                tip: 'Add more pellets and re-melt if you find dry patches.'
            }
        ],
        troubleshooting: [
            {
                issue: "The wrap isn't sticky enough",
                solution: "This usually means you missed the pine resin. It creates the tackiness needed for a good seal."
            },
            {
                issue: "The wrap is too waxy",
                solution: "Blot with a fresh sheet of baking paper in the oven to absorb excess."
            }
        ],
        icon: '🐝'
    },
    {
        id: 'herbs',
        title: 'Grow Your Own Herb Garden',
        category: 'Garden & Growing',
        level: 'Beginner',
        duration: 'Weekend Project',
        season: 'Spring',
        outcome: '5 Thriving herb plants',
        introduction: "Five essential herbs: basil, parsley, chives, thyme, and mint. This guide takes you from seed to first harvest, even on a windowsill.",
        equipment: [
            'Seed tray or modules',
            '5 x Medium pots (15-20cm)',
            'Watering can with fine rose',
            'Labels & marker'
        ],
        ingredients: [
            'Heritage seed packets',
            'Peat-free compost',
            'Grit or perlite (for drainage)'
        ],
        steps: [
            {
                id: 1,
                title: 'Sowing Your Seeds',
                description: 'Fill trays with compost, sow seeds thinly, and cover with a thin layer of compost.',
                tip: 'Basil needs warmth; parsley is slow; mint should ALWAYS be in its own pot.'
            },
            {
                id: 2,
                title: 'Germination (Waiting Phase)',
                description: 'Keep somewhere warm and humid. Germination ranges from 5 days (basil) up to 4 weeks (parsley).',
                tip: 'Move to light as soon as you see shoots to prevent them getting "leggy".'
            },
            {
                id: 3,
                title: 'Potting On',
                description: 'When seedlings have 2 true leaves, transplant them into their individual pots.',
                tip: 'Handle by the leaves, never the stem. A damaged stem is fatal.'
            },
            {
                id: 4,
                title: 'Hardening Off & Harvest',
                description: 'Gradually move outside (if desired). Harvest by pinching tips to encourage bushy growth.',
                tip: 'Never harvest more than a third of the plant at once.'
            }
        ],
        troubleshooting: [
            {
                issue: "Seeds aren't germinating",
                solution: "Usually too cold. Ensure 18-22°C. Be patient with parsley — it's notoriously slow."
            },
            {
                issue: "Basil is turning black",
                solution: "Cold damage or overwatering. Basil hates cold draughts and wet feet."
            }
        ],
        icon: '🌿'
    },
    {
        id: 'candles',
        title: 'Homemade Candles with Local Botanicals',
        category: 'Home & Craft',
        level: 'Beginner',
        duration: '2 Hours',
        season: 'Autumn / Winter',
        outcome: '4–6 Candles',
        introduction: "Soy or beeswax candles with dried botanicals. This guide covers wax selection, fragrance blending, and setting botanicals.",
        equipment: [
            'Double boiler',
            'Thermometer',
            'Pouring jug',
            'Heatproof vessels',
            'Wick centering tool'
        ],
        ingredients: [
            'Soy wax flakes or Beeswax pellets',
            'Pre-tabbed wicks',
            'Essential oils',
            'Dried botanicals (Lavender, Rosemary, etc.)'
        ],
        steps: [
            {
                id: 1,
                title: 'Prep Vessels',
                description: 'Fix wicks to the bottom of your vessels and center them with sticks or tools.',
                tip: 'A drop of hot glue or a wick sticker works best to keep them centered.'
            },
            {
                id: 2,
                title: 'Melt & Fragrance',
                description: 'Melt wax to 75-80°C. Cool to 65-68°C (for soy) before adding fragrance.',
                tip: 'Adding scent while too hot will cause the fragrance to evaporate.'
            },
            {
                id: 3,
                title: 'The Pour',
                description: 'Pour slowly at 55-60°C. Leave to set at room temperature undisturbed.',
                tip: 'Don\'t put them in the fridge to set — they might crack.'
            },
            {
                id: 4,
                title: 'Finish & Botanicals',
                description: 'When surface is tacky (not hard), press in your dried botanicals. Trim wicks to 5mm.',
                tip: 'Trimmed wicks prevent smoking and soot buildup.'
            }
        ],
        troubleshooting: [
            {
                issue: "My candle top is lumpy",
                solution: "Usually cooled too fast. A small 'top-up' pour or heat gun pass helps."
            },
            {
                issue: "No scent when burning",
                solution: "Wax was too hot when adding oils, or you didn't cure them for 48 hours."
            }
        ],
        icon: '🕯️'
    },
    {
        id: 'cleaning',
        title: 'Natural Cleaning Products',
        category: 'Home & Eco',
        level: 'Beginner',
        duration: '1–2 Hours',
        season: 'All Year',
        outcome: 'Full Household Set',
        introduction: "Effective alternatives to chemical cleaners using simple bulk ingredients. Greener, safer, and much cheaper.",
        equipment: [
            'Spray bottles (500ml)',
            'Glass jars',
            'Funnel',
            'Kitchen scales'
        ],
        ingredients: [
            'White Vinegar',
            'Washing Soda',
            'Bicarbonate of Soda',
            'Liquid Castile Soap',
            'Essential Oils (Tea Tree, Lemon, etc.)'
        ],
        steps: [
            {
                id: 1,
                title: 'All-Purpose Spray',
                description: 'Mix 250ml vinegar, 250ml water and 20 drops lemon oil. Shake and spray.',
                tip: 'Avoid use on natural stone like marble — the acid will etch it.'
            },
            {
                id: 2,
                title: 'Soft Scrub Paste',
                description: 'Combine bicarb, castile soap and water into a thick paste. Scrub and rinse.',
                tip: 'Store with lid loose; bicarb can build up pressure.'
            },
            {
                id: 3,
                title: 'Laundry Powder',
                description: 'Mix washing soda, bicarb and soap flakes. Use 2 tablespoons per wash.',
                tip: 'For cold washes, dissolve in hot water beforehand.'
            },
            {
                id: 4,
                title: 'Glass & Window Cleaner',
                description: 'Mix vinegar and water with 2 tsp of cornstarch — the secret to streak-free glass.',
                tip: 'Shake well before each use as cornstarch settles.'
            }
        ],
        troubleshooting: [
            {
                issue: "The scrub is drying out",
                solution: "Add a splash of water and stir. Store in a sealed jar once stable."
            },
            {
                issue: "My glass is streaky",
                solution: "Usually residue from old cleaners. Use less product and a dry microfibre cloth."
            }
        ],
        icon: '🧴'
    }
];

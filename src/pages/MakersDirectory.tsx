import React from 'react';
import { Hammer, Shirt, Footprints, Trees, Spool, Home, Zap, Flame, Sparkles, ShoppingBasket, ExternalLink, Info, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

const MAKER_CATEGORIES = [
    {
        id: 'tools',
        icon: <Hammer className="text-brand-olive" />,
        title: 'Tool Makers (Handmade & Traditional)',
        seoTitle: 'Handmade & Traditional Tool Makers | Heritage Crafts',
        seoMeta: 'Hand-forged tools from independent makers. No stock held.',
        description: 'Hand-forged and hand-finished tools made using traditional skills — built to last and repairable.',
        subAreas: [
            'Blacksmith hand tools (chisels, tongs, hammers)',
            'Woodworking hand tools (planes, mallets, gauges)',
            'Leatherworking tools (awls, punches)',
            'Green woodworking tools (shaving horses, drawknives)',
            'Forged garden tools (trowels, hoes, forks)'
        ],
        primaryLink: 'https://www.etsy.com/uk/search?q=hand+forged+tools',
        secondaryLink: 'https://www.blackcountrymetalworks.co.uk/forged-ironmongery.html'
    },
    {
        id: 'clothing',
        icon: <Shirt className="text-brand-olive" />,
        title: 'Artisan Clothing & Wearables',
        seoTitle: 'Artisan Clothing & Natural Fibre Wearables',
        seoMeta: 'Small-batch clothing made using traditional methods. No stock held.',
        description: 'Clothing made slowly, in small batches, using natural fibres and traditional techniques.',
        subAreas: [
            'Handwoven clothing (linen, wool, hemp)',
            'Naturally dyed garments (plant & mineral dyes)',
            'Handmade knitwear (jumpers, socks, hats)',
            'Tailored heritage workwear (aprons, smocks)',
            'Hand-sewn children’s clothing (small batch)'
        ],
        primaryLink: 'https://communityclothing.co.uk',
        secondaryLink: 'https://www.merchantandmills.com/clothing'
    },
    {
        id: 'footwear',
        icon: <Footprints className="text-brand-olive" />,
        title: 'Footwear & Leather Goods',
        seoTitle: 'Handmade Leather Footwear & Goods',
        seoMeta: 'Traditional boots, shoes, and leather goods made by hand. No stock held.',
        description: 'Handmade leather footwear and goods crafted using traditional cobbler and saddlery skills.',
        subAreas: [
            'Handmade leather shoes & boots',
            'Traditional cobbler repairs & resoling',
            'Hand-stitched belts & straps',
            'Leather bags & satchels',
            'Heritage leather book covers & journals'
        ],
        primaryLink: 'https://www.williamlennon.co.uk',
        secondaryLink: 'https://www.etsy.com/uk/search?q=handmade+leather+bag'
    },
    {
        id: 'woodcraft',
        icon: <Trees className="text-brand-olive" />,
        title: 'Woodcraft & Furniture',
        seoTitle: 'Handmade Woodcraft & Furniture',
        seoMeta: 'Furniture and wooden goods crafted using heritage skills. No stock held.',
        description: 'Furniture and wooden goods made by hand — from green wood to finished heirloom pieces.',
        subAreas: [
            'Handmade furniture (tables, stools, chairs)',
            'Green-wood turned bowls & plates',
            'Carved spoons & kitchenware',
            'Bespoke shelving & storage',
            'Wooden toys & educational tools'
        ],
        primaryLink: 'https://www.robin-wood.co.uk',
        secondaryLink: 'https://www.etsy.com/uk/search?q=handmade+wooden+furniture'
    },
    {
        id: 'textiles',
        icon: <Spool className="text-brand-olive" />,
        title: 'Textiles, Fibres & Haberdashery',
        seoTitle: 'Natural Fibres & Textile Crafts',
        seoMeta: 'Hand-spun yarns, woven cloth, and textile tools. No stock held.',
        description: 'Natural fibres, hand-spun yarns, woven cloth and textile tools for makers and home use.',
        subAreas: [
            'Hand-spun yarns',
            'Hand-woven cloth & fabric',
            'Natural fibre rugs & throws',
            'Quilting & patchwork textiles',
            'Hand-embroidered items'
        ],
        primaryLink: 'https://www.worldofwool.co.uk',
        secondaryLink: 'https://www.merchantandmills.com'
    },
    {
        id: 'outdoor',
        icon: <Home className="text-brand-olive" />,
        title: 'Sheds, Studios & Outdoor Builds',
        seoTitle: 'Handmade Sheds, Studios & Outdoor Builds',
        seoMeta: 'Workspaces and garden structures built for craft. No stock held.',
        description: 'Workspaces built for makers — sheds, studios and small buildings designed for craft and land-based work.',
        subAreas: [
            'Handmade garden sheds',
            'Timber workshops & studios',
            'Shepherd huts & micro cabins',
            'Wooden greenhouses & cold frames',
            'Tool stores & potting sheds'
        ],
        primaryLink: 'https://www.tigersheds.com',
        secondaryLink: 'https://dunsterhouse.co.uk'
    },
    {
        id: 'metalwork',
        icon: <Flame className="text-brand-olive" />,
        title: 'Metalwork & Ironcraft',
        seoTitle: 'Hand-forged Ironwork & Metalcraft',
        seoMeta: 'Decorative and functional ironwork forged using age-old techniques. No stock held.',
        description: 'Decorative and functional ironwork forged in real smithies using age-old techniques.',
        subAreas: [
            'Decorative ironwork (gates, rails)',
            'Hand-forged household items',
            'Fire tools & hearth accessories',
            'Garden metal structures (arches, trellises)',
            'Small sculptural metalwork'
        ],
        primaryLink: 'https://www.blackcountrymetalworks.co.uk',
        secondaryLink: 'https://www.etsy.com/uk/search?q=hand+forged+ironwork'
    },
    {
        id: 'home',
        icon: <Sparkles className="text-brand-olive" />,
        title: 'Home & Living (Craft-Built)',
        seoTitle: 'Handmade Home & Living (Craft-Built)',
        seoMeta: 'Functional beauty for the home, from hand-poured candles to ceramics. No stock held.',
        description: 'Functional beauty for the home, from hand-poured candles to pit-fired ceramics.',
        subAreas: [
            'Handmade candles (wax poured by hand)',
            'Artisan soap makers',
            'Hand-thrown ceramics (mugs, bowls)',
            'Lamps & lighting made by hand',
            'Traditional brushes & brooms'
        ],
        primaryLink: 'https://www.thesoapkitchen.co.uk',
        secondaryLink: 'https://www.etsy.com/uk/search?q=artisan+home+decor'
    },
    {
        id: 'heritage',
        icon: <ShoppingBasket className="text-brand-olive" />,
        title: 'Heritage & Traditional Crafts',
        seoTitle: 'Heritage & Traditional Crafts Directory',
        seoMeta: 'Basketry, chairmaking, and heritage skills from skilled makers. No stock held.',
        description: 'Skills passed down through generations — basketry, chairmaking, ropework and feltmaking.',
        subAreas: [
            'Basket weaving (willow, hazel)',
            'Chair caning & rush seating',
            'Thatching supplies & craft',
            'Rope & cord making',
            'Felt making (wet & needle felt)'
        ],
        primaryLink: 'https://www.musgrovewillows.co.uk',
        secondaryLink: 'https://www.hampsonwoods.com'
    },
    {
        id: 'garden',
        icon: <Zap className="text-brand-olive" />,
        title: 'Garden & Land-Based Makers',
        seoTitle: 'Handmade Garden Structures & Tools',
        seoMeta: 'Raised beds, planters, and traditional garden structures. No stock held.',
        description: 'Handmade structures and tools for gardens, smallholdings and outdoor spaces.',
        subAreas: [
            'Handmade planters & raised beds',
            'Natural fencing & hurdles',
            'Compost bins & wormeries',
            'Wildlife homes (bird boxes, bat boxes)',
            'Traditional garden structures'
        ],
        primaryLink: 'https://www.harrodhorticultural.com',
        secondaryLink: 'https://www.etsy.com/uk/search?q=handmade+garden+structures'
    }
];

export const MakersDirectory: React.FC = () => {
    return (
        <div className="py-24 bg-brand-cream min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Header */}
                <div className="mb-16">
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-brand-olive/10 text-brand-olive text-[10px] font-bold uppercase tracking-widest mb-6 w-fit">
                        <Info size={12} /> Trusted Directory
                    </div>
                    <h1 className="text-5xl md:text-7xl font-serif mb-6">Makers & <span className="italic text-brand-olive">Suppliers</span></h1>
                    <p className="text-xl text-brand-ink/60 max-w-3xl leading-relaxed">
                        Independent makers, traditional craftspeople, and heritage suppliers.
                        No stock held. We link directly to makers and may earn a small commission.
                    </p>
                </div>

                {/* Trust Strip */}
                <div className="bg-white rounded-full py-4 px-8 border border-brand-olive/10 flex flex-wrap justify-center gap-x-8 gap-y-2 mb-16 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-ink/40">
                    <span className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-brand-olive" /> Independent makers</span>
                    <span className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-brand-olive" /> No stock held</span>
                    <span className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-brand-olive" /> Ethical sourcing</span>
                    <span className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-brand-olive" /> Affiliate supported</span>
                </div>

                {/* Directory Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {MAKER_CATEGORIES.map((category, idx) => (
                        <motion.div
                            key={category.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="bg-white rounded-[40px] p-8 md:p-12 border border-brand-olive/5 shadow-sm hover:shadow-xl transition-all group flex flex-col"
                        >
                            {/* SEO metadata hidden for visual but present for web scrapers/SEO */}
                            <div className="sr-only">
                                <h3>{category.seoTitle}</h3>
                                <p>{category.seoMeta}</p>
                            </div>

                            <div className="w-12 h-12 rounded-2xl bg-brand-cream flex items-center justify-center mb-8">
                                {category.icon}
                            </div>

                            <h2 className="text-2xl md:text-3xl font-serif mb-4 group-hover:text-brand-olive transition-colors">
                                {category.title}
                            </h2>

                            <p className="text-brand-ink/60 text-sm leading-relaxed mb-8 flex-grow">
                                {category.description}
                            </p>

                            <div className="space-y-3 mb-12">
                                {category.subAreas.map((area, i) => (
                                    <div key={i} className="flex items-center gap-3 text-xs font-medium text-brand-ink/40">
                                        <div className="w-1 h-1 rounded-full bg-brand-olive/20" />
                                        {area}
                                    </div>
                                ))}
                            </div>

                            <div className="pt-8 border-t border-brand-cream space-y-4 mt-auto">
                                <a
                                    href={category.primaryLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-between w-full p-5 bg-brand-olive text-white rounded-2xl font-bold text-sm hover:bg-brand-olive/90 transition-all shadow-lg shadow-brand-olive/20"
                                >
                                    View trusted makers
                                    <ExternalLink size={16} />
                                </a>
                                <a
                                    href={category.secondaryLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-between w-full p-5 bg-white text-brand-olive border border-brand-olive/10 rounded-2xl font-bold text-sm hover:bg-brand-cream transition-all"
                                >
                                    Buy directly from the maker
                                    <ExternalLink size={16} />
                                </a>
                                <p className="text-[10px] text-center text-brand-ink/30 italic">No stock held. Affiliate supported.</p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Support Section */}
                <section className="mt-32">
                    <div className="bg-brand-olive text-brand-cream rounded-[60px] p-12 md:p-24 text-center relative overflow-hidden shadow-2xl">
                        <h2 className="text-4xl md:text-6xl font-serif mb-8 max-w-2xl mx-auto leading-tight">Support the <span className="italic">Makers</span></h2>
                        <p className="text-xl opacity-80 mb-12 max-w-2xl mx-auto leading-relaxed">
                            Every purchase through this directory supports independent artisans and the continued preservation of heritage crafts.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link to="/support-the-makers" className="px-12 py-5 bg-white text-brand-olive rounded-full font-bold hover:bg-brand-cream transition-all shadow-xl">
                                How it Works
                            </Link>
                            <Link to="/become-a-maker" className="px-8 py-5 border border-white/20 text-white rounded-full font-bold hover:bg-white/10 transition-all text-sm flex items-center gap-2">
                                Apply to be listed <ArrowRight size={16} />
                            </Link>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
};

import React from 'react';
import { motion } from 'motion/react';

/**
 * BlankPage Boilerplate
 * A clean, standard page structure for The Farmers Table Hub.
 * Copy and paste this to start a new feature or content page.
 */
export const BlankPage: React.FC = () => {
    return (
        <div className="py-20 bg-brand-cream min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Header Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16"
                >
                    <h1 className="text-5xl md:text-7xl font-serif mb-6">
                        Blank <span className="italic text-brand-olive">Page</span>
                    </h1>
                    <p className="text-xl text-brand-ink/70 leading-relaxed max-w-2xl mx-auto">
                        This is a clean template for your new community content.
                    </p>
                </motion.div>

                {/* Content Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="bg-white rounded-[40px] p-8 md:p-16 shadow-sm border border-brand-olive/5"
                >
                    <div className="prose prose-brand max-w-none">
                        <h2 className="text-3xl font-serif mb-6">Your Content Here</h2>
                        <p className="text-lg text-brand-ink/70 leading-relaxed">
                            Start by pasting your content here. This container uses the hub's standard
                            curved borders and typography to match the rest of the application.
                        </p>
                    </div>
                </motion.div>

            </div>
        </div>
    );
};

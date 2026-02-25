import React, { ReactNode } from 'react';
import { motion } from 'motion/react';

interface LegalLayoutProps {
    icon: ReactNode;
    title: string;
    italicTitle?: string;
    subtitle: string;
    lastUpdated?: string;
    children: ReactNode;
    footerQuote?: string;
}

export const LegalLayout: React.FC<LegalLayoutProps> = ({
    icon,
    title,
    italicTitle,
    subtitle,
    lastUpdated,
    children,
    footerQuote
}) => {
    return (
        <div className="py-16 md:py-24 bg-brand-cream min-h-screen">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="mb-16"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-olive/10 text-brand-olive text-sm font-bold mb-6">
                        {icon}
                    </div>
                    <h1 className="text-5xl md:text-7xl font-serif mb-6">
                        {title} {italicTitle && <span className="italic text-brand-olive">{italicTitle}</span>}
                    </h1>
                    <p className="text-xl text-brand-ink/70 leading-relaxed max-w-2xl">
                        {subtitle}
                    </p>
                    {lastUpdated && (
                        <p className="text-sm text-brand-ink/40 mt-6">Last updated: {lastUpdated}</p>
                    )}
                </motion.div>

                {/* Content */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="bg-white rounded-[40px] p-8 md:p-12 shadow-sm border border-brand-olive/5 space-y-12"
                >
                    {children}

                    {footerQuote && (
                        <div className="pt-8 border-t border-brand-olive/10">
                            <p className="font-serif text-lg italic text-brand-olive text-center">
                                "{footerQuote}"
                            </p>
                        </div>
                    )}
                </motion.div>

            </div>
        </div>
    );
};

interface LegalSectionProps {
    icon: ReactNode;
    title: string;
    children: ReactNode;
}

export const LegalSection: React.FC<LegalSectionProps> = ({ icon, title, children }) => (
    <section>
        <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-brand-cream rounded-xl">
                <span className="text-brand-olive">{icon}</span>
            </div>
            <h2 className="text-2xl font-serif">{title}</h2>
        </div>
        <div className="space-y-4 text-brand-ink/70 leading-relaxed font-sans">
            {children}
        </div>
    </section>
);

import React from 'react';
import { Gavel, Users, Info, Scale } from 'lucide-react';
import { LegalLayout, LegalSection } from '../components/LegalLayout';

export const Terms: React.FC = () => {
    return (
        <LegalLayout
            icon={<Gavel size={16} />}
            title="Small"
            italicTitle="Print"
            subtitle="Our terms are built on mutual respect and the shared mission of supporting our local community in Farnham."
            lastUpdated="February 25, 2026"
            footerQuote="Fostering community through integrity and shared values."
        >
            <LegalSection icon={<Users size={20} />} title="1. Community & Use">
                <p>The Farmers Table Hub is a community space. By using our platform, you agree to:</p>
                <ul className="list-disc pl-6 space-y-2">
                    <li>Use the platform for lawful purposes only.</li>
                    <li>Respect other community members, makers, and producers.</li>
                    <li>Provide accurate information in any submissions (stories, events, feedback).</li>
                </ul>
            </LegalSection>

            <LegalSection icon={<Info size={20} />} title="2. Directory & Makers">
                <p>For artisans and food producers listed in our directory:</p>
                <ul className="list-disc pl-6 space-y-2">
                    <li>**Authenticity**: You certify that your products are genuine artisan/handmade items or locally produced food. We reserve the right to remove mass-produced reselling listings.</li>
                    <li>**Ownership**: You retain ownership of your stories and images, but grant us permission to feature them on the Hub platform.</li>
                    <li>**Tiers**: Paid directory tiers are non-refundable but can be cancelled at any time to prevent further billing.</li>
                </ul>
            </LegalSection>

            <LegalSection icon={<Scale size={20} />} title="3. Social Enterprise Mission">
                <p>The Farmers Table Hub CIC is a Community Interest Company. Our mission is to reinvest in our community. Any revenue generated through directory fees supports our local radio, inclusive training, and food sustainability efforts.</p>
                <p>We reserve the right to modify these terms as our community grows and evolves. We will always notify you of significant changes.</p>
            </LegalSection>
        </LegalLayout>
    );
};

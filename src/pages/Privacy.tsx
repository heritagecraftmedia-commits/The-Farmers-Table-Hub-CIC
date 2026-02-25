import React from 'react';
import { Shield, Lock, Eye, FileText } from 'lucide-react';
import { LegalLayout, LegalSection } from '../components/LegalLayout';

export const Privacy: React.FC = () => {
    return (
        <LegalLayout
            icon={<Shield size={16} />}
            title="Our"
            italicTitle="Policy"
            subtitle="We value your privacy as much as we value our community. This policy outlines how we handle your data with care and transparency."
            lastUpdated="February 25, 2026"
            footerQuote="Building a community you can trust — offline and online."
        >
            <LegalSection icon={<Eye size={20} />} title="1. What we collect">
                <p>We only collect information that you voluntarily provide to us when you:</p>
                <ul className="list-disc pl-6 space-y-2">
                    <li>Register for a member account or directory listing.</li>
                    <li>Sign up for our newsletter or radio updates.</li>
                    <li>Submit a story, event, or feedback form.</li>
                    <li>Interact with our marketplace or café services.</li>
                </ul>
                <p>This may include your name, business details, email address, social media handles, and location business hints.</p>
            </LegalSection>

            <LegalSection icon={<Lock size={20} />} title="2. How we use your data">
                <p>Your data helps us build a better hub for Farnham. We use it to:</p>
                <ul className="list-disc pl-6 space-y-2">
                    <li>Maintain and improve our Maker and Food Producer directories.</li>
                    <li>Verify the authenticity of local artisans (keeping out mass-resellers).</li>
                    <li>Send you community updates you've opted into.</li>
                    <li>Process payments for directory tiers via Stripe.</li>
                </ul>
            </LegalSection>

            <LegalSection icon={<Shield size={20} />} title="3. Third-party sharing">
                <p>We respect your information. We do **not** sell your data to third parties. We only share data with essential service providers:</p>
                <ul className="list-disc pl-6 space-y-2">
                    <li>**Supabase**: For secure database storage.</li>
                    <li>**Stripe**: For processing payments (we never see your full card details).</li>
                    <li>**Make.com**: For internal automation and discovery processing.</li>
                </ul>
            </LegalSection>

            <LegalSection icon={<FileText size={20} />} title="4. Your rights (GDPR)">
                <p>As a community hub, we fully support your right to control your data. You have the right to:</p>
                <ul className="list-disc pl-6 space-y-2">
                    <li>Access the personal data we hold about you.</li>
                    <li>Request correction of any inaccurate data.</li>
                    <li>Request deletion of your data (the "Right to be Forgotten").</li>
                    <li>Withdraw consent for marketing communications at any time.</li>
                </ul>
                <p>To exercise these rights, please email us at **hello@farmtotablehub.org.uk**.</p>
            </LegalSection>
        </LegalLayout>
    );
};

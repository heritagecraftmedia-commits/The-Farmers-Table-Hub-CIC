import React from 'react';
import { Accessibility as AccessibilityIcon, Keyboard, Eye, MessageSquare } from 'lucide-react';
import { LegalLayout, LegalSection } from '../components/LegalLayout';

export const Accessibility: React.FC = () => {
  return (
    <LegalLayout
      icon={<AccessibilityIcon size={16} />}
      title="Website"
      italicTitle="Accessibility"
      subtitle="We want Farmers Table Hub to be usable, understandable and welcoming to as many people as possible."
      lastUpdated="August 20, 2026"
      footerQuote="A community hub should be accessible to the community it serves."
    >
      <LegalSection icon={<Eye size={20} />} title="1. Our approach">
        <p>We are building the website with accessibility in mind, including clear language, readable layouts, responsive pages and meaningful labels for interactive controls.</p>
        <p>Accessibility is treated as an ongoing part of the build rather than a one-off check.</p>
      </LegalSection>

      <LegalSection icon={<Keyboard size={20} />} title="2. Keyboard and navigation">
        <p>We aim for the main website navigation and interactive controls to remain usable without relying solely on a mouse or touch screen.</p>
        <p>As new features are added, they should be checked for keyboard access, focus visibility and sensible navigation order.</p>
      </LegalSection>

      <LegalSection icon={<MessageSquare size={20} />} title="3. Help us improve it">
        <p>If you encounter a barrier, confusing content or something that does not work with your assistive technology, please tell us.</p>
        <p>We will use accessibility feedback to guide future improvements to the website.</p>
      </LegalSection>

      <LegalSection icon={<AccessibilityIcon size={20} />} title="4. Continuing development">
        <p>The Farmers Table Hub is still being developed. Some areas may not yet meet our intended accessibility standard while features, content and data are being completed.</p>
        <p>We will continue testing the public site as the build progresses, including desktop, mobile and assistive-technology considerations.</p>
      </LegalSection>
    </LegalLayout>
  );
};

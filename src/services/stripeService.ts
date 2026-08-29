// No @stripe/stripe-js import: this project uses Stripe Payment Links, which
// need no SDK, and the package is not a dependency here. The build only
// survived the dangling import because the symbol was unused.

// NOTE: read as VITE_STRIPE_PUBLISHABLE_KEY to match .env.example. This was
// VITE_STRIPE_PUBLIC_KEY, a name nothing ever set, so isConfigured() always
// returned false.
const STRIPE_PUBLIC_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
const PRICE_SUPPORTER = import.meta.env.VITE_STRIPE_PRICE_SUPPORTER;
const PRICE_FEATURED = import.meta.env.VITE_STRIPE_PRICE_FEATURED;

// For this project, we prioritize "Low Energy" setup. 
// We use Stripe Payment Links which can be easily dropped in without a backend session handler.
// The user can create these in their Stripe Dashboard and add them to .env

export const stripeService = {
    /**
     * Redirects the user to the Stripe Checkout page for a specific tier.
     * Since this is a client-only Vite app, we use Stripe Payment Links.
     */
    async redirectToCheckout(tier: 'supporter' | 'featured'): Promise<{ error: string | null }> {
        const code = tier === 'supporter' ? PRICE_SUPPORTER : PRICE_FEATURED;

        // Without this guard an unconfigured deployment sent supporters to
        // https://buy.stripe.com/undefined — a 404 on Stripe's domain, which
        // looks like a failed payment rather than a missing setup.
        if (!code) {
            return {
                error: `Payments are not set up yet. Add VITE_STRIPE_PRICE_${tier.toUpperCase()} to the environment.`,
            };
        }

        window.location.href = `https://buy.stripe.com/${code}`;
        return { error: null };
    },

    /**
     * Checks if Stripe is configured
     */
    isConfigured(): boolean {
        // Payment Links need the price codes; the publishable key alone is not
        // enough to complete a checkout.
        return Boolean(PRICE_SUPPORTER && PRICE_FEATURED);
    },

    /** True when a publishable key is present (kept for display logic). */
    hasPublishableKey(): boolean {
        return !!STRIPE_PUBLIC_KEY && STRIPE_PUBLIC_KEY !== 'pk_test_placeholder';
    }
};

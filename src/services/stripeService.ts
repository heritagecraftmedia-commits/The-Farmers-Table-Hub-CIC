import { loadStripe } from '@stripe/stripe-js';

const STRIPE_PUBLIC_KEY = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
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
    async redirectToCheckout(tier: 'supporter' | 'featured') {
        const paymentLink = tier === 'supporter'
            ? `https://buy.stripe.com/${PRICE_SUPPORTER}`
            : `https://buy.stripe.com/${PRICE_FEATURED}`;

        console.log(`Redirecting to Stripe Payment Link for ${tier}: ${paymentLink}`);

        // In a real production setup with a backend, we would use:
        // const stripe = await loadStripe(STRIPE_PUBLIC_KEY);
        // await stripe?.redirectToCheckout({ sessionId: ... });

        window.location.href = paymentLink;
    },

    /**
     * Checks if Stripe is configured
     */
    isConfigured(): boolean {
        return !!STRIPE_PUBLIC_KEY && STRIPE_PUBLIC_KEY !== 'pk_test_placeholder';
    }
};

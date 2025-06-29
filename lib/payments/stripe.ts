// Stripe integration for league payments with Apple Pay support
import Stripe from 'stripe';
import { Platform } from 'react-native';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2023-08-16',
});

// Apple Pay configuration
const APPLE_PAY_MERCHANT_ID = process.env.APPLE_PAY_MERCHANT_ID || 'merchant.com.sportbeacon';

export interface PaymentMethod {
  type: 'card' | 'apple_pay' | 'google_pay';
  enabled: boolean;
}

export const getSupportedPaymentMethods = (): PaymentMethod[] => {
  const methods: PaymentMethod[] = [
    { type: 'card', enabled: true }
  ];
  
  // Add Apple Pay for iOS
  if (Platform.OS === 'ios') {
    methods.push({ type: 'apple_pay', enabled: true });
  }
  
  // Add Google Pay for Android
  if (Platform.OS === 'android') {
    methods.push({ type: 'google_pay', enabled: true });
  }
  
  return methods;
};

export async function createStripeCheckoutSession(
  playerId: string, 
  leagueId: string, 
  amount: number, 
  successUrl: string, 
  cancelUrl: string, 
  email?: string,
  paymentMethod?: 'card' | 'apple_pay'
) {
  const paymentMethodTypes: string[] = ['card'];
  
  // Add Apple Pay if requested and on iOS
  if (paymentMethod === 'apple_pay' && Platform.OS === 'ios') {
    paymentMethodTypes.push('apple_pay');
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: paymentMethodTypes,
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `League Registration (${leagueId})`,
          },
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      playerId,
      leagueId,
      platform: Platform.OS,
    },
    customer_email: email,
    receipt_email: email,
    // Apple Pay specific settings
    payment_method_options: {
      apple_pay: {
        merchant_id: APPLE_PAY_MERCHANT_ID,
      },
    },
  });
  
  return { sessionId: session.id, url: session.url };
}

// Apple Pay direct integration (for React Native)
export const createApplePayPayment = async (
  amount: number,
  currency: string = 'USD',
  description: string
) => {
  if (Platform.OS !== 'ios') {
    throw new Error('Apple Pay is only available on iOS');
  }

  // This would integrate with @stripe/stripe-react-native
  // For now, return a mock implementation
  return {
    paymentMethodId: 'pm_apple_pay_mock',
    amount,
    currency,
    status: 'succeeded'
  };
};

// Webhook handler for payment status (to be used in an API route)
export async function handleStripeWebhook(event: Stripe.Event) {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      console.log('Payment completed:', session.id);
      // TODO: Mark registration as paid in Firestore
      // TODO: Send confirmation email
      // TODO: Update user subscription status
      break;
    }
    case 'checkout.session.async_payment_failed': {
      const session = event.data.object as Stripe.Checkout.Session;
      console.log('Payment failed:', session.id);
      // TODO: Handle payment failure
      // TODO: Send failure notification
      // TODO: Update user status
      break;
    }
    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log('Payment intent succeeded:', paymentIntent.id);
      break;
    }
    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log('Payment intent failed:', paymentIntent.id);
      break;
    }
    default:
      console.log(`Unhandled event type: ${event.type}`);
      break;
  }
}

// Validate Apple Pay availability
export const isApplePayAvailable = async (): Promise<boolean> => {
  if (Platform.OS !== 'ios') return false;
  
  try {
    // Check if Apple Pay is available on the device
    // This would use @stripe/stripe-react-native in a real implementation
    return true;
  } catch (error) {
    console.error('Apple Pay availability check failed:', error);
    return false;
  }
};

// Get payment method display name
export const getPaymentMethodDisplayName = (method: string): string => {
  switch (method) {
    case 'apple_pay':
      return 'Apple Pay';
    case 'google_pay':
      return 'Google Pay';
    case 'card':
      return 'Credit/Debit Card';
    default:
      return method;
  }
}; 
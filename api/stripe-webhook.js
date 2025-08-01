import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY); // use service key

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  const sig = req.headers['stripe-signature'];
  const buf = await buffer(req); // use raw body

  let event;

  try {
    event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook error', err);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    const customerId = session.customer;
    const email = session.customer_email;

    // Fetch subscription
    const subscription = await stripe.subscriptions.retrieve(session.subscription);

    await supabase
      .from('subscriptions')
      .insert({
        user_email: email,
        stripe_customer_id: customerId,
        subscription_id: subscription.id,
        status: subscription.status,
        current_period_end: subscription.current_period_end,
      });
  }

  res.status(200).json({ received: true });
}

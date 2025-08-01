import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  try {
    const { email } = req.body;

const session = await stripe.checkout.sessions.create({
  customer_email: email, // attach to Stripe customer
  line_items: [{ price: 'price_12345abcde', quantity: 1 }],
  mode: 'subscription',
  success_url: `${req.headers.origin}/download-success.html?session_id={CHECKOUT_SESSION_ID}`,
  cancel_url: `${req.headers.origin}/`,
});


    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Stripe error:', err);
    res.status(500).json({ error: err.message });
  }
}

const express = require('express');
const cors = require('cors');
// 🔴 הדבק כאן את ה-Secret Key שלך מ-Stripe (sk_test_...)
const stripe = require('stripe')('sk_test_51ULTTzAfS4FP0C0IFLBvBxW3JRDb67Le279eAWahv4qB19OprzpEgy832jStTuNIGodoT3nYZno4jc5aIrCxY6IC00Dbg4nLsU');

const app = express();
app.use(cors());
app.use(express.json());

// 1. הקפאת סכום המשימה בנאמנות (Hold) בעת פרסום המשימה
app.post('/api/create-escrow-payment', async (req, res) => {
  const { amount } = req.body;

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // Stripe מחשב באגורות/סנטים
      currency: 'ils',
      capture_method: 'manual', // מחזיק בנאמנות ולא גובה מיידית
    });

    res.json({ clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. שחרור הכסף לג'וניור מתוך המודל
app.post('/api/release-escrow-payment', async (req, res) => {
  const { paymentIntentId } = req.body;

  try {
    const paymentIntent = await stripe.paymentIntents.capture(paymentIntentId);
    res.json({ status: 'success', paymentIntent });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(4000, () => console.log('🚀 Backend running on http://localhost:4000'));
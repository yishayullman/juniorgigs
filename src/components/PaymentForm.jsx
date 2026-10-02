// src/components/PaymentForm.jsx
import React from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

// 🔴 פה מדביקים את המפתח הציבורי! (pk_test_...)
const stripePromise = loadStripe('pk_test_51ULTTzAfS4FP0C0IeuMsF6QSeRcrIxphqYzJwG3fWNGwnIYGwS1hKsMRRt97Z525gYHb6rwjXqWihnchqFcQc4BK007iTMkp9A');

function CheckoutForm({ amount, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    // 1. קריאה לשרת ליצירת בקשת הנאמנות
    const res = await fetch('http://localhost:4000/api/create-escrow-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount }),
    });
    const { clientSecret, paymentIntentId } = await res.json();

    // 2. ביצוע הקפאת הסכום בכרטיס
    const result = await stripe.confirmCardPayment(clientSecret, {
      payment_method: { card: elements.getElement(CardElement) },
    });

    if (result.error) {
      alert("שגיאה: " + result.error.message);
    } else {
      alert("🔒 הסכום הוקפא בנאמנות בהצלחה!");
      onSuccess(paymentIntentId); // שומרים את ה-ID מול המשימה
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-slate-900 rounded-2xl text-white space-y-4">
      <CardElement options={{ style: { base: { color: '#ffffff' } } }} />
      <button type="submit" disabled={!stripe} className="w-full bg-emerald-500 text-black py-2 rounded-xl font-bold">
        הפקד ₪{amount} בנאמנות
      </button>
    </form>
  );
}

export default function PaymentForm({ amount, onSuccess }) {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm amount={amount} onSuccess={onSuccess} />
    </Elements>
  );
}
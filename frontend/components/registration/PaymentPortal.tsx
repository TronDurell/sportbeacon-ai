import React, { useState } from 'react';
import { Button } from 'shadcn/ui/button';

const PaymentPortal: React.FC<{ playerId?: string; leagueId?: string; amount?: number }> = ({ playerId = 'demo', leagueId = 'demo', amount = 50 }) => {
  const [paid, setPaid] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');

  const handlePay = async () => {
    setLoading(true);
    setError(null);
    if (!email) {
      setError('Email is required for receipt.');
      setLoading(false);
      return;
    }
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId,
          leagueId,
          amount,
          email,
          successUrl: window.location.origin + '/payment-success',
          cancelUrl: window.location.href,
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || 'Payment failed');
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full" role="region" aria-label="Payment portal" tabIndex={0}>
      <div className="p-4 max-w-md mx-auto">
        <h2 className="text-xl font-bold mb-4">Payment Portal</h2>
        <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl shadow-lg">
          <p className="mb-2">League Fee: ${amount}</p>
          <input
            type="email"
            className="w-full mb-2 p-2 rounded border border-gray-300 dark:border-gray-700"
            placeholder="Email for receipt"
            value={email}
            onChange={e => setEmail(e.target.value)}
            aria-label="Email for receipt"
            required
          />
          {paid ? (
            <div className="text-green-600 font-semibold">Payment complete! Receipt sent to your email.</div>
          ) : (
            <Button className="w-full" onClick={handlePay} disabled={loading}>{loading ? 'Processing...' : 'Pay with Stripe'}</Button>
          )}
          {error && <div className="text-red-600 mt-2">{error}</div>}
        </div>
      </div>
    </div>
  );
};

export default PaymentPortal; 
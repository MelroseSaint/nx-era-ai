"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useSession } from "@/components/SessionContextProvider";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, Coins, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { toast } from "sonner";
import { startCheckout } from "@/integrations/stripe/client";
import { PRICE_PRO, PRICE_DEV, PRICE_ENTERPRISE, PRICE_CREDITS_100, PRICE_CREDITS_500, PRICE_CREDITS_1000 } from "@/integrations/stripe/prices";

const Credits: React.FC = () => {
  const { user } = useSession();
  const navigate = useNavigate();
  const [credits, setCredits] = React.useState<number>(0);
  const [transactions, setTransactions] = React.useState<{ id?: string; type: "earn"|"spend"|"purchase"; amount: number; note?: string; timestamp: number }[]>([]);

  const LOW_THRESHOLD = 20;

  React.useEffect(() => {
    const run = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', user.id)
        .single();
      if (!error && data && typeof data.credits === 'number') {
        setCredits(data.credits);
      }

      const { data: txns } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      if (txns) {
        setTransactions(txns.map(t => ({ id: t.id, type: t.type, amount: t.amount, note: t.note, timestamp: Date.parse(t.created_at) })));
      }
    };
    run();
  }, [user]);

  const addTxn = (type: "earn"|"spend"|"purchase", amount: number, note?: string) => {
    setTransactions(prev => [{ type, amount, note, timestamp: Date.now() }, ...prev]);
  };

  const persistChange = async (delta: number, type: "earn"|"spend"|"purchase", note: string) => {
    if (!user) return;
    const newVal = Math.max(0, credits + delta);
    setCredits(newVal);
    addTxn(type, Math.abs(delta), note);
    // Update profile credits
    const { error: updateErr } = await supabase
      .from('profiles')
      .update({ credits: newVal })
      .eq('id', user.id);
    // Insert a transaction record
    const { error: insertErr } = await supabase
      .from('credit_transactions')
      .insert({ user_id: user.id, type, amount: Math.abs(delta), note });
    if (updateErr) {
      console.warn('Failed to update credits:', updateErr.message);
      toast.error('Failed to persist credit balance');
    }
    if (insertErr) {
      console.warn('Failed to log transaction:', insertErr.message);
      toast.error('Failed to log credit transaction');
    }
    if (!updateErr && !insertErr) {
      const verb = type === 'earn' ? 'Earned' : type === 'spend' ? 'Spent' : 'Purchased';
      toast.success(`${verb} ${Math.abs(delta)} credits`);
    }
  };

  const earn = () => persistChange(+10, "earn", "Daily reward");
  const spend = () => {
    if (credits <= 0) return;
    persistChange(-5, "spend", "Action usage");
  };
  const purchasePack = async (packCredits: number) => {
    const priceMap: Record<number, string> = {
      100: PRICE_CREDITS_100,
      500: PRICE_CREDITS_500,
      1000: PRICE_CREDITS_1000,
    };
    const priceId = priceMap[packCredits];
    if (!priceId || priceId.startsWith('price_mock')) {
      toast.error('Stripe prices are not configured.');
      return;
    }
    await startCheckout(priceId, 'payment', { userId: user!.id, credits: String(packCredits) }, user?.email ?? undefined);
  };
  const upgradeToPro = () => {
    if (!PRICE_PRO || PRICE_PRO.startsWith('price_mock')) {
      toast.error('Pro subscription price is not configured.');
      return;
    }
    startCheckout(PRICE_PRO, 'subscription', { userId: user!.id, plan: 'Pro' }, user?.email ?? undefined);
  };

  const upgradeToDev = () => {
    if (!PRICE_DEV || PRICE_DEV.startsWith('price_mock')) {
      toast.error('Dev subscription price is not configured.');
      return;
    }
    startCheckout(PRICE_DEV, 'subscription', { userId: user!.id, plan: 'Dev' }, user?.email ?? undefined);
  };

  const upgradeToEnterprise = () => {
    if (!PRICE_ENTERPRISE || PRICE_ENTERPRISE.startsWith('price_mock')) {
      toast.error('Enterprise subscription price is not configured.');
      return;
    }
    startCheckout(PRICE_ENTERPRISE, 'subscription', { userId: user!.id, plan: 'Enterprise' }, user?.email ?? undefined);
  };

  if (!user) {
    return (
      <div className="container mx-auto py-6 px-4">
        <Card className="max-w-xl mx-auto bg-card text-card-foreground">
          <CardHeader>
            <CardTitle>Sign in to manage credits</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Credits are available only to registered users.</p>
            <div className="mt-3 flex gap-3">
              <Button className="bg-primary hover:bg-primary/80 text-primary-foreground" onClick={() => navigate('/login')}>Sign in</Button>
              <Button className="bg-muted hover:bg-accent" onClick={() => navigate('/login')}>Create account</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4">
      {( ([PRICE_PRO, PRICE_DEV].some(p => !p || String(p).startsWith('price_mock'))) ) && (
        <div className="mb-4 p-3 rounded-md border border-red-300 bg-red-100 text-red-800">
          Stripe plan prices are not configured. Set `VITE_STRIPE_PRICE_PRO` and `VITE_STRIPE_PRICE_DEV`.
        </div>
      )}
      <div className="mb-4">
        <h1 className="text-2xl font-semibold" style={{
          background: "linear-gradient(90deg, #8B5CF6, #22D3EE)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}>Credits</h1>
        <p className="text-muted-foreground">Manage balance, view transactions, and get more credits.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Balance card */}
        <Card className="md:col-span-2 bg-card text-card-foreground">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Current Balance</CardTitle>
            <Coins className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="text-4xl font-bold">{credits}</div>
              {credits <= LOW_THRESHOLD && (
                <div className="inline-flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  <span className="text-sm">Low balance</span>
                </div>
              )}
            </div>
            <div className="mt-4 flex gap-3">
              <Button className="btn-magenta hover:opacity-90 active:opacity-80" onClick={earn}>Earn +10</Button>
              <Button className="bg-primary hover:bg-primary/80 text-primary-foreground" onClick={spend}>
                Spend -5
              </Button>
              <div className="flex flex-wrap gap-2">
                <Button className="bg-secondary hover:bg-accent text-foreground" onClick={() => purchasePack(100)}>Buy 100</Button>
                <Button className="bg-secondary hover:bg-accent text-foreground" onClick={() => purchasePack(500)}>Buy 500</Button>
                <Button className="bg-secondary hover:bg-accent text-foreground" onClick={() => purchasePack(1000)}>Buy 1000</Button>
              </div>
              <Button className="bg-primary hover:bg-primary/80 text-primary-foreground" onClick={upgradeToPro}>Upgrade to Pro</Button>
              <Button className="bg-secondary hover:bg-accent text-foreground" onClick={upgradeToDev}>Upgrade to Dev</Button>
              <Button className="bg-muted hover:bg-accent text-foreground" onClick={upgradeToEnterprise}>Upgrade to Enterprise</Button>
            </div>
          </CardContent>
        </Card>

        {/* User info */}
        <Card className="bg-card text-card-foreground">
          <CardHeader>
            <CardTitle>User</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Signed in as</div>
              <div className="font-medium">{user?.email ?? "Guest"}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions */}
      <Card className="mt-6 bg-card text-card-foreground">
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-muted-foreground">No transactions yet. Try earning, spending, or purchasing credits.</p>
          ) : (
            <ul className="divide-y divide-border">
              {transactions.map((t, idx) => (
                <li key={idx} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    {t.type === "earn" && <ArrowUpCircle className="h-4 w-4 text-primary" />}
                    {t.type === "spend" && <ArrowDownCircle className="h-4 w-4 text-destructive" />}
                    {t.type === "purchase" && <Coins className="h-4 w-4 text-secondary" />}
                    <span className="capitalize">{t.type}</span>
                    <span className="text-muted-foreground">{t.note}</span>
                  </div>
                  <div className="font-medium">{t.amount > 0 ? "+" : ""}{t.amount}</div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Credits;

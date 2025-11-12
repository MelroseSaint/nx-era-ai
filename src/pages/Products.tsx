"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Product = {
  id: string;
  title: string;
  image: string | null;
  description: string | null;
  price: number; // price in USDT or USD equivalent
  status: string;
  payment_url?: string | null; // optional external payment link (e.g., Cryptomus)
};

export default function Products() {
  const navigate = useNavigate();
  const [products, setProducts] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from("products")
        .select("id,title,image,description,price,status,payment_url")
        .in("status", ["active", "available"])
        .order("price", { ascending: true });
      if (error) throw error;
      setProducts((data as Product[]) || []);
    } catch (e: any) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchProducts();
  }, []);

  const handleBuy = (p: Product) => {
    if (p.payment_url) {
      window.open(p.payment_url, "_blank", "noopener,noreferrer");
      return;
    }
    toast.info("Payment link not configured. Contact support.");
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-100 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-5xl mx-auto mt-8">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">Products</CardTitle>
          <CardDescription className="text-center">Purchase credits and features dynamically loaded from Supabase.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center">Loading products...</p>
          ) : error ? (
            <div className="text-center">
              <p className="text-red-600 dark:text-red-400">Failed to load products: {error}</p>
              <Button variant="outline" onClick={fetchProducts} className="mt-2">Retry</Button>
            </div>
          ) : products.length === 0 ? (
            <p className="text-center text-gray-600 dark:text-gray-300">No products available at the moment.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((p) => (
                <Card key={p.id} className="overflow-hidden">
                  {p.image && (
                    <img src={p.image} alt={p.title} className="w-full h-40 object-cover" loading="lazy" height="160" />
                  )}
                  <CardContent className="space-y-2 pt-4">
                    <h3 className="text-lg font-semibold">{p.title}</h3>
                    {p.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3">{p.description}</p>
                    )}
                    <div className="flex items-center justify-between pt-2">
                      <span className="font-bold">{p.price} USDT</span>
                      <Button className="laser-button" onClick={() => handleBuy(p)}>Buy</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="mt-6">
            <Button variant="outline" className="w-full" onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

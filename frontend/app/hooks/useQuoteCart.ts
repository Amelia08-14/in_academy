"use client";

import { useEffect, useState } from "react";
import { quoteCart, type QuoteCartItem } from "@/lib/quoteCart";

export function useQuoteCart() {
  const [items, setItems] = useState<QuoteCartItem[]>([]);

  useEffect(() => {
    const sync = () => setItems(quoteCart.list());
    sync();
    window.addEventListener(quoteCart.event, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(quoteCart.event, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return {
    items,
    count: items.length,
    add: quoteCart.add,
    remove: quoteCart.remove,
    setParticipants: quoteCart.setParticipants,
    clear: quoteCart.clear,
    has: (id: string) => items.some((i) => i.formationId === id),
  };
}

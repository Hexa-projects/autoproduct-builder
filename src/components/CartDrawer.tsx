import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ShoppingCart, Minus, Plus, Trash2, Loader2, Banknote, ShieldCheck, Truck, RotateCcw, ArrowRight } from "lucide-react";
import { useCartStore } from "@/stores/cartStore";
import { trackInitiateCheckout } from "@/lib/tracking";
import { CODCheckoutModal } from "@/components/CODCheckoutModal";
import { ScrollReveal } from "@/components/ScrollReveal";
import { useShopifyProducts } from "@/hooks/useShopify";

export function CartDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const { items, isLoading, isSyncing, updateQuantity, removeItem, syncCart } = useCartStore();
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + (parseFloat(item.price.amount) * item.quantity), 0);
  const currency = items[0]?.price.currencyCode || 'EUR';
  const { data: allProducts } = useShopifyProducts();

  useEffect(() => { if (isOpen) syncCart(); }, [isOpen, syncCart]);

  const handleCheckout = () => {
    trackInitiateCheckout({ value: totalPrice, currency, numItems: totalItems });
    setIsOpen(false);
    setShowCheckout(true);
  };

  // Cross-sell: products not in cart
  const cartHandles = new Set(items.map(i => i.product.node.handle));
  const crossSellProducts = (allProducts || []).filter(p => !cartHandles.has(p.node.handle)).slice(0, 2);

  // Free shipping threshold
  const freeShippingThreshold = 0; // Always free for COD
  const shippingMessage = '✓ Envío gratis incluido';

  return (
    <>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="relative">
            <ShoppingCart className="h-5 w-5" />
            {totalItems > 0 && (
              <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-accent text-accent-foreground">
                {totalItems}
              </Badge>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent className="w-full sm:max-w-lg flex flex-col h-full">
          <SheetHeader className="flex-shrink-0">
            <SheetTitle>Tu carrito</SheetTitle>
            <SheetDescription>
              {totalItems === 0 ? 'Tu carrito está vacío' : `${totalItems} artículo${totalItems !== 1 ? 's' : ''}`}
            </SheetDescription>
          </SheetHeader>
          <div className="flex flex-col flex-1 pt-4 min-h-0">
            {items.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">Tu carrito está vacío</p>
                  <Button asChild variant="outline" size="sm" onClick={() => setIsOpen(false)}>
                    <Link to="/colecciones">Ver productos</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto pr-2 min-h-0">
                  <div className="space-y-3">
                    {items.map((item) => (
                      <div key={item.variantId} className="flex gap-3 p-2 rounded-lg border">
                        <div className="w-16 h-16 bg-muted rounded-md overflow-hidden flex-shrink-0">
                          {item.product.node.images?.edges?.[0]?.node && (
                            <img src={item.product.node.images.edges[0].node.url} alt={item.product.node.title} className="w-full h-full object-cover" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-xs truncate sm:text-sm">{item.product.node.title}</h4>
                          <p className="text-[10px] text-muted-foreground">{item.selectedOptions.map(o => o.value).join(' · ')}</p>
                          <p className="font-semibold text-sm tabular-nums mt-0.5">€{parseFloat(item.price.amount).toFixed(2)}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeItem(item.variantId)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                          <div className="flex items-center gap-1">
                            <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.variantId, item.quantity - 1)}>
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-6 text-center text-xs tabular-nums">{item.quantity}</span>
                            <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.variantId, item.quantity + 1)}>
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Cross-sell */}
                  {crossSellProducts.length > 0 && (
                    <div className="mt-4 pt-3 border-t">
                      <p className="text-xs font-semibold mb-2">Completa tu pedido</p>
                      <div className="space-y-2">
                        {crossSellProducts.map((p) => {
                          const img = p.node.images.edges[0]?.node;
                          const price = parseFloat(p.node.priceRange.minVariantPrice.amount);
                          return (
                            <Link
                              key={p.node.id}
                              to={`/products/${p.node.handle}`}
                              onClick={() => setIsOpen(false)}
                              className="flex items-center gap-2.5 rounded-lg border bg-muted/20 p-2 hover:bg-muted/40 transition-colors"
                            >
                              <div className="h-10 w-10 rounded-md overflow-hidden bg-muted shrink-0">
                                {img && <img src={img.url} alt="" className="h-full w-full object-cover" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[11px] font-medium line-clamp-1">{p.node.title}</p>
                                <p className="text-[10px] font-semibold text-accent">€{price.toFixed(2)}</p>
                              </div>
                              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex-shrink-0 space-y-3 pt-4 border-t">
                  {/* Shipping info */}
                  <div className="text-center text-[11px] font-medium text-accent">{shippingMessage}</div>

                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Total</span>
                    <span className="text-xl font-bold tabular-nums">€{totalPrice.toFixed(2)}</span>
                  </div>
                  <Button
                    onClick={handleCheckout}
                    className="w-full gap-2 min-h-[48px] bg-accent text-accent-foreground hover:bg-accent/90"
                    size="lg"
                    disabled={items.length === 0 || isLoading || isSyncing}
                  >
                    {isLoading || isSyncing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <><Banknote className="w-4 h-4" /> Pedir y pagar al recibir</>
                    )}
                  </Button>
                  <div className="flex items-center justify-center gap-4 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> Sin pago ahora</span>
                    <span className="flex items-center gap-1"><Truck className="h-3 w-3" /> 2–5 días</span>
                    <span className="flex items-center gap-1"><RotateCcw className="h-3 w-3" /> 30 días</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
      <CODCheckoutModal open={showCheckout} onOpenChange={setShowCheckout} />
    </>
  );
}

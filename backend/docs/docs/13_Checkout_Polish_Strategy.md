# Tilet3D Cart & Checkout Polish Strategy

## 1. The Missing Pieces: Dynamic Shipping & Tax

Right now, your backend explicitly hardcodes shipping and tax to zero in `apps/orders/services/checkout.py`:
```python
shipping_fee = Decimal("0.00")
tax = Decimal("0.00")
```
Similarly, the frontend `CheckoutModal.tsx` just displays the sum of the items without accounting for delivery fees or VAT. For a production e-commerce platform operating in Ethiopia, these need to be dynamic based on user input.

---

## 2. Recommended Business Logic (Ethiopian Context)

Based on standard e-commerce practices in Ethiopia (like Deliver Addis, Tikus, and local courier networks), here is a robust structure you can implement:

### A. Tax (VAT)
*   **Standard Rate:** 15% VAT is standard for commercial goods in Ethiopia.
*   **Implementation:** `tax = subtotal * Decimal("0.15")`

### B. Regional Shipping Tiers
Since your primary operational base appears to be around **Adama, Oromia**, you should structure your shipping zones relative to that distance:

*   **Zone 1 (Local / Adama):** Flat rate of ~150 ETB.
*   **Zone 2 (Addis Ababa / Sheger City):** Flat rate of ~250 - 300 ETB (via daily buses/couriers).
*   **Zone 3 (Other Regional Capitals - Hawassa, Bahir Dar, Dire Dawa):** ~500 - 600 ETB (via EMS / EthioPost).
*   **Zone 4 (International):** Flagged for manual review, or high flat rate (e.g., 3000+ ETB via DHL).

---

## 3. Backend Action Plan (`checkout.py`)

You need to extract the shipping logic into a helper method inside your `CheckoutService`.

### Update `checkout.py`
```python
class CheckoutService:
    @staticmethod
    def calculate_shipping(region: str, city: str) -> Decimal:
        region = region.lower().strip()
        city = city.lower().strip()
        
        if city == "adama":
            return Decimal("150.00")
        elif city in ["addis ababa", "finfinne", "sheger"]:
            return Decimal("300.00")
        elif region in ["oromia", "amhara", "sidama", "dire dawa"]:
            # Standard regional courier
            return Decimal("500.00")
        else:
            # Default fallback for other areas
            return Decimal("700.00")

    @staticmethod
    @transaction.atomic
    def checkout(user, checkout_data, provider="chapa"):
        # ... (keep existing cart validation and inventory reservation) ...

        # Calculate dynamic fees
        shipping_fee = CheckoutService.calculate_shipping(
            region=checkout_data.get("region", ""),
            city=checkout_data.get("city", "")
        )
        tax = subtotal * Decimal("0.15") # 15% VAT
        discount = Decimal("0.00") # Setup promo codes later

        total = subtotal + shipping_fee + tax - discount

        # ... (keep existing order creation logic) ...
```

---

## 4. Frontend Action Plan (`CheckoutModal.tsx`)

Your UI currently shows a single `Total Due`. You need to break this down into a receipt-style summary so the user isn't surprised by the jump in price when redirected to Chapa.

### 1. Create Local State for Derived Costs
Instead of just displaying `cartTotal()`, calculate the estimations directly in the component based on the `formData.city` and `formData.region`.

```tsx
// Inside CheckoutModal.tsx
const subtotal = cartTotal();
const tax = subtotal * 0.15;

// Simple frontend mirror of the backend logic
const getShippingFee = (region: string, city: string) => {
    const c = city.toLowerCase().trim();
    if (c === 'adama') return 150;
    if (c === 'addis ababa') return 300;
    return 500; // default
};

const shipping = getShippingFee(formData.region, formData.city);
const grandTotal = subtotal + tax + shipping;
```

### 2. Update the Footer UI
Replace the current generic "Total Due" with a detailed breakdown right above the Pay button:

```tsx
{/* Replace the current summary section with this */}
<div className="pt-4 border-t border-stone-100 bg-white sticky bottom-0 space-y-3">
    <div className="flex justify-between text-xs text-stone-500">
        <span>Subtotal</span>
        <span>ETB {subtotal.toLocaleString()}</span>
    </div>
    <div className="flex justify-between text-xs text-stone-500">
        <span>Tax (15% VAT)</span>
        <span>ETB {tax.toLocaleString()}</span>
    </div>
    <div className="flex justify-between text-xs text-stone-500">
        <span>Shipping ({formData.city})</span>
        <span>ETB {shipping.toLocaleString()}</span>
    </div>
    <div className="flex items-center justify-between pt-2 mt-2 border-t border-dashed border-stone-200">
        <p className="text-[11px] uppercase tracking-wider text-stone-400">Total Due</p>
        <p className="font-serif text-2xl font-bold text-stone-900">
            ETB {grandTotal.toLocaleString()}
        </p>
    </div>

    <motion.button 
        /* existing Chapa button code */
    />
</div>
```

## 5. Security & Edge Case Polish
1. **Inventory Race Conditions:** Your backend is correctly using `.select_for_update()` in `inventory.py`. This is excellent for preventing double-selling limited Habesha kemis pieces.
2. **Abandoned Carts / Failed Payments:** Because you immediately deduct `reserved_stock`, you *must* ensure your `expire_orders.py` cron job runs frequently (e.g., every 30 mins) to call `InventoryService.release()` for unpaid Chapa transactions, otherwise your stock will be locked permanently!

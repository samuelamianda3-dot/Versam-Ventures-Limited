import React, { useState } from 'react';
import { MenuItem, Restaurant, OrderItem, PromoOffer } from '../types';
import { 
  Plus, 
  Minus, 
  ShoppingBag, 
  Clock, 
  Flame, 
  MapPin, 
  Star, 
  Check, 
  ArrowRight, 
  ShieldCheck, 
  UtensilsCrossed, 
  Copy, 
  Phone, 
  Tag, 
  Sparkles,
  Smartphone,
  Banknote,
  Headphones
} from 'lucide-react';
import { PRESET_DESTINATIONS, SUPPORT_CONTACTS } from '../data/mockData';
import { playOrderNotificationSound } from '../utils/audio';

interface StorefrontViewProps {
  restaurants: Restaurant[];
  menuItems: MenuItem[];
  cart: OrderItem[];
  offers?: PromoOffer[];
  onAddToCart: (item: MenuItem) => void;
  onUpdateCartQty: (itemId: string, delta: number) => void;
  onCheckout: (
    destinationIndex: number, 
    customInstructions: string,
    paymentMethod: 'mpesa' | 'cash_on_delivery',
    mpesaPhone: string,
    mpesaTransactionCode: string,
    appliedPromo?: string
  ) => void;
  onSwitchToTracking: () => void;
  onOpenSupport?: () => void;
  hasActiveOrder: boolean;
}

export const StorefrontView: React.FC<StorefrontViewProps> = ({
  restaurants,
  menuItems,
  cart,
  offers = [],
  onAddToCart,
  onUpdateCartQty,
  onCheckout,
  onSwitchToTracking,
  onOpenSupport,
  hasActiveOrder,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string>(restaurants[0].id);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedDestinationIdx, setSelectedDestinationIdx] = useState(0);
  const [instructions, setInstructions] = useState(PRESET_DESTINATIONS[0].instructions);

  // Payment method state
  const [paymentMethod, setPaymentMethod] = useState<'mpesa' | 'cash_on_delivery'>('mpesa');
  const [mpesaPhone, setMpesaPhone] = useState('0743926800');
  const [mpesaCode, setMpesaCode] = useState('');
  const [isSimulatingStk, setIsSimulatingStk] = useState(false);
  const [stkSuccess, setStkSuccess] = useState(false);
  const [copiedMpesa, setCopiedMpesa] = useState(false);

  // Promo code state
  const [couponInput, setCouponInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<PromoOffer | null>(null);
  const [promoError, setPromoError] = useState('');

  const categories = ['All', 'Burgers', 'Pizzas', 'Bowls', 'Sides', 'Drinks'];

  const filteredItems = menuItems.filter((item) => {
    const matchCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchRestaurant = selectedRestaurantId === 'all' || item.restaurantId === selectedRestaurantId;
    return matchCategory && matchRestaurant;
  });

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const deliveryFee = 150; // KSh 150 standard delivery
  const tax = Math.round(cartTotal * 0.08); // 8% tax in KSh

  // Calculate discount if promo applied
  let discountAmount = 0;
  if (appliedPromo && cartTotal >= appliedPromo.minOrderAmount) {
    if (appliedPromo.discountPercent > 0) {
      discountAmount = Math.round((cartTotal * appliedPromo.discountPercent) / 100);
    } else if (appliedPromo.code === 'FREEDROP') {
      discountAmount = deliveryFee;
    }
  }

  const orderGrandTotal = Math.max(0, cartTotal + deliveryFee + tax - discountAmount);

  const handleApplyPromo = (codeToApply?: string) => {
    const code = (codeToApply || couponInput).trim().toUpperCase();
    setPromoError('');
    const matched = offers.find((o) => o.code === code && o.active);
    if (!matched) {
      setPromoError('Invalid or expired coupon code.');
      setAppliedPromo(null);
      return;
    }
    if (cartTotal < matched.minOrderAmount) {
      setPromoError(`Requires minimum cart of KSh ${matched.minOrderAmount.toLocaleString()}`);
      return;
    }
    setAppliedPromo(matched);
    setCouponInput(code);
  };

  const handleCopyMpesa = () => {
    navigator.clipboard.writeText(SUPPORT_CONTACTS.mpesaPayNumber);
    setCopiedMpesa(true);
    setTimeout(() => setCopiedMpesa(false), 2000);
  };

  const handleSimulateStkPush = () => {
    if (!mpesaPhone.trim()) return;
    setIsSimulatingStk(true);
    setStkSuccess(false);

    setTimeout(() => {
      setIsSimulatingStk(false);
      setStkSuccess(true);
      const generatedCode = `QK${Math.floor(10 + Math.random() * 89)}XP${Math.floor(1000 + Math.random() * 9000)}`;
      setMpesaCode(generatedCode);
      playOrderNotificationSound('click');
    }, 2200);
  };

  const handleConfirmOrder = () => {
    setIsCheckoutOpen(false);
    onCheckout(
      selectedDestinationIdx, 
      instructions,
      paymentMethod,
      mpesaPhone,
      mpesaCode || (paymentMethod === 'mpesa' ? 'QK87XP4921' : ''),
      appliedPromo?.code
    );
  };

  const activeOfferBanner = offers.find((o) => o.active);

  return (
    <div className="space-y-6">
      {/* Active Promotion Bar */}
      {activeOfferBanner && (
        <div className="bg-emerald-950/60 border border-emerald-500/40 rounded-2xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-bold text-emerald-300 uppercase tracking-wider text-[11px]">
              {activeOfferBanner.bannerTag}:
            </span>
            <span className="text-neutral-200">{activeOfferBanner.title}</span>
            <span className="text-neutral-500 hidden sm:inline">·</span>
            <span className="text-neutral-400 hidden sm:inline">{activeOfferBanner.description}</span>
          </div>

          <button
            onClick={() => {
              handleApplyPromo(activeOfferBanner.code);
              setIsCheckoutOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs transition-colors shrink-0 shadow-sm"
          >
            <span>Use Code: {activeOfferBanner.code}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Hero Showcase Banner */}
      <div className="relative rounded-3xl overflow-hidden border border-neutral-800 bg-neutral-900 shadow-2xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
          {/* Left Text Zone */}
          <div className="lg:col-span-7 p-8 sm:p-10 flex flex-col justify-between z-10">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
                <UtensilsCrossed className="w-4 h-4" />
                <span>Versam Ventures Express Courier</span>
                <span className="text-neutral-500">·</span>
                <span className="text-neutral-300">Nairobi Live Delivery</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-neutral-100 leading-[1.1] text-balance">
                Fresh gourmet meals, dispatched hot to your doorstep.
              </h1>

              <p className="text-sm sm:text-base text-neutral-400 max-w-xl leading-relaxed">
                Order gourmet dry-aged burgers, Neapolitan woodfired pizzas, and fresh poke. Pay seamlessly via M-Pesa to <strong>0743926800</strong> or Cash on Delivery, and follow your bike courier with verified receipts.
              </p>
            </div>

            {/* Support hotline & features */}
            <div className="pt-6 mt-6 border-t border-neutral-800 flex flex-wrap items-center justify-between gap-4 text-xs text-neutral-300">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  <span>Avg. 14-min delivery</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>M-Pesa Verified</span>
                </div>
              </div>

              {onOpenSupport && (
                <button
                  onClick={onOpenSupport}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 font-medium transition-colors"
                >
                  <Headphones className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Support: 0743926800 / 0795509505</span>
                </button>
              )}
            </div>
          </div>

          {/* Right Hero Image */}
          <div className="lg:col-span-5 relative min-h-[260px] lg:min-h-full">
            <img
              src="/src/assets/images/hero_delivery_culinary_1792736549071.jpg"
              alt="Artisan culinary spread"
              className="w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-neutral-900 via-transparent to-transparent opacity-90 lg:opacity-100" />
          </div>
        </div>
      </div>

      {/* Restaurant Selector & Category Bar */}
      <div className="space-y-4">
        {/* Restaurant selector tabs */}
        <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedRestaurantId('all')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors shrink-0 ${
              selectedRestaurantId === 'all'
                ? 'bg-neutral-100 text-neutral-950 shadow-md font-bold'
                : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
            }`}
          >
            All Kitchens
          </button>
          {restaurants.map((rest) => (
            <button
              key={rest.id}
              onClick={() => setSelectedRestaurantId(rest.id)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors shrink-0 flex items-center gap-2 ${
                selectedRestaurantId === rest.id
                  ? 'bg-emerald-500 text-neutral-950 font-bold shadow-lg shadow-emerald-500/20'
                  : 'bg-neutral-900 text-neutral-300 hover:text-white border border-neutral-800'
              }`}
            >
              <span>{rest.name}</span>
              <span className="text-[10px] opacity-80 font-mono">★ {rest.rating}</span>
            </button>
          ))}
        </div>

        {/* Category Filter Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 text-xs">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-lg whitespace-nowrap transition-colors shrink-0 ${
                selectedCategory === cat
                  ? 'bg-neutral-800 text-neutral-100 font-semibold border border-neutral-700'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((dish) => {
          const cartItem = cart.find((i) => i.id === dish.id);
          const inCartQty = cartItem?.quantity || 0;
          const isAvailable = dish.inStock !== false;

          return (
            <div
              key={dish.id}
              className={`bg-neutral-900/90 border border-neutral-800 rounded-2xl overflow-hidden hover:border-neutral-700 transition-all flex flex-col group shadow-lg ${
                !isAvailable ? 'opacity-60' : ''
              }`}
            >
              {/* Dish Photo */}
              <div className="relative aspect-[4/3] overflow-hidden bg-neutral-950">
                <img
                  src={dish.image}
                  alt={dish.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                  <span className="text-xs px-2 py-0.5 rounded-md bg-neutral-950/80 backdrop-blur-md text-neutral-300 font-mono border border-neutral-800">
                    {dish.prepTime}
                  </span>
                  {!isAvailable ? (
                    <span className="text-[11px] px-2 py-0.5 rounded-md bg-red-500/80 text-white font-bold uppercase tracking-wider">
                      Sold Out
                    </span>
                  ) : dish.isPopular ? (
                    <span className="text-[11px] px-2 py-0.5 rounded-md bg-emerald-500 text-neutral-950 font-bold uppercase tracking-wider">
                      Popular
                    </span>
                  ) : null}
                </div>
              </div>

              {/* Content */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-base text-neutral-100 group-hover:text-emerald-400 transition-colors">
                        {dish.name}
                      </h3>
                      {dish.sku && (
                        <span className="inline-block mt-0.5 text-[10px] font-mono text-emerald-400 bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800 font-bold">
                          {dish.sku}
                        </span>
                      )}
                    </div>
                    <span className="text-base font-bold font-mono text-emerald-400 shrink-0 tabular-nums">
                      KSh {dish.price.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 mt-2 line-clamp-2 leading-relaxed">
                    {dish.description}
                  </p>
                </div>

                {/* Tags and Add to Cart action */}
                <div className="pt-3 border-t border-neutral-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[11px] text-neutral-500">
                    {dish.tags.slice(0, 2).map((tag) => (
                      <span key={tag}>#{tag}</span>
                    ))}
                  </div>

                  {!isAvailable ? (
                    <span className="text-xs text-neutral-500 italic">Currently Unavailable</span>
                  ) : inCartQty > 0 ? (
                    <div className="flex items-center gap-2 bg-neutral-950 border border-neutral-800 rounded-xl px-2 py-1">
                      <button
                        onClick={() => onUpdateCartQty(dish.id, -1)}
                        className="p-1 text-neutral-400 hover:text-white transition-colors"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-xs font-bold font-mono text-emerald-400 px-1">
                        {inCartQty}
                      </span>
                      <button
                        onClick={() => onUpdateCartQty(dish.id, 1)}
                        className="p-1 text-neutral-400 hover:text-white transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => onAddToCart(dish)}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-neutral-800 hover:bg-emerald-500 hover:text-neutral-950 text-neutral-200 text-xs font-semibold transition-all shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Bottom Cart Bar if items in cart */}
      {cartItemCount > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[900] w-full max-w-lg px-4 pointer-events-auto">
          <div className="bg-neutral-900/95 backdrop-blur-xl border border-emerald-500/40 rounded-2xl p-4 shadow-2xl shadow-black/80 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 text-neutral-950 flex items-center justify-center font-bold font-mono shadow-md">
                {cartItemCount}
              </div>
              <div>
                <p className="text-xs text-neutral-400">Total in Kenyan Shillings</p>
                <p className="text-base font-bold font-mono text-neutral-100 tabular-nums">
                  KSh {cartTotal.toLocaleString()}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsCheckoutOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs shadow-lg shadow-emerald-500/25 transition-all active:scale-95"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Checkout & Dispatch</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Checkout Modal with M-Pesa & Cash on Delivery */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-[1200] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl text-neutral-100 space-y-5 animate-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2.5">
                <ShoppingBag className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="font-bold text-lg leading-tight">Versam Ventures Checkout</h3>
                  <p className="text-xs text-neutral-400">Select payment & delivery point</p>
                </div>
              </div>
              <button
                onClick={() => setIsCheckoutOpen(false)}
                className="text-neutral-400 hover:text-white text-xs px-2.5 py-1 rounded-lg bg-neutral-800"
              >
                Close
              </button>
            </div>

            {/* Destination Selection */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider block">
                1. Delivery Location in Nairobi
              </label>
              <div className="space-y-2">
                {PRESET_DESTINATIONS.map((dest, idx) => (
                  <div
                    key={dest.label}
                    onClick={() => {
                      setSelectedDestinationIdx(idx);
                      setInstructions(dest.instructions);
                    }}
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-start gap-3 ${
                      selectedDestinationIdx === idx
                        ? 'bg-emerald-500/10 border-emerald-500 text-neutral-100 ring-1 ring-emerald-500/50'
                        : 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700 text-neutral-300'
                    }`}
                  >
                    <MapPin className={`w-4 h-4 mt-0.5 shrink-0 ${selectedDestinationIdx === idx ? 'text-emerald-400' : 'text-neutral-500'}`} />
                    <div className="flex-1">
                      <p className="font-semibold">{dest.label}</p>
                      <p className="text-[11px] text-neutral-400 mt-0.5">{dest.instructions}</p>
                    </div>
                    {selectedDestinationIdx === idx && (
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2.5 pt-2 border-t border-neutral-800">
              <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider block">
                2. Choose Payment Option
              </label>

              <div className="grid grid-cols-2 gap-3">
                {/* M-Pesa Option */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('mpesa')}
                  className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                    paymentMethod === 'mpesa'
                      ? 'bg-emerald-500/15 border-emerald-500 ring-1 ring-emerald-500/50 shadow-md'
                      : 'bg-neutral-950/70 border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500 text-neutral-950 flex items-center justify-center font-bold font-mono text-sm">
                      M
                    </div>
                    {paymentMethod === 'mpesa' && <Check className="w-4 h-4 text-emerald-400" />}
                  </div>
                  <div className="mt-2.5">
                    <p className="font-bold text-xs text-neutral-100">Lipa na M-PESA</p>
                    <p className="text-[11px] text-emerald-400 font-mono mt-0.5 font-semibold">
                      To: 0743926800
                    </p>
                  </div>
                </button>

                {/* Cash on Delivery Option */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash_on_delivery')}
                  className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                    paymentMethod === 'cash_on_delivery'
                      ? 'bg-emerald-500/15 border-emerald-500 ring-1 ring-emerald-500/50 shadow-md'
                      : 'bg-neutral-950/70 border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="w-8 h-8 rounded-xl bg-neutral-800 text-neutral-200 flex items-center justify-center font-bold text-sm">
                      <Banknote className="w-4 h-4 text-emerald-400" />
                    </div>
                    {paymentMethod === 'cash_on_delivery' && <Check className="w-4 h-4 text-emerald-400" />}
                  </div>
                  <div className="mt-2.5">
                    <p className="font-bold text-xs text-neutral-100">Cash on Delivery</p>
                    <p className="text-[11px] text-neutral-400 mt-0.5">Pay rider in KSh</p>
                  </div>
                </button>
              </div>

              {/* M-Pesa Interactive Box */}
              {paymentMethod === 'mpesa' && (
                <div className="p-4 rounded-2xl bg-neutral-950 border border-emerald-500/30 space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-neutral-200">
                      M-Pesa Merchant Recipient
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyMpesa}
                      className="flex items-center gap-1 text-[11px] text-emerald-400 hover:underline"
                    >
                      {copiedMpesa ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedMpesa ? 'Copied 0743926800' : 'Copy Number'}</span>
                    </button>
                  </div>

                  <div className="bg-neutral-900/90 rounded-xl p-3 border border-neutral-800 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold font-mono text-emerald-400">
                        {SUPPORT_CONTACTS.mpesaPayNumber}
                      </p>
                      <p className="text-[11px] text-neutral-400">
                        Name: {SUPPORT_CONTACTS.mpesaPayName}
                      </p>
                    </div>
                    <span className="text-xs px-2 py-1 rounded bg-emerald-500/20 text-emerald-300 font-mono font-semibold">
                      KSh {orderGrandTotal.toLocaleString()}
                    </span>
                  </div>

                  {/* STK Push Simulator / Manual Code */}
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Your M-Pesa Phone (e.g. 0743926800)"
                        value={mpesaPhone}
                        onChange={(e) => setMpesaPhone(e.target.value)}
                        className="flex-1 bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-neutral-100 font-mono focus:outline-none focus:border-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={handleSimulateStkPush}
                        disabled={isSimulatingStk}
                        className="px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs transition-colors shrink-0 disabled:opacity-50"
                      >
                        {isSimulatingStk ? 'Sending Prompt...' : 'Send STK Prompt'}
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Or enter M-Pesa Code (e.g. QK87XP4921)"
                        value={mpesaCode}
                        onChange={(e) => setMpesaCode(e.target.value.toUpperCase())}
                        className="flex-1 bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-neutral-100 uppercase font-mono tracking-wider focus:outline-none focus:border-emerald-500"
                      />
                      {stkSuccess && (
                        <span className="text-xs text-emerald-400 font-medium flex items-center gap-1 shrink-0">
                          <Check className="w-3.5 h-3.5" /> STK Received
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Cash On Delivery Instructions */}
              {paymentMethod === 'cash_on_delivery' && (
                <div className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800 text-xs space-y-1.5 animate-in fade-in duration-200">
                  <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
                    <Banknote className="w-4 h-4" />
                    <span>Cash on Delivery (KSh)</span>
                  </div>
                  <p className="text-neutral-400 text-[11px] leading-relaxed">
                    Please prepare exact cash of <strong>KSh {orderGrandTotal.toLocaleString()}</strong> upon courier arrival. Our bike rider carries change for up to KSh 2,000.
                  </p>
                </div>
              )}
            </div>

            {/* Promo Code Coupon Box */}
            <div className="space-y-2 pt-2 border-t border-neutral-800">
              <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider block">
                3. Coupon / Promo Code
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="e.g. VERSAM15"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  className="flex-1 bg-neutral-950 border border-neutral-700 rounded-xl px-3.5 py-2 text-xs text-neutral-100 uppercase font-mono tracking-wider focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => handleApplyPromo()}
                  className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-200 transition-colors"
                >
                  Apply Code
                </button>
              </div>

              {appliedPromo && (
                <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-between text-xs text-emerald-300">
                  <span>✓ {appliedPromo.code} applied (-KSh {discountAmount.toLocaleString()})</span>
                  <button onClick={() => setAppliedPromo(null)} className="text-neutral-400 hover:text-white">
                    Remove
                  </button>
                </div>
              )}

              {promoError && (
                <p className="text-[11px] text-red-400">{promoError}</p>
              )}
            </div>

            {/* Price Breakdown in KSh */}
            <div className="bg-neutral-950/80 rounded-2xl p-4 border border-neutral-800 text-xs space-y-2 font-mono">
              <div className="flex justify-between text-neutral-400">
                <span>Items Subtotal</span>
                <span>KSh {cartTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Versam Bike Courier Delivery</span>
                <span>KSh {deliveryFee.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Tax & Packaging</span>
                <span>KSh {tax.toLocaleString()}</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-400 font-semibold">
                  <span>Promo Discount ({appliedPromo?.code})</span>
                  <span>-KSh {discountAmount.toLocaleString()}</span>
                </div>
              )}

              <div className="pt-2 border-t border-neutral-800 flex justify-between font-bold text-neutral-100 text-base">
                <span>Total Due</span>
                <span className="text-emerald-400">KSh {orderGrandTotal.toLocaleString()}</span>
              </div>
            </div>

            {/* Submit Order Button */}
            <button
              onClick={handleConfirmOrder}
              className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-sm shadow-xl shadow-emerald-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Place Order for Admin Approval (KSh {orderGrandTotal.toLocaleString()})</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

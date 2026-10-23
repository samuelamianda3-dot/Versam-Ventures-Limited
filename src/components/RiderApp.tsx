import React, { useState } from 'react';
import { Order, Courier, OrderStatus } from '../types';
import { SUPPORT_CONTACTS } from '../data/mockData';
import { CourierBikeIcon } from './CourierBikeIcon';
import { 
  Bike, 
  MapPin, 
  Navigation, 
  Phone, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  DollarSign, 
  Compass, 
  ShieldCheck, 
  Store, 
  User, 
  Receipt, 
  ArrowRight,
  TrendingUp,
  BatteryCharging,
  Eye,
  MessageSquare,
  Sparkles
} from 'lucide-react';

interface RiderAppProps {
  orders: Order[];
  couriers: Courier[];
  activeRiderId: string;
  onSelectRider: (riderId: string) => void;
  onStartDeliveryRun: (orderId: string) => void;
  onCompleteDelivery: (orderId: string) => void;
  onViewReceipt: (photoUrl: string, amount: number) => void;
  isSimulating: boolean;
  onToggleSimulate: () => void;
  onStepRun: () => void;
}

export const RiderApp: React.FC<RiderAppProps> = ({
  orders,
  couriers,
  activeRiderId,
  onSelectRider,
  onStartDeliveryRun,
  onCompleteDelivery,
  onViewReceipt,
  isSimulating,
  onToggleSimulate,
  onStepRun,
}) => {
  const [activeTab, setActiveTab] = useState<'active_runs' | 'shift_stats'>('active_runs');
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const currentRider = couriers.find((c) => c.id === activeRiderId) || couriers[0];

  // Orders assigned to this rider (as primary courier OR secondary backup courier)
  const riderOrders = orders.filter(
    (o) =>
      o.courier?.id === currentRider.id ||
      o.backupCourier?.id === currentRider.id ||
      (o.status !== 'pending_admin_approval' && !o.courier && o.status !== 'cancelled')
  );

  const activeAssignedOrder = 
    riderOrders.find((o) => o.id === selectedOrderId) ||
    riderOrders.find((o) => o.status === 'in_transit' || o.status === 'arriving') ||
    riderOrders.find((o) => o.status === 'order_finished') ||
    riderOrders.find((o) => o.status === 'kitchen_preparing' || o.status === 'admin_approved') ||
    riderOrders[0];

  // Calculate rider earnings in KSh
  const deliveredOrders = orders.filter((o) => o.courier?.id === currentRider.id && o.status === 'delivered');
  const todayEarningsKsh = deliveredOrders.length * 150 + 450; // Base wage + per delivery

  return (
    <div className="space-y-6">
      {/* Top Rider HUD Header */}
      <div className="bg-neutral-900/90 backdrop-blur-md border border-neutral-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={currentRider.photoUrl}
                alt={currentRider.name}
                className="w-14 h-14 rounded-full object-cover border-2 border-emerald-500 shadow-md shadow-emerald-500/20"
              />
              <span 
                className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-neutral-900 ${
                  isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-neutral-500'
                }`}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white tracking-tight">{currentRider.name}</h1>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-semibold border border-emerald-500/30">
                  {currentRider.vehicle}
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Plate: <span className="font-mono text-neutral-300 font-semibold">{currentRider.vehiclePlate}</span> • Rating: ★ {currentRider.rating} • Completed: {currentRider.completedDeliveries} runs
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Rider Selector */}
            <div className="flex items-center bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1.5">
              <span className="text-xs text-neutral-400 mr-2">Switch Rider:</span>
              <select
                value={activeRiderId}
                onChange={(e) => onSelectRider(e.target.value)}
                className="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer"
              >
                {couriers.map((c) => (
                  <option key={c.id} value={c.id} className="bg-neutral-900 text-white">
                    {c.name} ({c.vehicle})
                  </option>
                ))}
              </select>
            </div>

            {/* Shift Online/Break Toggle */}
            <button
              onClick={() => setIsOnline(!isOnline)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                isOnline
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                  : 'bg-neutral-800 text-neutral-400 border-neutral-700 hover:text-white'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400 animate-ping' : 'bg-neutral-500'}`} />
              {isOnline ? 'Shift: Active Online' : 'Shift: On Break'}
            </button>

            {/* Versam Dispatch Hotline */}
            <a
              href={`tel:${SUPPORT_CONTACTS.primary}`}
              className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold flex items-center gap-1.5 border border-neutral-700 transition"
              title="Call Versam Dispatch Desk"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              <span>HQ: {SUPPORT_CONTACTS.primary}</span>
            </a>
          </div>
        </div>

        {/* Quick Shift Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-neutral-800/80">
          <div className="bg-neutral-950/60 p-3 rounded-xl border border-neutral-800/60">
            <span className="text-[11px] text-neutral-400 block">Today's Payout</span>
            <span className="text-lg font-bold text-emerald-400 font-mono">
              KSh {todayEarningsKsh.toLocaleString()}
            </span>
          </div>
          <div className="bg-neutral-950/60 p-3 rounded-xl border border-neutral-800/60">
            <span className="text-[11px] text-neutral-400 block">Assigned Orders</span>
            <span className="text-lg font-bold text-white font-mono">
              {riderOrders.filter((o) => o.status !== 'delivered' && o.status !== 'cancelled').length} active
            </span>
          </div>
          <div className="bg-neutral-950/60 p-3 rounded-xl border border-neutral-800/60">
            <span className="text-[11px] text-neutral-400 block">Current Telemetry</span>
            <span className="text-lg font-bold text-neutral-200 font-mono">
              {currentRider.speedKmh} km/h • {currentRider.heading}°
            </span>
          </div>
          <div className="bg-neutral-950/60 p-3 rounded-xl border border-neutral-800/60 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-neutral-400 block">Battery / Range</span>
              <span className="text-lg font-bold text-emerald-400 font-mono">88% (42km)</span>
            </div>
            <BatteryCharging className="w-5 h-5 text-emerald-400/80" />
          </div>
        </div>
      </div>

      {/* Main Rider View */}
      {riderOrders.length === 0 ? (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-10 text-center">
          <div className="w-16 h-16 rounded-2xl bg-neutral-800 flex items-center justify-center mx-auto mb-4 text-emerald-400">
            <CourierBikeIcon size={36} bagColor="#10b981" />
          </div>
          <h2 className="text-lg font-bold text-white mb-1">No Orders Assigned To You Yet</h2>
          <p className="text-sm text-neutral-400 max-w-md mx-auto mb-4">
            When a customer places an order and Versam Admin assigns it to {currentRider.name}, it will appear here immediately with pickup and delivery directions.
          </p>
          <p className="text-xs text-neutral-500 font-mono">
            Support contact: {SUPPORT_CONTACTS.primary} or {SUPPORT_CONTACTS.secondary}
          </p>
        </div>
      ) : activeAssignedOrder ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Order details & Action Pipeline (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Order Selector pills if multiple orders */}
            {riderOrders.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {riderOrders.map((ord) => (
                  <button
                    key={ord.id}
                    onClick={() => setSelectedOrderId(ord.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap border transition ${
                      activeAssignedOrder.id === ord.id
                        ? 'bg-emerald-500 text-neutral-950 border-emerald-400'
                        : 'bg-neutral-900 text-neutral-300 border-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    Order {ord.displayNumber} ({ord.status.replace(/_/g, ' ')})
                  </button>
                ))}
              </div>
            )}

            {/* Active Delivery Card */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-lg">
              <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <CourierBikeIcon size={24} bagColor="#10b981" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-white">Order {activeAssignedOrder.displayNumber}</span>
                      <span className={`text-[11px] px-2 py-0.5 rounded-md font-semibold uppercase ${
                        activeAssignedOrder.status === 'delivered'
                          ? 'bg-neutral-800 text-neutral-300'
                          : activeAssignedOrder.status === 'in_transit' || activeAssignedOrder.status === 'arriving'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : activeAssignedOrder.status === 'order_finished'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                      }`}>
                        {activeAssignedOrder.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <span className="text-xs text-neutral-400 font-mono">
                      Total: KSh {activeAssignedOrder.totalPrice.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Payment Tag */}
                <div className="text-right">
                  {activeAssignedOrder.paymentMethod === 'mpesa' ? (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/80 text-emerald-400 text-xs font-semibold border border-emerald-800/80">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>M-Pesa Verified</span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-950/80 text-amber-300 text-xs font-semibold border border-amber-800/80">
                      <DollarSign className="w-3.5 h-3.5" />
                      <span>Collect Cash KSh {activeAssignedOrder.totalPrice.toLocaleString()}</span>
                    </div>
                  )}
                  {activeAssignedOrder.mpesaDetails && (
                    <p className="text-[10px] text-neutral-500 font-mono mt-1">
                      Code: {activeAssignedOrder.mpesaDetails.transactionCode}
                    </p>
                  )}
                </div>
              </div>

              {/* Bulk Order Dual Courier Notice */}
              {activeAssignedOrder.backupCourier && (
                <div className="mt-3 p-3 rounded-xl bg-purple-950/40 border border-purple-500/40 text-xs text-purple-300 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded-md bg-purple-500/20 text-purple-400 font-bold font-mono text-[10px]">
                      DUAL COURIER
                    </span>
                    <span>
                      {activeAssignedOrder.courier?.id === currentRider.id ? (
                        <>You are <strong>Lead Courier</strong>. Backup Courier: <strong>{activeAssignedOrder.backupCourier.name}</strong> ({activeAssignedOrder.backupCourier.vehiclePlate})</>
                      ) : (
                        <>You are <strong>Backup Courier</strong> supporting Lead Courier: <strong>{activeAssignedOrder.courier?.name}</strong> ({activeAssignedOrder.courier?.vehiclePlate})</>
                      )}
                    </span>
                  </div>
                  <a
                    href={`tel:${activeAssignedOrder.courier?.id === currentRider.id ? activeAssignedOrder.backupCourier.phone : activeAssignedOrder.courier?.phone}`}
                    className="text-[11px] font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1 cursor-pointer"
                  >
                    <Phone className="w-3 h-3" /> Call Partner
                  </a>
                </div>
              )}

              {/* Waypoint Route Cards (Store Pickup -> Customer Drop-off) */}
              <div className="py-4 space-y-3">
                {/* Store Pickup */}
                <div className="p-3.5 rounded-xl bg-neutral-950/80 border border-neutral-800/80 flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-neutral-900 text-emerald-400 mt-0.5">
                    <Store className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
                        1. Store Pickup
                      </span>
                      <a 
                        href={`tel:${activeAssignedOrder.restaurant.phone}`}
                        className="text-xs text-neutral-400 hover:text-white flex items-center gap-1 transition"
                      >
                        <Phone className="w-3 h-3 text-emerald-400" />
                        <span>{activeAssignedOrder.restaurant.phone}</span>
                      </a>
                    </div>
                    <p className="text-sm font-semibold text-white mt-0.5">{activeAssignedOrder.restaurant.name}</p>
                    <p className="text-xs text-neutral-400">{activeAssignedOrder.restaurant.address}</p>
                  </div>
                </div>

                {/* Customer Drop-off */}
                <div className="p-3.5 rounded-xl bg-neutral-950/80 border border-neutral-800/80 flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-neutral-900 text-sky-400 mt-0.5">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-sky-400 uppercase tracking-wider">
                        2. Customer Delivery
                      </span>
                      <a 
                        href={`tel:${activeAssignedOrder.customerPhone}`}
                        className="text-xs text-neutral-400 hover:text-white flex items-center gap-1 transition"
                      >
                        <Phone className="w-3 h-3 text-sky-400" />
                        <span>{activeAssignedOrder.customerPhone}</span>
                      </a>
                    </div>
                    <p className="text-sm font-semibold text-white mt-0.5">{activeAssignedOrder.customerName}</p>
                    <p className="text-xs text-neutral-300 font-medium">{activeAssignedOrder.deliveryAddress}</p>
                    {activeAssignedOrder.deliveryInstructions && (
                      <p className="text-[11px] text-amber-300/90 mt-1 italic">
                        Note: "{activeAssignedOrder.deliveryInstructions}"
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Items & Receipt Verification Badge */}
              <div className="p-3.5 rounded-xl bg-neutral-950/50 border border-neutral-800 text-xs space-y-2">
                <div className="flex items-center justify-between font-semibold text-neutral-300">
                  <span>Package Contents ({activeAssignedOrder.items.length} items):</span>
                  {activeAssignedOrder.receiptVerification ? (
                    <button
                      onClick={() => onViewReceipt(
                        activeAssignedOrder.receiptVerification!.photoUrl,
                        activeAssignedOrder.receiptVerification!.verifiedAmount
                      )}
                      className="text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Receipt className="w-3.5 h-3.5" />
                      <span>View Verified Receipt Slip (KSh {activeAssignedOrder.receiptVerification.verifiedAmount.toLocaleString()})</span>
                    </button>
                  ) : (
                    <span className="text-amber-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Receipt check pending at store</span>
                    </span>
                  )}
                </div>
                <div className="divide-y divide-neutral-900">
                  {activeAssignedOrder.items.map((item) => (
                    <div key={item.id} className="py-1 flex items-center justify-between text-neutral-400">
                      <span>{item.quantity}x {item.name}</span>
                      <span className="font-mono text-neutral-300">KSh {(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons for Current Stage */}
              <div className="mt-5 pt-4 border-t border-neutral-800 space-y-3">
                {activeAssignedOrder.status === 'kitchen_preparing' || activeAssignedOrder.status === 'admin_approved' ? (
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Clock className="w-5 h-5 text-amber-400 animate-spin" />
                      <div>
                        <p className="text-xs font-semibold text-amber-300">Waiting for Store to Finish Packing</p>
                        <p className="text-[11px] text-neutral-400">The kitchen is preparing items and will stamp the receipt slip.</p>
                      </div>
                    </div>
                    <a
                      href={`tel:${activeAssignedOrder.restaurant.phone}`}
                      className="px-3 py-1.5 rounded-lg bg-neutral-900 text-xs font-semibold text-neutral-200 border border-neutral-700 hover:text-white"
                    >
                      Call Store
                    </a>
                  </div>
                ) : activeAssignedOrder.status === 'order_finished' ? (
                  <div className="space-y-2">
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex items-center gap-2.5">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                      <div className="text-xs">
                        <span className="font-semibold text-emerald-300">Store Dispatched & Receipt Stamped!</span>
                        <p className="text-neutral-400">Items are sealed in thermal bag. You can now collect and depart.</p>
                      </div>
                    </div>
                    <button
                      onClick={() => onStartDeliveryRun(activeAssignedOrder.id)}
                      className="w-full py-3.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-sm flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-500/20 cursor-pointer"
                    >
                      <Navigation className="w-4 h-4" />
                      <span>Confirm Package Pickup & Start Live Delivery Run</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                ) : activeAssignedOrder.status === 'in_transit' || activeAssignedOrder.status === 'arriving' ? (
                  <div className="space-y-3">
                    <div className="bg-emerald-950/60 border border-emerald-800/80 rounded-xl p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
                        <div>
                          <p className="text-xs font-bold text-emerald-300">
                            {activeAssignedOrder.status === 'arriving' ? 'Approaching Customer Destination' : 'En Route to Delivery Address'}
                          </p>
                          <p className="text-[11px] text-neutral-400 font-mono">
                            ETA: {activeAssignedOrder.etaMinutes} min • Remaining: {activeAssignedOrder.distanceRemainingKm.toFixed(1)} km
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={onStepRun}
                          className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold border border-neutral-700 cursor-pointer"
                          title="Simulate 1 GPS step forward"
                        >
                          Step +1
                        </button>
                        <button
                          onClick={onToggleSimulate}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                            isSimulating
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                          }`}
                        >
                          {isSimulating ? 'GPS: Running' : 'GPS: Paused'}
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={() => onCompleteDelivery(activeAssignedOrder.id)}
                      className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-neutral-950 font-bold text-sm flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-500/20 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>
                        {activeAssignedOrder.paymentMethod === 'cash_on_delivery'
                          ? `Collect KSh ${activeAssignedOrder.totalPrice.toLocaleString()} Cash & Confirm Handover`
                          : 'Confirm Handover & Complete Delivery'}
                      </span>
                    </button>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-center">
                    <p className="text-xs text-neutral-400 flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>This delivery was completed and settled. Great job!</span>
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Turn-by-Turn GPS Navigation Card & Telemetry (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-lg">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
                <Navigation className="w-4 h-4 text-emerald-400" />
                <span>Rider GPS Telemetry & Guidance</span>
              </h3>

              {/* Real-time HUD dials */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-center">
                  <span className="text-[10px] text-neutral-500 uppercase tracking-wider block">Speed</span>
                  <span className="text-2xl font-bold font-mono text-emerald-400">
                    {currentRider.speedKmh} <span className="text-xs font-normal text-neutral-400">km/h</span>
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-center">
                  <span className="text-[10px] text-neutral-500 uppercase tracking-wider block">Compass Heading</span>
                  <span className="text-2xl font-bold font-mono text-white flex items-center justify-center gap-1">
                    <Compass className="w-5 h-5 text-emerald-400" />
                    <span>{currentRider.heading}°</span>
                  </span>
                </div>
              </div>

              {/* Progress along route */}
              <div className="space-y-1.5 mb-4">
                <div className="flex justify-between text-xs text-neutral-400">
                  <span>Route Completion</span>
                  <span className="font-mono text-emerald-400">
                    {Math.round(
                      (activeAssignedOrder.currentRouteIndex / Math.max(1, activeAssignedOrder.routeCoords.length - 1)) * 100
                    )}%
                  </span>
                </div>
                <div className="h-2 w-full bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(
                        100,
                        (activeAssignedOrder.currentRouteIndex / Math.max(1, activeAssignedOrder.routeCoords.length - 1)) * 100
                      )}%`,
                    }}
                  />
                </div>
              </div>

              {/* Quick Communication Box */}
              <div className="space-y-2 pt-2 border-t border-neutral-800">
                <span className="text-xs font-semibold text-neutral-400 block">Quick Contact Actions</span>
                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={`tel:${activeAssignedOrder.customerPhone}`}
                    className="p-2.5 rounded-xl bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-xs font-semibold text-neutral-200 flex items-center justify-center gap-1.5 transition"
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Call Customer</span>
                  </a>
                  <a
                    href={`https://wa.me/254${activeAssignedOrder.customerPhone.replace(/^0/, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-xl bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-xs font-semibold text-neutral-200 flex items-center justify-center gap-1.5 transition"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                    <span>WhatsApp</span>
                  </a>
                  <a
                    href={`tel:${SUPPORT_CONTACTS.primary}`}
                    className="p-2.5 rounded-xl bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-xs font-semibold text-neutral-200 flex items-center justify-center gap-1.5 transition col-span-2"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Versam Support Desk (0743926800 / 0795509505)</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

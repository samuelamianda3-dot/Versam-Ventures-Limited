import React, { useState } from 'react';
import { Order, OrderStatus } from '../types';
import { 
  CheckCircle2, 
  Clock, 
  ChefHat, 
  Bike, 
  Home, 
  Phone, 
  MessageSquare, 
  MapPin, 
  ShieldCheck, 
  Play, 
  Pause, 
  FastForward, 
  RotateCcw,
  Sparkles,
  Camera,
  Banknote,
  Smartphone,
  Eye,
  Headphones,
  Package,
  AlertTriangle
} from 'lucide-react';
import { CourierBikeIcon } from './CourierBikeIcon';
import { SUPPORT_CONTACTS } from '../data/mockData';

interface OrderTrackerProps {
  order: Order;
  isSimulating: boolean;
  simulationSpeed: number;
  onToggleSimulation: () => void;
  onChangeSpeed: (speed: number) => void;
  onStepForward: () => void;
  onResetOrder: () => void;
  onAdvanceToStatus: (status: OrderStatus) => void;
  onOpenSupport?: () => void;
}

export const OrderTracker: React.FC<OrderTrackerProps> = ({
  order,
  isSimulating,
  simulationSpeed,
  onToggleSimulation,
  onChangeSpeed,
  onStepForward,
  onResetOrder,
  onAdvanceToStatus,
  onOpenSupport,
}) => {
  const [showReceiptPhoto, setShowReceiptPhoto] = useState(false);

  const steps: { key: OrderStatus; label: string; icon: React.ReactNode; desc: string }[] = [
    {
      key: 'pending_admin_approval',
      label: 'Admin Clearance',
      icon: <Clock className="w-4 h-4" />,
      desc: 'Awaiting HQ approval',
    },
    {
      key: 'admin_approved',
      label: 'Admin Approved',
      icon: <ShieldCheck className="w-4 h-4" />,
      desc: 'Rider assigned, store notified',
    },
    {
      key: 'kitchen_preparing',
      label: 'Store Packing',
      icon: <ChefHat className="w-4 h-4" />,
      desc: 'Picking & cooking items',
    },
    {
      key: 'order_finished',
      label: 'Receipt Stamped',
      icon: <CheckCircle2 className="w-4 h-4" />,
      desc: 'Dispatched to courier',
    },
    {
      key: 'in_transit',
      label: 'Rider En Route',
      icon: <Bike className="w-4 h-4" />,
      desc: 'Live GPS delivery run',
    },
    {
      key: 'delivered',
      label: 'Delivered',
      icon: <Home className="w-4 h-4" />,
      desc: 'Handed over at door',
    },
  ];

  const getStepStatus = (stepKey: OrderStatus) => {
    const orderOfSteps: OrderStatus[] = [
      'pending_admin_approval',
      'admin_approved',
      'kitchen_preparing',
      'order_finished',
      'in_transit',
      'arriving',
      'delivered',
    ];
    const currentIndex = orderOfSteps.indexOf(order.status === 'arriving' ? 'in_transit' : order.status);
    const stepIndex = orderOfSteps.indexOf(stepKey);

    if (order.status === 'delivered') return 'completed';
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'active';
    return 'pending';
  };

  const progressPercent = Math.min(
    100,
    Math.round(
      (order.currentRouteIndex / Math.max(1, order.routeCoords.length - 1)) * 100
    )
  );

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-xl space-y-6">
      {/* Top Banner Status */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
              Customer Live Tracker
            </span>
            <span className="text-neutral-500 font-mono text-xs">{order.displayNumber}</span>
          </div>
          <h2 className="text-xl font-bold text-neutral-100 mt-0.5">
            {order.status === 'pending_admin_approval' && 'Order Placed — Awaiting Admin Approval'}
            {order.status === 'admin_approved' && 'Approved by Versam HQ! Sent to Store'}
            {order.status === 'kitchen_preparing' && 'Store / Kitchen is Preparing & Packing'}
            {order.status === 'order_finished' && 'Receipt Stamped! Handed to Rider'}
            {order.status === 'in_transit' && `Rider ${order.courier?.name || 'Courier'} is on the Way`}
            {order.status === 'arriving' && 'Rider Arriving Any Second!'}
            {order.status === 'delivered' && 'Order Delivered! Enjoy!'}
            {order.status === 'cancelled' && 'Order Cancelled'}
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            {order.restaurant.name} · {order.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
          </p>
        </div>

        {/* ETA & Distance HUD */}
        <div className="flex items-center gap-3 bg-neutral-950/80 px-4 py-2.5 rounded-xl border border-neutral-800">
          <div>
            <span className="text-[11px] text-neutral-400 uppercase tracking-wider block">
              Estimated Arrival
            </span>
            <span className="text-2xl font-bold font-mono text-emerald-400 tabular-nums">
              {order.status === 'delivered' ? '00:00' : `${order.etaMinutes} mins`}
            </span>
          </div>
          <div className="h-8 w-px bg-neutral-800" />
          <div>
            <span className="text-[11px] text-neutral-400 uppercase tracking-wider block">
              Total Due (KSh)
            </span>
            <span className="text-sm font-semibold font-mono text-neutral-100 tabular-nums">
              KSh {order.totalPrice.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Real-Time Live Delivery Progress Scrubber & Simulation Bar */}
      <div className="bg-neutral-950/90 rounded-xl p-3.5 border border-neutral-800 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold text-neutral-200">Live GPS Simulation</span>
            <span className="text-neutral-500 font-mono tabular-nums">({progressPercent}% route)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-neutral-400 text-[11px]">Speed:</span>
            {[1, 2, 4].map((spd) => (
              <button
                key={spd}
                onClick={() => onChangeSpeed(spd)}
                className={`px-2 py-0.5 rounded text-xs font-mono transition-colors ${
                  simulationSpeed === spd
                    ? 'bg-emerald-500 text-neutral-950 font-bold'
                    : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>

        {/* Progress track */}
        <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden relative">
          <div
            className="h-full bg-gradient-to-r from-emerald-600 via-emerald-500 to-green-400 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Play / Pause / Step Controls */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-2">
            <button
              onClick={onToggleSimulation}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                isSimulating
                  ? 'bg-emerald-500 text-neutral-950 hover:bg-emerald-400'
                  : 'bg-neutral-800 text-neutral-100 hover:bg-neutral-700'
              }`}
            >
              {isSimulating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isSimulating ? 'Pause GPS' : 'Auto Track GPS'}</span>
            </button>

            <button
              onClick={onStepForward}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-700 transition-colors"
              title="Advance one GPS waypoint"
            >
              <FastForward className="w-3.5 h-3.5" />
              <span>Step</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            {order.status === 'kitchen_preparing' && (
              <button
                onClick={() => onAdvanceToStatus('order_finished')}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors"
              >
                Finish & Dispatch
              </button>
            )}
            {order.status !== 'delivered' && (
              <button
                onClick={() => onAdvanceToStatus('delivered')}
                className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
              >
                Mark Delivered
              </button>
            )}
            <button
              onClick={onResetOrder}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
              title="Reset Order Demo"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Stepper Timeline */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
        {steps.map((st) => {
          const status = getStepStatus(st.key);
          return (
            <div
              key={st.key}
              className={`p-3 rounded-xl border transition-all ${
                status === 'completed'
                  ? 'bg-neutral-950/60 border-emerald-500/30 text-emerald-400'
                  : status === 'active'
                  ? 'bg-emerald-500/10 border-emerald-500/60 text-emerald-300 shadow-md ring-1 ring-emerald-500/40'
                  : 'bg-neutral-950/30 border-neutral-800/60 text-neutral-500'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="p-1.5 rounded-lg bg-neutral-900 border border-neutral-800">
                  {status === 'completed' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    st.icon
                  )}
                </div>
                {order.statusTimestamps[st.key] && (
                  <span className="text-[10px] font-mono text-neutral-400">
                    {order.statusTimestamps[st.key]}
                  </span>
                )}
              </div>
              <h4 className="text-xs font-semibold text-neutral-200 truncate">{st.label}</h4>
              <p className="text-[11px] text-neutral-400 mt-0.5 leading-tight">{st.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Verified Dispatch Receipt & Payment Banner */}
      <div className="bg-neutral-950/80 rounded-xl p-4 border border-neutral-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            {order.paymentMethod === 'mpesa' ? <Smartphone className="w-4 h-4" /> : <Banknote className="w-4 h-4" />}
          </div>
          <div>
            <p className="font-semibold text-neutral-200">
              {order.paymentMethod === 'mpesa'
                ? `Paid via M-Pesa (0743926800)`
                : `Payment: Cash on Delivery (KSh ${order.totalPrice.toLocaleString()})`}
            </p>
            <p className="text-[11px] text-neutral-400">
              {order.paymentMethod === 'mpesa'
                ? `Transaction Ref: ${order.mpesaDetails?.transactionCode || 'Verified'}`
                : `Please pay courier in exact KSh`}
            </p>
          </div>
        </div>

        {order.receiptVerification && (
          <button
            onClick={() => setShowReceiptPhoto(!showReceiptPhoto)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-emerald-400 border border-emerald-500/30 font-semibold transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{showReceiptPhoto ? 'Hide Receipt' : 'View Verified Receipt'}</span>
          </button>
        )}
      </div>

      {/* Glovo / Pelican Style Items & Substitutions Card */}
      <div className="bg-neutral-950/70 border border-neutral-800 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-neutral-800/80">
          <span className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
            <Package className="w-4 h-4 text-emerald-400" />
            <span>Store Packing & Items Checklist</span>
          </span>
          <span className="text-[11px] font-mono text-neutral-400">
            {order.items.length} items
          </span>
        </div>

        {/* Any substitution banner alert */}
        {order.items.some((i) => i.status === 'substituted') && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Store Notice: Item Substituted</span>
            </div>
            {order.items
              .filter((i) => i.status === 'substituted' && i.substitution)
              .map((i) => (
                <p key={i.id} className="text-[11px] text-neutral-300">
                  <span className="line-through text-neutral-500">{i.name}</span> was out of stock and replaced with <strong className="text-white">{i.substitution?.substituteName}</strong> (KSh {i.substitution?.substitutePrice.toLocaleString()}).
                </p>
              ))}
          </div>
        )}

        {/* Items list */}
        <div className="divide-y divide-neutral-900 text-xs">
          {order.items.map((item) => (
            <div key={item.id} className="py-2 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`font-medium ${item.status === 'substituted' || item.status === 'removed' ? 'line-through text-neutral-500' : 'text-neutral-200'}`}>
                    {item.quantity}x {item.name}
                  </span>
                  {item.status === 'substituted' && item.substitution && (
                    <span className="text-[10px] font-semibold text-amber-400 bg-amber-500/15 px-1.5 py-0.2 rounded border border-amber-500/30">
                      ↳ Substituted: {item.substitution.substituteName}
                    </span>
                  )}
                  {item.status === 'picked' && (
                    <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/15 px-1.5 py-0.2 rounded">
                      ✓ Packed
                    </span>
                  )}
                  {item.status === 'removed' && (
                    <span className="text-[10px] font-semibold text-rose-400 bg-rose-500/15 px-1.5 py-0.2 rounded">
                      ✕ Removed
                    </span>
                  )}
                </div>
              </div>
              <span className="font-mono text-neutral-300">
                KSh {((item.substitution ? item.substitution.substitutePrice : item.price) * item.quantity).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Expanded Receipt Photo Card */}
      {showReceiptPhoto && order.receiptVerification && (
        <div className="p-4 rounded-2xl bg-neutral-950 border border-emerald-500/40 space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-emerald-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              Kitchen Handover Receipt Proof
            </span>
            <span className="text-neutral-400 font-mono text-[11px]">
              {order.receiptVerification.verifiedAt} · {order.receiptVerification.verifiedBy}
            </span>
          </div>
          <div className="relative aspect-[16/9] rounded-xl overflow-hidden border border-neutral-800 max-h-56">
            <img
              src={order.receiptVerification.photoUrl}
              alt="Kitchen verified dispatch receipt"
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-2 left-2 bg-neutral-950/90 px-2.5 py-1 rounded-lg text-[11px] font-mono text-emerald-300 border border-emerald-500/40">
              Verified Amount: KSh {order.receiptVerification.verifiedAmount.toLocaleString()}
            </div>
          </div>
          <p className="text-xs text-neutral-400 italic">
            "{order.receiptVerification.notes || 'Package checked and sealed.'}"
          </p>
        </div>
      )}

      {/* Courier & Destination Split Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Courier Details */}
        {order.courier ? (
          <div className="bg-neutral-950/70 border border-neutral-800 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-emerald-950/80 border-2 border-emerald-500/60 flex items-center justify-center p-1.5 shadow-lg shadow-emerald-950/50">
                  <CourierBikeIcon className="w-full h-full" bagColor="#10b981" frameColor="#ffffff" />
                </div>
                <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-neutral-950" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-neutral-100">{order.courier.name}</h4>
                  <span className="text-[11px] px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-300 font-mono border border-emerald-800/50">
                    ★ {order.courier.rating}
                  </span>
                </div>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Versam Courier Bike · {order.courier.vehiclePlate} · {order.courier.completedDeliveries}+ trips
                </p>
                <div className="flex items-center gap-2 mt-1 text-[11px] text-emerald-400 font-mono">
                  <span>Speed: {order.courier.speedKmh} km/h</span>
                  <span>·</span>
                  <span>Heading: {Math.round(order.courier.heading)}°</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={`tel:${order.courier.phone}`}
                className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors"
                title="Call Courier"
              >
                <Phone className="w-4 h-4" />
              </a>
              {onOpenSupport && (
                <button
                  onClick={onOpenSupport}
                  className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors"
                  title="Contact Support (0743926800 / 0795509505)"
                >
                  <MessageSquare className="w-4 h-4 text-emerald-400" />
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-neutral-950/70 border border-neutral-800 rounded-xl p-4 flex items-center gap-3 text-neutral-400 text-xs">
            <Clock className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>Assigning nearest Versam courier while kitchen prepares order...</span>
          </div>
        )}

        {/* Drop-off Details */}
        <div className="bg-neutral-950/70 border border-neutral-800 rounded-xl p-4 flex items-start gap-3">
          <div className="p-2 rounded-xl bg-neutral-800 text-emerald-400 shrink-0 mt-0.5">
            <MapPin className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-neutral-200 uppercase tracking-wider">
                Delivery Location
              </span>
              <span className="text-[11px] text-neutral-500">Contactless</span>
            </div>
            <p className="text-xs font-medium text-neutral-100 mt-0.5 truncate">
              {order.deliveryAddress}
            </p>
            <p className="text-xs text-neutral-400 mt-0.5 italic">
              Note: "{order.deliveryInstructions}"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

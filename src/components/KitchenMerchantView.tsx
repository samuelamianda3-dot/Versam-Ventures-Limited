import React, { useState } from 'react';
import { Order, OrderStatus, OrderItem, MenuItem } from '../types';
import { 
  ChefHat, 
  Clock, 
  CheckCircle2, 
  PackageCheck, 
  PlusCircle, 
  AlertCircle, 
  ArrowRight, 
  Flame,
  Camera, 
  Banknote, 
  Smartphone, 
  Phone, 
  ShieldCheck,
  CheckSquare,
  Square,
  Bike,
  Store,
  Receipt,
  AlertTriangle,
  RefreshCw,
  XCircle,
  Package,
  Layers,
  Search,
  Check
} from 'lucide-react';
import { playOrderNotificationSound } from '../utils/audio';
import { ReceiptCaptureModal } from './ReceiptCaptureModal';
import { ItemSubstitutionModal } from './ItemSubstitutionModal';
import { AddProductModal } from './AddProductModal';
import { SUPPORT_CONTACTS } from '../data/mockData';

interface KitchenMerchantViewProps {
  orders: Order[];
  catalog: MenuItem[];
  onAcceptOrder: (orderId: string) => void;
  onFinishOrder: (orderId: string) => void;
  onSimulateNewOrder: () => void;
  onSelectOrder: (orderId: string) => void;
  onItemPicked: (orderId: string, itemId: string) => void;
  onSubstituteItem: (
    orderId: string, 
    originalItemId: string, 
    substitute: MenuItem, 
    reason: string
  ) => void;
  onRemoveItem: (orderId: string, itemId: string, reason: string) => void;
  onToggleCatalogStock?: (itemId: string) => void;
  onAddMenuItem?: (item: MenuItem) => void;
  onVerifyReceipt?: (
    orderId: string, 
    photoUrl: string, 
    verifiedAmount: number, 
    verifiedBy: string,
    notes: string
  ) => void;
  activeOrderId: string;
}

export const KitchenMerchantView: React.FC<KitchenMerchantViewProps> = ({
  orders,
  catalog,
  onAcceptOrder,
  onFinishOrder,
  onSimulateNewOrder,
  onSelectOrder,
  onItemPicked,
  onSubstituteItem,
  onRemoveItem,
  onToggleCatalogStock,
  onAddMenuItem,
  onVerifyReceipt,
  activeOrderId,
}) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'inventory'>('orders');
  const [verifyingOrder, setVerifyingOrder] = useState<Order | null>(null);
  
  // Substitution Modal state
  const [substitutingOrder, setSubstitutingOrder] = useState<Order | null>(null);
  const [substitutingItem, setSubstitutingItem] = useState<OrderItem | null>(null);

  // Store Inventory & Catalog
  const [inventorySearch, setInventorySearch] = useState('');
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);

  // Filter orders by workflow state
  const awaitingAdminOrders = orders.filter((o) => o.status === 'pending_admin_approval');
  const readyToPickOrders = orders.filter((o) => o.status === 'admin_approved');
  const inPrepOrders = orders.filter((o) => o.status === 'kitchen_preparing');
  const dispatchedOrders = orders.filter(
    (o) => o.status === 'order_finished' || o.status === 'in_transit' || o.status === 'arriving'
  );

  const handleOpenReceiptModal = (ord: Order) => {
    setVerifyingOrder(ord);
  };

  const handleConfirmReceipt = (
    photoUrl: string, 
    verifiedAmount: number, 
    verifiedBy: string, 
    notes: string
  ) => {
    if (!verifyingOrder) return;
    onVerifyReceipt?.(verifyingOrder.id, photoUrl, verifiedAmount, verifiedBy, notes);
    onFinishOrder(verifyingOrder.id);
    setVerifyingOrder(null);
  };

  const handleOpenSubstituteModal = (ord: Order, item: OrderItem) => {
    setSubstitutingOrder(ord);
    setSubstitutingItem(item);
  };

  const filteredCatalog = catalog.filter((i) =>
    i.name.toLowerCase().includes(inventorySearch.toLowerCase()) ||
    (i.sku && i.sku.toLowerCase().includes(inventorySearch.toLowerCase())) ||
    i.category.toLowerCase().includes(inventorySearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Merchant / Store Header Bar */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-neutral-100">
                Versam Store & Picker App (Glovo / Pelican Mode)
              </h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">
                Live Store Terminal
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              Pick customer items, mark items out of stock, substitute replacements, verify receipt photo (KSh), and dispatch to couriers.
            </p>
          </div>
        </div>

        {/* Action Button & Sub-Tabs */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center bg-neutral-950 p-1 rounded-xl border border-neutral-800 text-xs">
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                activeTab === 'orders'
                  ? 'bg-emerald-500 text-neutral-950 font-bold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Order Picking ({inPrepOrders.length + readyToPickOrders.length})
            </button>
            <button
              onClick={() => setActiveTab('inventory')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                activeTab === 'inventory'
                  ? 'bg-emerald-500 text-neutral-950 font-bold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Store Stock & Availability
            </button>
          </div>

          <button
            onClick={() => {
              playOrderNotificationSound('order_new');
              onSimulateNewOrder();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 font-semibold text-xs transition cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>Simulate Customer Order</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: Order Picking Pipeline (Glovo/Pelican flow) */}
      {activeTab === 'orders' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Column 1: Approved by Admin (Ready to Accept & Pick) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <h3 className="font-semibold text-sm text-neutral-200">Admin Approved (Ready to Pick)</h3>
              </div>
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 font-mono font-bold border border-emerald-800/60">
                {readyToPickOrders.length}
              </span>
            </div>

            {awaitingAdminOrders.length > 0 && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>{awaitingAdminOrders.length} order(s) awaiting Admin Approval at HQ</span>
                </div>
                <p className="text-[11px] text-neutral-400">
                  Customer placed order. It will appear here once Admin approves and assigns a rider.
                </p>
              </div>
            )}

            {readyToPickOrders.length === 0 ? (
              <div className="bg-neutral-900/50 border border-dashed border-neutral-800 rounded-xl p-6 text-center text-xs text-neutral-500">
                No approved orders waiting to start. Check the Admin Portal to approve newly placed orders!
              </div>
            ) : (
              readyToPickOrders.map((ord) => (
                <div
                  key={ord.id}
                  onClick={() => onSelectOrder(ord.id)}
                  className={`bg-neutral-900 rounded-xl border p-4 shadow-lg transition-all cursor-pointer ${
                    activeOrderId === ord.id
                      ? 'border-emerald-500 ring-2 ring-emerald-500/30'
                      : 'border-emerald-500/40 hover:border-emerald-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white font-mono">{ord.displayNumber}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
                        Admin Approved
                      </span>
                    </div>
                    <span className="text-xs font-mono font-bold text-emerald-400">
                      KSh {ord.totalPrice.toLocaleString()}
                    </span>
                  </div>

                  <p className="text-xs text-neutral-300 mt-2 font-medium">Customer: {ord.customerName}</p>
                  <p className="text-[11px] text-neutral-400">{ord.deliveryAddress}</p>

                  {ord.courier && (
                    <div className="mt-2.5 p-2 rounded-lg bg-neutral-950 border border-neutral-800 flex items-center justify-between text-xs">
                      <span className="text-neutral-400 flex items-center gap-1">
                        <Bike className="w-3.5 h-3.5 text-emerald-400" /> Assigned Rider:
                      </span>
                      <span className="text-white font-semibold">{ord.courier.name}</span>
                    </div>
                  )}

                  <div className="mt-3 pt-3 border-t border-neutral-800">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAcceptOrder(ord.id);
                      }}
                      className="w-full py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer"
                    >
                      <Flame className="w-3.5 h-3.5" />
                      <span>Start Picking & Packing Items</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Column 2: Currently Picking (Glovo/Pelican style Item Picking & Substitution) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                <h3 className="font-semibold text-sm text-neutral-200">Active Picking & Substitutions</h3>
              </div>
              <span className="text-xs px-2 py-0.5 rounded bg-neutral-800 text-amber-400 font-mono font-bold">
                {inPrepOrders.length}
              </span>
            </div>

            {inPrepOrders.length === 0 ? (
              <div className="bg-neutral-900/50 border border-dashed border-neutral-800 rounded-xl p-6 text-center text-xs text-neutral-500">
                No orders currently in picking. Accept an approved order on the left to start collecting items!
              </div>
            ) : (
              inPrepOrders.map((ord) => {
                const totalItemsCount = ord.items.length;
                const pickedCount = ord.items.filter((i) => i.picked || i.status === 'picked' || i.status === 'substituted').length;
                const progressPercent = Math.round((pickedCount / Math.max(1, totalItemsCount)) * 100);
                const allItemsResolved = pickedCount === totalItemsCount;

                return (
                  <div
                    key={ord.id}
                    onClick={() => onSelectOrder(ord.id)}
                    className={`bg-neutral-900 rounded-2xl border p-5 shadow-xl transition-all space-y-4 cursor-pointer ${
                      activeOrderId === ord.id
                        ? 'border-emerald-500 ring-2 ring-emerald-500/30'
                        : 'border-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white font-mono">{ord.displayNumber}</span>
                          {(ord.isBulkOrder || ord.backupCourier) && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                              <Package className="w-3 h-3" /> BULK ORDER (Dual Bags)
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-neutral-400">Customer: {ord.customerName} ({ord.customerPhone})</p>
                      </div>
                      <span className="text-xs font-mono font-bold text-emerald-400">
                        KSh {ord.totalPrice.toLocaleString()}
                      </span>
                    </div>

                    {(ord.isBulkOrder || ord.backupCourier) && (
                      <div className="p-2.5 rounded-xl bg-purple-950/50 border border-purple-500/30 text-xs text-purple-300 flex items-center justify-between">
                        <span>📦 <strong>Dual Couriers Dispatched:</strong> {ord.courier?.name} + {ord.backupCourier?.name || 'Assigned Backup'}</span>
                        <span className="text-[10px] text-neutral-400 font-mono">Pack 2 Bags</span>
                      </div>
                    )}

                    {/* Glovo-Style Picking Progress HUD */}
                    <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800 space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-neutral-300 font-semibold">Picking Progress</span>
                        <span className={`font-mono font-bold ${allItemsResolved ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {pickedCount} of {totalItemsCount} Collected ({progressPercent}%)
                        </span>
                      </div>
                      <div className="h-2 w-full bg-neutral-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 rounded-full ${
                            allItemsResolved ? 'bg-emerald-500' : 'bg-amber-400'
                          }`}
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Glovo/Pelican Interactive Packing List */}
                    <div className="space-y-2.5">
                      <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider block">
                        Order Items Checklist:
                      </span>

                      {ord.items.map((item) => {
                        const isPicked = item.picked || item.status === 'picked';
                        const isSubstituted = item.status === 'substituted' && item.substitution;
                        const isRemoved = item.status === 'removed';

                        return (
                          <div
                            key={item.id}
                            className={`p-3 rounded-xl border transition-all space-y-2 ${
                              isPicked
                                ? 'bg-emerald-950/20 border-emerald-500/40'
                                : isSubstituted
                                ? 'bg-amber-950/20 border-amber-500/40'
                                : isRemoved
                                ? 'bg-rose-950/20 border-rose-500/40 opacity-60'
                                : 'bg-neutral-950 border-neutral-800'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className={`text-xs font-bold ${isSubstituted || isRemoved ? 'line-through text-neutral-400' : 'text-white'}`}>
                                    {item.quantity}x {item.name}
                                  </span>
                                  {isPicked && !isSubstituted && (
                                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                      ✓ Found
                                    </span>
                                  )}
                                  {isSubstituted && (
                                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                      Substituted
                                    </span>
                                  )}
                                  {isRemoved && (
                                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                                      Removed
                                    </span>
                                  )}
                                </div>
                                <span className="font-mono text-neutral-400 text-[11px]">
                                  KSh {(item.price * item.quantity).toLocaleString()}
                                </span>
                              </div>

                              {/* Action controls for picker */}
                              <div className="flex items-center gap-1.5">
                                {!isSubstituted && !isRemoved && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onItemPicked(ord.id, item.id);
                                    }}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                                      isPicked
                                        ? 'bg-emerald-500 text-neutral-950 shadow-sm'
                                        : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200'
                                    }`}
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>{isPicked ? 'Picked' : 'Found'}</span>
                                  </button>
                                )}

                                {!isRemoved && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenSubstituteModal(ord, item);
                                    }}
                                    className="px-2 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-amber-400 text-xs font-semibold border border-amber-500/30 transition cursor-pointer flex items-center gap-1"
                                    title="Mark Out of Stock & Substitute like Glovo/Pelican"
                                  >
                                    <RefreshCw className="w-3 h-3" />
                                    <span>{isSubstituted ? 'Change Sub' : 'Out of Stock'}</span>
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Substituted Item Details if applicable */}
                            {isSubstituted && item.substitution && (
                              <div className="p-2 rounded-lg bg-neutral-950 border border-amber-500/30 text-xs space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-amber-300 font-semibold flex items-center gap-1">
                                    <ArrowRight className="w-3 h-3 text-emerald-400" />
                                    <span>Replaced with: {item.substitution.substituteName}</span>
                                  </span>
                                  <span className="font-mono font-bold text-emerald-400">
                                    KSh {item.substitution.substitutePrice.toLocaleString()}
                                  </span>
                                </div>
                                <p className="text-[10px] text-neutral-400 italic">
                                  Reason: "{item.substitution.reason}" • {item.substitution.timestamp}
                                </p>
                              </div>
                            )}

                            {/* Removed Item Details */}
                            {isRemoved && (
                              <p className="text-[11px] text-rose-400 italic">
                                Item removed from order. Total discounted & refunded.
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Stamped Receipt Action Button */}
                    <div className="pt-2 border-t border-neutral-800">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenReceiptModal(ord);
                        }}
                        className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition shadow-md cursor-pointer ${
                          allItemsResolved
                            ? 'bg-emerald-500 hover:bg-emerald-400 text-neutral-950 shadow-emerald-500/20'
                            : 'bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700'
                        }`}
                      >
                        <Camera className="w-4 h-4" />
                        <span>
                          {allItemsResolved
                            ? 'Verify Receipt & Dispatch to Rider'
                            : 'Proceed to Receipt Verification (Items Pending)'}
                        </span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Column 3: Dispatched & Handed over to Courier */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                <h3 className="font-semibold text-sm text-neutral-200">Dispatched with Courier</h3>
              </div>
              <span className="text-xs px-2 py-0.5 rounded bg-neutral-800 text-cyan-400 font-mono font-bold">
                {dispatchedOrders.length}
              </span>
            </div>

            {dispatchedOrders.length === 0 ? (
              <div className="bg-neutral-900/50 border border-dashed border-neutral-800 rounded-xl p-6 text-center text-xs text-neutral-500">
                No orders dispatched to couriers yet.
              </div>
            ) : (
              dispatchedOrders.map((ord) => (
                <div
                  key={ord.id}
                  onClick={() => onSelectOrder(ord.id)}
                  className={`bg-neutral-900/80 rounded-xl border p-4 shadow-lg transition-all space-y-2 cursor-pointer ${
                    activeOrderId === ord.id
                      ? 'border-emerald-500 ring-2 ring-emerald-500/30'
                      : 'border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white font-mono">{ord.displayNumber}</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 uppercase">
                      {ord.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-neutral-400">
                    <span>Courier: <strong className="text-neutral-200">{ord.courier?.name || 'Assigned Rider'}</strong></span>
                    <span className="font-mono text-emerald-400 font-bold">KSh {ord.totalPrice.toLocaleString()}</span>
                  </div>

                  {ord.receiptVerification && (
                    <div className="p-2 rounded bg-neutral-950 border border-neutral-800 text-[11px] text-emerald-400 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" /> Receipt Verified: KSh {ord.receiptVerification.verifiedAmount.toLocaleString()}
                      </span>
                      <span className="text-neutral-500 font-mono">{ord.receiptVerification.verifiedAt}</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: Store Catalog & SKU Inventory Manager (Glovo Merchant / Pelican Store manager) */}
      {activeTab === 'inventory' && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-800">
            <div>
              <div className="flex items-center gap-2">
                <Store className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-sm text-neutral-100">Store Catalog & SKU Inventory</h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {catalog.length} Products
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Manage what is available in store, track assigned SKU codes, and add new culinary products with photos & descriptions.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="relative">
                <input
                  type="text"
                  value={inventorySearch}
                  onChange={(e) => setInventorySearch(e.target.value)}
                  placeholder="Filter SKU or dish..."
                  className="bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-neutral-500 pl-8 focus:outline-none focus:border-emerald-500 w-44 sm:w-52"
                />
                <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 top-2" />
              </div>

              <button
                type="button"
                onClick={() => setIsAddProductOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs flex items-center gap-1.5 transition shadow-sm cursor-pointer active:scale-95 whitespace-nowrap"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Add Product</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredCatalog.map((item) => {
              const inStock = item.inStock !== false;

              return (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                    inStock ? 'bg-neutral-950 border-neutral-800' : 'bg-neutral-950/40 border-rose-500/30'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-12 h-12 rounded-lg object-cover border border-neutral-800 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs font-bold text-white truncate">{item.name}</h4>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="font-mono text-[10px] text-emerald-400 bg-neutral-900 px-1.5 py-0.5 rounded border border-neutral-800 font-bold">
                          {item.sku}
                        </span>
                        <span className="text-[11px] text-neutral-400 font-mono">
                          KSh {item.price.toLocaleString()}
                        </span>
                      </div>
                      <p className="text-[10px] text-neutral-500 line-clamp-1 mt-0.5">{item.description}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => onToggleCatalogStock?.(item.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border shrink-0 ${
                      inStock
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-rose-500/20 hover:text-rose-400 hover:border-rose-500/40'
                        : 'bg-rose-500/15 text-rose-400 border-rose-500/30 hover:bg-emerald-500/20 hover:text-emerald-400 hover:border-emerald-500/40'
                    }`}
                  >
                    {inStock ? 'In Stock' : 'Out of Stock'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal: Store Add Product Modal */}
      <AddProductModal
        isOpen={isAddProductOpen}
        onClose={() => setIsAddProductOpen(false)}
        onAddProduct={(newItem) => {
          onAddMenuItem?.(newItem);
        }}
        currentItemsCount={catalog.length}
        sourceApp="Store / Kitchen App"
      />

      {/* Modal 1: Glovo/Pelican Item Substitution & Out of Stock */}
      {substitutingOrder && substitutingItem && (
        <ItemSubstitutionModal
          isOpen={true}
          onClose={() => {
            setSubstitutingOrder(null);
            setSubstitutingItem(null);
          }}
          item={substitutingItem}
          catalog={catalog}
          customerPhone={substitutingOrder.customerPhone}
          onSubstitute={(origId, subItem, reason) => {
            onSubstituteItem(substitutingOrder.id, origId, subItem, reason);
          }}
          onRemoveItem={(origId, reason) => {
            onRemoveItem(substitutingOrder.id, origId, reason);
          }}
        />
      )}

      {/* Modal 2: Receipt Photo Capture & Verification */}
      {verifyingOrder && (
        <ReceiptCaptureModal
          order={verifyingOrder}
          isOpen={true}
          onClose={() => setVerifyingOrder(null)}
          onConfirmVerification={handleConfirmReceipt}
        />
      )}
    </div>
  );
};

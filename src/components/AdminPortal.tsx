import React, { useState } from 'react';
import { 
  MenuItem, 
  PromoOffer, 
  Order, 
  CustomerActivity,
  OrderStatus,
  Courier,
  UserAccount,
  UserRole
} from '../types';
import { SUPPORT_CONTACTS, SAMPLE_COURIERS } from '../data/mockData';
import { findRidersByProximity, checkIsBulkOrder } from '../utils/geo';
import { AddProductModal } from './AddProductModal';
import { 
  DollarSign, 
  Tag, 
  Activity, 
  Package, 
  Plus, 
  Check, 
  Edit3, 
  Trash2, 
  TrendingUp, 
  Clock, 
  Bike, 
  Search, 
  Sliders, 
  ShieldCheck, 
  ExternalLink,
  Flame,
  CheckCircle2, 
  AlertTriangle,
  AlertCircle,
  Lock,
  Unlock,
  KeyRound,
  UserCheck,
  Send,
  XCircle,
  Truck,
  Phone,
  Copy,
  Users,
  Eye,
  EyeOff,
  UserPlus,
  Shield,
  Store,
  User,
  Sparkles,
  Zap,
  MapPin
} from 'lucide-react';

interface AdminPortalProps {
  menuItems: MenuItem[];
  onUpdateMenuItem: (updatedItem: MenuItem) => void;
  onAddMenuItem: (newItem: MenuItem) => void;
  offers: PromoOffer[];
  onToggleOffer: (offerId: string) => void;
  onAddOffer: (newOffer: PromoOffer) => void;
  onDeleteOffer: (offerId: string) => void;
  orders: Order[];
  activities: CustomerActivity[];
  couriers: Courier[];
  onApproveOrder: (orderId: string, assignedCourierId: string, backupCourierId?: string) => void;
  onRejectOrder: (orderId: string, reason: string) => void;
  onReassignCourier: (orderId: string, newCourierId: string) => void;
  onForceOrderStatus?: (orderId: string, status: OrderStatus) => void;
  isAdminAuthenticated: boolean;
  onAuthenticateAdmin: (pin: string) => boolean;
  onLogoutAdmin: () => void;
  // Accounts directory
  accounts: UserAccount[];
  onUpdateAccount?: (updatedAccount: UserAccount) => void;
  onAddAccount?: (newAccount: UserAccount) => void;
  onToggleAccountStatus?: (accountId: string) => void;
  onResetAccountPin?: (accountId: string, newPin: string) => void;
  // Rider Onboarding
  onOnboardRider?: (riderData: {
    name: string;
    phone: string;
    email: string;
    vehicle: Courier['vehicle'];
    vehiclePlate: string;
    pin: string;
    hubCoords: [number, number];
    photoUrl?: string;
  }) => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  menuItems,
  onUpdateMenuItem,
  onAddMenuItem,
  offers,
  onToggleOffer,
  onAddOffer,
  onDeleteOffer,
  orders,
  activities,
  couriers,
  onApproveOrder,
  onRejectOrder,
  onReassignCourier,
  onForceOrderStatus,
  isAdminAuthenticated,
  onAuthenticateAdmin,
  onLogoutAdmin,
  accounts = [],
  onUpdateAccount,
  onAddAccount,
  onToggleAccountStatus,
  onResetAccountPin,
  onOnboardRider,
}) => {
  const [activeTab, setActiveTab] = useState<'approvals' | 'catalog' | 'riders' | 'accounts' | 'offers' | 'activity' | 'orders'>('approvals');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  
  // Auth state
  const [enteredPin, setEnteredPin] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  // Selected rider per pending order id
  const [selectedRiderForOrder, setSelectedRiderForOrder] = useState<Record<string, string>>({});
  const [selectedBackupRiderForOrder, setSelectedBackupRiderForOrder] = useState<Record<string, string>>({});

  // Editing state for price
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editPriceValue, setEditPriceValue] = useState<number>(0);

  // Add Product Modal
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);

  // New Offer Form state
  const [isAddingOffer, setIsAddingOffer] = useState(false);
  const [newOfferCode, setNewOfferCode] = useState('');
  const [newOfferTitle, setNewOfferTitle] = useState('');
  const [newOfferDiscount, setNewOfferDiscount] = useState<number>(10);
  const [newOfferMinAmount, setNewOfferMinAmount] = useState<number>(800);

  // Rider Onboarding Modal state
  const [isOnboardingRiderOpen, setIsOnboardingRiderOpen] = useState(false);
  const [riderName, setRiderName] = useState('');
  const [riderPhone, setRiderPhone] = useState('07');
  const [riderEmail, setRiderEmail] = useState('');
  const [riderVehicle, setRiderVehicle] = useState<Courier['vehicle']>('Versam Courier Bike');
  const [riderPlate, setRiderPlate] = useState('KB-');
  const [riderPin, setRiderPin] = useState('3305');
  const [riderHub, setRiderHub] = useState<'Westlands' | 'Rhapta' | 'Riverside' | 'CBD'>('Westlands');
  const [onboardSuccessMsg, setOnboardSuccessMsg] = useState<string | null>(null);

  // Accounts view state
  const [accountRoleFilter, setAccountRoleFilter] = useState<'all' | UserRole>('all');
  const [accountSearch, setAccountSearch] = useState('');
  const [revealedPins, setRevealedPins] = useState<Record<string, boolean>>({});
  const [isCreateAccountOpen, setIsCreateAccountOpen] = useState(false);
  const [newAccName, setNewAccName] = useState('');
  const [newAccRole, setNewAccRole] = useState<UserRole>('store');
  const [newAccPhone, setNewAccPhone] = useState('07');
  const [newAccEmail, setNewAccEmail] = useState('');
  const [newAccPin, setNewAccPin] = useState('2205');
  const [resetPinTarget, setResetPinTarget] = useState<UserAccount | null>(null);
  const [newPinValue, setNewPinValue] = useState('');
  const [copiedSku, setCopiedSku] = useState<string | null>(null);

  // Financial calculations
  const totalGrossRevenueKsh = orders
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.totalPrice, 0);

  const pendingApprovals = orders.filter((o) => o.status === 'pending_admin_approval');

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = onAuthenticateAdmin(enteredPin);
    if (!success) {
      setAuthError('Invalid Admin Passcode. Use master PIN 7439 or click Quick Demo Unlock.');
    } else {
      setAuthError(null);
    }
  };

  const handleQuickUnlock = () => {
    onAuthenticateAdmin('7439');
    setAuthError(null);
  };

  const handleStartEditPrice = (item: MenuItem) => {
    setEditingItemId(item.id);
    setEditPriceValue(item.price);
  };

  const handleSavePrice = (item: MenuItem) => {
    onUpdateMenuItem({
      ...item,
      price: editPriceValue,
    });
    setEditingItemId(null);
  };

  const handleToggleStock = (item: MenuItem) => {
    onUpdateMenuItem({
      ...item,
      inStock: item.inStock === false ? true : false,
    });
  };

  const handleCopySku = (sku: string) => {
    navigator.clipboard?.writeText(sku);
    setCopiedSku(sku);
    setTimeout(() => setCopiedSku(null), 2000);
  };

  const handleCreateNewOffer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOfferCode.trim() || !newOfferTitle.trim()) return;

    const newOffer: PromoOffer = {
      id: `offer-${Date.now()}`,
      code: newOfferCode.trim().toUpperCase(),
      title: newOfferTitle.trim(),
      description: `Save ${newOfferDiscount}% off on orders above KSh ${newOfferMinAmount}.`,
      discountPercent: newOfferDiscount,
      minOrderAmount: newOfferMinAmount,
      active: true,
      bannerTag: `${newOfferDiscount}% DISCOUNT`,
    };

    onAddOffer(newOffer);
    setIsAddingOffer(false);
    setNewOfferCode('');
    setNewOfferTitle('');
  };

  // Auto assign closest rider and backup for bulk orders
  const handleAutoAssignForOrder = (ord: Order) => {
    const nearby = findRidersByProximity(ord.restaurant.coords, couriers, 3);
    if (nearby.length > 0) {
      const primaryRiderId = nearby[0].courier.id;
      const backupRiderId = nearby.length > 1 ? nearby[1].courier.id : undefined;

      setSelectedRiderForOrder((prev) => ({ ...prev, [ord.id]: primaryRiderId }));
      if (backupRiderId) {
        setSelectedBackupRiderForOrder((prev) => ({ ...prev, [ord.id]: backupRiderId }));
      }
    }
  };

  // Submit Rider Onboarding
  const handleOnboardRiderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!riderName.trim() || !riderPhone.trim() || riderPin.length < 4) return;

    const hubMap: Record<string, [number, number]> = {
      Westlands: [37.7879, -122.3972],
      Rhapta: [37.7871, -122.4015],
      Riverside: [37.7828, -122.4026],
      CBD: [37.7850, -122.4000],
    };

    if (onOnboardRider) {
      onOnboardRider({
        name: riderName.trim(),
        phone: riderPhone.trim(),
        email: riderEmail.trim() || `${riderName.toLowerCase().replace(/\s+/g, '.')}@versamventures.co.ke`,
        vehicle: riderVehicle,
        vehiclePlate: riderPlate.trim().toUpperCase() || 'KB-NEW',
        pin: riderPin.trim(),
        hubCoords: hubMap[riderHub] || [37.7879, -122.3972],
      });
    }

    setOnboardSuccessMsg(`Rider "${riderName}" onboarded! They can now log into the Rider App with Phone ${riderPhone} and PIN ${riderPin}.`);
    setTimeout(() => {
      setOnboardSuccessMsg(null);
      setIsOnboardingRiderOpen(false);
      setRiderName('');
      setRiderPhone('07');
      setRiderEmail('');
      setRiderPlate('KB-');
    }, 2500);
  };

  // Create Staff Account
  const handleCreateAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccName.trim() || !newAccPhone.trim() || newAccPin.length < 4) return;

    const roleLabels: Record<UserRole, string> = {
      admin: 'Platform Administrator',
      store: 'Store Manager / Kitchen Picker',
      rider: 'Courier Rider',
      customer: 'Registered Customer',
    };

    const newAcc: UserAccount = {
      id: `acc-${newAccRole}-${Date.now()}`,
      name: newAccName.trim(),
      email: newAccEmail.trim() || `${newAccName.toLowerCase().replace(/\s+/g, '.')}@versamventures.co.ke`,
      phone: newAccPhone.trim(),
      pin: newAccPin.trim(),
      role: newAccRole,
      roleLabel: roleLabels[newAccRole],
      status: 'active',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80',
      createdAt: new Date().toISOString().split('T')[0],
      lastLogin: 'Never logged in',
      notes: 'Created via Admin Staff Directory',
    };

    onAddAccount?.(newAcc);
    setIsCreateAccountOpen(false);
    setNewAccName('');
    setNewAccPhone('07');
    setNewAccEmail('');
  };

  const handleResetPinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPinTarget || newPinValue.length < 4) return;
    onResetAccountPin?.(resetPinTarget.id, newPinValue.trim());
    setResetPinTarget(null);
    setNewPinValue('');
  };

  const togglePinReveal = (accountId: string) => {
    setRevealedPins((prev) => ({ ...prev, [accountId]: !prev[accountId] }));
  };

  // If locked, render authentication gate
  if (!isAdminAuthenticated) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl text-white">
        <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4 text-emerald-400 shadow-inner">
          <Shield className="w-7 h-7" />
        </div>

        <div className="text-center mb-6">
          <span className="text-[11px] font-mono uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
            Versam Ventures HQ
          </span>
          <h2 className="text-xl font-bold mt-2 text-white">Administrator Access Gate</h2>
          <p className="text-xs text-neutral-400 mt-1">
            Restricted portal for order clearance, courier dispatch, catalog & user directory management.
          </p>
        </div>

        {authError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{authError}</span>
          </div>
        )}

        <form onSubmit={handleLoginSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              Enter Admin Security PIN / Passcode
            </label>
            <div className="relative">
              <input
                type="password"
                maxLength={6}
                value={enteredPin}
                onChange={(e) => setEnteredPin(e.target.value)}
                placeholder="4-digit Master PIN"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm font-mono text-center tracking-widest text-emerald-400 focus:outline-none focus:border-emerald-500"
                autoFocus
              />
              <KeyRound className="w-4 h-4 text-neutral-500 absolute left-3 top-3.5" />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs font-bold transition shadow-lg shadow-emerald-500/20 cursor-pointer active:scale-95"
          >
            Authenticate Admin Console
          </button>
        </form>

        <div className="mt-4 pt-4 border-t border-neutral-800 text-center space-y-2">
          <button
            type="button"
            onClick={handleQuickUnlock}
            className="w-full py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold transition border border-neutral-700 cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Unlock className="w-3.5 h-3.5 text-emerald-400" />
            <span>1-Click Demo Master Unlock (PIN: 7439)</span>
          </button>
          <p className="text-[11px] text-neutral-500 font-mono">
            Direct Support: {SUPPORT_CONTACTS.primary} / {SUPPORT_CONTACTS.secondary}
          </p>
        </div>
      </div>
    );
  }

  const filteredMenuItems = menuItems.filter((i) => {
    const matchesSearch = 
      i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || i.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const filteredAccounts = accounts.filter((acc) => {
    const matchesRole = accountRoleFilter === 'all' || acc.role === accountRoleFilter;
    const matchesSearch = 
      acc.name.toLowerCase().includes(accountSearch.toLowerCase()) ||
      acc.phone.includes(accountSearch) ||
      acc.email.toLowerCase().includes(accountSearch.toLowerCase());
    return matchesRole && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Admin Navigation Header */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-neutral-400">
            <span>Versam Ventures HQ</span>
            <span>/</span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Operations Command Center
            </span>
          </div>
          <h1 className="text-xl font-bold text-neutral-100 mt-0.5">
            Admin Master Portal & Dispatch Desk
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Control order clearances, location-based rider dispatch, bulk-order backups, master catalog SKUs, and all user accounts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <UserCheck className="w-4 h-4" />
            <span>Master Admin Active</span>
          </div>
          <button
            onClick={onLogoutAdmin}
            className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold border border-neutral-700 transition cursor-pointer flex items-center gap-1"
          >
            <Lock className="w-3.5 h-3.5 text-neutral-400" />
            <span>Lock</span>
          </button>
        </div>
      </div>

      {/* Admin Tab Switcher */}
      <div className="flex items-center gap-1.5 bg-neutral-950 p-1.5 rounded-2xl border border-neutral-800 text-xs overflow-x-auto">
        <button
          onClick={() => setActiveTab('approvals')}
          className={`px-3.5 py-2 rounded-xl font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'approvals'
              ? 'bg-emerald-500 text-neutral-950 font-bold shadow-md shadow-emerald-500/20'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <span>Order Clearance & Dispatch</span>
          {pendingApprovals.length > 0 && (
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              activeTab === 'approvals' ? 'bg-neutral-950 text-emerald-400' : 'bg-emerald-500 text-neutral-950 animate-pulse'
            }`}>
              {pendingApprovals.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('catalog')}
          className={`px-3.5 py-2 rounded-xl font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'catalog'
              ? 'bg-emerald-500 text-neutral-950 font-bold shadow-md shadow-emerald-500/20'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          <span>Product Catalog & SKUs ({menuItems.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('riders')}
          className={`px-3.5 py-2 rounded-xl font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'riders'
              ? 'bg-emerald-500 text-neutral-950 font-bold shadow-md shadow-emerald-500/20'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Bike className="w-3.5 h-3.5" />
          <span>Rider Fleet & Onboarding ({couriers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('accounts')}
          className={`px-3.5 py-2 rounded-xl font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'accounts'
              ? 'bg-emerald-500 text-neutral-950 font-bold shadow-md shadow-emerald-500/20'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>User Directory & PINs ({accounts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('offers')}
          className={`px-3.5 py-2 rounded-xl font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'offers'
              ? 'bg-emerald-500 text-neutral-950 font-bold shadow-md shadow-emerald-500/20'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Tag className="w-3.5 h-3.5" />
          <span>Offers & Promos ({offers.filter((o) => o.active).length})</span>
        </button>

        <button
          onClick={() => setActiveTab('activity')}
          className={`px-3.5 py-2 rounded-xl font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'activity'
              ? 'bg-emerald-500 text-neutral-950 font-bold shadow-md shadow-emerald-500/20'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Live Activity Audit</span>
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`px-3.5 py-2 rounded-xl font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'orders'
              ? 'bg-emerald-500 text-neutral-950 font-bold shadow-md shadow-emerald-500/20'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Truck className="w-3.5 h-3.5" />
          <span>Master Order Archive ({orders.length})</span>
        </button>
      </div>

      {/* KPI Overview Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 shadow-md flex items-center justify-between">
          <div>
            <span className="text-[11px] text-neutral-400 uppercase tracking-wider block">
              Gross Orders Revenue
            </span>
            <span className="text-2xl font-bold font-mono text-emerald-400 tabular-nums">
              KSh {totalGrossRevenueKsh.toLocaleString()}
            </span>
            <span className="text-[10px] text-neutral-500 block mt-0.5">M-Pesa & Cash on Delivery</span>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 shadow-md flex items-center justify-between">
          <div>
            <span className="text-[11px] text-neutral-400 uppercase tracking-wider block">
              Pending Clearances
            </span>
            <span className={`text-2xl font-bold font-mono tabular-nums ${
              pendingApprovals.length > 0 ? 'text-amber-400 animate-pulse' : 'text-neutral-100'
            }`}>
              {pendingApprovals.length} Orders
            </span>
            <span className="text-[10px] text-neutral-400 block mt-0.5">Location auto-matching active</span>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 shadow-md flex items-center justify-between">
          <div>
            <span className="text-[11px] text-neutral-400 uppercase tracking-wider block">
              Active Rider Fleet
            </span>
            <span className="text-2xl font-bold font-mono text-neutral-100 tabular-nums">
              {couriers.length} Couriers
            </span>
            <span className="text-[10px] text-emerald-400 block mt-0.5">
              Admin-verified accounts only
            </span>
          </div>
          <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400">
            <Bike className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 shadow-md flex items-center justify-between">
          <div>
            <span className="text-[11px] text-neutral-400 uppercase tracking-wider block">
              User Directory & Logins
            </span>
            <span className="text-2xl font-bold font-mono text-neutral-100 tabular-nums">
              {accounts.length} Accounts
            </span>
            <span className="text-[10px] text-neutral-400 block mt-0.5">PIN & Password protected</span>
          </div>
          <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400">
            <Users className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* TAB 1: Order Approvals (Auto-Assign Closest Rider + Bulk Order Backup) */}
      {activeTab === 'approvals' && (
        <div className="space-y-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-800">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base text-white">Pending Customer Order Approvals</h3>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {pendingApprovals.length} Awaiting Decision
                  </span>
                </div>
                <p className="text-xs text-neutral-400 mt-0.5">
                  The app automatically calculates courier proximity to the kitchen. For bulk orders, a secondary backup courier is assigned to handle cargo volume.
                </p>
              </div>

              {pendingApprovals.length > 0 && (
                <button
                  onClick={() => {
                    pendingApprovals.forEach((ord) => handleAutoAssignForOrder(ord));
                  }}
                  className="px-3.5 py-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-bold hover:bg-emerald-500/30 transition flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Auto-Match Closest Riders for All</span>
                </button>
              )}
            </div>

            {pendingApprovals.length === 0 ? (
              <div className="py-12 text-center">
                <div className="w-12 h-12 rounded-full bg-neutral-800 text-emerald-400 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-white mb-1">Approval Queue Clean!</h4>
                <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                  All customer orders have been reviewed. When a new order is placed in the Customer App, it will immediately sound an alert and appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-4 pt-4">
                {pendingApprovals.map((ord) => {
                  const bulkCheck = checkIsBulkOrder(ord);
                  const isBulk = bulkCheck.isBulk;

                  // Proximity match
                  const nearbyRiders = findRidersByProximity(ord.restaurant.coords, couriers, 3);
                  const closestRider = nearbyRiders[0]?.courier || couriers[0];
                  const secondClosestRider = nearbyRiders[1]?.courier || couriers[1] || couriers[0];

                  const chosenRiderId = selectedRiderForOrder[ord.id] || closestRider.id;
                  const chosenBackupId = selectedBackupRiderForOrder[ord.id] || (isBulk ? secondClosestRider.id : '');

                  const chosenRider = couriers.find((c) => c.id === chosenRiderId) || closestRider;
                  const chosenBackup = couriers.find((c) => c.id === chosenBackupId);

                  return (
                    <div
                      key={ord.id}
                      className="p-5 rounded-2xl bg-neutral-950 border-2 border-amber-500/40 shadow-xl space-y-4"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-neutral-800">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-base font-bold text-white font-mono">
                              Order {ord.displayNumber}
                            </span>
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase">
                              Needs Clearance
                            </span>
                            {isBulk && (
                              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center gap-1 animate-pulse">
                                <Package className="w-3 h-3" /> BULK ORDER DETECTED (Dual Rider Required)
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-neutral-400 mt-1">
                            Customer: <strong className="text-neutral-200">{ord.customerName}</strong> ({ord.customerPhone}) • Created {ord.createdAt}
                          </p>
                          <p className="text-xs text-neutral-400">
                            Kitchen: <strong className="text-neutral-200">{ord.restaurant.name}</strong> • Drop-off: <span className="text-neutral-300">{ord.deliveryAddress}</span>
                          </p>
                        </div>

                        {/* Amount & Payment */}
                        <div className="text-right">
                          <span className="text-xl font-bold font-mono text-emerald-400 block">
                            KSh {ord.totalPrice.toLocaleString()}
                          </span>
                          {ord.paymentMethod === 'mpesa' ? (
                            <span className="inline-flex items-center gap-1 text-xs text-emerald-300 font-semibold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/80">
                              <CheckCircle2 className="w-3 h-3" /> M-Pesa ({ord.mpesaDetails?.transactionCode || '0743926800'})
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-amber-300 font-semibold bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/80">
                              Cash on Delivery
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Items List with SKU tags */}
                      <div className="space-y-1.5">
                        <div className="text-xs font-semibold text-neutral-300 flex items-center justify-between">
                          <span>Order Checklist ({ord.items.reduce((s, i) => s + i.quantity, 0)} items)</span>
                          {isBulk && (
                            <span className="text-[11px] text-purple-400">
                              {bulkCheck.reason}
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                          {ord.items.map((it) => (
                            <div
                              key={it.id}
                              className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-between text-xs"
                            >
                              <div>
                                <div className="font-semibold text-neutral-200">{it.name}</div>
                                {it.sku && (
                                  <div className="text-[10px] font-mono text-neutral-400">SKU: {it.sku}</div>
                                )}
                              </div>
                              <span className="font-mono text-emerald-400 font-bold ml-2">
                                {it.quantity}x • KSh {(it.price * it.quantity).toLocaleString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Proximity-Based Dispatch Controls */}
                      <div className="p-3.5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                            <MapPin className="w-4 h-4 text-emerald-400" />
                            <span>Location-Based Courier Assignment:</span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleAutoAssignForOrder(ord)}
                            className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer font-semibold"
                          >
                            <Zap className="w-3.5 h-3.5" />
                            <span>Auto-Select Closest ({nearbyRiders[0]?.distanceKm || 0.4} km away)</span>
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {/* Primary Courier */}
                          <div>
                            <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                              Primary Courier (Lead Rider)
                            </label>
                            <select
                              value={chosenRiderId}
                              onChange={(e) =>
                                setSelectedRiderForOrder((prev) => ({
                                  ...prev,
                                  [ord.id]: e.target.value,
                                }))
                              }
                              className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                            >
                              {couriers.map((c) => {
                                const dist = nearbyRiders.find((n) => n.courier.id === c.id)?.distanceKm;
                                return (
                                  <option key={c.id} value={c.id}>
                                    {c.name} ({c.vehicle} • {c.vehiclePlate}) {dist !== undefined ? `[${dist} km from kitchen]` : ''}
                                  </option>
                                );
                              })}
                            </select>
                            <div className="text-[10px] text-neutral-400 mt-1 flex items-center gap-1">
                              <span>Selected: <strong>{chosenRider.name}</strong></span>
                              <span>• Plate: {chosenRider.vehiclePlate}</span>
                              <span>• Phone: {chosenRider.phone}</span>
                            </div>
                          </div>

                          {/* Secondary Backup Courier (Bulk Orders) */}
                          <div className={isBulk ? 'opacity-100' : 'opacity-60'}>
                            <div className="flex items-center justify-between mb-1">
                              <label className="block text-[11px] font-semibold text-neutral-300">
                                Backup Courier (Cargo Overflow Support)
                              </label>
                              {isBulk && (
                                <span className="text-[10px] font-bold text-purple-400 uppercase">
                                  Required for Bulk
                                </span>
                              )}
                            </div>
                            <select
                              value={chosenBackupId}
                              onChange={(e) =>
                                setSelectedBackupRiderForOrder((prev) => ({
                                  ...prev,
                                  [ord.id]: e.target.value,
                                }))
                              }
                              className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                            >
                              <option value="">{isBulk ? '-- Select Backup Courier --' : 'None (Single Rider Sufficient)'}</option>
                              {couriers
                                .filter((c) => c.id !== chosenRiderId)
                                .map((c) => {
                                  const dist = nearbyRiders.find((n) => n.courier.id === c.id)?.distanceKm;
                                  return (
                                    <option key={c.id} value={c.id}>
                                      {c.name} ({c.vehicle} • {c.vehiclePlate}) {dist !== undefined ? `[${dist} km]` : ''}
                                    </option>
                                  );
                                })}
                            </select>
                            {chosenBackup && (
                              <div className="text-[10px] text-purple-300 mt-1">
                                Backup: <strong>{chosenBackup.name}</strong> will carry secondary thermal pannier bag.
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Approval Actions */}
                      <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => onRejectOrder(ord.id, 'Kitchen overloaded / address out of radius')}
                          className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-rose-400 border border-rose-500/20 text-xs font-semibold transition cursor-pointer"
                        >
                          Reject Order
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            onApproveOrder(ord.id, chosenRiderId, chosenBackupId || undefined);
                          }}
                          className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs flex items-center gap-2 transition shadow-lg shadow-emerald-500/20 cursor-pointer active:scale-95"
                        >
                          <Check className="w-4 h-4 stroke-[3]" />
                          <span>Approve & Dispatch to Kitchen {isBulk ? '(Dual Courier)' : ''}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Product Catalog & SKU Manager */}
      {activeTab === 'catalog' && (
        <div className="space-y-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base text-white">Master Product Catalog & Assigned SKUs</h3>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {menuItems.length} Products
                  </span>
                </div>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Every product has a unique SKU code. Add new products with photos & descriptions, modify prices in KSh, and toggle instant stock status.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                {/* Search */}
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by SKU code, dish name..."
                    className="bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 pl-8 focus:outline-none focus:border-emerald-500 w-56 sm:w-64"
                  />
                  <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 top-2.5" />
                </div>

                {/* Category Filter */}
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-300 focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="all">All Categories</option>
                  <option value="Burgers">Burgers</option>
                  <option value="Pizzas">Pizzas</option>
                  <option value="Bowls">Bowls</option>
                  <option value="Sides">Sides</option>
                  <option value="Drinks">Drinks</option>
                </select>

                <button
                  type="button"
                  onClick={() => setIsAddProductModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs flex items-center gap-1.5 transition shadow-lg shadow-emerald-500/20 cursor-pointer active:scale-95"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Add New Product (With Photo & SKU)</span>
                </button>
              </div>
            </div>

            {copiedSku && (
              <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>SKU <strong>{copiedSku}</strong> copied to clipboard!</span>
              </div>
            )}

            {/* Catalog Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-950 text-neutral-400 border-b border-neutral-800 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-3">Product Photo & Title</th>
                    <th className="py-3 px-3">Assigned SKU Code</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3">Price (KSh)</th>
                    <th className="py-3 px-3">Stock Availability</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800">
                  {filteredMenuItems.map((item) => {
                    const isEditing = editingItemId === item.id;
                    const inStock = item.inStock !== false;

                    return (
                      <tr key={item.id} className="hover:bg-neutral-950/60 transition-colors">
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-12 h-12 rounded-xl object-cover border border-neutral-800 shrink-0"
                            />
                            <div>
                              <p className="font-bold text-neutral-100">{item.name}</p>
                              <p className="text-[11px] text-neutral-400 line-clamp-1 max-w-xs">{item.description}</p>
                              {item.tags && item.tags.length > 0 && (
                                <div className="flex gap-1 mt-1">
                                  {item.tags.slice(0, 2).map((tg, idx) => (
                                    <span key={idx} className="text-[9px] px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-400">
                                      {tg}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-950 border border-neutral-800 font-mono text-[11px] text-emerald-400 font-bold">
                            <span>{item.sku}</span>
                            <button
                              onClick={() => handleCopySku(item.sku)}
                              className="text-neutral-500 hover:text-white transition cursor-pointer"
                              title="Copy SKU code"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-neutral-800 text-neutral-300">
                            {item.category}
                          </span>
                        </td>

                        <td className="py-3 px-3 font-mono font-bold text-neutral-100">
                          {isEditing ? (
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs text-neutral-400">KSh</span>
                              <input
                                type="number"
                                min={50}
                                step={10}
                                value={editPriceValue}
                                onChange={(e) => setEditPriceValue(Number(e.target.value))}
                                className="w-24 bg-neutral-950 border border-emerald-500 rounded px-2 py-1 text-xs text-white focus:outline-none"
                              />
                            </div>
                          ) : (
                            <span className="text-emerald-400">KSh {item.price.toLocaleString()}</span>
                          )}
                        </td>

                        <td className="py-3 px-3">
                          <button
                            onClick={() => handleToggleStock(item)}
                            className={`px-3 py-1 rounded-xl text-[11px] font-bold cursor-pointer border transition ${
                              inStock
                                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-rose-500/20 hover:text-rose-400 hover:border-rose-500/40'
                                : 'bg-rose-500/15 text-rose-400 border-rose-500/30 hover:bg-emerald-500/20 hover:text-emerald-400 hover:border-emerald-500/40'
                            }`}
                          >
                            {inStock ? '● In Stock' : '✕ Out of Stock'}
                          </button>
                        </td>

                        <td className="py-3 px-3 text-right">
                          {isEditing ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleSavePrice(item)}
                                className="p-1.5 rounded-lg bg-emerald-500 text-neutral-950 hover:bg-emerald-400 cursor-pointer"
                                title="Save price"
                              >
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                              </button>
                              <button
                                onClick={() => setEditingItemId(null)}
                                className="p-1.5 rounded-lg bg-neutral-800 text-neutral-400 hover:text-white cursor-pointer"
                                title="Cancel"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleStartEditPrice(item)}
                              className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[11px] font-medium flex items-center gap-1 ml-auto cursor-pointer"
                            >
                              <Edit3 className="w-3 h-3 text-emerald-400" />
                              <span>Edit KSh</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Rider Fleet & Onboarding Desk */}
      {activeTab === 'riders' && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-800">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">Courier Rider Fleet Management</h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {couriers.length} Active Couriers
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                <strong className="text-emerald-400">Security Rule:</strong> Rider accounts can <strong>ONLY be opened here at the Admin App</strong>. Once created, credentials are live for the Rider App.
              </p>
            </div>

            <button
              onClick={() => setIsOnboardingRiderOpen(true)}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs flex items-center gap-1.5 transition shadow-lg shadow-emerald-500/20 cursor-pointer self-start sm:self-auto active:scale-95"
            >
              <UserPlus className="w-4 h-4 stroke-[2.5]" />
              <span>Onboard New Courier Rider</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {couriers.map((rider) => {
              const assignedRun = orders.find(
                (o) => (o.courier?.id === rider.id || o.backupCourier?.id === rider.id) &&
                       o.status !== 'delivered' && o.status !== 'cancelled'
              );

              const isBackupOnRun = assignedRun?.backupCourier?.id === rider.id;

              return (
                <div
                  key={rider.id}
                  className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-neutral-700 transition space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={rider.photoUrl}
                        alt={rider.name}
                        className="w-12 h-12 rounded-xl object-cover border-2 border-emerald-500/60"
                      />
                      <div>
                        <h4 className="text-sm font-bold text-white">{rider.name}</h4>
                        <p className="text-xs text-neutral-400">
                          {rider.vehicle} • <span className="font-mono text-neutral-200 font-semibold">{rider.vehiclePlate}</span>
                        </p>
                        <p className="text-[11px] text-emerald-400 mt-0.5">
                          ★ {rider.rating} • {rider.completedDeliveries} completed runs • {rider.phone}
                        </p>
                      </div>
                    </div>
                    <a
                      href={`tel:${rider.phone}`}
                      className="p-2 rounded-xl bg-neutral-900 text-neutral-300 hover:text-white border border-neutral-800"
                      title="Call Rider"
                    >
                      <Phone className="w-4 h-4 text-emerald-400" />
                    </a>
                  </div>

                  <div className="pt-2 border-t border-neutral-900 flex items-center justify-between text-xs">
                    <span className="text-neutral-400">Current Run Status:</span>
                    {assignedRun ? (
                      <span className={`font-semibold flex items-center gap-1 font-mono ${
                        isBackupOnRun ? 'text-purple-400' : 'text-amber-400'
                      }`}>
                        <Truck className="w-3.5 h-3.5" />
                        <span>Order {assignedRun.displayNumber} ({isBackupOnRun ? 'Backup Co-Courier' : 'Primary'})</span>
                      </span>
                    ) : (
                      <span className="text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Idle & Ready for Dispatch
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: User Directory & PIN Management */}
      {activeTab === 'accounts' && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">Versam System User Directory & PIN Management</h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  {accounts.length} Total Accounts
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Every team member and customer has their own account with a distinct PIN or password. View credentials, reset PINs, or suspend accounts.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative">
                <input
                  type="text"
                  value={accountSearch}
                  onChange={(e) => setAccountSearch(e.target.value)}
                  placeholder="Filter name, phone, email..."
                  className="bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 pl-8 focus:outline-none focus:border-emerald-500 w-52 sm:w-60"
                />
                <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 top-2.5" />
              </div>

              <button
                onClick={() => setIsCreateAccountOpen(true)}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-lg shadow-purple-600/20 cursor-pointer active:scale-95"
              >
                <UserPlus className="w-4 h-4 stroke-[2.5]" />
                <span>+ Create Staff Account</span>
              </button>
            </div>
          </div>

          {/* Role Filter Tabs */}
          <div className="flex items-center gap-2 text-xs overflow-x-auto pb-1">
            {(['all', 'admin', 'store', 'rider', 'customer'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setAccountRoleFilter(r)}
                className={`px-3 py-1.5 rounded-xl font-bold capitalize transition cursor-pointer ${
                  accountRoleFilter === r
                    ? 'bg-neutral-100 text-neutral-950'
                    : 'bg-neutral-950 text-neutral-400 hover:text-white border border-neutral-800'
                }`}
              >
                {r === 'all' ? 'All Roles' : `${r}s`}
              </button>
            ))}
          </div>

          {/* Accounts Grid / Table */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredAccounts.map((acc) => {
              const isPinRevealed = revealedPins[acc.id] || false;
              const isSuspended = acc.status === 'suspended';

              return (
                <div
                  key={acc.id}
                  className={`p-4 rounded-2xl border transition space-y-3 ${
                    isSuspended ? 'bg-neutral-950/40 border-rose-500/30 opacity-75' : 'bg-neutral-950 border-neutral-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <img
                        src={acc.avatarUrl}
                        alt={acc.name}
                        className="w-11 h-11 rounded-xl object-cover border border-neutral-700 shrink-0"
                      />
                      <div>
                        <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                          <span>{acc.name}</span>
                          {isSuspended && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
                              Suspended
                            </span>
                          )}
                        </h4>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                          acc.role === 'admin' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                          acc.role === 'store' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                          acc.role === 'rider' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                          'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        }`}>
                          {acc.roleLabel || acc.role}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1 text-[11px] text-neutral-400 border-t border-b border-neutral-900 py-2">
                    <div className="flex items-center justify-between">
                      <span>Phone:</span>
                      <strong className="text-neutral-200 font-mono">{acc.phone}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Email:</span>
                      <span className="text-neutral-300 truncate max-w-[170px]">{acc.email}</span>
                    </div>
                    {acc.storeName && (
                      <div className="flex items-center justify-between">
                        <span>Store Hub:</span>
                        <span className="text-amber-400 font-semibold">{acc.storeName}</span>
                      </div>
                    )}
                    {acc.vehiclePlate && (
                      <div className="flex items-center justify-between">
                        <span>Vehicle / Plate:</span>
                        <span className="text-emerald-400 font-mono font-bold">{acc.vehiclePlate}</span>
                      </div>
                    )}
                  </div>

                  {/* PIN Display & Actions */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-neutral-500" />
                      <span className="text-[11px] text-neutral-400">PIN:</span>
                      <span className="font-mono text-xs font-bold text-emerald-400 bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
                        {isPinRevealed ? acc.pin : '••••'}
                      </span>
                      <button
                        type="button"
                        onClick={() => togglePinReveal(acc.id)}
                        className="text-neutral-500 hover:text-neutral-300 p-0.5 cursor-pointer"
                        title={isPinRevealed ? 'Hide PIN' : 'Reveal PIN'}
                      >
                        {isPinRevealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setResetPinTarget(acc);
                          setNewPinValue(acc.pin);
                        }}
                        className="px-2 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-[10px] font-semibold border border-neutral-800 transition cursor-pointer"
                      >
                        Reset PIN
                      </button>
                      <button
                        type="button"
                        onClick={() => onToggleAccountStatus?.(acc.id)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-semibold border transition cursor-pointer ${
                          isSuspended
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20'
                        }`}
                      >
                        {isSuspended ? 'Activate' : 'Suspend'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 5: Offers & Promos */}
      {activeTab === 'offers' && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
            <div>
              <h3 className="font-bold text-sm text-neutral-100">Customer Promotional Offers & Codes</h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Create discount codes with minimum KSh order requirements. Active offers appear on the customer checkout drawer.
              </p>
            </div>

            <button
              onClick={() => setIsAddingOffer(!isAddingOffer)}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs flex items-center gap-1 transition shadow-sm cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Offer</span>
            </button>
          </div>

          {/* Create Offer Drawer */}
          {isAddingOffer && (
            <form
              onSubmit={handleCreateNewOffer}
              className="p-4 rounded-xl bg-neutral-950 border border-emerald-500/30 space-y-3"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  New Promotional Discount Code
                </h4>
                <button
                  type="button"
                  onClick={() => setIsAddingOffer(false)}
                  className="text-xs text-neutral-500 hover:text-white"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="text-[11px] text-neutral-400 block mb-1">Coupon Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. NAIROBI20"
                    value={newOfferCode}
                    onChange={(e) => setNewOfferCode(e.target.value.toUpperCase())}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-1.5 text-white font-mono uppercase focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-neutral-400 block mb-1">Headline</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 20% Off Weekend Feast"
                    value={newOfferTitle}
                    onChange={(e) => setNewOfferTitle(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-neutral-400 block mb-1">Discount %</label>
                  <input
                    type="number"
                    required
                    min={5}
                    max={75}
                    value={newOfferDiscount}
                    onChange={(e) => setNewOfferDiscount(Number(e.target.value))}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-1.5 text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-neutral-400 block mb-1">Min Spend (KSh)</label>
                  <input
                    type="number"
                    required
                    min={0}
                    step={50}
                    value={newOfferMinAmount}
                    onChange={(e) => setNewOfferMinAmount(Number(e.target.value))}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-1.5 text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs transition cursor-pointer"
              >
                Activate & Broadcast Promo Code
              </button>
            </form>
          )}

          {/* Offers Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {offers.map((offer) => (
              <div
                key={offer.id}
                className={`p-4 rounded-xl border transition-all ${
                  offer.active
                    ? 'bg-neutral-950 border-neutral-700/80'
                    : 'bg-neutral-950/40 border-neutral-800/40 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono font-bold text-sm text-emerald-400 tracking-wider bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded">
                    {offer.code}
                  </span>
                  <button
                    onClick={() => onToggleOffer(offer.id)}
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border cursor-pointer ${
                      offer.active
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                    }`}
                  >
                    {offer.active ? 'Active' : 'Paused'}
                  </button>
                </div>

                <h4 className="text-xs font-bold text-neutral-100">{offer.title}</h4>
                <p className="text-[11px] text-neutral-400 mt-1">{offer.description}</p>

                <div className="mt-3 pt-3 border-t border-neutral-800/80 flex items-center justify-between text-[11px] text-neutral-400">
                  <span>Min spend: <strong className="text-neutral-200">KSh {offer.minOrderAmount.toLocaleString()}</strong></span>
                  <button
                    onClick={() => onDeleteOffer(offer.id)}
                    className="text-neutral-500 hover:text-rose-400 transition cursor-pointer"
                    title="Delete offer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: Live Customer Activity Feed */}
      {activeTab === 'activity' && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
            <div>
              <h3 className="font-bold text-sm text-neutral-100">Live Platform Activity Feed</h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Every action taken on the Customer App, Store App, and Rider App is broadcasted in real time.
              </p>
            </div>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Live Telemetry Stream
            </span>
          </div>

          <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
            {activities.length === 0 ? (
              <div className="p-8 text-center text-xs text-neutral-500">
                No activity recorded yet.
              </div>
            ) : (
              activities.map((act) => (
                <div
                  key={act.id}
                  className="p-3 rounded-xl bg-neutral-950/70 border border-neutral-800/80 hover:border-neutral-700 transition-all flex items-start justify-between gap-3 text-xs"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 mt-0.5 shrink-0 text-emerald-400">
                      <Activity className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-neutral-200">{act.actor}</span>
                        {act.metadata && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-400 font-mono">
                            {act.metadata}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-neutral-300 mt-0.5">{act.description}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-neutral-500 shrink-0">
                    {act.timestamp}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 7: Master Orders Control */}
      {activeTab === 'orders' && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
            <div>
              <h3 className="font-bold text-sm text-neutral-100">All Master Customer Orders</h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Verify payment proofs, dispatch photos, and override status if necessary.
              </p>
            </div>
            <span className="text-xs text-neutral-400 font-mono">
              Total: {orders.length} orders
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-950/80 text-neutral-400 border-b border-neutral-800 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-3">Order</th>
                  <th className="py-3 px-3">Customer & Phone</th>
                  <th className="py-3 px-3">Amount (KSh)</th>
                  <th className="py-3 px-3">Assigned Couriers</th>
                  <th className="py-3 px-3">Payment Method</th>
                  <th className="py-3 px-3">Dispatch Receipt</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Quick Override</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-neutral-950/40 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-emerald-400">
                      {ord.displayNumber}
                    </td>
                    <td className="py-3 px-3">
                      <p className="font-semibold text-neutral-200">{ord.customerName}</p>
                      <p className="text-[11px] text-neutral-400 font-mono">{ord.customerPhone}</p>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-neutral-100 tabular-nums">
                      KSh {ord.totalPrice.toLocaleString()}
                    </td>
                    <td className="py-3 px-3">
                      <div className="space-y-1">
                        <select
                          value={ord.courier?.id || ''}
                          onChange={(e) => onReassignCourier(ord.id, e.target.value)}
                          className="bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-[11px] text-neutral-200 focus:outline-none"
                        >
                          <option value="">Unassigned</option>
                          {couriers.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name} ({c.vehiclePlate})
                            </option>
                          ))}
                        </select>
                        {ord.backupCourier && (
                          <div className="text-[10px] text-purple-400 font-mono">
                            + Backup: {ord.backupCourier.name} ({ord.backupCourier.vehiclePlate})
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      {ord.paymentMethod === 'mpesa' ? (
                        <div className="space-y-0.5">
                          <span className="text-[11px] font-bold text-emerald-400">
                            M-PESA ({SUPPORT_CONTACTS.primary})
                          </span>
                          {ord.mpesaDetails?.transactionCode && (
                            <p className="text-[10px] font-mono text-neutral-400">
                              Code: {ord.mpesaDetails.transactionCode}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-[11px] text-amber-300 font-medium">
                          Cash on Delivery
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      {ord.receiptVerification ? (
                        <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Verified (KSh {ord.receiptVerification.verifiedAmount.toLocaleString()})
                        </span>
                      ) : (
                        <span className="text-[11px] text-neutral-500 italic">Pending Handover</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono uppercase font-semibold ${
                        ord.status === 'pending_admin_approval'
                          ? 'bg-amber-500/20 text-amber-300'
                          : ord.status === 'admin_approved'
                          ? 'bg-sky-500/20 text-sky-300'
                          : ord.status === 'delivered'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-neutral-800 text-neutral-300'
                      }`}>
                        {ord.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      {onForceOrderStatus && (
                        <select
                          value={ord.status}
                          onChange={(e) => onForceOrderStatus(ord.id, e.target.value as OrderStatus)}
                          className="bg-neutral-950 border border-neutral-700 rounded-lg px-2 py-1 text-[11px] text-neutral-200 focus:outline-none focus:border-emerald-500"
                        >
                          <option value="pending_admin_approval">Pending Admin Approval</option>
                          <option value="admin_approved">Admin Approved</option>
                          <option value="kitchen_preparing">Kitchen Preparing</option>
                          <option value="order_finished">Order Finished</option>
                          <option value="in_transit">In Transit</option>
                          <option value="arriving">Arriving</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: Add Product Modal (Photos, Description, SKU) */}
      <AddProductModal
        isOpen={isAddProductModalOpen}
        onClose={() => setIsAddProductModalOpen(false)}
        onAddProduct={(item) => {
          onAddMenuItem(item);
        }}
        currentItemsCount={menuItems.length}
        sourceApp="Admin Portal"
      />

      {/* MODAL 2: Rider Onboarding Desk (Admin Only) */}
      {isOnboardingRiderOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl p-6 sm:p-7 text-white my-8">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Admin-Only Authorization
                </span>
                <h3 className="text-lg font-bold text-white mt-1">Onboard New Courier Rider</h3>
                <p className="text-xs text-neutral-400">
                  Rider accounts can ONLY be opened at the Admin App. Once saved, this rider can log in to the Rider App immediately.
                </p>
              </div>
              <button
                onClick={() => setIsOnboardingRiderOpen(false)}
                className="p-2 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {onboardSuccessMsg ? (
              <div className="my-6 p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>{onboardSuccessMsg}</span>
              </div>
            ) : (
              <form onSubmit={handleOnboardRiderSubmit} className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Rider Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={riderName}
                    onChange={(e) => setRiderName(e.target.value)}
                    placeholder="e.g. Dennis Ochieng"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1">
                      Phone Number (For Login & Calls)
                    </label>
                    <input
                      type="tel"
                      required
                      value={riderPhone}
                      onChange={(e) => setRiderPhone(e.target.value)}
                      placeholder="0743926800"
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1">
                      Assigned 4-Digit Rider PIN
                    </label>
                    <input
                      type="text"
                      maxLength={4}
                      required
                      value={riderPin}
                      onChange={(e) => setRiderPin(e.target.value)}
                      placeholder="e.g. 3305"
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs font-mono text-emerald-400 focus:outline-none focus:border-emerald-500 tracking-wider"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1">
                      Vehicle Type
                    </label>
                    <select
                      value={riderVehicle}
                      onChange={(e) => setRiderVehicle(e.target.value as Courier['vehicle'])}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      <option value="Versam Courier Bike">Versam Courier Bike (with bag)</option>
                      <option value="E-Bike">Electric E-Bike</option>
                      <option value="Motorcycle">Motorcycle</option>
                      <option value="Delivery EV">Delivery EV</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1">
                      Vehicle Plate / Identifier
                    </label>
                    <input
                      type="text"
                      required
                      value={riderPlate}
                      onChange={(e) => setRiderPlate(e.target.value.toUpperCase())}
                      placeholder="e.g. KB-920"
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs font-mono uppercase text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1">
                      Initial Location Hub
                    </label>
                    <select
                      value={riderHub}
                      onChange={(e) => setRiderHub(e.target.value as any)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      <option value="Westlands">Westlands Hub (Kenyatta Ave)</option>
                      <option value="Rhapta">Rhapta Road Hub</option>
                      <option value="Riverside">Riverside Drive Hub</option>
                      <option value="CBD">Nairobi CBD Hub</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1">
                      Email Address (Optional)
                    </label>
                    <input
                      type="email"
                      value={riderEmail}
                      onChange={(e) => setRiderEmail(e.target.value)}
                      placeholder="rider@versamventures.co.ke"
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-[11px] text-neutral-400">
                  Equipped with <strong>Versam Insulated Thermal Courier Bag</strong> with bike pannier mounting straps.
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-800">
                  <button
                    type="button"
                    onClick={() => setIsOnboardingRiderOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-neutral-950 flex items-center gap-2 cursor-pointer active:scale-95"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Complete Onboarding & Issue PIN</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL 3: Create Staff Account (Admin/Store) */}
      {isCreateAccountOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl p-6 sm:p-7 text-white my-8">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
              <div>
                <h3 className="text-base font-bold text-white">Create Staff / System Account</h3>
                <p className="text-xs text-neutral-400">Add an administrator or store picker with login credentials.</p>
              </div>
              <button
                onClick={() => setIsCreateAccountOpen(false)}
                className="p-2 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAccountSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">Staff Full Name</label>
                <input
                  type="text"
                  required
                  value={newAccName}
                  onChange={(e) => setNewAccName(e.target.value)}
                  placeholder="e.g. John Kamau"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">System Role</label>
                <select
                  value={newAccRole}
                  onChange={(e) => setNewAccRole(e.target.value as UserRole)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="store">Store Manager / Kitchen Picker</option>
                  <option value="admin">Platform Administrator</option>
                  <option value="customer">Customer Account</option>
                </select>
                <span className="text-[10px] text-neutral-500 mt-1 block">
                  (Note: Riders must be onboarded in the Riders tab to configure their vehicle & route hub.)
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={newAccPhone}
                    onChange={(e) => setNewAccPhone(e.target.value)}
                    placeholder="0743926800"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">4-Digit PIN</label>
                  <input
                    type="text"
                    maxLength={4}
                    required
                    value={newAccPin}
                    onChange={(e) => setNewAccPin(e.target.value)}
                    placeholder="2205"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs font-mono text-emerald-400 focus:outline-none focus:border-emerald-500 tracking-wider"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">Email Address</label>
                <input
                  type="email"
                  value={newAccEmail}
                  onChange={(e) => setNewAccEmail(e.target.value)}
                  placeholder="staff@versamventures.co.ke"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsCreateAccountOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Create Account</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Reset Account PIN */}
      {resetPinTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl p-6 text-white my-8">
            <h3 className="text-base font-bold text-white">Reset Security PIN</h3>
            <p className="text-xs text-neutral-400 mt-1">
              Updating 4-digit PIN for <strong>{resetPinTarget.name}</strong> ({resetPinTarget.phone}).
            </p>

            <form onSubmit={handleResetPinSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">New 4-Digit PIN</label>
                <input
                  type="text"
                  maxLength={4}
                  required
                  value={newPinValue}
                  onChange={(e) => setNewPinValue(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-center text-base font-mono text-emerald-400 focus:outline-none focus:border-emerald-500 tracking-widest"
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setResetPinTarget(null)}
                  className="px-3 py-1.5 rounded-xl text-xs text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl text-xs font-bold bg-emerald-500 text-neutral-950 hover:bg-emerald-400 cursor-pointer"
                >
                  Save PIN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

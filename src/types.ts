export type OrderStatus =
  | 'pending_admin_approval'
  | 'admin_approved'
  | 'kitchen_preparing'
  | 'order_finished'
  | 'in_transit'
  | 'arriving'
  | 'delivered'
  | 'cancelled';

export interface ItemSubstitution {
  originalItemId: string;
  originalName: string;
  originalPrice: number;
  substituteItemId: string;
  substituteName: string;
  substitutePrice: number;
  reason?: string;
  timestamp: string;
}

export interface OrderItem {
  id: string;
  sku?: string; // Product SKU code (e.g. SKU-VRB-101)
  name: string;
  price: number; // in KSh
  quantity: number;
  notes?: string;
  image?: string;
  picked?: boolean; // For picker checklist
  status?: 'pending' | 'picked' | 'out_of_stock' | 'substituted' | 'removed';
  substitution?: ItemSubstitution;
}

export interface Courier {
  id: string;
  name: string;
  photoUrl: string;
  vehicle: 'Versam Courier Bike' | 'E-Bike' | 'Motorcycle' | 'Delivery EV';
  vehiclePlate: string;
  rating: number;
  phone: string;
  completedDeliveries: number;
  currentCoords: [number, number];
  heading: number; // degrees 0-360
  speedKmh: number;
  status?: 'available' | 'assigned' | 'en_route' | 'off_duty';
}

export interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  address: string;
  coords: [number, number];
  phone: string;
  rating: number;
  prepTimeAvgMin: number;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'order_new' | 'kitchen_ready' | 'courier_transit' | 'courier_arriving' | 'order_finished' | 'system';
  orderId: string;
  unread: boolean;
}

export interface ReceiptVerification {
  photoUrl: string;
  verifiedAmount: number; // in KSh
  verifiedAt: string;
  verifiedBy: string;
  notes?: string;
}

export interface MpesaPaymentDetails {
  phone: string; // e.g. 0743926800
  transactionCode: string; // e.g. QK87XP4921
  timestamp: string;
  status: 'pending' | 'completed' | 'verified';
}

export interface Order {
  id: string;
  displayNumber: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  deliveryInstructions: string;
  deliveryCoords: [number, number];
  restaurant: Restaurant;
  items: OrderItem[];
  subtotal: number; // in KSh
  tax: number; // in KSh
  deliveryFee: number; // in KSh
  discountAmount?: number; // in KSh
  promoCode?: string;
  totalPrice: number; // in KSh
  paymentMethod: 'mpesa' | 'cash_on_delivery';
  mpesaDetails?: MpesaPaymentDetails;
  cashChangeRequested?: string;
  receiptVerification?: ReceiptVerification;
  status: OrderStatus;
  createdAt: string;
  statusTimestamps: Partial<Record<OrderStatus, string>>;
  courier?: Courier;
  backupCourier?: Courier; // Secondary courier assigned for bulk orders to handle split load
  isBulkOrder?: boolean;
  bulkOrderReason?: string;
  routeCoords: [number, number][];
  currentRouteIndex: number;
  etaMinutes: number;
  distanceRemainingKm: number;
}

export interface MenuItem {
  id: string;
  sku: string; // Unique SKU code (e.g. SKU-VRB-101)
  restaurantId: string;
  name: string;
  category: 'Burgers' | 'Pizzas' | 'Bowls' | 'Sides' | 'Drinks';
  price: number; // in KSh
  description: string;
  image: string;
  prepTime: string;
  calories?: number;
  isPopular?: boolean;
  inStock?: boolean;
  stockQuantity?: number;
  tags: string[];
}

export interface PromoOffer {
  id: string;
  code: string;
  title: string;
  description: string;
  discountPercent: number;
  minOrderAmount: number; // in KSh
  active: boolean;
  bannerTag: string;
}

export interface CustomerActivity {
  id: string;
  timestamp: string;
  actor: string;
  type: 'order' | 'cart' | 'payment' | 'dispatch' | 'delivery' | 'support' | 'browse';
  description: string;
  metadata?: string;
}

export type UserRole = 'admin' | 'store' | 'rider' | 'customer';

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  phone: string;
  pin: string; // 4-digit PIN or password
  role: UserRole;
  roleLabel: string;
  storeId?: string;
  storeName?: string;
  riderId?: string;
  vehicle?: 'Versam Courier Bike' | 'E-Bike' | 'Motorcycle' | 'Delivery EV' | string;
  vehiclePlate?: string;
  status: 'active' | 'suspended';
  avatarUrl: string;
  lastLogin?: string;
  createdAt: string;
  notes?: string;
}

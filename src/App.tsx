import React, { useState, useEffect } from 'react';
import { 
  Order, 
  OrderStatus, 
  NotificationItem, 
  OrderItem, 
  MenuItem, 
  Courier,
  PromoOffer, 
  CustomerActivity,
  ReceiptVerification,
  UserAccount
} from './types';
import { 
  INITIAL_ORDERS,
  RESTAURANTS, 
  INITIAL_MENU_ITEMS, 
  INITIAL_OFFERS,
  INITIAL_CUSTOMER_ACTIVITIES,
  SAMPLE_COURIERS, 
  PRESET_DESTINATIONS,
  SUPPORT_CONTACTS,
  INITIAL_ACCOUNTS,
  buildRouteBetween 
} from './data/mockData';
import { InteractiveMap } from './components/InteractiveMap';
import { OrderTracker } from './components/OrderTracker';
import { NotificationCenter } from './components/NotificationCenter';
import { KitchenMerchantView } from './components/KitchenMerchantView';
import { StorefrontView } from './components/StorefrontView';
import { AdminPortal } from './components/AdminPortal';
import { RiderApp } from './components/RiderApp';
import { ChatSupportModal } from './components/ChatSupportModal';
import { AuthModal } from './components/AuthModal';
import { CourierBikeIcon } from './components/CourierBikeIcon';
import { playOrderNotificationSound } from './utils/audio';
import { sendBrowserNotification } from './utils/notifications';
import { calculateBearing, calculateRemainingRouteDistance, checkIsBulkOrder, findRidersByProximity } from './utils/geo';
import { 
  Map, 
  Utensils, 
  ChefHat, 
  Clock, 
  Bike, 
  Compass, 
  Flame, 
  CheckCircle2, 
  Layers, 
  PhoneCall, 
  RefreshCw,
  BellRing,
  ShieldCheck,
  Headphones,
  Sliders,
  DollarSign,
  Smartphone,
  Store,
  User,
  ArrowRight,
  Lock,
  Unlock,
  AlertCircle
} from 'lucide-react';

export default function App() {
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [activeOrderId, setActiveOrderId] = useState<string>(INITIAL_ORDERS[0].id);
  
  // Four Primary Apps: customer | store | rider | admin
  const [activeApp, setActiveApp] = useState<'customer' | 'store' | 'rider' | 'admin'>('customer');
  // Customer sub-view: menu (ordering) or track (live map & progress)
  const [customerSubView, setCustomerSubView] = useState<'menu' | 'track'>('track');

  const [cart, setCart] = useState<OrderItem[]>([]);
  const [isSimulating, setIsSimulating] = useState<boolean>(true);
  const [simulationSpeed, setSimulationSpeed] = useState<number>(1);

  // Active Rider in Rider App
  const [couriers, setCouriers] = useState<Courier[]>(SAMPLE_COURIERS);
  const [activeRiderId, setActiveRiderId] = useState<string>(SAMPLE_COURIERS[0].id);

  // Admin dynamic state
  const [menuItems, setMenuItems] = useState<MenuItem[]>(INITIAL_MENU_ITEMS);
  const [offers, setOffers] = useState<PromoOffer[]>(INITIAL_OFFERS);
  const [activities, setActivities] = useState<CustomerActivity[]>(INITIAL_CUSTOMER_ACTIVITIES);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(true); // default authenticated for ease of use

  // Accounts & Authentication state
  const [accounts, setAccounts] = useState<UserAccount[]>(INITIAL_ACCOUNTS);
  const [currentUser, setCurrentUser] = useState<UserAccount>(INITIAL_ACCOUNTS[0]); // Samuel Amianda (Admin)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authTargetApp, setAuthTargetApp] = useState<'admin' | 'store' | 'rider' | 'customer' | undefined>(undefined);

  // Support chat modal state
  const [isSupportOpen, setIsSupportOpen] = useState<boolean>(false);

  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'notif-1',
      title: 'New Customer Order #8105',
      message: 'Faith Njeri placed order for KSh 1,932 via M-Pesa. Awaiting Admin Clearance.',
      timestamp: '12:15 PM',
      type: 'order_new',
      orderId: 'ord-8105',
      unread: true,
    },
    {
      id: 'notif-2',
      title: 'Order #8104 Approved & In Kitchen',
      message: 'Alex Mercer order verified. Assigned to Rider Kelvin Mwangi.',
      timestamp: '12:05 PM',
      type: 'order_new',
      orderId: 'ord-8104',
      unread: false,
    },
    {
      id: 'notif-3',
      title: 'Dispatch Receipt Stamped',
      message: 'Receipt verified for KSh 1,446. Sealed with tamper seal.',
      timestamp: '12:08 PM',
      type: 'order_finished',
      orderId: 'ord-8104',
      unread: false,
    },
  ]);

  const activeOrder = orders.find((o) => o.id === activeOrderId) || orders[0];

  // Pending counts for badges
  const pendingApprovalsCount = orders.filter((o) => o.status === 'pending_admin_approval').length;
  const storeReadyCount = orders.filter((o) => o.status === 'admin_approved' || o.status === 'kitchen_preparing').length;
  const riderActiveCount = orders.filter((o) => o.status === 'order_finished' || o.status === 'in_transit' || o.status === 'arriving').length;

  // Helper to log customer activity to Admin stream
  const logActivity = (
    actor: string,
    type: CustomerActivity['type'],
    description: string,
    metadata?: string
  ) => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newAct: CustomerActivity = {
      id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: timeStr,
      actor,
      type,
      description,
      metadata,
    };
    setActivities((prev) => [newAct, ...prev]);
  };

  // Helper to append a new notification with sound & browser alert
  const addNotification = (
    title: string,
    message: string,
    type: NotificationItem['type'],
    orderId: string
  ) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      title,
      message,
      timestamp: timeStr,
      type,
      orderId,
      unread: true,
    };

    setNotifications((prev) => [newNotif, ...prev]);

    // Play appropriate Web Audio chime
    if (type === 'order_new') {
      playOrderNotificationSound('order_new');
    } else if (type === 'order_finished' || type === 'kitchen_ready') {
      playOrderNotificationSound('order_finished');
    } else if (type === 'courier_arriving') {
      playOrderNotificationSound('courier_arriving');
    } else if (type === 'system') {
      playOrderNotificationSound('order_delivered');
    }

    // Trigger Native Browser Web Notification if granted
    sendBrowserNotification(title, {
      body: message,
      tag: orderId,
    });
  };

  // Simulation Interval for active order GPS tracking
  useEffect(() => {
    if (!isSimulating) return;

    const intervalTime = Math.max(250, Math.floor(1000 / simulationSpeed));

    const interval = setInterval(() => {
      setOrders((prevOrders) => {
        return prevOrders.map((ord) => {
          if (ord.id !== activeOrderId) return ord;

          // If still awaiting admin, in store kitchen, or waiting for pickup, wait
          if (
            ord.status === 'pending_admin_approval' ||
            ord.status === 'admin_approved' ||
            ord.status === 'kitchen_preparing' ||
            ord.status === 'order_finished'
          ) {
            return ord;
          }

          if (ord.status === 'in_transit' || ord.status === 'arriving') {
            const nextIdx = ord.currentRouteIndex + 1;
            const totalPoints = ord.routeCoords.length;

            if (nextIdx >= totalPoints) {
              const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              addNotification(
                `Delivered! Order ${ord.displayNumber}`,
                `Versam Courier ${ord.courier?.name || 'Driver'} arrived and delivered your order to ${ord.deliveryAddress}.`,
                'system',
                ord.id
              );
              logActivity(
                `Courier ${ord.courier?.name || 'Driver'}`,
                'delivery',
                `Delivered order ${ord.displayNumber} at ${ord.deliveryAddress}. Amount KSh ${ord.totalPrice.toLocaleString()} settled.`,
                'Delivered'
              );
              return {
                ...ord,
                status: 'delivered',
                currentRouteIndex: totalPoints - 1,
                distanceRemainingKm: 0,
                etaMinutes: 0,
                statusTimestamps: {
                  ...ord.statusTimestamps,
                  delivered: now,
                },
              };
            }

            const currentCoord = ord.routeCoords[nextIdx];
            const nextCoord = ord.routeCoords[Math.min(totalPoints - 1, nextIdx + 1)];
            const newHeading = calculateBearing(
              currentCoord[0],
              currentCoord[1],
              nextCoord[0],
              nextCoord[1]
            );

            const remainingDistance = calculateRemainingRouteDistance(ord.routeCoords, nextIdx);
            const remainingMinutes = Math.max(1, Math.ceil(remainingDistance * 2.8));

            // Check if nearing delivery (< 4 points remaining)
            let newStatus: OrderStatus = 'in_transit';
            if (nextIdx >= totalPoints - 4) {
              newStatus = 'arriving';
              if (ord.status !== 'arriving') {
                addNotification(
                  `Courier Arriving Soon!`,
                  `${ord.courier?.name} is less than 1 minute away from ${ord.deliveryAddress}.`,
                  'courier_arriving',
                  ord.id
                );
                logActivity(
                  `GPS Telemetry`,
                  'delivery',
                  `Courier ${ord.courier?.name} is within 300m of ${ord.deliveryAddress}`,
                  'Proximity Alert'
                );
              }
            }

            return {
              ...ord,
              status: newStatus,
              currentRouteIndex: nextIdx,
              distanceRemainingKm: remainingDistance,
              etaMinutes: remainingMinutes,
              courier: ord.courier
                ? {
                    ...ord.courier,
                    currentCoords: currentCoord,
                    heading: newHeading || ord.courier.heading,
                    speedKmh: Math.floor(22 + Math.sin(nextIdx) * 6),
                  }
                : undefined,
            };
          }

          return ord;
        });
      });
    }, intervalTime);

    return () => clearInterval(interval);
  }, [isSimulating, simulationSpeed, activeOrderId]);

  // Handler: Manually advance single step
  const handleStepForward = () => {
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id !== activeOrderId) return ord;
        const totalPoints = ord.routeCoords.length;
        const nextIdx = Math.min(totalPoints - 1, ord.currentRouteIndex + 1);
        const currentCoord = ord.routeCoords[nextIdx];
        const nextCoord = ord.routeCoords[Math.min(totalPoints - 1, nextIdx + 1)];
        const newHeading = calculateBearing(
          currentCoord[0],
          currentCoord[1],
          nextCoord[0],
          nextCoord[1]
        );
        const remainingDistance = calculateRemainingRouteDistance(ord.routeCoords, nextIdx);
        const remainingMinutes = Math.max(1, Math.ceil(remainingDistance * 2.8));

        const isFinished = nextIdx >= totalPoints - 1;
        const status: OrderStatus = isFinished ? 'delivered' : ord.status === 'kitchen_preparing' ? 'in_transit' : ord.status;

        return {
          ...ord,
          status,
          currentRouteIndex: nextIdx,
          distanceRemainingKm: remainingDistance,
          etaMinutes: isFinished ? 0 : remainingMinutes,
          courier: ord.courier
            ? {
                ...ord.courier,
                currentCoords: currentCoord,
                heading: newHeading || ord.courier.heading,
              }
            : undefined,
        };
      })
    );
  };

  // Handler: Transition order status directly
  const handleAdvanceToStatus = (newStatus: OrderStatus) => {
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id !== activeOrderId) return ord;

        if (newStatus === 'order_finished') {
          addNotification(
            `Order ${ord.displayNumber} Finished & Ready!`,
            `The kitchen has completed cooking. Courier ${ord.courier?.name || 'Driver'} is dispatched with your meal!`,
            'order_finished',
            ord.id
          );
          logActivity(
            'Kitchen Dispatch',
            'dispatch',
            `Order ${ord.displayNumber} marked finished & dispatched with courier`,
            'Dispatched'
          );
          return {
            ...ord,
            status: 'order_finished',
            statusTimestamps: {
              ...ord.statusTimestamps,
              order_finished: now,
            },
          };
        }

        if (newStatus === 'delivered') {
          addNotification(
            `Order ${ord.displayNumber} Delivered!`,
            `Your package was delivered to ${ord.deliveryAddress}.`,
            'system',
            ord.id
          );
          return {
            ...ord,
            status: 'delivered',
            currentRouteIndex: ord.routeCoords.length - 1,
            distanceRemainingKm: 0,
            etaMinutes: 0,
            statusTimestamps: {
              ...ord.statusTimestamps,
              delivered: now,
            },
          };
        }

        return {
          ...ord,
          status: newStatus,
          statusTimestamps: {
            ...ord.statusTimestamps,
            [newStatus]: now,
          },
        };
      })
    );
  };

  // Handler: Reset Order Demo
  const handleResetOrder = () => {
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id !== activeOrderId) return ord;
        return {
          ...INITIAL_ORDERS[1],
          id: ord.id,
          displayNumber: ord.displayNumber,
          customerName: ord.customerName,
          deliveryAddress: ord.deliveryAddress,
          status: 'kitchen_preparing',
          currentRouteIndex: 0,
          courier: ord.courier
            ? {
                ...ord.courier,
                currentCoords: ord.routeCoords[0],
                speedKmh: 24,
              }
            : undefined,
        };
      })
    );
    setIsSimulating(true);
    addNotification(
      'Simulation Reset',
      'Order reset to kitchen prep phase. Versam courier stationed at restaurant.',
      'system',
      activeOrderId
    );
  };

  // Kitchen handler: Accept order
  const handleKitchenAccept = (orderId: string) => {
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id !== orderId) return ord;
        return {
          ...ord,
          status: 'kitchen_preparing',
          statusTimestamps: {
            ...ord.statusTimestamps,
            kitchen_preparing: now,
          },
        };
      })
    );
    addNotification(
      'Order Accepted in Kitchen',
      'The kitchen team has started picking & grilling your order.',
      'order_new',
      orderId
    );
    logActivity('Store & Kitchen', 'order', `Accepted order ${orderId}; picking & preparation underway`);
  };

  // Kitchen handler: Mark order finished and ready for pickup
  const handleKitchenFinish = (orderId: string) => {
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id !== orderId) return ord;
        return {
          ...ord,
          status: 'order_finished',
          statusTimestamps: {
            ...ord.statusTimestamps,
            order_finished: now,
          },
        };
      })
    );
    addNotification(
      `Order Finished & Ready!`,
      `Store packed the order and verified the receipt. Ready for courier pickup!`,
      'order_finished',
      orderId
    );
  };

  // Kitchen handler: Verify receipt photo & exact KSh amount
  const handleVerifyReceipt = (
    orderId: string,
    photoUrl: string,
    verifiedAmount: number,
    verifiedBy: string,
    notes: string
  ) => {
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const receiptData: ReceiptVerification = {
      photoUrl,
      verifiedAmount,
      verifiedAt: now,
      verifiedBy,
      notes,
    };

    setOrders((prev) =>
      prev.map((ord) => (ord.id === orderId ? { ...ord, receiptVerification: receiptData } : ord))
    );

    logActivity(
      verifiedBy,
      'dispatch',
      `Receipt verified for order ${orderId}: KSh ${verifiedAmount.toLocaleString()} matches invoice. Photo stamped.`,
      'Handover Approved'
    );

    addNotification(
      `Receipt Verified: KSh ${verifiedAmount.toLocaleString()}`,
      `Kitchen confirmed package contents and invoice with tamper seal.`,
      'kitchen_ready',
      orderId
    );
  };

  // Simulate an incoming customer order
  const handleSimulateNewOrder = () => {
    const newNum = Math.floor(1000 + Math.random() * 9000);
    const id = `ord-${newNum}`;
    const destination = PRESET_DESTINATIONS[Math.floor(Math.random() * PRESET_DESTINATIONS.length)];
    const restaurant = RESTAURANTS[Math.floor(Math.random() * RESTAURANTS.length)];
    const route = buildRouteBetween(restaurant.coords, destination.coords);

    const newOrder: Order = {
      id,
      displayNumber: `#${newNum}`,
      customerName: ['Sophia Chen', 'David Kim', 'Faith Njeri', 'Brian Otieno'][
        Math.floor(Math.random() * 4)
      ],
      customerPhone: SUPPORT_CONTACTS.primary,
      deliveryAddress: destination.label,
      deliveryInstructions: destination.instructions,
      deliveryCoords: destination.coords,
      restaurant,
      items: [
        {
          id: menuItems[0].id,
          name: menuItems[0].name,
          price: menuItems[0].price,
          quantity: 1,
          image: menuItems[0].image,
          picked: false,
        },
        {
          id: menuItems[1]?.id || menuItems[0].id,
          name: menuItems[1]?.name || 'Truffle Aioli Dip',
          price: menuItems[1]?.price || 350,
          quantity: 1,
          picked: false,
        },
      ],
      subtotal: menuItems[0].price + (menuItems[1]?.price || 350),
      tax: 96,
      deliveryFee: 150,
      totalPrice: menuItems[0].price + (menuItems[1]?.price || 350) + 246,
      paymentMethod: 'mpesa',
      mpesaDetails: {
        phone: SUPPORT_CONTACTS.primary,
        transactionCode: `QK${Math.floor(10 + Math.random() * 89)}XP${Math.floor(1000 + Math.random() * 9000)}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'verified',
      },
      status: 'pending_admin_approval', // Starts in pending admin approval!
      createdAt: 'Just now',
      statusTimestamps: {
        pending_admin_approval: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
      courier: undefined,
      routeCoords: route,
      currentRouteIndex: 0,
      etaMinutes: 14,
      distanceRemainingKm: calculateRemainingRouteDistance(route, 0),
    };

    setOrders((prev) => [newOrder, ...prev]);
    setActiveOrderId(id);

    logActivity(
      `${newOrder.customerName} (${SUPPORT_CONTACTS.primary})`,
      'order',
      `Placed order #${newNum} for KSh ${newOrder.totalPrice.toLocaleString()} via M-Pesa. Awaiting Admin Approval.`,
      'Pending Approval'
    );

    addNotification(
      `New Inbound Order #${newNum}!`,
      `${newOrder.customerName} placed order. Awaiting Admin HQ clearance.`,
      'order_new',
      id
    );
  };

  // Cart operations
  const handleAddToCart = (dish: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === dish.id);
      if (existing) {
        return prev.map((i) => (i.id === dish.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [
        ...prev,
        {
          id: dish.id,
          sku: dish.sku,
          name: dish.name,
          price: dish.price,
          quantity: 1,
          image: dish.image,
        },
      ];
    });

    logActivity('Customer', 'cart', `Added ${dish.name} (SKU: ${dish.sku}) to cart`);
    playOrderNotificationSound('click');
  };

  const handleUpdateCartQty = (dishId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((i) => {
          if (i.id === dishId) {
            const newQty = i.quantity + delta;
            return newQty > 0 ? { ...i, quantity: newQty } : null;
          }
          return i;
        })
        .filter(Boolean) as OrderItem[];
    });
  };

  // Customer Checkout: Places order in 'pending_admin_approval'
  const handleCheckout = (
    destinationIndex: number, 
    customInstructions: string,
    paymentMethod: 'mpesa' | 'cash_on_delivery',
    mpesaPhone: string,
    mpesaTransactionCode: string,
    appliedPromoCode?: string
  ) => {
    if (cart.length === 0) return;
    const dest = PRESET_DESTINATIONS[destinationIndex];
    const restaurant = RESTAURANTS[0];
    const route = buildRouteBetween(restaurant.coords, dest.coords);
    const newNum = Math.floor(1000 + Math.random() * 9000);
    const id = `ord-${newNum}`;

    const subtotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const tax = Math.round(subtotal * 0.08);
    const deliveryFee = 150;

    let discountAmount = 0;
    if (appliedPromoCode) {
      const offer = offers.find((o) => o.code === appliedPromoCode);
      if (offer) {
        discountAmount = offer.discountPercent > 0 
          ? Math.round((subtotal * offer.discountPercent) / 100)
          : deliveryFee;
      }
    }

    const totalPrice = Math.max(0, subtotal + tax + deliveryFee - discountAmount);
    const bulkCheck = checkIsBulkOrder({ items: cart, totalPrice, subtotal });

    const newOrder: Order = {
      id,
      displayNumber: `#${newNum}`,
      customerName: currentUser.name || 'Alex Mercer',
      customerPhone: mpesaPhone || currentUser.phone || SUPPORT_CONTACTS.primary,
      deliveryAddress: dest.label,
      deliveryInstructions: customInstructions || dest.instructions,
      deliveryCoords: dest.coords,
      restaurant,
      items: cart.map((it) => ({ ...it, picked: false })),
      subtotal,
      tax,
      deliveryFee,
      discountAmount,
      promoCode: appliedPromoCode,
      totalPrice,
      paymentMethod,
      mpesaDetails: paymentMethod === 'mpesa' ? {
        phone: mpesaPhone || SUPPORT_CONTACTS.mpesaPayNumber,
        transactionCode: mpesaTransactionCode || `QK${Math.floor(10 + Math.random() * 89)}XP${Math.floor(1000 + Math.random() * 9000)}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'verified',
      } : undefined,
      status: 'pending_admin_approval', // User requirement: Customer places and Admin approves!
      createdAt: 'Just now',
      statusTimestamps: {
        pending_admin_approval: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
      courier: undefined,
      backupCourier: undefined,
      isBulkOrder: bulkCheck.isBulk,
      bulkOrderReason: bulkCheck.reason,
      routeCoords: route,
      currentRouteIndex: 0,
      etaMinutes: 14,
      distanceRemainingKm: calculateRemainingRouteDistance(route, 0),
    };

    setOrders((prev) => [newOrder, ...prev]);
    setActiveOrderId(id);
    setCart([]);
    setCustomerSubView('track');
    setActiveApp('customer');

    logActivity(
      `${newOrder.customerName} (${paymentMethod === 'mpesa' ? mpesaPhone : 'Cash'})`,
      'order',
      `Placed order #${newNum} for KSh ${totalPrice.toLocaleString()}${bulkCheck.isBulk ? ' [BULK ORDER]' : ''}. Submitted to Versam Admin for clearance.`,
      bulkCheck.isBulk ? 'Bulk Order' : 'Awaiting Admin'
    );

    addNotification(
      `Order Placed: KSh ${totalPrice.toLocaleString()}!`,
      `Order #${newNum} submitted. Versam Admin will approve and assign your courier.`,
      'order_new',
      id
    );
  };

  // Admin Callbacks: Approvals, Rejections, Rider Assignments (with Proximity & Bulk Backup Support)
  const handleAdminApproveOrder = (orderId: string, assignedCourierId: string, backupCourierId?: string) => {
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const chosenCourier = couriers.find((c) => c.id === assignedCourierId) || couriers[0];
    const backupCourier = backupCourierId ? couriers.find((c) => c.id === backupCourierId) : undefined;

    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id !== orderId) return ord;
        return {
          ...ord,
          status: 'admin_approved',
          courier: {
            ...chosenCourier,
            currentCoords: ord.routeCoords[0],
            heading: calculateBearing(ord.routeCoords[0][0], ord.routeCoords[0][1], ord.routeCoords[1][0], ord.routeCoords[1][1]),
          },
          backupCourier: backupCourier,
          isBulkOrder: Boolean(backupCourier || ord.isBulkOrder),
          statusTimestamps: {
            ...ord.statusTimestamps,
            admin_approved: now,
          },
        };
      })
    );

    // Update courier statuses
    setCouriers((prev) =>
      prev.map((c) => {
        if (c.id === assignedCourierId || c.id === backupCourierId) {
          return { ...c, status: 'assigned' };
        }
        return c;
      })
    );

    addNotification(
      `Order Approved by Admin!`,
      `Order cleared by HQ. Assigned to Rider ${chosenCourier.name}${backupCourier ? ` + Backup ${backupCourier.name}` : ''}. Routed to Store!`,
      'order_new',
      orderId
    );

    logActivity(
      'Versam Admin HQ',
      'dispatch',
      `Approved order ${orderId}. Lead Rider: ${chosenCourier.name} (${chosenCourier.vehiclePlate})${backupCourier ? ` • Backup Rider: ${backupCourier.name} (${backupCourier.vehiclePlate})` : ''}`,
      'Admin Approved'
    );
  };

  // User Accounts & Authentication Handlers
  const handleSelectUser = (user: UserAccount) => {
    setCurrentUser(user);
    if (user.role === 'admin') {
      setIsAdminAuthenticated(true);
    }
    if (user.role === 'store') {
      setActiveApp('store');
    } else if (user.role === 'rider') {
      if (user.riderId) setActiveRiderId(user.riderId);
      setActiveApp('rider');
    } else if (user.role === 'customer') {
      setActiveApp('customer');
    }
    logActivity(user.name, 'support', `Logged in via PIN as ${user.roleLabel}`);
  };

  const handleRegisterCustomer = (name: string, phone: string, email: string, pin: string) => {
    const newAcc: UserAccount = {
      id: `acc-cust-${Date.now()}`,
      name,
      phone,
      email: email || `${name.toLowerCase().replace(/\s+/g, '.')}@gmail.com`,
      pin,
      role: 'customer',
      roleLabel: 'Registered Customer',
      status: 'active',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=160&auto=format&fit=crop&q=80',
      createdAt: new Date().toISOString().split('T')[0],
      lastLogin: 'Just registered',
    };
    setAccounts((prev) => [newAcc, ...prev]);
    setCurrentUser(newAcc);
    logActivity(name, 'support', `Registered new customer account with phone ${phone}`);
    addNotification('Account Created!', `Welcome to Versam Ventures, ${name}!`, 'system', '');
  };

  const handleOnboardRider = (riderData: {
    name: string;
    phone: string;
    email: string;
    vehicle: Courier['vehicle'];
    vehiclePlate: string;
    pin: string;
    hubCoords: [number, number];
    photoUrl?: string;
  }) => {
    const newRiderId = `cour-${Date.now()}`;
    const newCourier: Courier = {
      id: newRiderId,
      name: riderData.name,
      photoUrl: riderData.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80',
      vehicle: riderData.vehicle,
      vehiclePlate: riderData.vehiclePlate,
      rating: 5.0,
      phone: riderData.phone,
      completedDeliveries: 0,
      currentCoords: riderData.hubCoords,
      heading: 0,
      speedKmh: 22,
      status: 'available',
    };

    const newAcc: UserAccount = {
      id: `acc-rider-${Date.now()}`,
      name: riderData.name,
      email: riderData.email,
      phone: riderData.phone,
      pin: riderData.pin,
      role: 'rider',
      roleLabel: `Courier Rider (${riderData.vehiclePlate})`,
      riderId: newRiderId,
      vehicle: riderData.vehicle,
      vehiclePlate: riderData.vehiclePlate,
      status: 'active',
      avatarUrl: newCourier.photoUrl,
      createdAt: new Date().toISOString().split('T')[0],
      lastLogin: 'Pending first run',
      notes: 'Authorized and onboarded exclusively by Admin desk.',
    };

    setCouriers((prev) => [...prev, newCourier]);
    setAccounts((prev) => [...prev, newAcc]);
    logActivity('Admin Operations Desk', 'dispatch', `Onboarded new courier rider ${riderData.name} (${riderData.vehiclePlate}) with PIN ${riderData.pin}`);
    addNotification('New Courier Onboarded', `${riderData.name} is now registered and can sign in to the Rider App.`, 'system', '');
  };

  const handleToggleAccountStatus = (accountId: string) => {
    setAccounts((prev) =>
      prev.map((acc) =>
        acc.id === accountId
          ? { ...acc, status: acc.status === 'active' ? 'suspended' : 'active' }
          : acc
      )
    );
  };

  const handleResetAccountPin = (accountId: string, newPin: string) => {
    setAccounts((prev) =>
      prev.map((acc) => (acc.id === accountId ? { ...acc, pin: newPin } : acc))
    );
    const target = accounts.find((a) => a.id === accountId);
    if (target) {
      logActivity('Admin Desk', 'support', `Reset PIN for account ${target.name} (${target.phone}) to ${newPin}`);
      addNotification('Security PIN Reset', `PIN updated for ${target.name}.`, 'system', '');
    }
  };

  const handleUpdateAccount = (updated: UserAccount) => {
    setAccounts((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
  };

  const handleAddAccount = (newAcc: UserAccount) => {
    setAccounts((prev) => [newAcc, ...prev]);
    logActivity('Admin Desk', 'support', `Created new system account for ${newAcc.name} (${newAcc.role})`);
  };

  const handleAdminRejectOrder = (orderId: string, reason: string) => {
    setOrders((prev) =>
      prev.map((ord) => (ord.id === orderId ? { ...ord, status: 'cancelled' } : ord))
    );
    addNotification(`Order Rejected by Admin`, `Reason: ${reason}`, 'system', orderId);
    logActivity('Versam Admin HQ', 'support', `Rejected order ${orderId}: ${reason}`, 'Cancelled');
  };

  const handleAdminReassignCourier = (orderId: string, newCourierId: string) => {
    const chosenCourier = couriers.find((c) => c.id === newCourierId);
    if (!chosenCourier) return;

    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id !== orderId) return ord;
        return {
          ...ord,
          courier: {
            ...chosenCourier,
            currentCoords: ord.courier?.currentCoords || ord.routeCoords[0],
            heading: ord.courier?.heading || 0,
          },
        };
      })
    );

    logActivity('Versam Admin HQ', 'dispatch', `Reassigned order ${orderId} to Rider ${chosenCourier.name}`);
  };

  // Admin auth
  const handleAuthenticateAdmin = (pin: string) => {
    if (
      pin === '7439' || 
      pin.toLowerCase() === 'admin' || 
      pin.toLowerCase() === 'samuelamianda3@gmail.com'
    ) {
      setIsAdminAuthenticated(true);
      return true;
    }
    return false;
  };

  // Glovo / Pelican Store & Picker callbacks: Item Picking, Out of Stock & Substitutions
  const handleItemPicked = (orderId: string, itemId: string) => {
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id !== orderId) return ord;
        return {
          ...ord,
          items: ord.items.map((it) => {
            if (it.id !== itemId) return it;
            const newPicked = !it.picked;
            return {
              ...it,
              picked: newPicked,
              status: newPicked ? ('picked' as const) : ('pending' as const),
            };
          }),
        };
      })
    );
    playOrderNotificationSound('click');
  };

  const handleSubstituteItem = (
    orderId: string,
    originalItemId: string,
    substitute: MenuItem,
    reason: string
  ) => {
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id !== orderId) return ord;

        const targetItem = ord.items.find((i) => i.id === originalItemId);
        if (!targetItem) return ord;

        const newItems = ord.items.map((it) => {
          if (it.id !== originalItemId) return it;
          return {
            ...it,
            status: 'substituted' as const,
            picked: true,
            substitution: {
              originalItemId: it.id,
              originalName: it.name,
              originalPrice: it.price,
              substituteItemId: substitute.id,
              substituteName: substitute.name,
              substitutePrice: substitute.price,
              reason,
              timestamp: now,
            },
          };
        });

        const newSubtotal = newItems.reduce(
          (sum, i) =>
            sum +
            (i.status === 'removed'
              ? 0
              : (i.substitution ? i.substitution.substitutePrice : i.price) * i.quantity),
          0
        );
        const tax = Math.round(newSubtotal * 0.08);
        const newTotal = Math.max(0, newSubtotal + tax + ord.deliveryFee - (ord.discountAmount || 0));

        return {
          ...ord,
          items: newItems,
          subtotal: newSubtotal,
          tax,
          totalPrice: newTotal,
        };
      })
    );

    addNotification(
      `Item Substituted by Store`,
      `Replaced with ${substitute.name} (KSh ${substitute.price.toLocaleString()})`,
      'order_new',
      orderId
    );

    logActivity(
      'Store Picker (Glovo Mode)',
      'order',
      `Substituted item for order ${orderId}: Replaced with ${substitute.name} (KSh ${substitute.price.toLocaleString()}). Reason: ${reason}`
    );
  };

  const handleRemoveItem = (orderId: string, itemId: string, reason: string) => {
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id !== orderId) return ord;

        const newItems = ord.items.map((it) => {
          if (it.id !== itemId) return it;
          return {
            ...it,
            status: 'removed' as const,
            picked: false,
          };
        });

        const newSubtotal = newItems.reduce(
          (sum, i) =>
            sum +
            (i.status === 'removed'
              ? 0
              : (i.substitution ? i.substitution.substitutePrice : i.price) * i.quantity),
          0
        );
        const tax = Math.round(newSubtotal * 0.08);
        const newTotal = Math.max(0, newSubtotal + tax + ord.deliveryFee - (ord.discountAmount || 0));

        return {
          ...ord,
          items: newItems,
          subtotal: newSubtotal,
          tax,
          totalPrice: newTotal,
        };
      })
    );

    addNotification(`Item Out of Stock & Refunded`, `An unavailable item was removed from order ${orderId}.`, 'system', orderId);
    logActivity('Store Picker', 'order', `Removed item from order ${orderId}. Total adjusted.`);
  };

  const handleToggleCatalogStock = (itemId: string) => {
    setMenuItems((prev) =>
      prev.map((it) => (it.id === itemId ? { ...it, inStock: it.inStock === false ? true : false } : it))
    );
  };

  // Rider App Callbacks
  const handleStartDeliveryRun = (orderId: string) => {
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id !== orderId) return ord;
        return {
          ...ord,
          status: 'in_transit',
          statusTimestamps: {
            ...ord.statusTimestamps,
            in_transit: now,
          },
        };
      })
    );
    setIsSimulating(true);
    addNotification(
      'Rider On The Way!',
      `Courier picked up the sealed order and started the live GPS delivery run!`,
      'courier_transit',
      orderId
    );
    logActivity('Rider App', 'delivery', `Courier picked up package and initiated GPS transit to customer.`);
  };

  const handleCompleteDelivery = (orderId: string) => {
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id !== orderId) return ord;
        return {
          ...ord,
          status: 'delivered',
          currentRouteIndex: ord.routeCoords.length - 1,
          distanceRemainingKm: 0,
          etaMinutes: 0,
          statusTimestamps: {
            ...ord.statusTimestamps,
            delivered: now,
          },
        };
      })
    );
    playOrderNotificationSound('order_delivered');
    addNotification(
      'Delivered Successfully!',
      'Customer handover verified. Order payment confirmed.',
      'system',
      orderId
    );
    logActivity('Rider App', 'delivery', `Delivered order ${orderId}. Handover complete.`);
  };

  // Menu items & Offers callbacks
  const handleUpdateMenuItem = (updated: MenuItem) => {
    setMenuItems((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
    logActivity('Admin Console', 'browse', `Updated price/stock for ${updated.name}: KSh ${updated.price.toLocaleString()}`);
  };

  const handleAddMenuItem = (newItem: MenuItem) => {
    setMenuItems((prev) => [newItem, ...prev]);
    logActivity('Admin Console', 'browse', `Added ${newItem.name} (KSh ${newItem.price.toLocaleString()}) to menu`);
  };

  const handleToggleOffer = (offerId: string) => {
    setOffers((prev) =>
      prev.map((off) => (off.id === offerId ? { ...off, active: !off.active } : off))
    );
  };

  const handleAddOffer = (newOffer: PromoOffer) => {
    setOffers((prev) => [newOffer, ...prev]);
    logActivity('Admin Console', 'support', `Activated new promo code ${newOffer.code}`);
  };

  const handleDeleteOffer = (offerId: string) => {
    setOffers((prev) => prev.filter((off) => off.id !== offerId));
  };

  const handleForceOrderStatus = (orderId: string, status: OrderStatus) => {
    handleAdvanceToStatus(status);
  };

  const handleDismissToast = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleClearAllNotifs = () => {
    setNotifications([]);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col antialiased">
      {/* 
        Top Bar Contract:
        [Brand title + custom bike icon] — [4 Apps Nav Switcher] — [Support Hotline + Notification Center]
      */}
      <header className="sticky top-0 z-[1000] bg-neutral-950/95 backdrop-blur-md border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Zone 1: Brand Wordmark */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 flex items-center justify-center p-1 shadow-lg shadow-emerald-500/20">
              <CourierBikeIcon className="w-full h-full" bagColor="#10b981" frameColor="#ffffff" />
            </div>
            <div>
              <span className="font-bold tracking-tight text-white block text-sm sm:text-base leading-tight">
                Versam Ventures
              </span>
              <span className="text-[10px] text-emerald-400 font-mono tracking-wider block">
                Nairobi Real-Time Delivery
              </span>
            </div>
          </div>

          {/* Zone 2: The 4 Distinct Apps Switcher (Single-line, clear role badges) */}
          <nav className="hidden md:flex items-center gap-1.5 bg-neutral-900/90 p-1 rounded-2xl border border-neutral-800 text-xs">
            {/* 1. Customer App */}
            <button
              onClick={() => setActiveApp('customer')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeApp === 'customer'
                  ? 'bg-emerald-500 text-neutral-950 font-bold shadow-md shadow-emerald-500/20'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Customer App</span>
            </button>

            {/* 2. Store / Picker App */}
            <button
              onClick={() => setActiveApp('store')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all flex items-center gap-1.5 cursor-pointer relative ${
                activeApp === 'store'
                  ? 'bg-emerald-500 text-neutral-950 font-bold shadow-md shadow-emerald-500/20'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>Store / Picker App</span>
              {storeReadyCount > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  activeApp === 'store' ? 'bg-neutral-950 text-emerald-400' : 'bg-emerald-500 text-neutral-950'
                }`}>
                  {storeReadyCount}
                </span>
              )}
            </button>

            {/* 3. Rider App */}
            <button
              onClick={() => setActiveApp('rider')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all flex items-center gap-1.5 cursor-pointer relative ${
                activeApp === 'rider'
                  ? 'bg-emerald-500 text-neutral-950 font-bold shadow-md shadow-emerald-500/20'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Bike className="w-3.5 h-3.5" />
              <span>Rider App</span>
              {riderActiveCount > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  activeApp === 'rider' ? 'bg-neutral-950 text-emerald-400' : 'bg-emerald-500 text-neutral-950'
                }`}>
                  {riderActiveCount}
                </span>
              )}
            </button>

            {/* 4. Admin App */}
            <button
              onClick={() => setActiveApp('admin')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all flex items-center gap-1.5 cursor-pointer relative ${
                activeApp === 'admin'
                  ? 'bg-emerald-500 text-neutral-950 font-bold shadow-md shadow-emerald-500/20'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Admin App</span>
              {pendingApprovalsCount > 0 ? (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold animate-pulse ${
                  activeApp === 'admin' ? 'bg-neutral-950 text-amber-400' : 'bg-amber-500 text-neutral-950'
                }`}>
                  {pendingApprovalsCount}
                </span>
              ) : !isAdminAuthenticated ? (
                <Lock className="w-3 h-3 text-neutral-500 ml-0.5" />
              ) : null}
            </button>
          </nav>

          {/* Zone 3: User Account / PIN Switcher + Support + Notification Center */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* User Account / PIN Login Switcher */}
            <button
              onClick={() => {
                setAuthTargetApp(undefined);
                setIsAuthModalOpen(true);
              }}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-emerald-500/50 text-xs text-neutral-300 transition cursor-pointer"
              title="Click to switch account or sign in with PIN"
            >
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.name}
                className="w-6 h-6 rounded-lg object-cover border border-neutral-700 shrink-0"
              />
              <div className="hidden lg:block text-left">
                <span className="block text-[11px] font-bold text-white leading-tight truncate max-w-[110px]">
                  {currentUser.name}
                </span>
                <span className="block text-[9px] text-emerald-400 font-mono capitalize leading-tight">
                  {currentUser.role} (PIN: {currentUser.pin})
                </span>
              </div>
              <span className="text-[10px] text-neutral-400 hidden sm:inline lg:hidden">
                {currentUser.name.split(' ')[0]}
              </span>
            </button>

            <button
              onClick={() => setIsSupportOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-emerald-500/50 text-neutral-300 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
              title="Customer Care: 0743926800 / 0795509505"
            >
              <Headphones className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Support: {SUPPORT_CONTACTS.primary}</span>
            </button>

            <NotificationCenter
              notifications={notifications}
              onDismissToast={handleDismissToast}
              onClearAll={handleClearAllNotifs}
              onSelectOrder={(id) => {
                setActiveOrderId(id);
                setActiveApp('customer');
                setCustomerSubView('track');
              }}
            />
          </div>
        </div>

        {/* Mobile Navigation bar for the 4 Apps */}
        <div className="md:hidden flex items-center justify-around border-t border-neutral-800/80 py-2 px-2 bg-neutral-900/95 text-[11px]">
          <button
            onClick={() => setActiveApp('customer')}
            className={`flex items-center gap-1 py-1 px-2.5 rounded-lg ${
              activeApp === 'customer' ? 'bg-emerald-500 text-neutral-950 font-bold' : 'text-neutral-400'
            }`}
          >
            <Smartphone className="w-3 h-3" />
            <span>Customer</span>
          </button>
          <button
            onClick={() => setActiveApp('store')}
            className={`flex items-center gap-1 py-1 px-2.5 rounded-lg relative ${
              activeApp === 'store' ? 'bg-emerald-500 text-neutral-950 font-bold' : 'text-neutral-400'
            }`}
          >
            <Store className="w-3 h-3" />
            <span>Store</span>
            {storeReadyCount > 0 && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
          </button>
          <button
            onClick={() => setActiveApp('rider')}
            className={`flex items-center gap-1 py-1 px-2.5 rounded-lg relative ${
              activeApp === 'rider' ? 'bg-emerald-500 text-neutral-950 font-bold' : 'text-neutral-400'
            }`}
          >
            <Bike className="w-3 h-3" />
            <span>Rider</span>
            {riderActiveCount > 0 && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
          </button>
          <button
            onClick={() => setActiveApp('admin')}
            className={`flex items-center gap-1 py-1 px-2.5 rounded-lg relative ${
              activeApp === 'admin' ? 'bg-emerald-500 text-neutral-950 font-bold' : 'text-neutral-400'
            }`}
          >
            <Sliders className="w-3 h-3" />
            <span>Admin</span>
            {pendingApprovalsCount > 0 && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
          </button>
        </div>

        {/* Operational Workflow Breadcrumb (Shows how the 4 apps interconnect) */}
        <div className="bg-neutral-950 border-t border-neutral-800/60 py-2 px-4 text-[11px] overflow-x-auto">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-neutral-400 whitespace-nowrap">
            <div className="flex items-center gap-2">
              <span className="text-neutral-500 font-semibold uppercase text-[10px] tracking-wider">
                System Workflow:
              </span>
              <span className={`px-2 py-0.5 rounded font-medium ${
                activeOrder?.status === 'pending_admin_approval' ? 'bg-emerald-500/20 text-emerald-300 font-bold' : ''
              }`}>
                1. Customer Places Order
              </span>
              <ArrowRight className="w-3 h-3 text-neutral-600" />
              <span className={`px-2 py-0.5 rounded font-medium ${
                activeOrder?.status === 'admin_approved' ? 'bg-emerald-500/20 text-emerald-300 font-bold' : ''
              }`}>
                2. Admin Approves & Assigns Rider
              </span>
              <ArrowRight className="w-3 h-3 text-neutral-600" />
              <span className={`px-2 py-0.5 rounded font-medium ${
                activeOrder?.status === 'kitchen_preparing' || activeOrder?.status === 'order_finished' ? 'bg-emerald-500/20 text-emerald-300 font-bold' : ''
              }`}>
                3. Store Prepares & Stamps Receipt
              </span>
              <ArrowRight className="w-3 h-3 text-neutral-600" />
              <span className={`px-2 py-0.5 rounded font-medium ${
                activeOrder?.status === 'in_transit' || activeOrder?.status === 'delivered' ? 'bg-emerald-500/20 text-emerald-300 font-bold' : ''
              }`}>
                4. Rider Delivers
              </span>
            </div>

            <div className="flex items-center gap-2 text-neutral-400">
              <span className="text-neutral-500">Active Order:</span>
              <span className="font-mono text-white font-bold">{activeOrder.displayNumber}</span>
              <span className="text-emerald-400 font-mono">({activeOrder.status.replace(/_/g, ' ')})</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* ========================================================= */}
        {/* APP 1: CUSTOMER APP (Ordering & Real-time Live GPS Tracking) */}
        {/* ========================================================= */}
        {activeApp === 'customer' && (
          <div className="space-y-6">
            {/* Customer Sub-Navigation Switcher (Menu vs Tracker) */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-neutral-900 border border-neutral-800 rounded-2xl p-3 shadow-md">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCustomerSubView('track')}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                    customerSubView === 'track'
                      ? 'bg-emerald-500 text-neutral-950 font-bold shadow-sm'
                      : 'bg-neutral-950 text-neutral-300 hover:text-white border border-neutral-800'
                  }`}
                >
                  <Map className="w-3.5 h-3.5" />
                  <span>Live Delivery Tracker & Map</span>
                </button>
                <button
                  onClick={() => setCustomerSubView('menu')}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                    customerSubView === 'menu'
                      ? 'bg-emerald-500 text-neutral-950 font-bold shadow-sm'
                      : 'bg-neutral-950 text-neutral-300 hover:text-white border border-neutral-800'
                  }`}
                >
                  <Utensils className="w-3.5 h-3.5" />
                  <span>Browse Menu & Order Food</span>
                  {cart.length > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-emerald-400 text-neutral-950 font-bold text-[10px]">
                      {cart.reduce((s, i) => s + i.quantity, 0)}
                    </span>
                  )}
                </button>
              </div>

              {/* Order selector if multiple orders */}
              {orders.length > 1 && (
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-neutral-400">Switch Order:</span>
                  <select
                    value={activeOrderId}
                    onChange={(e) => setActiveOrderId(e.target.value)}
                    className="bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1 text-xs text-white font-mono focus:outline-none"
                  >
                    {orders.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.displayNumber} — KSh {o.totalPrice.toLocaleString()} ({o.status.replace(/_/g, ' ')})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Sub-view: Live GPS Tracker */}
            {customerSubView === 'track' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* Interactive Map Column (7 cols) */}
                  <div className="lg:col-span-7 h-[460px] lg:h-[620px] w-full">
                    <InteractiveMap order={activeOrder} autoCenter={isSimulating} />
                  </div>

                  {/* Order Telemetry Column (5 cols) */}
                  <div className="lg:col-span-5 space-y-4">
                    <OrderTracker
                      order={activeOrder}
                      isSimulating={isSimulating}
                      simulationSpeed={simulationSpeed}
                      onToggleSimulation={() => setIsSimulating(!isSimulating)}
                      onChangeSpeed={setSimulationSpeed}
                      onStepForward={handleStepForward}
                      onResetOrder={handleResetOrder}
                      onAdvanceToStatus={handleAdvanceToStatus}
                      onOpenSupport={() => setIsSupportOpen(true)}
                    />

                    {/* Quick navigation to other role apps for testing */}
                    <div className="grid grid-cols-3 gap-2 pt-2">
                      <button
                        onClick={() => setActiveApp('store')}
                        className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-emerald-500/40 text-center transition cursor-pointer"
                      >
                        <Store className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                        <span className="text-xs font-semibold text-neutral-200 block">Store App</span>
                      </button>
                      <button
                        onClick={() => setActiveApp('rider')}
                        className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-emerald-500/40 text-center transition cursor-pointer"
                      >
                        <Bike className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                        <span className="text-xs font-semibold text-neutral-200 block">Rider App</span>
                      </button>
                      <button
                        onClick={() => setActiveApp('admin')}
                        className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-emerald-500/40 text-center transition cursor-pointer"
                      >
                        <Sliders className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                        <span className="text-xs font-semibold text-neutral-200 block">Admin App</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Sub-view: Storefront Food Menu */}
            {customerSubView === 'menu' && (
              <StorefrontView
                restaurants={RESTAURANTS}
                menuItems={menuItems}
                cart={cart}
                offers={offers}
                onAddToCart={handleAddToCart}
                onUpdateCartQty={handleUpdateCartQty}
                onCheckout={handleCheckout}
                onSwitchToTracking={() => setCustomerSubView('track')}
                onOpenSupport={() => setIsSupportOpen(true)}
                hasActiveOrder={orders.length > 0}
              />
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* APP 2: PICKER / RESTAURANT / STORE APP */}
        {/* ========================================================= */}
        {activeApp === 'store' && (
          <KitchenMerchantView
            orders={orders}
            catalog={menuItems}
            onAcceptOrder={handleKitchenAccept}
            onFinishOrder={handleKitchenFinish}
            onSimulateNewOrder={handleSimulateNewOrder}
            onSelectOrder={(id) => {
              setActiveOrderId(id);
            }}
            onItemPicked={handleItemPicked}
            onSubstituteItem={handleSubstituteItem}
            onRemoveItem={handleRemoveItem}
            onToggleCatalogStock={handleToggleCatalogStock}
            onAddMenuItem={handleAddMenuItem}
            onVerifyReceipt={handleVerifyReceipt}
            activeOrderId={activeOrderId}
          />
        )}

        {/* ========================================================= */}
        {/* APP 3: RIDER APP (Courier HUD & Live GPS Delivery Run) */}
        {/* ========================================================= */}
        {activeApp === 'rider' && (
          <RiderApp
            orders={orders}
            couriers={couriers}
            activeRiderId={activeRiderId}
            onSelectRider={setActiveRiderId}
            onStartDeliveryRun={handleStartDeliveryRun}
            onCompleteDelivery={handleCompleteDelivery}
            onViewReceipt={(url, amount) => {
              setIsSupportOpen(true);
            }}
            isSimulating={isSimulating}
            onToggleSimulate={() => setIsSimulating(!isSimulating)}
            onStepRun={handleStepForward}
          />
        )}

        {/* ========================================================= */}
        {/* APP 4: ADMIN APP (Protected Gate, Approvals, Riders, Prices) */}
        {/* ========================================================= */}
        {activeApp === 'admin' && (
          <AdminPortal
            menuItems={menuItems}
            onUpdateMenuItem={handleUpdateMenuItem}
            onAddMenuItem={handleAddMenuItem}
            offers={offers}
            onToggleOffer={handleToggleOffer}
            onAddOffer={handleAddOffer}
            onDeleteOffer={handleDeleteOffer}
            orders={orders}
            activities={activities}
            couriers={couriers}
            onApproveOrder={handleAdminApproveOrder}
            onRejectOrder={handleAdminRejectOrder}
            onReassignCourier={handleAdminReassignCourier}
            onForceOrderStatus={handleForceOrderStatus}
            isAdminAuthenticated={isAdminAuthenticated}
            onAuthenticateAdmin={handleAuthenticateAdmin}
            onLogoutAdmin={() => setIsAdminAuthenticated(false)}
            accounts={accounts}
            onUpdateAccount={handleUpdateAccount}
            onAddAccount={handleAddAccount}
            onToggleAccountStatus={handleToggleAccountStatus}
            onResetAccountPin={handleResetAccountPin}
            onOnboardRider={handleOnboardRider}
          />
        )}
      </main>

      {/* User Authentication & Persona Switcher Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        accounts={accounts}
        onSelectUser={handleSelectUser}
        targetApp={authTargetApp}
        onRegisterCustomer={handleRegisterCustomer}
      />

      {/* Chat & Support Modal (0743926800 / 0795509505) */}
      <ChatSupportModal
        isOpen={isSupportOpen}
        onClose={() => setIsSupportOpen(false)}
        activeOrderNumber={activeOrder?.displayNumber || '#8104'}
        onLogActivity={(desc) => logActivity('Customer via Chat', 'support', desc)}
      />

      {/* Clean Editorial Footer */}
      <footer className="border-t border-neutral-800/80 bg-neutral-950 py-6 mt-12 text-xs text-neutral-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-5 h-5 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center p-0.5">
              <CourierBikeIcon className="w-full h-full" bagColor="#10b981" frameColor="#ffffff" />
            </div>
            <span className="font-bold text-neutral-300">Versam Ventures Delivery Platform</span>
            <span>·</span>
            <span>Support: {SUPPORT_CONTACTS.primary} / {SUPPORT_CONTACTS.secondary}</span>
            <span>·</span>
            <span>M-Pesa Pay: {SUPPORT_CONTACTS.mpesaPayNumber}</span>
          </div>
          <div className="flex items-center gap-4 text-neutral-400">
            <button
              onClick={() => setIsSupportOpen(true)}
              className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Headphones className="w-3.5 h-3.5" />
              <span>Live Support Desk</span>
            </button>
            <span>·</span>
            <a
              href="/versam-ventures.tar.gz"
              download="versam-ventures.tar.gz"
              className="text-neutral-400 hover:text-white transition-colors underline underline-offset-4 cursor-pointer"
            >
              Download App Package (.tar.gz)
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

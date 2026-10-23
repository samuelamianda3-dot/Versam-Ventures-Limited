import React, { useState } from 'react';
import { NotificationItem } from '../types';
import { 
  Bell, 
  Volume2, 
  VolumeX, 
  CheckCircle2, 
  ChefHat, 
  Bike, 
  PackageCheck, 
  X, 
  Sparkles,
  Info
} from 'lucide-react';
import { playOrderNotificationSound, isSoundEnabled, setSoundEnabled } from '../utils/audio';
import { requestBrowserNotificationPermission, getNotificationPermission } from '../utils/notifications';

interface NotificationCenterProps {
  notifications: NotificationItem[];
  onDismissToast: (id: string) => void;
  onClearAll: () => void;
  onSelectOrder?: (orderId: string) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications,
  onDismissToast,
  onClearAll,
  onSelectOrder,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [soundOn, setSoundOn] = useState(isSoundEnabled());
  const [browserPermission, setBrowserPermission] = useState(getNotificationPermission());

  const unreadCount = notifications.filter((n) => n.unread).length;
  // Recent 3 unread notifications show as active toasts
  const activeToasts = notifications.slice(0, 3);

  const toggleSound = () => {
    const nextState = !soundOn;
    setSoundOn(nextState);
    setSoundEnabled(nextState);
    if (nextState) {
      playOrderNotificationSound('click');
    }
  };

  const handleRequestNativePermission = async () => {
    const permission = await requestBrowserNotificationPermission();
    setBrowserPermission(permission);
    if (permission === 'granted') {
      playOrderNotificationSound('order_finished');
    }
  };

  const handleTestSound = (type: 'order_new' | 'order_finished' | 'order_delivered') => {
    playOrderNotificationSound(type);
  };

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'order_new':
        return <ChefHat className="w-4 h-4 text-emerald-400" />;
      case 'order_finished':
      case 'kitchen_ready':
        return <PackageCheck className="w-4 h-4 text-green-400" />;
      case 'courier_transit':
      case 'courier_arriving':
        return <Bike className="w-4 h-4 text-emerald-300" />;
      default:
        return <Info className="w-4 h-4 text-teal-400" />;
    }
  };

  return (
    <>
      {/* Floating Bell Trigger in App Header or Navigation */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white hover:border-emerald-600/50 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          title="Notification Center"
          aria-label="Open notifications"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 text-neutral-950 text-[11px] font-bold flex items-center justify-center ring-2 ring-neutral-950 animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Dropdown / Popover Tray */}
        {isOpen && (
          <div className="absolute right-0 mt-3 w-84 sm:w-96 rounded-2xl bg-neutral-900/98 backdrop-blur-xl border border-neutral-800 shadow-2xl z-[1000] p-4 text-neutral-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-emerald-400" />
                <h3 className="font-semibold text-sm">Notifications</h3>
                <span className="text-xs text-neutral-400">({notifications.length})</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleSound}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
                  title={soundOn ? 'Mute chimes' : 'Unmute chimes'}
                >
                  {soundOn ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Notification settings bar */}
            <div className="py-2.5 px-3 my-2 rounded-xl bg-neutral-950/70 border border-neutral-800/80 flex items-center justify-between text-xs">
              <div>
                <span className="text-neutral-300 font-medium block">Desktop Alerts</span>
                <span className="text-neutral-500 text-[11px]">
                  {browserPermission === 'granted' ? 'Native active' : 'Click to enable in browser'}
                </span>
              </div>
              {browserPermission !== 'granted' ? (
                <button
                  onClick={handleRequestNativePermission}
                  className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 font-medium transition-colors border border-emerald-500/30"
                >
                  Enable
                </button>
              ) : (
                <span className="text-emerald-400 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Ready
                </span>
              )}
            </div>

            {/* Quick sound test buttons */}
            <div className="flex items-center gap-1.5 mb-2 pb-2 border-b border-neutral-800/60 overflow-x-auto text-[11px] text-neutral-400">
              <span className="shrink-0 text-neutral-500">Test Chimes:</span>
              <button
                onClick={() => handleTestSound('order_new')}
                className="px-2 py-0.5 rounded bg-neutral-800 hover:bg-emerald-950/50 hover:text-emerald-300 text-neutral-300 transition-colors shrink-0"
              >
                New Order
              </button>
              <button
                onClick={() => handleTestSound('order_finished')}
                className="px-2 py-0.5 rounded bg-neutral-800 hover:bg-emerald-950/50 hover:text-emerald-300 text-neutral-300 transition-colors shrink-0"
              >
                Order Ready
              </button>
              <button
                onClick={() => handleTestSound('order_delivered')}
                className="px-2 py-0.5 rounded bg-neutral-800 hover:bg-emerald-950/50 hover:text-emerald-300 text-neutral-300 transition-colors shrink-0"
              >
                Delivered
              </button>
            </div>

            {/* Notifications List */}
            <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
              {notifications.length === 0 ? (
                <div className="py-8 text-center text-neutral-500 text-xs">
                  No notifications yet. Place an order or trigger simulation!
                </div>
              ) : (
                notifications.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => onSelectOrder?.(item.orderId)}
                    className="p-2.5 rounded-xl bg-neutral-950/60 hover:bg-neutral-800/60 border border-neutral-800/60 transition-all cursor-pointer group"
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 shrink-0 mt-0.5">
                        {getIcon(item.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-2">
                          <h4 className="text-xs font-semibold text-neutral-200 group-hover:text-emerald-400 transition-colors truncate">
                            {item.title}
                          </h4>
                          <span className="text-[10px] text-neutral-500 shrink-0 font-mono">
                            {item.timestamp}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-400 mt-0.5 line-clamp-2">
                          {item.message}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="pt-3 mt-2 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
                <span>{notifications.length} logged events</span>
                <button
                  onClick={onClearAll}
                  className="hover:text-neutral-200 transition-colors"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating Live Toasts (top right banner) */}
      <div className="fixed top-20 right-4 z-[1100] max-w-sm w-full pointer-events-none space-y-2">
        {activeToasts.map((toast) => (
          <div
            key={`toast-${toast.id}`}
            className="pointer-events-auto bg-neutral-900/95 backdrop-blur-xl border border-emerald-500/40 rounded-2xl p-3.5 shadow-2xl shadow-black/80 flex items-start gap-3 animate-in slide-in-from-top-4 fade-in duration-300"
          >
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 shrink-0 text-emerald-400">
              {getIcon(toast.type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  Live Update
                </span>
                <span className="text-[10px] text-neutral-500 font-mono">{toast.timestamp}</span>
              </div>
              <h4 className="text-xs font-semibold text-neutral-100 mt-0.5">{toast.title}</h4>
              <p className="text-xs text-neutral-300 mt-0.5 leading-snug">{toast.message}</p>
            </div>
            <button
              onClick={() => onDismissToast(toast.id)}
              className="text-neutral-500 hover:text-neutral-300 p-1 rounded-lg transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </>
  );
};

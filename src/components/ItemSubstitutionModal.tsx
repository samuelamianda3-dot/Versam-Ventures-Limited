import React, { useState } from 'react';
import { OrderItem, MenuItem } from '../types';
import { 
  AlertTriangle, 
  Search, 
  Check, 
  X, 
  RefreshCw, 
  Trash2, 
  Phone, 
  DollarSign, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { SUPPORT_CONTACTS } from '../data/mockData';

interface ItemSubstitutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: OrderItem;
  catalog: MenuItem[];
  customerPhone: string;
  onSubstitute: (
    originalItemId: string,
    substituteItem: MenuItem,
    reason: string
  ) => void;
  onRemoveItem: (originalItemId: string, reason: string) => void;
}

export const ItemSubstitutionModal: React.FC<ItemSubstitutionModalProps> = ({
  isOpen,
  onClose,
  item,
  catalog,
  customerPhone,
  onSubstitute,
  onRemoveItem,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubItem, setSelectedSubItem] = useState<MenuItem | null>(null);
  const [subReason, setSubReason] = useState('Out of stock in kitchen/store inventory');
  const [callNoted, setCallNoted] = useState(false);

  if (!isOpen) return null;

  // Filter catalog items for suggestions (excluding current item)
  const candidateSubstitutes = catalog.filter((c) => {
    if (c.id === item.id) return false;
    if (c.inStock === false) return false;
    if (!searchQuery.trim()) {
      return true;
    }
    return (
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const handleConfirmSubstitution = () => {
    if (!selectedSubItem) return;
    onSubstitute(item.id, selectedSubItem, subReason);
    onClose();
  };

  const handleConfirmRemoval = () => {
    onRemoveItem(item.id, subReason || 'Item out of stock, no substitute available');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                Glovo / Pelican Picker Flow
              </span>
              <h2 className="text-lg font-bold text-white">Item Out of Stock & Substitute</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-neutral-800 text-neutral-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Target Item Card */}
        <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">
              Unavailable Customer Item
            </span>
            <h3 className="text-sm font-bold text-white mt-0.5">{item.name}</h3>
            <p className="text-xs text-neutral-400 font-mono">
              Qty: {item.quantity} • Price: KSh {item.price.toLocaleString()}
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            Out of Stock
          </span>
        </div>

        {/* Customer Contact Call Helper */}
        <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-neutral-300">
            <Phone className="w-4 h-4 text-emerald-400" />
            <span>Notify Customer: <strong className="font-mono text-white">{customerPhone}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={`tel:${customerPhone}`}
              className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold transition"
            >
              Call Customer
            </a>
            <button
              onClick={() => setCallNoted(!callNoted)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                callNoted
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-neutral-800 text-neutral-400 border-neutral-700'
              }`}
            >
              {callNoted ? '✓ Customer Agreed' : 'Mark Customer Agreed'}
            </button>
          </div>
        </div>

        {/* Search for Substitute in Catalog */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
              Select Replacement / Substitute Item
            </label>
            <span className="text-[11px] text-neutral-400">
              {candidateSubstitutes.length} in-stock options
            </span>
          </div>

          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search alternative dishes, drinks, sides..."
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-neutral-500 pl-9 focus:outline-none focus:border-emerald-500"
            />
            <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
          </div>

          {/* Catalog grid */}
          <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
            {candidateSubstitutes.map((cand) => {
              const isSelected = selectedSubItem?.id === cand.id;
              const priceDiff = cand.price - item.price;

              return (
                <div
                  key={cand.id}
                  onClick={() => setSelectedSubItem(cand)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-emerald-950/60 border-emerald-500 shadow-md ring-1 ring-emerald-500/50'
                      : 'bg-neutral-950 hover:bg-neutral-900 border-neutral-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={cand.image}
                      alt={cand.name}
                      className="w-10 h-10 rounded-lg object-cover border border-neutral-800"
                    />
                    <div>
                      <p className="text-xs font-bold text-white">{cand.name}</p>
                      <p className="text-[11px] text-neutral-400">
                        {cand.category} • {cand.prepTime}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-emerald-400 block">
                      KSh {cand.price.toLocaleString()}
                    </span>
                    <span className={`text-[10px] font-mono font-semibold ${
                      priceDiff > 0 ? 'text-amber-400' : priceDiff < 0 ? 'text-cyan-400' : 'text-neutral-500'
                    }`}>
                      {priceDiff === 0 ? 'Same Price' : priceDiff > 0 ? `+KSh ${priceDiff}` : `-KSh ${Math.abs(priceDiff)}`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Reason / Notes */}
        <div>
          <label className="text-[11px] font-semibold text-neutral-400 block mb-1">
            Reason for Substitution / Note to Customer
          </label>
          <select
            value={subReason}
            onChange={(e) => setSubReason(e.target.value)}
            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="Out of stock in kitchen/store inventory">Out of stock in kitchen/store inventory</option>
            <option value="Customer requested alternative via phone">Customer requested alternative via phone</option>
            <option value="Substituted with closest premium alternative">Substituted with closest premium alternative</option>
            <option value="Packaging damaged; fresh batch substituted">Packaging damaged; fresh batch substituted</option>
          </select>
        </div>

        {/* Action Buttons: Confirm Substitute OR Remove/Refund */}
        <div className="pt-2 border-t border-neutral-800 space-y-2">
          {selectedSubItem ? (
            <button
              onClick={handleConfirmSubstitution}
              className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-500/20 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>
                Confirm Replace with "{selectedSubItem.name}" (KSh {selectedSubItem.price.toLocaleString()})
              </span>
            </button>
          ) : (
            <p className="text-[11px] text-center text-neutral-500 italic">
              Select a substitute item from the list above, or choose to remove the item below.
            </p>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={handleConfirmRemoval}
              className="flex-1 py-2.5 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-rose-400 border border-rose-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>No Substitute (Remove & Refund Item)</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold transition cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

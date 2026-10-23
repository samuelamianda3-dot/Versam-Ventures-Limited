import React, { useState, useRef } from 'react';
import { Order } from '../types';
import { 
  Camera, 
  Upload, 
  CheckCircle2, 
  ShieldCheck, 
  X, 
  FileText, 
  AlertCircle,
  Eye,
  Check
} from 'lucide-react';

interface ReceiptCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
  onConfirmVerification: (
    photoUrl: string, 
    verifiedAmount: number, 
    verifiedBy: string,
    notes: string
  ) => void;
}

export const ReceiptCaptureModal: React.FC<ReceiptCaptureModalProps> = ({
  isOpen,
  onClose,
  order,
  onConfirmVerification,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoPreview, setPhotoPreview] = useState<string>(
    order.receiptVerification?.photoUrl || '/src/assets/images/hero_delivery_culinary_1792736549071.jpg'
  );
  const [amountInput, setAmountInput] = useState<number>(
    order.receiptVerification?.verifiedAmount || order.totalPrice
  );
  const [verifiedBy, setVerifiedBy] = useState<string>(
    order.receiptVerification?.verifiedBy || 'Chef Mwangi (Kitchen Lead)'
  );
  const [notes, setNotes] = useState<string>(
    order.receiptVerification?.notes || `All items packed in thermal bag. Seal #${order.displayNumber.replace('#', 'V')}.`
  );
  const [amountMatches, setAmountMatches] = useState<boolean>(true);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setPhotoPreview(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAmountChange = (val: number) => {
    setAmountInput(val);
    setAmountMatches(val === order.totalPrice);
  };

  const handleApprove = () => {
    onConfirmVerification(photoPreview, amountInput, verifiedBy, notes);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[1300] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col text-neutral-100 animate-in zoom-in-95 duration-200 max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-neutral-100">
                  Dispatch Handover: Receipt & Photo Verification
                </h3>
              </div>
              <p className="text-[11px] text-neutral-400">
                Order {order.displayNumber} · {order.customerName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Instructions banner */}
          <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-3 flex items-start gap-2.5 text-xs text-neutral-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-emerald-300">Mandatory Handover Protocol</p>
              <p className="text-neutral-400 text-[11px] mt-0.5">
                Take a clear picture of the packed meal receipt and verify the total KSh amount before handing over to the Versam courier bike.
              </p>
            </div>
          </div>

          {/* Receipt Photo Capture Box */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider block">
              1. Receipt / Package Photo
            </label>
            <div className="relative aspect-[16/10] bg-neutral-950 rounded-2xl overflow-hidden border-2 border-dashed border-neutral-700 hover:border-emerald-500/60 transition-colors group">
              {photoPreview ? (
                <div className="relative w-full h-full">
                  <img
                    src={photoPreview}
                    alt="Receipt verification capture"
                    className="w-full h-full object-cover"
                  />
                  {/* Digital Stamp overlay */}
                  <div className="absolute top-3 left-3 bg-neutral-950/90 backdrop-blur-md border border-emerald-500/40 rounded-xl px-2.5 py-1 text-[11px] font-mono text-emerald-300 flex items-center gap-1.5 shadow-md">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>STAMPED: {order.displayNumber}</span>
                  </div>
                  <div className="absolute bottom-3 right-3 bg-neutral-950/90 backdrop-blur-md border border-neutral-700 rounded-xl px-2.5 py-1 text-[11px] font-mono text-neutral-200">
                    KSh {amountInput.toLocaleString()}
                  </div>
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-neutral-500 gap-2 p-4 text-center">
                  <Camera className="w-8 h-8 text-neutral-400" />
                  <p className="text-xs font-medium text-neutral-300">
                    No receipt photo snapped yet
                  </p>
                  <p className="text-[11px]">Click below to use camera or upload photo</p>
                </div>
              )}
            </div>

            {/* Photo Action Buttons */}
            <div className="flex items-center gap-2 pt-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-200 transition-colors border border-neutral-700/60"
              >
                <Camera className="w-3.5 h-3.5 text-emerald-400" />
                <span>Take Photo / Upload</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  setPhotoPreview('/src/assets/images/hero_delivery_culinary_1792736549071.jpg')
                }
                className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-medium text-neutral-300 transition-colors"
                title="Use Kitchen Counter Mock Snap"
              >
                Use Kitchen Snap
              </button>
            </div>
          </div>

          {/* Amount Verification */}
          <div className="space-y-2 pt-2 border-t border-neutral-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider block">
                2. Verify Total Amount (KSh)
              </label>
              <span className="text-[11px] font-mono text-neutral-400">
                Order Total: <strong className="text-emerald-400">KSh {order.totalPrice.toLocaleString()}</strong>
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-400 font-mono">
                  KSh
                </span>
                <input
                  type="number"
                  value={amountInput}
                  onChange={(e) => handleAmountChange(Number(e.target.value))}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-xl pl-12 pr-3.5 py-2.5 text-sm font-bold font-mono text-neutral-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {amountMatches ? (
                <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Amount Matches</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold shrink-0">
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                  <span>Mismatch</span>
                </div>
              )}
            </div>
          </div>

          {/* Handover Sign-off */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div>
              <label className="text-xs font-semibold text-neutral-300 block mb-1">
                Verified By (Kitchen Lead)
              </label>
              <input
                type="text"
                value={verifiedBy}
                onChange={(e) => setVerifiedBy(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-neutral-300 block mb-1">
                Security Notes / Seal #
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-300 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApprove}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98]"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Verify Receipt & Dispatch Courier</span>
          </button>
        </div>
      </div>
    </div>
  );
};

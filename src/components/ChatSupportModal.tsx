import React, { useState } from 'react';
import { 
  Phone, 
  MessageSquare, 
  X, 
  Send, 
  ExternalLink, 
  CheckCircle2, 
  Clock, 
  Headphones, 
  Copy, 
  Check
} from 'lucide-react';
import { SUPPORT_CONTACTS } from '../data/mockData';

interface ChatSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeOrderNumber?: string;
  onLogActivity?: (description: string) => void;
}

interface ChatMessage {
  id: string;
  sender: 'support' | 'user';
  text: string;
  time: string;
}

export const ChatSupportModal: React.FC<ChatSupportModalProps> = ({
  isOpen,
  onClose,
  activeOrderNumber = '#8104',
  onLogActivity,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm1',
      sender: 'support',
      text: `Hello! Welcome to Versam Ventures Customer Support. Our team is live and ready to assist you. You can chat here or reach us directly on 0743926800 or 0795509505.`,
      time: 'Just now',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [copiedNumber, setCopiedNumber] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (num: string) => {
    navigator.clipboard.writeText(num);
    setCopiedNumber(num);
    setTimeout(() => setCopiedNumber(null), 2000);
  };

  const handleSendMessage = (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: text.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputText('');

    onLogActivity?.(`Customer sent support chat message: "${text.trim().substring(0, 45)}..."`);

    // Simulated automated assistant response
    setTimeout(() => {
      let reply = `Thank you for reaching out regarding ${activeOrderNumber}. Our dispatch team has logged your inquiry. For urgent changes, please call our direct hotline at 0743926800.`;
      
      const lower = text.toLowerCase();
      if (lower.includes('mpesa') || lower.includes('payment') || lower.includes('paid')) {
        reply = `For M-Pesa payments, our verified merchant phone is 0743926800. If you already sent funds, please submit the M-Pesa transaction reference in checkout or reply here with your code.`;
      } else if (lower.includes('where') || lower.includes('status') || lower.includes('rider')) {
        reply = `Your courier is actively tracked via live GPS. You can view real-time road coordinates, ETA, and speed on the Live Tracker tab!`;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `reply-${Date.now()}`,
          sender: 'support',
          text: reply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-[1300] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col text-neutral-100 animate-in zoom-in-95 duration-200 h-[620px] max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-neutral-100">Versam Chat & Support</h3>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <p className="text-[11px] text-neutral-400">
                Direct Line: 0743926800 · 0795509505 (7am – 11:30pm)
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

        {/* Quick Contact Buttons Strip */}
        <div className="px-4 py-3 bg-neutral-950/70 border-b border-neutral-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          {/* Primary Phone */}
          <div className="flex items-center gap-1.5 bg-neutral-900 border border-neutral-800 px-2.5 py-1.5 rounded-xl">
            <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <a href="tel:0743926800" className="font-mono text-emerald-400 font-bold hover:underline">
              0743926800
            </a>
            <button
              onClick={() => handleCopy('0743926800')}
              className="ml-1 text-neutral-400 hover:text-white p-0.5"
              title="Copy phone"
            >
              {copiedNumber === '0743926800' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>

          {/* Secondary Phone */}
          <div className="flex items-center gap-1.5 bg-neutral-900 border border-neutral-800 px-2.5 py-1.5 rounded-xl">
            <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <a href="tel:0795509505" className="font-mono text-emerald-400 font-bold hover:underline">
              0795509505
            </a>
            <button
              onClick={() => handleCopy('0795509505')}
              className="ml-1 text-neutral-400 hover:text-white p-0.5"
              title="Copy phone"
            >
              {copiedNumber === '0795509505' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>

          {/* WhatsApp Direct Link */}
          <a
            href="https://wa.me/254743926800?text=Hello%20Versam%20Ventures,%20I%20need%20assistance%20with%20my%20delivery"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-neutral-950 font-bold text-xs transition-colors shadow-sm"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>WhatsApp</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Chat Messages Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-neutral-950/40">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-emerald-500 text-neutral-950 font-medium rounded-tr-sm shadow-md'
                    : 'bg-neutral-800 text-neutral-100 rounded-tl-sm border border-neutral-700/60 shadow-md'
                }`}
              >
                <p>{msg.text}</p>
              </div>
              <span className="text-[10px] text-neutral-500 mt-1 px-1 font-mono">{msg.time}</span>
            </div>
          ))}
        </div>

        {/* Quick Suggestion Pills */}
        <div className="p-2 bg-neutral-950/90 border-t border-neutral-800 flex items-center gap-1.5 overflow-x-auto text-[11px] text-neutral-300">
          <span className="shrink-0 text-neutral-500 px-1">Quick:</span>
          <button
            onClick={() => handleSendMessage(`Where is courier Marcus for ${activeOrderNumber}?`)}
            className="px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-emerald-500/50 hover:text-emerald-300 whitespace-nowrap transition-colors"
          >
            Where is courier?
          </button>
          <button
            onClick={() => handleSendMessage(`How do I pay via M-Pesa to 0743926800?`)}
            className="px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-emerald-500/50 hover:text-emerald-300 whitespace-nowrap transition-colors"
          >
            M-Pesa 0743926800 help
          </button>
          <button
            onClick={() => handleSendMessage(`I would like to call support on 0795509505.`)}
            className="px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-emerald-500/50 hover:text-emerald-300 whitespace-nowrap transition-colors"
          >
            Call 0795509505
          </button>
        </div>

        {/* Text Input Footer */}
        <div className="p-3 bg-neutral-950 border-t border-neutral-800 flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Type your message or inquiry..."
            className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
          />
          <button
            onClick={() => handleSendMessage()}
            className="p-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold transition-all disabled:opacity-50"
            disabled={!inputText.trim()}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

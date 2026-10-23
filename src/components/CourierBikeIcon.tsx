import React from 'react';

interface CourierBikeIconProps {
  className?: string;
  size?: number;
  bagColor?: string;
  frameColor?: string;
}

export const CourierBikeIcon: React.FC<CourierBikeIconProps> = ({
  className = 'w-6 h-6',
  size,
  bagColor = '#10b981', // Emerald delivery bag
  frameColor = 'currentColor',
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      style={size ? { width: size, height: size } : undefined}
    >
      {/* Rear Wheel */}
      <circle
        cx="11"
        cy="33"
        r="7.5"
        stroke={frameColor}
        strokeWidth="2.8"
        strokeLinecap="round"
      />
      <circle cx="11" cy="33" r="2" fill={frameColor} />

      {/* Front Wheel */}
      <circle
        cx="37"
        cy="33"
        r="7.5"
        stroke={frameColor}
        strokeWidth="2.8"
        strokeLinecap="round"
      />
      <circle cx="37" cy="33" r="2" fill={frameColor} />

      {/* Bike Frame */}
      {/* Bottom bracket to rear wheel */}
      <line
        x1="11"
        y1="33"
        x2="22"
        y2="33"
        stroke={frameColor}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Rear wheel to seat post */}
      <line
        x1="11"
        y1="33"
        x2="19"
        y2="21"
        stroke={frameColor}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Bottom bracket to seat post */}
      <line
        x1="22"
        y1="33"
        x2="19"
        y2="21"
        stroke={frameColor}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Seat post upward */}
      <line
        x1="19"
        y1="21"
        x2="18"
        y2="17.5"
        stroke={frameColor}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Saddle */}
      <path
        d="M15 17.5h6.5c1 0 1.8-.8 1.5-1.8-.3-1-1.2-1.7-2.3-1.7h-4.7c-1.1 0-2 .9-2 2 0 .8.5 1.5 1 1.5z"
        fill={frameColor}
      />
      {/* Down tube: seat to bottom bracket to head tube */}
      <line
        x1="22"
        y1="33"
        x2="33"
        y2="21"
        stroke={frameColor}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Top tube */}
      <line
        x1="19"
        y1="21"
        x2="33"
        y2="21"
        stroke={frameColor}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Fork to front wheel */}
      <line
        x1="33"
        y1="21"
        x2="37"
        y2="33"
        stroke={frameColor}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Stem and handlebars */}
      <line
        x1="33"
        y1="21"
        x2="34.5"
        y2="15.5"
        stroke={frameColor}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M31.5 15.5h5.5c1.2 0 2.2-.8 2.2-2s-.8-2-2-2h-1"
        stroke={frameColor}
        strokeWidth="2.2"
        strokeLinecap="round"
      />

      {/* Courier Insulated Delivery Bag / Cargo Box over rear rack */}
      {/* Rack stay */}
      <line
        x1="11"
        y1="33"
        x2="10"
        y2="24"
        stroke={frameColor}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="19"
        y1="23"
        x2="9"
        y2="24"
        stroke={frameColor}
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* The Courier Delivery Backpack / Thermal Box */}
      <rect
        x="6"
        y="12"
        width="11"
        height="12"
        rx="2.5"
        fill={bagColor}
        stroke="#064e3b"
        strokeWidth="1.5"
      />
      {/* Bag top flap */}
      <path
        d="M5.5 14h12c.5 0 .8-.4.7-.8l-.5-1.5c-.2-.5-.6-.7-1.1-.7H6.4c-.5 0-.9.2-1.1.7l-.5 1.5c-.1.4.2.8.7.8z"
        fill="#047857"
      />
      {/* Bag reflective safety strip */}
      <line
        x1="7.5"
        y1="18.5"
        x2="15.5"
        y2="18.5"
        stroke="#ffffff"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeDasharray="1.5, 1"
      />
      {/* Bag buckle / logo dot */}
      <circle cx="11.5" cy="18.5" r="1.2" fill="#ffffff" />
    </svg>
  );
};

import React from 'react';

export const ProductSVG = ({ type }) => {
  switch (type) {
    case 'scanner':
      return (
        <svg viewBox="0 0 120 90" className="w-24 h-20 mx-auto drop-shadow-sm">
          <rect x="22" y="15" width="76" height="60" rx="12" fill="#F6EDE1" />
          <path d="M40 30 H80 C83 30 85 33 83 36 L75 48 H55 L60 70 H45 L42 48 H37 C34 48 33 45 35 42 Z" fill="#2f2a25" />
          <rect x="78" y="33" width="6" height="11" rx="2" fill="#7bbd65" />
          <line x1="88" y1="35" x2="100" y2="29" stroke="#7bbd65" strokeWidth="2" strokeLinecap="round" />
          <line x1="88" y1="39" x2="102" y2="39" stroke="#7bbd65" strokeWidth="2" strokeLinecap="round" />
          <line x1="88" y1="43" x2="100" y2="49" stroke="#7bbd65" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'headphones':
      return (
        <svg viewBox="0 0 120 90" className="w-24 h-20 mx-auto drop-shadow-sm">
          <circle cx="60" cy="45" r="34" fill="#F6EDE1" />
          <path d="M36 48 V42 C36 28.7 46.7 18 60 18 C73.3 18 84 28.7 84 42 V48" fill="none" stroke="#2f2a25" strokeWidth="6" strokeLinecap="round" />
          <rect x="30" y="43" width="12" height="22" rx="6" fill="#5c4632" />
          <rect x="78" y="43" width="12" height="22" rx="6" fill="#5c4632" />
          <circle cx="84" cy="54" r="2.5" fill="#7bbd65" />
        </svg>
      );
    case 'keyboard':
      return (
        <svg viewBox="0 0 120 90" className="w-24 h-20 mx-auto drop-shadow-sm">
          <rect x="16" y="26" width="88" height="42" rx="8" fill="#2f2a25" />
          <rect x="20" y="30" width="80" height="34" rx="5" fill="#3e3730" />
          <rect x="24" y="34" width="8" height="6" rx="1.5" fill="#7bbd65" />
          <rect x="35" y="34" width="8" height="6" rx="1.5" fill="#F6EDE1" />
          <rect x="46" y="34" width="8" height="6" rx="1.5" fill="#F6EDE1" />
          <rect x="57" y="34" width="8" height="6" rx="1.5" fill="#F6EDE1" />
          <rect x="68" y="34" width="8" height="6" rx="1.5" fill="#F6EDE1" />
          <rect x="79" y="34" width="17" height="6" rx="1.5" fill="#d3b897" />
          <rect x="24" y="43" width="12" height="6" rx="1.5" fill="#d3b897" />
          <rect x="39" y="43" width="8" height="6" rx="1.5" fill="#F6EDE1" />
          <rect x="50" y="43" width="8" height="6" rx="1.5" fill="#F6EDE1" />
          <rect x="61" y="43" width="8" height="6" rx="1.5" fill="#F6EDE1" />
          <rect x="72" y="43" width="24" height="6" rx="1.5" fill="#7bbd65" />
          <rect x="36" y="52" width="48" height="6" rx="2" fill="#F6EDE1" />
        </svg>
      );
    case 'box_pack':
      return (
        <svg viewBox="0 0 120 90" className="w-24 h-20 mx-auto drop-shadow-sm">
          <polygon points="60,14 96,30 96,64 60,80 24,64 24,30" fill="#d5b388" />
          <polygon points="60,14 96,30 60,46 24,30" fill="#e6cba5" />
          <polygon points="60,46 96,30 96,64 60,80" fill="#c19a6b" />
          <polygon points="46,20 82,36 74,40 38,24" fill="#F6EDE1" opacity="0.85" />
          <rect x="34" y="50" width="16" height="10" rx="2" transform="skewY(22)" fill="#2f2a25" />
        </svg>
      );
    case 'router':
      return (
        <svg viewBox="0 0 120 90" className="w-24 h-20 mx-auto drop-shadow-sm">
          <line x1="36" y1="48" x2="32" y2="18" stroke="#2f2a25" strokeWidth="4" strokeLinecap="round" />
          <line x1="60" y1="48" x2="60" y2="15" stroke="#2f2a25" strokeWidth="4" strokeLinecap="round" />
          <line x1="84" y1="48" x2="88" y2="18" stroke="#2f2a25" strokeWidth="4" strokeLinecap="round" />
          <rect x="24" y="46" width="72" height="22" rx="6" fill="#2f2a25" />
          <circle cx="36" cy="57" r="3" fill="#7bbd65" />
          <circle cx="46" cy="57" r="3" fill="#7bbd65" />
          <circle cx="56" cy="57" r="3" fill="#7bbd65" />
          <rect x="72" y="55" width="16" height="4" rx="2" fill="#F6EDE1" opacity="0.5" />
        </svg>
      );
    case 'jacket':
      return (
        <svg viewBox="0 0 120 90" className="w-24 h-20 mx-auto drop-shadow-sm">
          <path d="M42 18 L52 14 L68 14 L78 18 L96 34 L86 46 L76 36 L76 74 L44 74 L44 36 L34 46 L24 34 Z" fill="#4a3b2c" />
          <path d="M52 14 L60 26 L68 14" fill="#F6EDE1" />
          <line x1="60" y1="26" x2="60" y2="74" stroke="#F6EDE1" strokeWidth="2" />
          <rect x="64" y="34" width="8" height="4" rx="1" fill="#7bbd65" />
        </svg>
      );
    case 'pallet':
      return (
        <svg viewBox="0 0 120 90" className="w-24 h-20 mx-auto drop-shadow-sm">
          <rect x="28" y="20" width="28" height="24" rx="3" fill="#d5b388" stroke="#2f2a25" strokeWidth="1.5" />
          <rect x="60" y="24" width="30" height="20" rx="3" fill="#c19a6b" stroke="#2f2a25" strokeWidth="1.5" />
          <rect x="26" y="44" width="32" height="22" rx="3" fill="#e6cba5" stroke="#2f2a25" strokeWidth="1.5" />
          <rect x="60" y="44" width="32" height="22" rx="3" fill="#d5b388" stroke="#2f2a25" strokeWidth="1.5" />
          <rect x="20" y="68" width="80" height="6" rx="2" fill="#5c4632" />
          <rect x="26" y="74" width="10" height="5" fill="#2f2a25" />
          <rect x="55" y="74" width="10" height="5" fill="#2f2a25" />
          <rect x="84" y="74" width="10" height="5" fill="#2f2a25" />
        </svg>
      );
    case 'printer':
      return (
        <svg viewBox="0 0 120 90" className="w-24 h-20 mx-auto drop-shadow-sm">
          <rect x="38" y="14" width="44" height="18" rx="3" fill="#ffffff" stroke="#d5b388" strokeWidth="2" />
          <rect x="26" y="30" width="68" height="36" rx="8" fill="#2f2a25" />
          <rect x="38" y="54" width="44" height="22" rx="2" fill="#F6EDE1" stroke="#2f2a25" strokeWidth="2" />
          <line x1="45" y1="62" x2="75" y2="62" stroke="#2f2a25" strokeWidth="3" strokeDasharray="3 2" />
          <line x1="45" y1="68" x2="68" y2="68" stroke="#2f2a25" strokeWidth="2" />
          <circle cx="80" cy="42" r="4" fill="#7bbd65" />
        </svg>
      );
    case 'sneakers':
      return (
        <svg viewBox="0 0 120 90" className="w-24 h-20 mx-auto drop-shadow-sm">
          <path d="M24 58 Q24 40 42 40 L58 40 L68 26 L80 30 L86 48 Q98 50 98 62 L24 62 Z" fill="#5c4632" />
          <rect x="22" y="60" width="78" height="9" rx="4" fill="#F6EDE1" stroke="#2f2a25" strokeWidth="1.5" />
          <path d="M45 48 L65 48 L60 55 L40 55 Z" fill="#7bbd65" />
        </svg>
      );
    case 'spool':
      return (
        <svg viewBox="0 0 120 90" className="w-24 h-20 mx-auto drop-shadow-sm">
          <ellipse cx="60" cy="24" rx="28" ry="8" fill="#2f2a25" />
          <rect x="38" y="24" width="44" height="40" fill="#c19a6b" />
          <line x1="38" y1="34" x2="82" y2="34" stroke="#a67c52" strokeWidth="2" />
          <line x1="38" y1="44" x2="82" y2="44" stroke="#a67c52" strokeWidth="2" />
          <line x1="38" y1="54" x2="82" y2="54" stroke="#a67c52" strokeWidth="2" />
          <ellipse cx="60" cy="64" rx="28" ry="8" fill="#2f2a25" />
          <ellipse cx="60" cy="24" rx="10" ry="3" fill="#F6EDE1" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 120 90" className="w-24 h-20 mx-auto drop-shadow-sm">
          <rect x="30" y="20" width="60" height="50" rx="8" fill="#d5b388" />
        </svg>
      );
  }
};

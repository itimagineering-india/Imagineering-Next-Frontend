/**
 * Custom Category Icons
 * Colorful, cartoon-style icons for service categories
 */

import React from 'react';

interface IconProps {
  className?: string;
}

// Original categories with colorful icons
export const ContractorsIcon: React.FC<IconProps> = ({ className = "w-full h-full" }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Hard hat */}
    <path d="M 30 25 L 70 25 Q 75 25 75 30 L 75 45 Q 75 50 70 50 L 30 50 Q 25 50 25 45 L 25 30 Q 25 25 30 25" fill="#FFD700" stroke="#FFA500" strokeWidth="2"/>
    <rect x="30" y="25" width="40" height="8" rx="2" fill="#FFA500"/>
    <rect x="45" y="20" width="10" height="8" rx="1" fill="#FFD700"/>
    
    {/* Face */}
    <circle cx="50" cy="40" r="8" fill="#FFDBAC"/>
    <circle cx="47" cy="38" r="1.5" fill="#000"/>
    <circle cx="53" cy="38" r="1.5" fill="#000"/>
    <path d="M 47 42 Q 50 44 53 42" stroke="#000" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
    
    {/* Safety vest */}
    <rect x="35" y="50" width="30" height="25" rx="2" fill="#FFD700" stroke="#FFA500" strokeWidth="2"/>
    <rect x="40" y="55" width="20" height="15" rx="1" fill="#FF6347"/>
  </svg>
);

export const MachinesIcon: React.FC<IconProps> = ({ className = "w-full h-full" }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Machine body */}
    <rect x="20" y="30" width="60" height="50" rx="4" fill="#87CEEB" stroke="#4682B4" strokeWidth="2.5"/>
    
    {/* Control panel */}
    <rect x="25" y="35" width="50" height="15" rx="2" fill="#4169E1"/>
    <circle cx="35" cy="42" r="3" fill="#32CD32"/>
    <circle cx="50" cy="42" r="3" fill="#FFD700"/>
    <circle cx="65" cy="42" r="3" fill="#DC143C"/>
    
    {/* Gears */}
    <circle cx="35" cy="60" r="8" fill="#808080" stroke="#696969" strokeWidth="2"/>
    <circle cx="35" cy="60" r="4" fill="#A9A9A9"/>
    <path d="M 35 52 L 35 54 L 30 54 L 30 56 L 35 56 L 35 64 L 30 64 L 30 66 L 35 66 L 35 68" stroke="#696969" strokeWidth="1.5"/>
    
    <circle cx="65" cy="60" r="8" fill="#808080" stroke="#696969" strokeWidth="2"/>
    <circle cx="65" cy="60" r="4" fill="#A9A9A9"/>
    <path d="M 65 52 L 65 54 L 60 54 L 60 56 L 65 56 L 65 64 L 60 64 L 60 66 L 65 66 L 65 68" stroke="#696969" strokeWidth="1.5"/>
  </svg>
);

export const LandIcon: React.FC<IconProps> = ({ className = "w-full h-full" }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Mountain */}
    <path d="M 20 70 L 50 25 L 80 70 Z" fill="#8B4513" stroke="#654321" strokeWidth="2"/>
    <path d="M 30 60 L 50 35 L 70 60 Z" fill="#A0522D" stroke="#8B4513" strokeWidth="1.5"/>
    
    {/* Trees */}
    <rect x="25" y="65" width="4" height="8" fill="#8B4513"/>
    <circle cx="27" cy="65" r="6" fill="#228B22"/>
    
    <rect x="70" y="65" width="4" height="8" fill="#8B4513"/>
    <circle cx="72" cy="65" r="6" fill="#228B22"/>
    
    {/* Sun */}
    <circle cx="75" cy="20" r="8" fill="#FFD700"/>
    <path d="M 75 10 L 75 12 L 75 8 M 75 28 L 75 30 L 75 26 M 65 20 L 67 20 L 63 20 M 85 20 L 87 20 L 83 20" stroke="#FFA500" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export const HomesIcon: React.FC<IconProps> = ({ className = "w-full h-full" }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* House */}
    <rect x="30" y="45" width="40" height="35" rx="2" fill="#FF6347" stroke="#DC143C" strokeWidth="2"/>
    
    {/* Roof */}
    <path d="M 25 45 L 50 25 L 75 45 Z" fill="#8B4513" stroke="#654321" strokeWidth="2"/>
    
    {/* Door */}
    <rect x="42" y="60" width="16" height="20" rx="1" fill="#654321" stroke="#000" strokeWidth="1.5"/>
    <circle cx="55" cy="70" r="1.5" fill="#FFD700"/>
    
    {/* Windows */}
    <rect x="35" y="50" width="8" height="8" rx="1" fill="#87CEEB" stroke="#4682B4" strokeWidth="1"/>
    <line x1="39" y1="50" x2="39" y2="58" stroke="#4682B4" strokeWidth="1"/>
    <line x1="35" y1="54" x2="43" y2="54" stroke="#4682B4" strokeWidth="1"/>
    
    <rect x="57" y="50" width="8" height="8" rx="1" fill="#87CEEB" stroke="#4682B4" strokeWidth="1"/>
    <line x1="61" y1="50" x2="61" y2="58" stroke="#4682B4" strokeWidth="1"/>
    <line x1="57" y1="54" x2="65" y2="54" stroke="#4682B4" strokeWidth="1"/>
  </svg>
);

export const SpaceIcon: React.FC<IconProps> = ({ className = "w-full h-full" }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Building */}
    <rect x="25" y="30" width="50" height="55" rx="2" fill="#808080" stroke="#696969" strokeWidth="2"/>
    
    {/* Windows grid */}
    <rect x="30" y="35" width="8" height="10" rx="1" fill="#FFD700"/>
    <rect x="42" y="35" width="8" height="10" rx="1" fill="#FFD700"/>
    <rect x="54" y="35" width="8" height="10" rx="1" fill="#FFD700"/>
    <rect x="62" y="35" width="8" height="10" rx="1" fill="#FFD700"/>
    
    <rect x="30" y="50" width="8" height="10" rx="1" fill="#87CEEB"/>
    <rect x="42" y="50" width="8" height="10" rx="1" fill="#87CEEB"/>
    <rect x="54" y="50" width="8" height="10" rx="1" fill="#87CEEB"/>
    <rect x="62" y="50" width="8" height="10" rx="1" fill="#87CEEB"/>
    
    <rect x="30" y="65" width="8" height="10" rx="1" fill="#FFD700"/>
    <rect x="42" y="65" width="8" height="10" rx="1" fill="#FFD700"/>
    <rect x="54" y="65" width="8" height="10" rx="1" fill="#FFD700"/>
    <rect x="62" y="65" width="8" height="10" rx="1" fill="#FFD700"/>
    
    {/* Top antenna */}
    <line x1="50" y1="30" x2="50" y2="20" stroke="#FFD700" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="50" cy="18" r="2" fill="#FFD700"/>
  </svg>
);

export const ManufacturerIcon: React.FC<IconProps> = ({ className = "w-full h-full" }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Factory building */}
    <rect x="20" y="40" width="60" height="40" rx="2" fill="#A9A9A9" stroke="#696969" strokeWidth="2"/>
    
    {/* Chimneys */}
    <rect x="25" y="25" width="8" height="20" rx="1" fill="#696969"/>
    <rect x="40" y="20" width="8" height="25" rx="1" fill="#696969"/>
    <rect x="55" y="28" width="8" height="17" rx="1" fill="#696969"/>
    <rect x="70" y="30" width="8" height="15" rx="1" fill="#696969"/>
    
    {/* Smoke */}
    <circle cx="29" cy="20" r="3" fill="#D3D3D3" opacity="0.7"/>
    <circle cx="44" cy="15" r="4" fill="#D3D3D3" opacity="0.7"/>
    <circle cx="59" cy="23" r="3" fill="#D3D3D3" opacity="0.7"/>
    <circle cx="74" cy="25" r="3" fill="#D3D3D3" opacity="0.7"/>
    
    {/* Windows */}
    <rect x="25" y="45" width="6" height="8" rx="1" fill="#FFD700"/>
    <rect x="35" y="45" width="6" height="8" rx="1" fill="#FFD700"/>
    <rect x="45" y="45" width="6" height="8" rx="1" fill="#FFD700"/>
    <rect x="55" y="45" width="6" height="8" rx="1" fill="#FFD700"/>
    <rect x="65" y="45" width="6" height="8" rx="1" fill="#FFD700"/>
  </svg>
);

export const LogisticsIcon: React.FC<IconProps> = ({ className = "w-full h-full" }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Truck */}
    <rect x="20" y="50" width="50" height="25" rx="2" fill="#4169E1" stroke="#000080" strokeWidth="2"/>
    <rect x="25" y="45" width="25" height="10" rx="1" fill="#1E90FF" stroke="#000080" strokeWidth="1.5"/>
    
    {/* Wheels */}
    <circle cx="35" cy="80" r="8" fill="#2F2F2F"/>
    <circle cx="35" cy="80" r="5" fill="#696969"/>
    <circle cx="35" cy="80" r="2" fill="#2F2F2F"/>
    
    <circle cx="60" cy="80" r="8" fill="#2F2F2F"/>
    <circle cx="60" cy="80" r="5" fill="#696969"/>
    <circle cx="60" cy="80" r="2" fill="#2F2F2F"/>
    
    {/* Cargo boxes */}
    <rect x="55" y="52" width="12" height="10" rx="1" fill="#FFD700" stroke="#FFA500" strokeWidth="1"/>
    <rect x="55" y="64" width="12" height="8" rx="1" fill="#FF6347" stroke="#DC143C" strokeWidth="1"/>
  </svg>
);

export const VendorsIcon: React.FC<IconProps> = ({ className = "w-full h-full" }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Store */}
    <rect x="25" y="35" width="50" height="45" rx="2" fill="#FF6347" stroke="#DC143C" strokeWidth="2"/>
    
    {/* Sign */}
    <rect x="30" y="25" width="40" height="12" rx="2" fill="#FFD700" stroke="#FFA500" strokeWidth="1.5"/>
    <text x="50" y="34" textAnchor="middle" fontSize="8" fill="#000" fontWeight="bold">STORE</text>
    
    {/* Door */}
    <rect x="42" y="60" width="16" height="20" rx="1" fill="#654321" stroke="#000" strokeWidth="1.5"/>
    <circle cx="55" cy="70" r="1.5" fill="#FFD700"/>
    
    {/* Windows */}
    <rect x="30" y="40" width="10" height="12" rx="1" fill="#87CEEB" stroke="#4682B4" strokeWidth="1"/>
    <line x1="35" y1="40" x2="35" y2="52" stroke="#4682B4" strokeWidth="1"/>
    <line x1="30" y1="46" x2="40" y2="46" stroke="#4682B4" strokeWidth="1"/>
    
    <rect x="60" y="40" width="10" height="12" rx="1" fill="#87CEEB" stroke="#4682B4" strokeWidth="1"/>
    <line x1="65" y1="40" x2="65" y2="52" stroke="#4682B4" strokeWidth="1"/>
    <line x1="60" y1="46" x2="70" y2="46" stroke="#4682B4" strokeWidth="1"/>
  </svg>
);

export const RentalServicesIcon: React.FC<IconProps> = ({ className = "w-full h-full" }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Key */}
    <rect x="45" y="50" width="20" height="8" rx="2" fill="#FFD700" stroke="#FFA500" strokeWidth="2"/>
    <circle cx="55" cy="54" r="6" fill="#FFD700" stroke="#FFA500" strokeWidth="2"/>
    <circle cx="55" cy="54" r="3" fill="none" stroke="#FFA500" strokeWidth="1.5"/>
    
    {/* Key teeth */}
    <rect x="48" y="52" width="3" height="4" rx="1" fill="#FFA500"/>
    <rect x="52" y="50" width="2" height="3" rx="1" fill="#FFA500"/>
    
    {/* Keychain ring */}
    <circle cx="65" cy="54" r="4" fill="none" stroke="#808080" strokeWidth="2"/>
    <line x1="63" y1="54" x2="61" y2="54" stroke="#808080" strokeWidth="2"/>
  </svg>
);

export const ConstructionIcon: React.FC<IconProps> = ({ className = "w-full h-full" }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Hammer */}
    <rect x="35" y="45" width="8" height="30" rx="1" fill="#8B4513" stroke="#654321" strokeWidth="1.5"/>
    <rect x="30" y="40" width="18" height="8" rx="1" fill="#808080" stroke="#696969" strokeWidth="1.5"/>
    
    {/* Construction site */}
    <rect x="55" y="50" width="30" height="25" rx="1" fill="#A9A9A9" stroke="#808080" strokeWidth="1.5"/>
    
    {/* Crane */}
    <line x1="70" y1="50" x2="70" y2="30" stroke="#FFD700" strokeWidth="3" strokeLinecap="round"/>
    <line x1="70" y1="30" x2="85" y2="30" stroke="#FFD700" strokeWidth="3" strokeLinecap="round"/>
    <line x1="85" y1="30" x2="85" y2="45" stroke="#FFD700" strokeWidth="2" strokeLinecap="round"/>
    
    {/* Building blocks */}
    <rect x="58" y="60" width="8" height="8" fill="#FF6347"/>
    <rect x="68" y="60" width="8" height="8" fill="#4169E1"/>
    <rect x="78" y="60" width="8" height="8" fill="#32CD32"/>
  </svg>
);

export const ConstructionMaterialsIcon: React.FC<IconProps> = ({ className = "w-full h-full" }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Package/Box */}
    <rect x="30" y="40" width="40" height="35" rx="2" fill="#FF6347" stroke="#DC143C" strokeWidth="2"/>
    
    {/* Tape */}
    <rect x="30" y="40" width="40" height="8" fill="#FFD700" stroke="#FFA500" strokeWidth="1"/>
    <line x1="50" y1="40" x2="50" y2="48" stroke="#FFA500" strokeWidth="1"/>
    
    {/* Label */}
    <rect x="35" y="50" width="30" height="20" rx="1" fill="#FFFFFF" stroke="#D3D3D3" strokeWidth="1"/>
    <text x="50" y="62" textAnchor="middle" fontSize="7" fill="#000">MATERIALS</text>
  </svg>
);

export const ManpowerIcon: React.FC<IconProps> = ({ className = "w-full h-full" }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* People */}
    <circle cx="30" cy="30" r="8" fill="#FFDBAC"/>
    <rect x="24" y="38" width="12" height="20" rx="3" fill="#4169E1"/>
    <rect x="26" y="58" width="8" height="12" rx="1" fill="#2F2F2F"/>
    
    <circle cx="50" cy="30" r="8" fill="#FFDBAC"/>
    <rect x="44" y="38" width="12" height="20" rx="3" fill="#32CD32"/>
    <rect x="46" y="58" width="8" height="12" rx="1" fill="#2F2F2F"/>
    
    <circle cx="70" cy="30" r="8" fill="#FFDBAC"/>
    <rect x="64" y="38" width="12" height="20" rx="3" fill="#FF6347"/>
    <rect x="66" y="58" width="8" height="12" rx="1" fill="#2F2F2F"/>
  </svg>
);

export const TechnicalManpowerIcon: React.FC<IconProps> = ({ className = "w-full h-full" }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Person with tools */}
    <circle cx="50" cy="25" r="10" fill="#FFDBAC"/>
    <rect x="42" y="35" width="16" height="25" rx="3" fill="#4169E1"/>
    <rect x="44" y="60" width="12" height="15" rx="1" fill="#2F2F2F"/>
    
    {/* Hard hat */}
    <path d="M 40 20 L 60 20 Q 65 20 65 25 L 65 30 Q 65 32 60 32 L 40 32 Q 35 32 35 30 L 35 25 Q 35 20 40 20" fill="#FFD700" stroke="#FFA500" strokeWidth="1.5"/>
    
    {/* Wrench */}
    <path d="M 70 40 L 75 45 L 80 40 L 75 35 Z" fill="#808080" stroke="#696969" strokeWidth="1.5"/>
    <rect x="72" y="42" width="6" height="2" fill="#696969"/>
  </svg>
);

export const FinancingIcon: React.FC<IconProps> = ({ className = "w-full h-full" }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Dollar sign */}
    <circle cx="50" cy="50" r="25" fill="#32CD32" stroke="#228B22" strokeWidth="2"/>
    <text x="50" y="58" textAnchor="middle" fontSize="28" fill="#FFFFFF" fontWeight="bold">$</text>
    
    {/* Coins */}
    <circle cx="25" cy="30" r="8" fill="#FFD700" stroke="#FFA500" strokeWidth="1.5"/>
    <text x="25" y="35" textAnchor="middle" fontSize="10" fill="#000" fontWeight="bold">₹</text>
    
    <circle cx="75" cy="70" r="8" fill="#FFD700" stroke="#FFA500" strokeWidth="1.5"/>
    <text x="75" y="75" textAnchor="middle" fontSize="10" fill="#000" fontWeight="bold">₹</text>
  </svg>
);

export const ConstructionCompaniesIcon: React.FC<IconProps> = ({ className = "w-full h-full" }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Multiple buildings */}
    <rect x="15" y="50" width="20" height="30" rx="1" fill="#808080" stroke="#696969" strokeWidth="1.5"/>
    <rect x="20" y="45" width="10" height="8" rx="1" fill="#A9A9A9"/>
    
    <rect x="40" y="40" width="20" height="40" rx="1" fill="#808080" stroke="#696969" strokeWidth="1.5"/>
    <rect x="45" y="35" width="10" height="8" rx="1" fill="#A9A9A9"/>
    
    <rect x="65" y="45" width="20" height="35" rx="1" fill="#808080" stroke="#696969" strokeWidth="1.5"/>
    <rect x="70" y="40" width="10" height="8" rx="1" fill="#A9A9A9"/>
    
    {/* Windows */}
    <rect x="18" y="55" width="4" height="6" fill="#FFD700"/>
    <rect x="25" y="55" width="4" height="6" fill="#FFD700"/>
    
    <rect x="43" y="50" width="5" height="7" fill="#87CEEB"/>
    <rect x="52" y="50" width="5" height="7" fill="#87CEEB"/>
    
    <rect x="68" y="50" width="4" height="6" fill="#FFD700"/>
    <rect x="75" y="50" width="4" height="6" fill="#FFD700"/>
  </svg>
);

export const ElectricalServicesIcon: React.FC<IconProps> = ({ className = "w-full h-full" }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Light bulb */}
    <circle cx="50" cy="40" r="15" fill="#FFD700" stroke="#FFA500" strokeWidth="2"/>
    <circle cx="50" cy="40" r="10" fill="#FFFFFF"/>
    <circle cx="50" cy="40" r="5" fill="#FFD700"/>
    
    {/* Bulb base */}
    <rect x="45" y="55" width="10" height="8" rx="1" fill="#808080"/>
    <rect x="47" y="63" width="6" height="3" rx="1" fill="#696969"/>
    
    {/* Lightning bolt */}
    <path d="M 50 25 L 45 35 L 50 35 L 48 45 L 55 30 L 50 30 Z" fill="#FFD700" stroke="#FFA500" strokeWidth="1.5"/>
    
    {/* Electrical lines */}
    <line x1="30" y1="50" x2="35" y2="50" stroke="#FFD700" strokeWidth="2" strokeLinecap="round"/>
    <line x1="65" y1="50" x2="70" y2="50" stroke="#FFD700" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export const PlumbingIcon: React.FC<IconProps> = ({ className = "w-full h-full" }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Pipe system */}
    <rect x="25" y="30" width="50" height="8" rx="2" fill="#87CEEB" stroke="#4682B4" strokeWidth="2"/>
    <rect x="25" y="30" width="8" height="8" rx="2" fill="#4169E1"/>
    
    {/* Vertical pipe */}
    <rect x="40" y="38" width="8" height="25" rx="2" fill="#87CEEB" stroke="#4682B4" strokeWidth="2"/>
    
    {/* Horizontal pipe */}
    <rect x="48" y="55" width="25" height="8" rx="2" fill="#87CEEB" stroke="#4682B4" strokeWidth="2"/>
    
    {/* Tap */}
    <rect x="70" y="55" width="8" height="12" rx="1" fill="#808080"/>
    <ellipse cx="74" cy="67" rx="3" ry="2" fill="#87CEEB"/>
    
    {/* Water drops */}
    <path d="M 74 70 Q 74 75 72 75 Q 74 77 74 75 Q 76 75 74 70" fill="#4169E1"/>
    <path d="M 72 72 Q 72 76 70 76 Q 72 78 72 76 Q 74 76 72 72" fill="#4169E1"/>
    
    {/* Wrench */}
    <path d="M 20 60 L 25 65 L 30 60 L 25 55 Z" fill="#808080" stroke="#696969" strokeWidth="1.5"/>
    <rect x="22" y="62" width="6" height="2" fill="#696969"/>
  </svg>
);

export const PaintingIcon: React.FC<IconProps> = ({ className = "w-full h-full" }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Paint bucket */}
    <path d="M 40 30 L 60 30 L 65 50 L 35 50 Z" fill="#FF6347" stroke="#DC143C" strokeWidth="2"/>
    <rect x="35" y="50" width="30" height="25" rx="2" fill="#FF6347" stroke="#DC143C" strokeWidth="2"/>
    
    {/* Handle */}
    <path d="M 45 30 Q 50 25 55 30" stroke="#808080" strokeWidth="2" fill="none" strokeLinecap="round"/>
    
    {/* Paint brush */}
    <rect x="65" y="45" width="4" height="20" rx="1" fill="#8B4513"/>
    <rect x="64" y="45" width="6" height="8" rx="1" fill="#FF1493"/>
    <line x1="67" y1="45" x2="67" y2="53" stroke="#FF69B4" strokeWidth="1"/>
    
    {/* Paint drops */}
    <circle cx="70" cy="70" r="3" fill="#FF1493"/>
    <circle cx="68" cy="75" r="2" fill="#FF1493"/>
  </svg>
);

export const MaintenanceIcon: React.FC<IconProps> = ({ className = "w-full h-full" }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Toolbox */}
    <rect x="30" y="40" width="40" height="35" rx="3" fill="#FF6347" stroke="#DC143C" strokeWidth="2"/>
    <rect x="32" y="42" width="36" height="8" rx="1" fill="#FF8C00"/>
    <line x1="50" y1="42" x2="50" y2="50" stroke="#DC143C" strokeWidth="2"/>
    
    {/* Tools inside */}
    <rect x="35" y="55" width="12" height="3" rx="1" fill="#808080"/>
    <rect x="35" y="60" width="12" height="3" rx="1" fill="#808080"/>
    <rect x="35" y="65" width="8" height="3" rx="1" fill="#808080"/>
    
    <circle cx="60" cy="58" r="4" fill="#FFD700" stroke="#FFA500" strokeWidth="1.5"/>
    <circle cx="60" cy="58" r="2" fill="none" stroke="#FFA500" strokeWidth="1"/>
    
    {/* Screwdriver */}
    <rect x="65" y="55" width="3" height="12" rx="1" fill="#808080"/>
    <rect x="64" y="55" width="5" height="4" rx="1" fill="#696969"/>
  </svg>
);

export const BeautySalonIcon: React.FC<IconProps> = ({ className = "w-full h-full" }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Makeup bag - pink */}
    <rect x="15" y="25" width="70" height="55" rx="6" fill="#FFB6C1" stroke="#FF69B4" strokeWidth="2.5"/>
    <path d="M 15 25 Q 50 12 85 25" stroke="#FF69B4" strokeWidth="3" fill="none"/>
    
    {/* Lipstick - hot pink */}
    <rect x="25" y="35" width="10" height="22" rx="2" fill="#FF1493"/>
    <circle cx="30" cy="35" r="5" fill="#FF69B4"/>
    <rect x="27" y="37" width="6" height="3" fill="#FFB6C1"/>
    
    {/* Compact - pink with mirror */}
    <circle cx="50" cy="48" r="10" fill="#FFB6C1" stroke="#FF69B4" strokeWidth="2"/>
    <circle cx="50" cy="48" r="6" fill="#FFFFFF"/>
    <circle cx="50" cy="48" r="3" fill="#E0E0E0"/>
    
    {/* Cream tube - blue with pink cap */}
    <rect x="62" y="40" width="8" height="18" rx="1.5" fill="#87CEEB"/>
    <rect x="62" y="40" width="8" height="5" fill="#FF69B4"/>
    <rect x="64" y="42" width="4" height="2" fill="#FFFFFF"/>
    
    {/* Brushes - brown */}
    <line x1="35" y1="58" x2="35" y2="72" stroke="#8B4513" strokeWidth="3" strokeLinecap="round"/>
    <line x1="35" y1="58" x2="28" y2="55" stroke="#8B4513" strokeWidth="2"/>
    <line x1="35" y1="58" x2="42" y2="55" stroke="#8B4513" strokeWidth="2"/>
    
    <line x1="68" y1="58" x2="68" y2="72" stroke="#8B4513" strokeWidth="3" strokeLinecap="round"/>
    <line x1="68" y1="58" x2="61" y2="55" stroke="#8B4513" strokeWidth="2"/>
    <line x1="68" y1="58" x2="75" y2="55" stroke="#8B4513" strokeWidth="2"/>
  </svg>
);

export const RefrigeratorIcon: React.FC<IconProps> = ({ className = "w-full h-full" }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Refrigerator body */}
    <rect x="25" y="15" width="50" height="70" rx="3" fill="#FFA500" stroke="#FF8C00" strokeWidth="2"/>
    
    {/* Top door */}
    <rect x="27" y="17" width="46" height="32" rx="2" fill="#FFB347" stroke="#FF8C00" strokeWidth="1"/>
    <line x1="50" y1="17" x2="50" y2="49" stroke="#FF8C00" strokeWidth="2"/>
    
    {/* Bottom door */}
    <rect x="27" y="51" width="46" height="32" rx="2" fill="#FFB347" stroke="#FF8C00" strokeWidth="1"/>
    <line x1="50" y1="51" x2="50" y2="83" stroke="#FF8C00" strokeWidth="2"/>
    
    {/* Handles */}
    <rect x="70" y="25" width="3" height="8" rx="1" fill="#DC143C"/>
    <rect x="70" y="60" width="3" height="8" rx="1" fill="#DC143C"/>
  </svg>
);

export const GeyserIcon: React.FC<IconProps> = ({ className = "w-full h-full" }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Geyser body */}
    <rect x="30" y="20" width="40" height="60" rx="5" fill="#808080" stroke="#696969" strokeWidth="2"/>
    
    {/* Top section */}
    <rect x="32" y="22" width="36" height="15" rx="2" fill="#A9A9A9"/>
    
    {/* Control panel */}
    <rect x="35" y="40" width="30" height="25" rx="2" fill="#D3D3D3"/>
    
    {/* Flame icon */}
    <path d="M 50 50 L 45 60 L 50 65 L 55 60 Z" fill="#DC143C"/>
    <circle cx="50" cy="55" r="3" fill="#FF4500"/>
    
    {/* Water outlet */}
    <ellipse cx="50" cy="85" rx="8" ry="3" fill="#87CEEB"/>
  </svg>
);

export const CleaningIcon: React.FC<IconProps> = ({ className = "w-full h-full" }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Cleaner character */}
    {/* Head */}
    <circle cx="50" cy="25" r="12" fill="#FFDBAC"/>
    
    {/* Body */}
    <rect x="38" y="37" width="24" height="30" rx="5" fill="#228B22"/>
    
    {/* Arms */}
    <rect x="30" y="40" width="8" height="20" rx="4" fill="#228B22"/>
    <rect x="62" y="40" width="8" height="20" rx="4" fill="#228B22"/>
    
    {/* Gloves */}
    <ellipse cx="34" cy="62" rx="4" ry="5" fill="#FFD700"/>
    <ellipse cx="66" cy="62" rx="4" ry="5" fill="#FFD700"/>
    
    {/* Cap */}
    <rect x="40" y="15" width="20" height="8" rx="2" fill="#FFD700"/>
    
    {/* Mop */}
    <line x1="70" y1="45" x2="85" y2="50" stroke="#4169E1" strokeWidth="3" strokeLinecap="round"/>
    <rect x="80" y="50" width="8" height="15" rx="1" fill="#4169E1"/>
    
    {/* Bucket */}
    <path d="M 20 60 L 20 75 L 30 75 L 30 60 Z" fill="#DC143C"/>
    <ellipse cx="25" cy="60" rx="5" ry="2" fill="#DC143C"/>
    
    {/* Wet floor sign */}
    <rect x="15" y="78" width="12" height="12" rx="1" fill="#FFD700" stroke="#FFA500" strokeWidth="1"/>
    <path d="M 21 82 L 21 88" stroke="#000" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

export const WashingMachineIcon: React.FC<IconProps> = ({ className = "w-full h-full" }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Machine body */}
    <rect x="25" y="20" width="50" height="60" rx="3" fill="#87CEEB" stroke="#4682B4" strokeWidth="2"/>
    
    {/* Door */}
    <circle cx="50" cy="50" r="18" fill="#B0E0E6" stroke="#4682B4" strokeWidth="2"/>
    
    {/* Window showing water */}
    <circle cx="50" cy="50" r="15" fill="#4169E1" opacity="0.6"/>
    <path d="M 35 45 Q 50 40 65 45 Q 50 50 35 45" fill="#1E90FF" opacity="0.8"/>
    
    {/* Control panel */}
    <rect x="40" y="25" width="20" height="8" rx="2" fill="#4682B4"/>
    <circle cx="45" cy="29" r="2" fill="#87CEEB"/>
    <circle cx="50" cy="29" r="2" fill="#87CEEB"/>
    <circle cx="55" cy="29" r="2" fill="#87CEEB"/>
  </svg>
);

export const MicrowaveIcon: React.FC<IconProps> = ({ className = "w-full h-full" }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Microwave body */}
    <rect x="20" y="25" width="60" height="50" rx="3" fill="#696969" stroke="#2F2F2F" strokeWidth="2"/>
    
    {/* Door */}
    <rect x="22" y="27" width="56" height="46" rx="2" fill="#808080" stroke="#2F2F2F" strokeWidth="1"/>
    
    {/* Display panel */}
    <rect x="25" y="30" width="50" height="12" rx="2" fill="#87CEEB"/>
    <text x="50" y="40" textAnchor="middle" fontSize="8" fill="#000">00:30</text>
    
    {/* Bowl inside */}
    <ellipse cx="50" cy="55" rx="12" ry="8" fill="#FF6347"/>
    <ellipse cx="50" cy="55" rx="10" ry="6" fill="#FF8C00"/>
    
    {/* Steam */}
    <path d="M 45 45 Q 47 40 45 35" stroke="#FFFFFF" strokeWidth="2" fill="none" strokeLinecap="round"/>
    <path d="M 50 45 Q 52 40 50 35" stroke="#FFFFFF" strokeWidth="2" fill="none" strokeLinecap="round"/>
    <path d="M 55 45 Q 57 40 55 35" stroke="#FFFFFF" strokeWidth="2" fill="none" strokeLinecap="round"/>
    
    {/* Handle */}
    <rect x="70" y="45" width="4" height="10" rx="1" fill="#2F2F2F"/>
  </svg>
);

export const WaterPurifierIcon: React.FC<IconProps> = ({ className = "w-full h-full" }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Purifier body */}
    <rect x="35" y="15" width="30" height="65" rx="3" fill="#DDA0DD" stroke="#9370DB" strokeWidth="2"/>
    
    {/* Top section */}
    <rect x="37" y="17" width="26" height="20" rx="2" fill="#E6E6FA"/>
    
    {/* Indicator light */}
    <circle cx="50" cy="27" r="4" fill="#32CD32"/>
    
    {/* Middle section */}
    <rect x="37" y="39" width="26" height="25" rx="2" fill="#DDA0DD"/>
    
    {/* Filter indicator */}
    <rect x="42" y="45" width="16" height="12" rx="1" fill="#FFFFFF" stroke="#9370DB" strokeWidth="1"/>
    
    {/* Bottom section with tap */}
    <rect x="37" y="66" width="26" height="12" rx="2" fill="#E6E6FA"/>
    
    {/* Tap */}
    <rect x="45" y="78" width="10" height="8" rx="1" fill="#9370DB"/>
    <ellipse cx="50" cy="86" rx="3" ry="2" fill="#87CEEB"/>
    
    {/* Water drop */}
    <path d="M 50 88 Q 50 92 47 92 Q 50 94 50 92 Q 53 92 50 88" fill="#4169E1"/>
  </svg>
);

export const KitchenChimneyIcon: React.FC<IconProps> = ({ className = "w-full h-full" }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Chimney body */}
    <rect x="25" y="40" width="50" height="35" rx="2" fill="#808080" stroke="#696969" strokeWidth="2"/>
    
    {/* Exhaust pipe */}
    <rect x="40" y="20" width="20" height="25" rx="2" fill="#2F2F2F"/>
    
    {/* Front panel */}
    <rect x="27" y="42" width="46" height="31" rx="1" fill="#A9A9A9"/>
    
    {/* Indicator lights */}
    <circle cx="40" cy="55" r="3" fill="#32CD32"/>
    <circle cx="60" cy="55" r="3" fill="#DC143C"/>
    
    {/* Control buttons */}
    <rect x="45" y="65" width="10" height="6" rx="1" fill="#2F2F2F"/>
  </svg>
);

export const KitchenAppliancesIcon: React.FC<IconProps> = ({ className = "w-full h-full" }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Stove */}
    <rect x="20" y="60" width="35" height="25" rx="2" fill="#CD853F" stroke="#8B4513" strokeWidth="2"/>
    
    {/* Burners */}
    <circle cx="30" cy="70" r="4" fill="#2F2F2F"/>
    <circle cx="45" cy="70" r="4" fill="#2F2F2F"/>
    
    {/* Pots */}
    <ellipse cx="30" cy="65" rx="5" ry="3" fill="#8B4513"/>
    <ellipse cx="45" cy="65" rx="5" ry="3" fill="#8B4513"/>
    
    {/* Oven */}
    <rect x="60" y="50" width="30" height="35" rx="2" fill="#D2691E" stroke="#8B4513" strokeWidth="2"/>
    <rect x="62" y="52" width="26" height="31" rx="1" fill="#A0522D"/>
    
    {/* Oven door handle */}
    <rect x="85" y="65" width="3" height="8" rx="1" fill="#8B4513"/>
    
    {/* Overhead cabinets */}
    <rect x="15" y="15" width="70" height="20" rx="2" fill="#DEB887" stroke="#8B4513" strokeWidth="1"/>
    <line x1="50" y1="15" x2="50" y2="35" stroke="#8B4513" strokeWidth="1"/>
  </svg>
);

export const TVRepairIcon: React.FC<IconProps> = ({ className = "w-full h-full" }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* TV screen */}
    <rect x="25" y="20" width="50" height="40" rx="2" fill="#808080" stroke="#696969" strokeWidth="2"/>
    
    {/* Screen content */}
    <rect x="27" y="22" width="46" height="36" rx="1" fill="#DC143C"/>
    <circle cx="50" cy="40" r="8" fill="#FFD700"/>
    <polygon points="47,38 47,42 52,40" fill="#DC143C"/>
    
    {/* TV stand */}
    <rect x="45" y="60" width="10" height="5" rx="1" fill="#696969"/>
    
    {/* Remote control */}
    <rect x="70" y="50" width="12" height="20" rx="2" fill="#4169E1" stroke="#000080" strokeWidth="1"/>
    <rect x="72" y="52" width="8" height="16" rx="1" fill="#1E90FF"/>
    <circle cx="76" cy="58" r="1.5" fill="#000080"/>
    <circle cx="76" cy="63" r="1.5" fill="#000080"/>
    <circle cx="76" cy="68" r="1.5" fill="#000080"/>
  </svg>
);


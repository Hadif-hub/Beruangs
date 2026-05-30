import React from "react";

interface BearLogoProps {
  className?: string;
}

export default function BearLogo({ className = "h-8 w-8" }: BearLogoProps) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      id="svg-bear-logo"
    >
      {/* External Ears */}
      <circle cx="6" cy="7" r="3.2" className="fill-bear-brown stroke-bear-dark" strokeWidth="2" />
      <circle cx="18" cy="7" r="3.2" className="fill-bear-brown stroke-bear-dark" strokeWidth="2" />
      
      {/* Inner Ear accents */}
      <circle cx="6" cy="7" r="1.5" className="fill-bear-latte opacity-80" />
      <circle cx="18" cy="7" r="1.5" className="fill-bear-latte opacity-80" />

      {/* Main Face Circle */}
      <circle cx="12" cy="13" r="7.5" className="fill-bear-brown stroke-bear-dark" strokeWidth="2" />

      {/* Eye shine highlights */}
      <circle cx="9.5" cy="11.5" r="1.2" className="fill-bear-dark" />
      <circle cx="9" cy="11" r="0.4" className="fill-white" />

      <circle cx="14.5" cy="11.5" r="1.2" className="fill-bear-dark" />
      <circle cx="14" cy="11" r="0.4" className="fill-white" />

      {/* Snout Details */}
      <ellipse cx="12" cy="15" rx="3" ry="2" className="fill-bear-latte stroke-bear-dark" strokeWidth="1.5" />
      
      {/* Nose and mouth */}
      <polygon points="11,14.2 13,14.2 12,15.2" className="fill-bear-dark" />
      <path 
        d="M12 15.2v1c-.5 0-.8.4-.8.4m.8-.4c.5 0 .8.4.8.4" 
        className="stroke-bear-dark" 
        strokeWidth="1" 
        strokeLinecap="round" 
      />
    </svg>
  );
}

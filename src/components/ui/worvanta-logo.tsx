import React from "react";

interface WorvantaLogoProps {
  className?: string;
  size?: number;
  showWordmark?: boolean;
  wordmarkClassName?: string;
}

export function WorvantaLogo({
  className = "",
  size = 28,
  showWordmark = true,
  wordmarkClassName = "text-base font-bold tracking-tight text-foreground",
}: WorvantaLogoProps) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Isotipo: Sobre semi-abierto sobrio con hoja de trabajo y acento sutil */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        {/* Hoja de trabajo que emerge del sobre */}
        <path
          d="M8 13V6.5C8 5.67 8.67 5 9.5 5H22.5C23.33 5 24 5.67 24 6.5V13"
          className="stroke-foreground/70"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <line x1="12" y1="8.5" x2="20" y2="8.5" className="stroke-foreground/40" strokeWidth="1.5" strokeLinecap="round" />

        {/* Cuerpo del sobre semi-abierto */}
        <rect
          x="3.5"
          y="10.5"
          width="25"
          height="17"
          rx="3"
          className="fill-card stroke-foreground"
          strokeWidth="1.8"
        />

        {/* Pliegue semi-abierto del sobre */}
        <path
          d="M4.5 12L16 19.5L27.5 12"
          className="stroke-foreground"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Punto / Acento sutil corporativo */}
        <circle cx="24.5" cy="7.5" r="2" className="fill-primary" />
      </svg>

      {showWordmark && (
        <span className={wordmarkClassName}>
          Worvanta
        </span>
      )}
    </div>
  );
}

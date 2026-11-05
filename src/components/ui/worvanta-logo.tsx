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
  wordmarkClassName = "text-base font-bold tracking-tight text-foreground font-sans",
}: WorvantaLogoProps) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Isotipo Worvanta Opción 3: Sobre geométrico semi-abierto con pliegue limpio y nodo de conexión */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        {/* Cuerpo del sobre */}
        <rect
          x="3"
          y="8.5"
          width="26"
          height="18"
          rx="3.5"
          className="fill-muted/20 stroke-foreground"
          strokeWidth="1.75"
        />

        {/* Solapa semi-abierta hacia arriba */}
        <path
          d="M3.5 10L16 4.5L28.5 10"
          className="stroke-foreground"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Pliegue interior geométrico */}
        <path
          d="M3.5 10.5L16 18.5L28.5 10.5"
          className="stroke-foreground/60"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Pliegues sutiles de esquina */}
        <path
          d="M3.5 26L11.5 18"
          className="stroke-foreground/25"
          strokeWidth="1.25"
          strokeLinecap="round"
        />
        <path
          d="M28.5 26L20.5 18"
          className="stroke-foreground/25"
          strokeWidth="1.25"
          strokeLinecap="round"
        />

        {/* Nodo circular de conexión (Espacio Compartido e Inteligente) */}
        <circle
          cx="16"
          cy="4.5"
          r="2.5"
          className="fill-blue-600 dark:fill-blue-400 stroke-background"
          strokeWidth="1"
        />
      </svg>

      {showWordmark && (
        <span className={wordmarkClassName}>
          Worvanta
        </span>
      )}
    </div>
  );
}

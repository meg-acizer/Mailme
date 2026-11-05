import React from "react";

interface WorvantaLogoProps {
  className?: string;
  size?: number;
  showWordmark?: boolean;
  wordmarkClassName?: string;
}

export function WorvantaLogo({
  className = "",
  size = 32,
  showWordmark = true,
  wordmarkClassName = "text-xl font-bold tracking-tight text-foreground font-sans",
}: WorvantaLogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* 
        Isotipo Oficial Worvanta (Variación 3):
        Sobre geométrico semi-abierto con solapa en V, pliegue interior en diamante
        y nodo de conexión azul cobalto (#0d62f2) ubicado en el centro superior.
      */}
      <svg
        width={size}
        height={(size * 32) / 36}
        viewBox="0 0 36 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        {/* Nodo circular azul cobalto (Espacio Compartido e Inteligente) */}
        <circle
          cx="18"
          cy="8.5"
          r="4.2"
          className="fill-blue-600 dark:fill-blue-500"
        />

        {/* 
          Pliegue interior inferior (forma la solapa interior del sobre)
        */}
        <path
          d="M3.5 25.5L18 16.5L32.5 25.5"
          className="stroke-foreground"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* 
          Pliegue superior en V que baja hacia el centro
        */}
        <path
          d="M3.5 8.5L18 19.5L32.5 8.5"
          className="stroke-foreground"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* 
          Contorno exterior: Lateral izquierdo, base horizontal y lateral derecho
        */}
        <path
          d="M3.5 8.5V25.5H32.5V8.5"
          className="stroke-foreground"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {showWordmark && (
        <span className={wordmarkClassName} style={{ letterSpacing: "-0.03em" }}>
          Worvanta
        </span>
      )}
    </div>
  );
}

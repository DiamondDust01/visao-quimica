import React, { useMemo } from 'react';
import { hexCenters, hexPolygon, symbolFor } from './hexGrid.js';
import useViewportSize from '../app/useViewportSize.js';

// Fundo do app: malha hexagonal com o símbolo de um elemento no centro de cada hexágono.
// Contornos e símbolos saem da mesma geometria (hexGrid.js), dentro do mesmo SVG, então
// ficam sempre alinhados. As cores vêm das variáveis --backdrop-* de styles.css.
const SIDE = 24;

export default function HexBackdrop() {
  const { width, height } = useViewportSize();
  const centers = useMemo(() => hexCenters(width, height, SIDE), [width, height]);
  const outline = useMemo(() => centers.map(({ x, y }) => `M${hexPolygon(x, y, SIDE).replaceAll(' ', 'L')}Z`).join(''), [centers]);
  const fontSize = width < 768 ? 8 : 10;

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(circle at 15% 0%, var(--backdrop-glow-a), transparent 40%), radial-gradient(circle at 90% 100%, var(--backdrop-glow-b), transparent 45%), linear-gradient(180deg, var(--app-bg) 0%, var(--app-bg-end) 100%)' }}
      />
      <svg className="absolute inset-0" width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <defs>
          <linearGradient id="backdrop-symbol-gradient" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2={width} y2={height}>
            <stop offset="0%" style={{ stopColor: 'var(--backdrop-symbol-a)' }} />
            <stop offset="100%" style={{ stopColor: 'var(--backdrop-symbol-b)' }} />
          </linearGradient>
        </defs>
        <path d={outline} fill="none" style={{ stroke: 'var(--backdrop-hex)' }} strokeWidth="1" />
        <g
          className="backdrop-symbols select-none"
          fill="url(#backdrop-symbol-gradient)"
          fontFamily="var(--font-mono)"
          fontSize={fontSize}
          textAnchor="middle"
          dominantBaseline="central"
          style={{ opacity: 'var(--backdrop-symbols-opacity)' }}
        >
          {centers.map((center) => (
            <text key={`${center.column}-${center.row}`} x={center.x} y={center.y}>{symbolFor(center)}</text>
          ))}
        </g>
      </svg>
    </div>
  );
}

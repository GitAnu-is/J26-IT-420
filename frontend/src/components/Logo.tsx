import React from 'react';

interface LogoProps {
  size?: number;
  inverted?: boolean;
}

export function Logo({ size = 48, inverted = false }: LogoProps) {
  const shield = inverted ? '#FFFFFF' : '#176B45';
  const leaf = inverted ? '#176B45' : '#FFFFFF';
  const vein = inverted ? '#FFFFFF' : '#176B45';
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" role="img" aria-label="AgriGuard">
      <path d="M24 3 41 9.5V22c0 11-7.4 19.6-17 23-9.6-3.4-17-12-17-23V9.5L24 3Z" fill={shield} />
      <path d="M15.5 32.5c0-10.5 6.5-16 17.5-17 0 11-6 17-17.5 17Z" fill={leaf} />
      <path d="M17 31l10-10" stroke={vein} strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="33" cy="15.5" r="2.2" fill="#65A765" />
    </svg>);

}
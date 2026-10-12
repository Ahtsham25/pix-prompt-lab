import React, { useId } from 'react';

interface PixvidLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

/**
 * Flagship 3D Crystalline Studio Emblem for Pixvid Lab.
 * Synchronized with ic_pixvid_logo.xml & logo_badge_bg.xml:
 * - Outer iridescent aurora bezel (Cyan -> Violet -> Rose)
 * - Deep jewel obsidian-amethyst inner studio chamber with top glass specular highlight
 * - Hexagonal cinema aperture iris ring
 * - Multi-faceted 3D crystalline Play/Motion prism
 * - Precision 4-point AI star flare at top-right apex
 */
export const PixvidLogo: React.FC<PixvidLogoProps> = ({ size = 'md', className = '' }) => {
  const uid = useId().replace(/:/g, '');

  const outerSize =
    size === 'xl'
      ? 'w-[108px] h-[108px] rounded-[30px] p-[2.5px] shadow-[0_0_50px_rgba(217,70,239,0.42)]'
      : size === 'lg'
      ? 'w-24 h-24 rounded-[26px] p-[2px] shadow-[0_0_40px_rgba(217,70,239,0.35)]'
      : size === 'sm'
      ? 'w-[30px] h-[30px] rounded-[10px] p-[1.5px] shadow-md shadow-[#A855F7]/25'
      : 'w-[34px] h-[34px] rounded-[11px] p-[1.5px] shadow-md shadow-[#A855F7]/30';

  const innerRadius =
    size === 'xl'
      ? 'rounded-[27.5px]'
      : size === 'lg'
      ? 'rounded-[24px]'
      : size === 'sm'
      ? 'rounded-[8.5px]'
      : 'rounded-[9.5px]';

  const svgSize = size === 'xl' ? 68 : size === 'lg' ? 58 : size === 'sm' ? 19 : 22;

  return (
    <div
      className={`${outerSize} pix-badge-gradient flex items-center justify-center shrink-0 relative select-none ${className}`}
    >
      {/* Inner deep jewel studio core */}
      <div
        className={`w-full h-full ${innerRadius} bg-gradient-to-br from-[#161336] via-[#2D094E] to-[#590D3B] flex items-center justify-center relative overflow-hidden`}
      >
        {/* Top glass specular highlight */}
        <div
          className="absolute inset-x-0 top-0 h-[46%] bg-gradient-to-b from-white/20 to-transparent pointer-events-none"
          aria-hidden="true"
        />
        {/* Subtle bottom magenta/cyan internal glow */}
        <div
          className="absolute -bottom-3 -right-3 w-2/3 h-2/3 rounded-full bg-[#38BDF8]/25 blur-md pointer-events-none"
          aria-hidden="true"
        />

        <svg
          width={svgSize}
          height={svgSize}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="relative z-10 drop-shadow-[0_2px_6px_rgba(0,0,0,0.45)]"
        >
          <defs>
            <linearGradient id={`hex_${uid}`} x1="4" y1="2.5" x2="20" y2="21.5" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.85" />
              <stop offset="50%" stopColor="#C084FC" stopOpacity="0.65" />
              <stop offset="100%" stopColor="#F43F5E" stopOpacity="0.85" />
            </linearGradient>
            <linearGradient id={`prismBack_${uid}`} x1="7.8" y1="6.8" x2="18" y2="17" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="100%" stopColor="#818CF8" />
            </linearGradient>
            <linearGradient id={`prismMain_${uid}`} x1="9" y1="7" x2="17.5" y2="16.5" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="65%" stopColor="#F3E8FF" />
              <stop offset="100%" stopColor="#FBCFE8" />
            </linearGradient>
            <linearGradient id={`star_${uid}`} x1="15.5" y1="2.5" x2="21" y2="8" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="50%" stopColor="#F472B6" />
              <stop offset="100%" stopColor="#FBBF24" />
            </linearGradient>
          </defs>

          {/* Subtle hexagonal cinema aperture ring */}
          <path
            d="M12 2.4L19.9 6.95V17.05L12 21.6L4.1 17.05V6.95L12 2.4Z"
            fill="#38BDF8"
            fillOpacity="0.10"
            stroke={`url(#hex_${uid})`}
            strokeWidth="1.25"
            strokeLinejoin="round"
          />

          {/* Layered back cyan motion prism wing */}
          <path
            d="M8.0 7.1L17.7 12.0L8.0 16.9V7.1Z"
            fill={`url(#prismBack_${uid})`}
            fillOpacity="0.52"
          />

          {/* Primary 3D Crystalline Play Prism */}
          <path
            d="M9.3 7.55C9.3 6.98 9.92 6.64 10.41 6.93L17.25 10.98C17.73 11.27 17.73 11.97 17.25 12.26L10.41 16.31C9.92 16.6 9.3 16.26 9.3 15.69V7.55Z"
            fill={`url(#prismMain_${uid})`}
          />

          {/* Upper facet light refraction on play prism */}
          <path
            d="M9.3 7.55C9.3 6.98 9.92 6.64 10.41 6.93L17.25 11.62L9.3 12.1V7.55Z"
            fill="#FFFFFF"
            fillOpacity="0.92"
          />

          {/* Precision AI Star Flare at top-right apex */}
          <path
            d="M18.3 2.5C18.62 4.35 19.25 4.98 21.1 5.3C19.25 5.62 18.62 6.25 18.3 8.1C17.98 6.25 17.35 5.62 15.5 5.3C17.35 4.98 17.98 4.35 18.3 2.5Z"
            fill={`url(#star_${uid})`}
          />
          <path
            d="M18.3 3.85C18.46 4.7 18.75 4.99 19.6 5.15C18.75 5.31 18.46 5.6 18.3 6.45C18.14 5.6 17.85 5.31 17.0 5.15C17.85 4.99 18.14 4.7 18.3 3.85Z"
            fill="#FFFFFF"
          />
        </svg>
      </div>
    </div>
  );
};

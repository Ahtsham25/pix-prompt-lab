import React from 'react';

interface PixvidLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Custom Pixvid Lab Logo matching ic_pixvid_logo.xml & logo_badge_bg.xml:
 * Combines a vibrant cyan-purple-pink gradient badge, camera/video frame,
 * crisp video play triangle, and top-right AI sparkle star.
 */
export const PixvidLogo: React.FC<PixvidLogoProps> = ({ size = 'md', className = '' }) => {
  const dimensions =
    size === 'lg'
      ? 'w-24 h-24 rounded-[26px]'
      : size === 'sm'
      ? 'w-[26px] h-[26px] rounded-[8px]'
      : 'w-[30px] h-[30px] rounded-[9px]';

  const svgSize = size === 'lg' ? 54 : size === 'sm' ? 16 : 19;

  return (
    <div
      className={`${dimensions} pix-badge-gradient flex items-center justify-center shrink-0 shadow-md shadow-[#A855F7]/25 ${className}`}
    >
      <svg
        width={svgSize}
        height={svgSize}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer translucent lens/video frame */}
        <rect
          x="3"
          y="4"
          width="18"
          height="16"
          rx="3.5"
          fill="white"
          fillOpacity="0.2"
          stroke="white"
          strokeOpacity="0.45"
          strokeWidth="1.2"
        />
        {/* Crisp Video Play Triangle */}
        <path
          d="M9.6 7.9V16.1C9.6 16.68 10.23 17.04 10.74 16.74L17.4 12.64C17.87 12.35 17.87 11.65 17.4 11.36L10.74 7.26C10.23 6.96 9.6 7.32 9.6 7.9Z"
          fill="white"
        />
        {/* Top-right AI Sparkle Star */}
        <path
          d="M18.6 1.8C18.9 3.6 19.5 4.2 21.3 4.5C19.5 4.8 18.9 5.4 18.6 7.2C18.3 5.4 17.7 4.8 15.9 4.5C17.7 4.2 18.3 3.6 18.6 1.8Z"
          fill="white"
        />
      </svg>
    </div>
  );
};

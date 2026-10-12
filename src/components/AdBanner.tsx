import React from 'react';
import { Constants } from '../constants';

interface AdBannerProps {
  label?: string;
  className?: string;
}

/**
 * AdBanner simulates and previews the AdMob Adaptive/Inline Banner in the web preview
 * while reflecting the user's real AdMob Banner ID: ca-app-pub-9508264963334654/1103896314.
 *
 * In Android APK (native build), real Google Mobile Ads SDK renders the actual ad via AdsManager.loadBanner().
 */
export const AdBanner: React.FC<AdBannerProps> = ({
  label = 'AdMob Banner Preview',
  className = '',
}) => {
  return (
    <div
      className={`w-full rounded-[14px] bg-[#121222]/90 border border-white/10 p-3 shadow-md backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-2 overflow-hidden relative ${className}`}
    >
      {/* Decorative subtle ambient highlight */}
      <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full bg-gradient-to-br from-[#A855F7]/15 to-[#EC4899]/15 blur-xl pointer-events-none" />

      <div className="flex items-center gap-2.5 z-10">
        <span className="px-2 py-0.5 rounded-[6px] bg-[#EC4899]/20 border border-[#EC4899]/30 text-[#EC4899] text-[10px] font-extrabold uppercase tracking-wider">
          Ad
        </span>
        <div className="flex flex-col">
          <span className="text-[12px] font-semibold text-white/90">
            {label}
          </span>
          <span className="text-[10px] text-[#9CA3AF] font-mono truncate max-w-[240px] sm:max-w-none">
            Unit: {Constants.BANNER_AD_UNIT_ID}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 z-10 shrink-0">
        <span className="text-[10px] px-2 py-1 rounded-[8px] bg-white/5 border border-white/10 text-[#38BDF8] font-medium">
          320×50 Smart Banner
        </span>
      </div>
    </div>
  );
};

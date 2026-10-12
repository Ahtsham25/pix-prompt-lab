import React from 'react';
import {
  X,
  MessageCircle,
  Star,
  Share2,
  Shield,
  Sliders,
  ChevronRight,
} from 'lucide-react';
import { Constants } from '../constants';
import { PixvidLogo } from './PixvidLogo';

interface MoreSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPrivacyPolicy: () => void;
  onOpenAdConsent: () => void;
  showToast: (msg: string) => void;
}

export const MoreSettingsModal: React.FC<MoreSettingsModalProps> = ({
  isOpen,
  onClose,
  onOpenPrivacyPolicy,
  onOpenAdConsent,
  showToast,
}) => {
  if (!isOpen) return null;

  const handleOpenWhatsApp = () => {
    window.open(Constants.WHATSAPP_LINK, '_blank', 'noopener,noreferrer');
    onClose();
  };

  const handleRateUs = () => {
    window.open(Constants.PLAY_STORE_URL, '_blank', 'noopener,noreferrer');
    onClose();
  };

  const handleShareApp = async () => {
    const shareText = `Check out ${Constants.APP_NAME} — a studio library of ready-to-use AI image & video prompts!\n${Constants.PLAY_STORE_URL}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: Constants.APP_NAME,
          text: shareText,
          url: window.location.href,
        });
      } catch {
        // User cancelled native share sheet
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareText);
        showToast('Share link copied to clipboard!');
      } catch {
        showToast('Could not copy share link');
      }
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end justify-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[500px] bg-[#131322]/95 backdrop-blur-2xl rounded-t-[28px] pb-7 border-t border-white/15 shadow-2xl animate-pix-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle affordance */}
        <div className="w-10 h-1.5 bg-white/15 rounded-full mx-auto mt-3" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-3.5 pb-4">
          <div className="flex items-center gap-2.5">
            <PixvidLogo size="sm" />
            <h2 className="text-[18px] font-bold text-white font-display">More &amp; Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/15 transition-colors cursor-pointer"
            aria-label="Close menu"
          >
            <X className="w-4 h-4 text-[#9CA3AF]" />
          </button>
        </div>

        {/* Rows matching dialog_more_settings.xml (No Admin button in user app) */}
        <div className="flex flex-col gap-2 px-4">
          <button
            onClick={handleOpenWhatsApp}
            className="w-full flex items-center gap-3.5 px-3.5 py-3 bg-[#1B1B2E]/90 hover:bg-[#24243B] border border-white/5 rounded-[15px] transition-colors text-left cursor-pointer"
          >
            <div className="w-9 h-9 rounded-[11px] bg-[#121220] flex items-center justify-center shrink-0">
              <MessageCircle className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="flex-1 text-[14px] font-medium text-white">
              Join Our WhatsApp Channel
            </span>
            <ChevronRight className="w-4 h-4 text-[#9CA3AF]" />
          </button>

          <button
            onClick={handleRateUs}
            className="w-full flex items-center gap-3.5 px-3.5 py-3 bg-[#1B1B2E]/90 hover:bg-[#24243B] border border-white/5 rounded-[15px] transition-colors text-left cursor-pointer"
          >
            <div className="w-9 h-9 rounded-[11px] bg-[#121220] flex items-center justify-center shrink-0">
              <Star className="w-5 h-5 text-amber-400" />
            </div>
            <span className="flex-1 text-[14px] font-medium text-white">Rate Us</span>
            <ChevronRight className="w-4 h-4 text-[#9CA3AF]" />
          </button>

          <button
            onClick={handleShareApp}
            className="w-full flex items-center gap-3.5 px-3.5 py-3 bg-[#1B1B2E]/90 hover:bg-[#24243B] border border-white/5 rounded-[15px] transition-colors text-left cursor-pointer"
          >
            <div className="w-9 h-9 rounded-[11px] bg-[#121220] flex items-center justify-center shrink-0">
              <Share2 className="w-5 h-5 text-[#A855F7]" />
            </div>
            <span className="flex-1 text-[14px] font-medium text-white">Share Our App</span>
            <ChevronRight className="w-4 h-4 text-[#9CA3AF]" />
          </button>

          <button
            onClick={() => {
              onClose();
              onOpenPrivacyPolicy();
            }}
            className="w-full flex items-center gap-3.5 px-3.5 py-3 bg-[#1B1B2E]/90 hover:bg-[#24243B] border border-white/5 rounded-[15px] transition-colors text-left cursor-pointer"
          >
            <div className="w-9 h-9 rounded-[11px] bg-[#121220] flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5 text-[#EC4899]" />
            </div>
            <span className="flex-1 text-[14px] font-medium text-white">Privacy Policy</span>
            <ChevronRight className="w-4 h-4 text-[#9CA3AF]" />
          </button>

          <button
            onClick={() => {
              onClose();
              onOpenAdConsent();
            }}
            className="w-full flex items-center gap-3.5 px-3.5 py-3 bg-[#1B1B2E]/90 hover:bg-[#24243B] border border-white/5 rounded-[15px] transition-colors text-left cursor-pointer"
          >
            <div className="w-9 h-9 rounded-[11px] bg-[#121220] flex items-center justify-center shrink-0">
              <Sliders className="w-5 h-5 text-sky-400" />
            </div>
            <span className="flex-1 text-[14px] font-medium text-white">Manage Ad Consent</span>
            <ChevronRight className="w-4 h-4 text-[#9CA3AF]" />
          </button>
        </div>
      </div>
    </div>
  );
};

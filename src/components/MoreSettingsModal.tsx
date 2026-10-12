import React from 'react';
import {
  X,
  MessageCircle,
  Star,
  Share2,
  Shield,
  Sliders,
  ChevronRight,
  PlusCircle,
} from 'lucide-react';
import { Constants } from '../constants';

interface MoreSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPrivacyPolicy: () => void;
  onOpenAdConsent: () => void;
  onOpenAdminPanel: () => void;
  showToast: (msg: string) => void;
}

export const MoreSettingsModal: React.FC<MoreSettingsModalProps> = ({
  isOpen,
  onClose,
  onOpenPrivacyPolicy,
  onOpenAdConsent,
  onOpenAdminPanel,
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
    const shareText = `Check out PixPrompt Lab — a library of ready-to-use AI image prompts!\n${Constants.PLAY_STORE_URL}`;
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
      className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-end justify-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[480px] bg-[#15151F] rounded-t-[24px] pb-6 border-t border-white/10 shadow-2xl animate-in slide-in-from-bottom duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5">
          <h2 className="text-[19px] font-bold text-white">More &amp; Settings</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close menu"
          >
            <X className="w-5 h-5 text-[#9CA3AF]" />
          </button>
        </div>

        {/* Rows matching dialog_more_settings.xml */}
        <div className="flex flex-col gap-2 px-4">
          <button
            onClick={handleOpenWhatsApp}
            className="w-full flex items-center gap-3.5 px-3.5 py-3 bg-[#1C1C28] hover:bg-[#242434] rounded-[14px] transition-colors text-left cursor-pointer"
          >
            <div className="w-9 h-9 rounded-[10px] bg-[#15151F] flex items-center justify-center shrink-0">
              <MessageCircle className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="flex-1 text-[14px] font-medium text-white">
              Join Our WhatsApp Channel
            </span>
            <ChevronRight className="w-4 h-4 text-[#9CA3AF]" />
          </button>

          <button
            onClick={handleRateUs}
            className="w-full flex items-center gap-3.5 px-3.5 py-3 bg-[#1C1C28] hover:bg-[#242434] rounded-[14px] transition-colors text-left cursor-pointer"
          >
            <div className="w-9 h-9 rounded-[10px] bg-[#15151F] flex items-center justify-center shrink-0">
              <Star className="w-5 h-5 text-amber-400" />
            </div>
            <span className="flex-1 text-[14px] font-medium text-white">Rate Us</span>
            <ChevronRight className="w-4 h-4 text-[#9CA3AF]" />
          </button>

          <button
            onClick={handleShareApp}
            className="w-full flex items-center gap-3.5 px-3.5 py-3 bg-[#1C1C28] hover:bg-[#242434] rounded-[14px] transition-colors text-left cursor-pointer"
          >
            <div className="w-9 h-9 rounded-[10px] bg-[#15151F] flex items-center justify-center shrink-0">
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
            className="w-full flex items-center gap-3.5 px-3.5 py-3 bg-[#1C1C28] hover:bg-[#242434] rounded-[14px] transition-colors text-left cursor-pointer"
          >
            <div className="w-9 h-9 rounded-[10px] bg-[#15151F] flex items-center justify-center shrink-0">
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
            className="w-full flex items-center gap-3.5 px-3.5 py-3 bg-[#1C1C28] hover:bg-[#242434] rounded-[14px] transition-colors text-left cursor-pointer"
          >
            <div className="w-9 h-9 rounded-[10px] bg-[#15151F] flex items-center justify-center shrink-0">
              <Sliders className="w-5 h-5 text-indigo-400" />
            </div>
            <span className="flex-1 text-[14px] font-medium text-white">Manage Ad Consent</span>
            <ChevronRight className="w-4 h-4 text-[#9CA3AF]" />
          </button>

          <button
            onClick={() => {
              onClose();
              onOpenAdminPanel();
            }}
            className="w-full flex items-center gap-3.5 px-3.5 py-3 bg-[#1C1C28] hover:bg-[#242434] rounded-[14px] transition-colors text-left cursor-pointer"
          >
            <div className="w-9 h-9 rounded-[10px] bg-[#15151F] flex items-center justify-center shrink-0">
              <PlusCircle className="w-5 h-5 text-[#F97316]" />
            </div>
            <span className="flex-1 text-[14px] font-medium text-white">
              Admin Panel (Add Prompt)
            </span>
            <ChevronRight className="w-4 h-4 text-[#9CA3AF]" />
          </button>
        </div>
      </div>
    </div>
  );
};

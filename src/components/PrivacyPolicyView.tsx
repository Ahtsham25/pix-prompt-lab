import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Constants } from '../constants';
import { PixvidLogo } from './PixvidLogo';

interface PrivacyPolicyViewProps {
  onBack: () => void;
}

export const PrivacyPolicyView: React.FC<PrivacyPolicyViewProps> = ({ onBack }) => {
  return (
    <div className="flex flex-col flex-1 min-h-0 animate-pix-card">
      {/* Frosted Studio Header */}
      <div className="mx-4 mt-3.5 pix-gradient-border rounded-[18px] shadow-lg shadow-black/25">
        <div className="h-[56px] pix-glass-panel rounded-[16.5px] flex items-center justify-between px-3.5">
          <div className="flex items-center gap-3">
            <PixvidLogo size="md" />
            <div>
              <h1 className="text-[16px] font-bold text-white leading-tight font-display">
                Privacy Policy
              </h1>
              <p className="text-[11px] text-[#A1A1B5]">Pixvid Lab — October 2026</p>
            </div>
          </div>
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/15 border border-white/10 transition-colors cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Content matching pixprompt-app/index.html */}
      <div className="flex-1 overflow-y-auto px-5 py-5 text-[14.5px] leading-[1.7] text-[#D4D4DC] space-y-5">
        <p>
          Pixvid Lab ("the App", "we", "us") is developed by Shami Academy. This page explains
          what information the App collects, how it's used, and the choices available to you. By
          using Pixvid Lab, you agree to the practices described here.
        </p>

        <div>
          <h2 className="text-[17px] font-bold text-[#EC4899] mb-2 font-display">
            Information We Collect
          </h2>
          <div className="pix-glass-panel border border-white/10 rounded-[16px] p-4 space-y-2.5">
            <p className="font-semibold text-white">Information stored only on your device:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                Image and video prompts you mark as favorites (saved locally on your device, not
                sent to us)
              </li>
              <li>
                Search text you type inside the App (used only to filter results on your device)
              </li>
            </ul>
            <p>
              We do not require account creation, and we do not collect your name, email, or phone
              number.
            </p>
          </div>
        </div>

        <div>
          <h2 className="text-[17px] font-bold text-[#EC4899] mb-2">Advertising</h2>
          <p className="mb-2.5">
            Pixvid Lab displays ads through Google AdMob. AdMob and its partners may collect
            device identifiers, approximate location, and usage data to show relevant ads and
            measure ad performance, in accordance with{' '}
            <a
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#A855F7] underline"
            >
              Google's Privacy Policy
            </a>
            .
          </p>
          <p>
            Where required by law (for example, users in the EEA and UK), the App shows a consent
            form (via Google's User Messaging Platform) letting you choose whether personalized ads
            are shown. You can revisit this choice anytime from the App's menu →{' '}
            <em>Manage Ad Consent</em>.
          </p>
        </div>

        <div>
          <h2 className="text-[17px] font-bold text-[#EC4899] mb-2">Third-Party Services</h2>
          <ul className="list-disc pl-5 space-y-1 mb-2.5">
            <li>
              <strong className="text-white">Google AdMob</strong> — displays banner,
              interstitial, and rewarded ads
            </li>
            <li>
              <strong className="text-white">Google User Messaging Platform (UMP)</strong> —
              manages ad consent choices
            </li>
            <li>
              <strong className="text-white">Image hosting</strong> — prompt preview images are
              loaded from publicly hosted links and are not tied to your identity
            </li>
          </ul>
          <p>
            The App also lets you optionally open Google Gemini, OpenAI ChatGPT, or Google Flow
            from a prompt's detail screen. If you choose to do so, your use of those apps/websites
            is governed by their own privacy policies, not this one.
          </p>
        </div>

        <div>
          <h2 className="text-[17px] font-bold text-[#EC4899] mb-2">Permissions</h2>
          <p>
            The App requests internet access only, used to load the prompt library and display ads.
            No camera, contacts, location, or storage permissions are requested.
          </p>
        </div>

        <div className="p-4 rounded-[14px] pix-button-gradient text-white">
          <p className="text-[14px] mb-1">Questions about this policy?</p>
          <a
            href={Constants.WHATSAPP_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-white no-underline hover:underline"
          >
            Contact us on WhatsApp →
          </a>
        </div>

        <footer className="pt-4 pb-2 text-center text-[12px] text-[#9CA3AF]">
          © 2026 Shami Academy. All rights reserved.
        </footer>
      </div>
    </div>
  );
};

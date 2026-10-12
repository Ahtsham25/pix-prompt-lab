import React, { useState } from 'react';
import { ArrowLeft, Copy, Heart, Sparkles, MessageSquare, Check, Play, ExternalLink } from 'lucide-react';
import { Prompt } from '../types';
import { Constants, resolvePromptImageUrl } from '../constants';
import { PixvidLogo } from './PixvidLogo';
import { AdBanner } from './AdBanner';

interface PromptDetailViewProps {
  prompt: Prompt;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onBack: () => void;
  showToast: (message: string) => void;
}

export const PromptDetailView: React.FC<PromptDetailViewProps> = ({
  prompt,
  isFavorite,
  onToggleFavorite,
  onBack,
  showToast,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [imgSrc, setImgSrc] = useState(() => resolvePromptImageUrl(prompt.image_url));
  const [imgError, setImgError] = useState(false);

  const isVideoPrompt = prompt.type === 'video';

  const handleGenerateClick = () => {
    setIsRevealed(false);
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setIsRevealed(true);
    }, Constants.GENERATE_DELAY_MS);
  };

  const copyToClipboard = async (text: string, customToast?: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
    showToast(customToast || 'Prompt copied!');
  };

  const handleTryGemini = () => {
    copyToClipboard(prompt.prompt_text, 'Prompt copied — paste it into Gemini');
    window.open(Constants.GEMINI_WEB_URL, '_blank', 'noopener,noreferrer');
  };

  const handleTryChatGpt = () => {
    copyToClipboard(prompt.prompt_text, 'Prompt copied — paste it into ChatGPT');
    window.open(Constants.CHATGPT_WEB_URL, '_blank', 'noopener,noreferrer');
  };

  const handleTryFlow = () => {
    copyToClipboard(prompt.prompt_text, 'Prompt copied — paste it into Google Flow');
    window.open(Constants.FLOW_WEB_URL, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 animate-pix-card">
      {/* Frosted Studio Header Card */}
      <div className="mx-4 mt-3.5 pix-gradient-border rounded-[18px] shadow-lg shadow-black/30">
        <div className="h-[56px] pix-glass-panel rounded-[16.5px] flex items-center justify-between px-3.5">
          <div className="flex items-center gap-3">
            <PixvidLogo size="sm" />
            <div className="flex flex-col leading-tight">
              <span className="text-[15.5px] font-bold text-white tracking-tight font-display">
                {Constants.APP_NAME}
              </span>
              <span className="text-[11.5px] text-[#A1A1B5]">
                {isVideoPrompt ? 'Featured Video Prompt' : 'Featured Image Prompt'}
              </span>
            </div>
          </div>

          <button
            onClick={onBack}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/15 border border-white/10 transition-colors cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Scrollable Detail Content */}
      <div className="flex-1 overflow-y-auto pb-8">
        {/* Image Showcase Card with luminous border */}
        <div className="mx-4 mt-4 pix-gradient-border rounded-[20px] relative shadow-2xl shadow-black/50">
          <div className="bg-[#12121F] rounded-[18.5px] overflow-hidden flex items-center justify-center min-h-[240px] max-h-[410px] relative">
            {!imgError ? (
              <img
                src={imgSrc}
                alt={prompt.title}
                referrerPolicy="no-referrer"
                onError={() => {
                  if (imgSrc !== prompt.image_url) {
                    setImgSrc(prompt.image_url);
                  } else {
                    setImgError(true);
                  }
                }}
                className="w-full max-h-[410px] object-contain"
              />
            ) : (
              <div className="w-full h-[260px] flex flex-col items-center justify-center gap-3 px-6 text-center bg-gradient-to-br from-[#191636] via-[#27103C] to-[#12121F]">
                <PixvidLogo size="md" />
                <span className="text-sm font-semibold text-white/90">{prompt.title}</span>
              </div>
            )}

            {isVideoPrompt && (
              <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/65 backdrop-blur-md border border-white/15 flex items-center gap-1.5 text-[11px] font-semibold text-white shadow-md">
                <Play className="w-3 h-3 fill-[#38BDF8] text-[#38BDF8]" />
                <span>Google Flow Video</span>
              </div>
            )}

            <button
              onClick={() => onToggleFavorite(prompt.id)}
              className="absolute top-3 right-3 w-[38px] h-[38px] rounded-full bg-black/55 backdrop-blur-md border border-white/15 flex items-center justify-center hover:scale-110 active:scale-95 transition-transform cursor-pointer shadow-md"
              aria-label={isFavorite ? 'Remove from favorites' : 'Save to favorites'}
            >
              <Heart
                className={`w-5 h-5 transition-colors ${
                  isFavorite ? 'fill-[#EC4899] text-[#EC4899]' : 'text-white'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Title & Clean Unboxed Metadata */}
        <div className="mx-4 mt-4">
          <h1 className="text-[19px] font-bold text-white leading-snug font-display">
            {prompt.title}
          </h1>

          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[12.5px] text-[#A1A1B5]">
            <span className="font-semibold text-[#F472B6]">{prompt.category}</span>
            <span aria-hidden="true">·</span>
            <span>{isVideoPrompt ? 'AI Video Motion' : 'AI Art & Photography'}</span>
            {prompt.tags
              .filter((t) => t.toLowerCase() !== prompt.category.toLowerCase())
              .map((tag, idx) => (
                <React.Fragment key={idx}>
                  <span aria-hidden="true">·</span>
                  <span className="text-[#9CA3AF]">#{tag}</span>
                </React.Fragment>
              ))}
          </div>
        </div>

        {/* Generate Prompt CTA */}
        <div className="mx-4 mt-5">
          <button
            onClick={handleGenerateClick}
            disabled={isProcessing}
            className="w-full h-[52px] pix-button-gradient rounded-[16px] text-white text-[14.5px] font-bold flex items-center justify-center gap-2.5 hover:opacity-95 active:scale-[0.99] transition-all disabled:opacity-60 cursor-pointer shadow-lg shadow-[#EC4899]/25"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isRevealed ? 'Regenerate Prompt' : 'Generate Prompt'}</span>
          </button>
        </div>

        {/* Processing Shimmer State */}
        {isProcessing && (
          <div className="mx-4 mt-3.5 h-[50px] pix-glass-panel border border-white/10 rounded-[16px] flex items-center justify-center gap-3 animate-pix-card">
            <div className="w-[22px] h-[22px] border-2 border-[#EC4899] border-t-transparent rounded-full animate-spin" />
            <span className="text-[13.5px] font-medium text-[#D4D4E4]">
              Crafting studio prompt…
            </span>
          </div>
        )}

        {/* Revealed Result Box + Action Buttons */}
        {isRevealed && !isProcessing && (
          <div className="animate-pix-card">
            <div className="mx-4 mt-4 pix-glass-panel rounded-[16px] p-4 flex items-start gap-3 border border-white/10 shadow-xl shadow-black/30">
              <p className="flex-1 text-[13.5px] leading-[1.65] text-[#F3F4F6] select-all whitespace-pre-wrap">
                {prompt.prompt_text}
              </p>
              <button
                onClick={() => copyToClipboard(prompt.prompt_text)}
                className="w-[40px] h-[40px] rounded-[12px] bg-[#1E1E32] hover:bg-[#292942] border border-white/10 flex items-center justify-center shrink-0 transition-colors cursor-pointer"
                aria-label="Copy prompt"
                title="Copy prompt"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4 text-white" />
                )}
              </button>
            </div>

            {/* Inline AdMob Banner matching detailInlineAdContainer in activity_prompt_detail.xml */}
            <div className="mx-4 mt-3">
              <AdBanner label="AdMob Inline Banner" />
            </div>

            {isVideoPrompt ? (
              /* Video Prompts: "Try with Flow" linking to Google Flow */
              <div className="mx-4 mt-3.5">
                <div className="pix-flow-border rounded-[16px] shadow-lg shadow-[#06B6D4]/15">
                  <button
                    onClick={handleTryFlow}
                    className="w-full h-[50px] bg-[#121220]/95 hover:bg-[#19192B] rounded-[14.5px] flex items-center justify-center gap-2.5 text-white text-[14px] font-bold transition-colors cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-[#38BDF8] text-[#38BDF8]" />
                    <span>Try with Flow</span>
                    <ExternalLink className="w-3.5 h-3.5 text-[#9CA3AF] ml-0.5" />
                  </button>
                </div>
              </div>
            ) : (
              /* Image Prompts: "Try Gemini" & "Try ChatGPT" */
              <div className="mx-4 mt-3.5 grid grid-cols-2 gap-3">
                <div className="pix-gradient-border rounded-[16px]">
                  <button
                    onClick={handleTryGemini}
                    className="w-full h-[48px] bg-[#121220]/95 hover:bg-[#19192B] rounded-[14.5px] flex items-center justify-center gap-2 text-white text-[13.5px] font-bold transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-[17px] h-[17px] text-[#A855F7]" />
                    <span>Try Gemini</span>
                  </button>
                </div>

                <div className="pix-gradient-border rounded-[16px]">
                  <button
                    onClick={handleTryChatGpt}
                    className="w-full h-[48px] bg-[#121220]/95 hover:bg-[#19192B] rounded-[14.5px] flex items-center justify-center gap-2 text-white text-[13.5px] font-bold transition-colors cursor-pointer"
                  >
                    <MessageSquare className="w-[17px] h-[17px] text-[#EC4899]" />
                    <span>Try ChatGPT</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

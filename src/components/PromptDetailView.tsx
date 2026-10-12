import React, { useState } from 'react';
import { ArrowLeft, Copy, Heart, Sparkles, MessageSquare, Check, Play } from 'lucide-react';
import { Prompt } from '../types';
import { Constants, resolvePromptImageUrl } from '../constants';
import { PixvidLogo } from './PixvidLogo';

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
      {/* Header card: Pixvid Lab logo + name/subtitle + back arrow */}
      <div className="mx-4 mt-3.5 pix-gradient-border rounded-[16px]">
        <div className="h-[52px] bg-[#15151F] rounded-[14px] flex items-center justify-between px-3">
          <div className="flex items-center gap-2.5">
            <PixvidLogo size="sm" />
            <div className="flex flex-col leading-tight">
              <span className="text-[15px] font-bold text-white">{Constants.APP_NAME}</span>
              <span className="text-[11px] text-[#9CA3AF]">
                {isVideoPrompt ? 'Featured Video Prompt' : 'Featured Prompt'}
              </span>
            </div>
          </div>

          <button
            onClick={onBack}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Scrollable Detail Content */}
      <div className="flex-1 overflow-y-auto pb-6">
        {/* Image Card with 2px gradient border */}
        <div className="mx-4 mt-4 pix-gradient-border rounded-[16px] relative">
          <div className="bg-[#15151F] rounded-[14px] overflow-hidden flex items-center justify-center min-h-[200px] max-h-[380px] relative">
            <img
              src={imgSrc}
              alt={prompt.title}
              onError={() => {
                if (imgSrc !== prompt.image_url) {
                  setImgSrc(prompt.image_url);
                }
              }}
              className="w-full max-h-[380px] object-contain"
            />
            {isVideoPrompt && (
              <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-xs border border-white/15 flex items-center gap-1.5 text-[11px] font-bold text-white">
                <Play className="w-3 h-3 fill-[#EC4899] text-[#EC4899]" />
                <span>Video Prompt</span>
              </div>
            )}
            <button
              onClick={() => onToggleFavorite(prompt.id)}
              className="absolute top-2.5 right-2.5 w-[34px] h-[34px] rounded-full bg-black/45 backdrop-blur-xs flex items-center justify-center hover:scale-110 active:scale-95 transition-transform cursor-pointer"
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

        {/* Title */}
        <h1 className="mx-4 mt-3.5 text-[17px] font-bold text-white leading-snug">
          {prompt.title}
        </h1>

        {/* Category Badge + Optional Tags */}
        <div className="mx-4 mt-2 flex flex-wrap items-center gap-1.5">
          <span className="pix-button-gradient text-white text-[11px] font-medium px-3.5 py-1 rounded-full">
            {prompt.category}
          </span>
          {prompt.tags
            .filter((t) => t.toLowerCase() !== prompt.category.toLowerCase())
            .map((tag, idx) => (
              <span
                key={idx}
                className="bg-[#1C1C28] text-[#9CA3AF] text-[11px] px-2.5 py-1 rounded-full"
              >
                #{tag}
              </span>
            ))}
        </div>

        {/* Generate Prompt Button */}
        <div className="mx-4 mt-[18px]">
          <button
            onClick={handleGenerateClick}
            disabled={isProcessing}
            className="w-full h-[50px] pix-button-gradient rounded-[14px] text-white text-[14px] font-bold flex items-center justify-center gap-2 hover:opacity-95 active:scale-[0.99] transition-all disabled:opacity-60 cursor-pointer shadow-lg shadow-[#EC4899]/20"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isRevealed ? 'Regenerate Prompt' : 'Generate Prompt'}</span>
          </button>
        </div>

        {/* Processing Spinner State */}
        {isProcessing && (
          <div className="mx-4 mt-3.5 h-[46px] bg-[#15151F] rounded-[14px] flex items-center justify-center gap-2.5 animate-pix-card">
            <div className="w-[22px] h-[22px] border-2 border-[#EC4899] border-t-transparent rounded-full animate-spin" />
            <span className="text-[13px] text-[#9CA3AF]">Generating prompt…</span>
          </div>
        )}

        {/* Revealed Result Box + Action Buttons */}
        {isRevealed && !isProcessing && (
          <div className="animate-pix-card">
            <div className="mx-4 mt-3.5 bg-[#15151F] rounded-[14px] p-3.5 flex items-start gap-2.5 border border-white/5">
              <p className="flex-1 text-[13.5px] leading-[1.6] text-white select-all whitespace-pre-wrap">
                {prompt.prompt_text}
              </p>
              <button
                onClick={() => copyToClipboard(prompt.prompt_text)}
                className="w-[38px] h-[38px] rounded-[10px] bg-[#1C1C28] hover:bg-[#262636] flex items-center justify-center shrink-0 transition-colors cursor-pointer"
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

            {isVideoPrompt ? (
              /* Video Prompts: "Try with Flow" linking to Google Flow */
              <div className="mx-4 mt-3">
                <div className="pix-gradient-border rounded-[15px]">
                  <button
                    onClick={handleTryFlow}
                    className="w-full h-[48px] bg-[#15151F] hover:bg-[#1C1C28] rounded-[13px] flex items-center justify-center gap-2.5 text-white text-[14px] font-bold transition-colors cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-[#EC4899] text-[#EC4899]" />
                    <span>Try with Flow</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Image Prompts: "Try Gemini" & "Try ChatGPT" */
              <div className="mx-4 mt-3 grid grid-cols-2 gap-3">
                <div className="pix-gradient-border rounded-[15px]">
                  <button
                    onClick={handleTryGemini}
                    className="w-full h-[46px] bg-[#15151F] hover:bg-[#1C1C28] rounded-[13px] flex items-center justify-center gap-2 text-white text-[13px] font-bold transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-[18px] h-[18px] text-[#A855F7]" />
                    <span>Try Gemini</span>
                  </button>
                </div>

                <div className="pix-gradient-border rounded-[15px]">
                  <button
                    onClick={handleTryChatGpt}
                    className="w-full h-[46px] bg-[#15151F] hover:bg-[#1C1C28] rounded-[13px] flex items-center justify-center gap-2 text-white text-[13px] font-bold transition-colors cursor-pointer"
                  >
                    <MessageSquare className="w-[18px] h-[18px] text-[#EC4899]" />
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

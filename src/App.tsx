import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Search,
  Heart,
  Menu,
  Sparkles,
  RefreshCw,
  X,
  PlusCircle,
  Check,
  Video,
  Play,
} from 'lucide-react';
import { Prompt, PromptData, NavTab } from './types';
import { Constants, resolvePromptImageUrl } from './constants';
import { PixvidLogo } from './components/PixvidLogo';
import { PromptDetailView } from './components/PromptDetailView';
import { MoreSettingsModal } from './components/MoreSettingsModal';
import { AdminPanelView } from './components/AdminPanelView';
import { PrivacyPolicyView } from './components/PrivacyPolicyView';

const FAVORITES_STORAGE_KEY = 'pixprompt_favorite_ids';
const AD_CONSENT_STORAGE_KEY = 'pixprompt_ad_consent';

interface PromptCardProps {
  prompt: Prompt;
  index: number;
  isFavorite: boolean;
  onSelect: (prompt: Prompt) => void;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
}

const PromptCard: React.FC<PromptCardProps> = ({
  prompt,
  index,
  isFavorite,
  onSelect,
  onToggleFavorite,
}) => {
  const [imgSrc, setImgSrc] = useState(() => resolvePromptImageUrl(prompt.image_url));
  const isVideo = prompt.type === 'video';

  useEffect(() => {
    setImgSrc(resolvePromptImageUrl(prompt.image_url));
  }, [prompt.image_url]);

  return (
    <div
      onClick={() => onSelect(prompt)}
      style={{ animationDelay: `${Math.min(index * 45, 320)}ms` }}
      className="animate-pix-card pix-gradient-border rounded-[16px] h-[220px] sm:h-[240px] cursor-pointer group relative transition-transform active:scale-[0.97]"
      title={prompt.title}
    >
      <div className="w-full h-full bg-[#15151F] rounded-[14px] overflow-hidden relative">
        <img
          src={imgSrc}
          alt={prompt.title}
          loading="lazy"
          onError={() => {
            if (imgSrc !== prompt.image_url) {
              setImgSrc(prompt.image_url);
            }
          }}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Video indicator badge on video prompt cards */}
        {isVideo && (
          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/55 backdrop-blur-xs border border-white/15 flex items-center gap-1 text-[10px] font-bold text-white">
            <Play className="w-2.5 h-2.5 fill-[#EC4899] text-[#EC4899]" />
            <span>Video</span>
          </div>
        )}

        {/* Subtle bottom gradient for bookmark button visibility */}
        <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/65 via-black/20 to-transparent pointer-events-none" />

        {/* Bookmark / Heart icon in bottom-right matching item_prompt.xml */}
        <button
          onClick={(e) => onToggleFavorite(prompt.id, e)}
          className="absolute bottom-2 right-2 w-[34px] h-[34px] rounded-full bg-black/45 backdrop-blur-xs flex items-center justify-center hover:scale-115 active:scale-90 transition-transform cursor-pointer"
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
  );
};

export function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState<NavTab>(NavTab.EXPLORE);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);

  const [imagePrompts, setImagePrompts] = useState<Prompt[]>([]);
  const [videoPrompts, setVideoPrompts] = useState<Prompt[]>([]);
  const [categories, setCategories] = useState<string[]>(['All']);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [visibleCount, setVisibleCount] = useState<number>(Constants.PAGE_SIZE);

  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<boolean>(false);

  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(FAVORITES_STORAGE_KEY);
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAdConsentOpen, setIsAdConsentOpen] = useState(false);
  const [personalizedAds, setPersonalizedAds] = useState<boolean>(() => {
    return localStorage.getItem(AD_CONSENT_STORAGE_KEY) !== 'non_personalized';
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
  }, []);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 2200);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 1100);
    return () => clearTimeout(timer);
  }, []);

  const applyLoadedData = useCallback((data: PromptData) => {
    const rawPrompts = data.prompts || [];
    const rawVideos = data.video_prompts || [];

    const imgs = rawPrompts
      .filter((p) => p.type !== 'video')
      .map((p) => ({ ...p, type: 'image' as const }));

    const vidsFromMain = rawPrompts
      .filter((p) => p.type === 'video')
      .map((p) => ({ ...p, type: 'video' as const }));

    const vidsFromDedicated = rawVideos.map((p) => ({ ...p, type: 'video' as const }));

    const seenVidIds = new Set<string>();
    const combinedVids: Prompt[] = [];
    for (const v of [...vidsFromDedicated, ...vidsFromMain]) {
      if (!seenVidIds.has(v.id)) {
        seenVidIds.add(v.id);
        combinedVids.push(v);
      }
    }

    setImagePrompts(imgs);
    setVideoPrompts(combinedVids);
    setCategories(['All', ...(data.categories || [])]);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const res = await fetch('/api/prompts');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: PromptData = await res.json();
      applyLoadedData(data);
    } catch {
      try {
        const remoteRes = await fetch(Constants.PROMPTS_JSON_URL);
        if (!remoteRes.ok) throw new Error(`HTTP ${remoteRes.status}`);
        const data: PromptData = await remoteRes.json();
        applyLoadedData(data);
      } catch {
        setLoadError(true);
        showToast('Could not load prompts. Please check your internet connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [applyLoadedData, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Reset pagination when tab, category, or search query changes
  useEffect(() => {
    setVisibleCount(Constants.PAGE_SIZE);
  }, [activeTab, selectedCategory, searchQuery]);

  const activeSourcePrompts = useMemo(() => {
    return activeTab === NavTab.VIDEOS ? videoPrompts : imagePrompts;
  }, [activeTab, imagePrompts, videoPrompts]);

  const filteredPrompts = useMemo(() => {
    let filtered = activeSourcePrompts;

    if (selectedCategory.toLowerCase() === 'trending') {
      filtered = filtered.filter(
        (prompt) =>
          (prompt.tags || []).some((t) => t.toLowerCase() === 'trending') ||
          prompt.category.toLowerCase() === 'trending'
      );
    } else if (selectedCategory !== 'All') {
      filtered = filtered.filter(
        (prompt) => prompt.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    const q = searchQuery.trim().toLowerCase();
    if (q.length > 0) {
      filtered = filtered.filter(
        (prompt) =>
          prompt.title.toLowerCase().includes(q) ||
          prompt.prompt_text.toLowerCase().includes(q) ||
          (prompt.tags || []).some((tag) => tag.toLowerCase().includes(q))
      );
    }

    return filtered;
  }, [activeSourcePrompts, selectedCategory, searchQuery]);

  const visiblePrompts = useMemo(
    () => filteredPrompts.slice(0, visibleCount),
    [filteredPrompts, visibleCount]
  );

  const hasMore = filteredPrompts.length > visibleCount;

  const favoritePrompts = useMemo(() => {
    const all = [...imagePrompts, ...videoPrompts];
    return all.filter((p) => favoriteIds.has(p.id));
  }, [imagePrompts, videoPrompts, favoriteIds]);

  const handleToggleFavorite = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      let nowFav = false;
      if (next.has(id)) {
        next.delete(id);
        nowFav = false;
      } else {
        next.add(id);
        nowFav = true;
      }
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(Array.from(next)));
      showToast(nowFav ? 'Saved to favorites' : 'Removed from favorites');
      return next;
    });
  };

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + Constants.PAGE_SIZE);
  };

  const handleSaveAdConsent = (personalized: boolean) => {
    setPersonalizedAds(personalized);
    localStorage.setItem(
      AD_CONSENT_STORAGE_KEY,
      personalized ? 'personalized' : 'non_personalized'
    );
    setIsAdConsentOpen(false);
    showToast('Ad consent preferences updated');
  };

  // Animated Splash Screen (SplashActivity.kt + activity_splash.xml)
  if (showSplash) {
    return (
      <div
        onClick={() => setShowSplash(false)}
        className="min-h-screen bg-[#0A0A12] flex flex-col items-center justify-center px-6 select-none cursor-pointer"
      >
        <div className="animate-pix-splash">
          <PixvidLogo size="lg" />
        </div>
        <h1 className="mt-[18px] text-[26px] font-bold text-white animate-pix-card">
          {Constants.APP_NAME}
        </h1>
        <p className="mt-1 text-[14px] text-[#9CA3AF] animate-pix-card">
          {Constants.SPLASH_TAGLINE}
        </p>
        <div className="mt-16 w-7 h-7 border-2 border-[#A855F7] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isVideosScreen = activeTab === NavTab.VIDEOS;

  return (
    <div className="min-h-screen bg-[#0A0A12] text-white flex justify-center">
      {/* Main App Container mirroring Android layout */}
      <div className="w-full max-w-[480px] min-h-screen bg-[#0A0A12] flex flex-col relative border-x border-white/5 shadow-2xl">
        {selectedPrompt ? (
          <PromptDetailView
            prompt={selectedPrompt}
            isFavorite={favoriteIds.has(selectedPrompt.id)}
            onToggleFavorite={(id) => handleToggleFavorite(id)}
            onBack={() => setSelectedPrompt(null)}
            showToast={showToast}
          />
        ) : activeTab === NavTab.ADMIN ? (
          <AdminPanelView
            categories={categories}
            onBack={() => setActiveTab(NavTab.EXPLORE)}
            onPromptAdded={(updatedData) => {
              applyLoadedData(updatedData);
            }}
          />
        ) : activeTab === NavTab.PRIVACY ? (
          <PrivacyPolicyView onBack={() => setActiveTab(NavTab.EXPLORE)} />
        ) : activeTab === NavTab.FAVORITE ? (
          /* Favorites Screen (activity_favorites.xml) */
          <div className="flex flex-col flex-1 min-h-0">
            <div className="mx-4 mt-3.5 pix-gradient-border rounded-[16px]">
              <div className="h-[52px] bg-[#15151F] rounded-[14px] flex items-center justify-between px-3">
                <div className="flex items-center gap-2.5">
                  <PixvidLogo size="md" />
                  <span className="text-[18px] font-bold text-white">Favorites</span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-[30px] h-[30px] rounded-full pix-avatar-gradient" />
                  <button
                    onClick={() => setIsMenuOpen(true)}
                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors cursor-pointer"
                    aria-label="More and Settings"
                  >
                    <Menu className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-3">
              {favoritePrompts.length === 0 ? (
                <div className="h-full min-h-[360px] flex items-center justify-center px-8 text-center">
                  <p className="text-[14px] text-[#9CA3AF] leading-relaxed">
                    No saved prompts yet. Tap the heart icon on any prompt to save it here.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 pb-4">
                  {favoritePrompts.map((prompt, index) => (
                    <PromptCard
                      key={prompt.id}
                      prompt={prompt}
                      index={index}
                      isFavorite={favoriteIds.has(prompt.id)}
                      onSelect={(p) => setSelectedPrompt(p)}
                      onToggleFavorite={handleToggleFavorite}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Explore (Image Prompts) & Videos (Video Prompts) Screens */
          <div className="flex flex-col flex-1 min-h-0">
            {/* Header card: new Pixvid Lab logo + name + avatar + menu */}
            <div className="mx-4 mt-3.5 pix-gradient-border rounded-[16px]">
              <div className="h-[52px] bg-[#15151F] rounded-[14px] flex items-center justify-between px-3">
                <div className="flex items-center gap-2.5">
                  <PixvidLogo size="md" />
                  <div className="flex items-center gap-2">
                    <span className="text-[18px] font-bold text-white">{Constants.APP_NAME}</span>
                    {isVideosScreen && (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full pix-button-gradient text-white">
                        Videos
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    onClick={loadData}
                    title="Refresh prompts"
                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors cursor-pointer"
                    aria-label="Refresh prompts"
                  >
                    <RefreshCw
                      className={`w-4 h-4 text-[#9CA3AF] ${loading ? 'animate-spin' : ''}`}
                    />
                  </button>
                  <div className="w-[30px] h-[30px] rounded-full pix-avatar-gradient" />
                  <button
                    onClick={() => setIsMenuOpen(true)}
                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors cursor-pointer"
                    aria-label="More and Settings"
                  >
                    <Menu className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>
            </div>

            {/* Category Chips */}
            <div className="mt-3.5 px-4 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0 h-[42px]">
              {categories.map((cat) => {
                const selected = cat.toLowerCase() === selectedCategory.toLowerCase();
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`h-[38px] px-[18px] rounded-[24px] text-[13px] whitespace-nowrap transition-all shrink-0 cursor-pointer ${
                      selected
                        ? 'pix-button-gradient text-white font-bold shadow-md shadow-[#EC4899]/20 scale-[1.02]'
                        : 'bg-[#1C1C28] text-white font-normal hover:bg-[#252535]'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            {/* Search Bar */}
            <div className="mx-4 mt-3 pix-gradient-border rounded-[16px]">
              <div className="h-[46px] bg-[#1C1C28] rounded-[14px] flex items-center px-3.5 gap-2.5">
                <Search className="w-5 h-5 text-[#6366F1] shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    isVideosScreen ? 'Search video prompts…' : 'Search image prompts…'
                  }
                  className="w-full bg-transparent text-[14px] text-white placeholder-[#9CA3AF] focus:outline-none"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-[#9CA3AF] hover:text-white cursor-pointer"
                    aria-label="Clear search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Prompt Grid / Loading / Empty State */}
            <div className="flex-1 overflow-y-auto px-3 pt-2.5 pb-4">
              {loading ? (
                <div className="h-full min-h-[320px] flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-[#A855F7] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : loadError ? (
                <div className="h-full min-h-[320px] flex flex-col items-center justify-center px-8 text-center gap-3">
                  <p className="text-[14px] text-[#9CA3AF]">
                    Could not load prompts. Please check your internet connection and try again.
                  </p>
                  <button
                    onClick={loadData}
                    className="px-5 py-2.5 rounded-[12px] pix-button-gradient text-white text-[13px] font-bold cursor-pointer"
                  >
                    Retry
                  </button>
                </div>
              ) : filteredPrompts.length === 0 ? (
                <div className="h-full min-h-[320px] flex items-center justify-center px-8 text-center">
                  <p className="text-[14px] text-[#9CA3AF]">No prompts found.</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    {visiblePrompts.map((prompt, index) => (
                      <PromptCard
                        key={`${activeTab}_${prompt.id}`}
                        prompt={prompt}
                        index={index}
                        isFavorite={favoriteIds.has(prompt.id)}
                        onSelect={(p) => setSelectedPrompt(p)}
                        onToggleFavorite={handleToggleFavorite}
                      />
                    ))}
                  </div>

                  {/* Load More Button matching item_load_more.xml */}
                  {hasMore && (
                    <button
                      onClick={handleLoadMore}
                      className="w-full h-[52px] mt-3.5 mb-2 rounded-[14px] pix-button-gradient flex items-center justify-center gap-2 text-white text-[13px] font-bold hover:opacity-95 active:scale-[0.99] transition-all cursor-pointer"
                    >
                      <Sparkles className="w-[18px] h-[18px]" />
                      <span>Load More</span>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Bottom Navigation Bar matching updated bottom_nav_bar.xml (Images, Videos, Favorite, Admin) */}
        <nav className="h-[72px] bg-[#15151F] border-t border-white/5 flex items-center justify-around pt-1.5 shrink-0 z-20">
          <button
            onClick={() => {
              setSelectedPrompt(null);
              setActiveTab(NavTab.EXPLORE);
            }}
            className="flex-1 h-full flex flex-col items-center justify-center cursor-pointer"
          >
            <div
              className={`w-[34px] h-[34px] rounded-full flex items-center justify-center transition-all duration-200 ${
                activeTab === NavTab.EXPLORE && !selectedPrompt
                  ? 'pix-button-gradient scale-105'
                  : ''
              }`}
            >
              <Search
                className={`w-5 h-5 ${
                  activeTab === NavTab.EXPLORE && !selectedPrompt
                    ? 'text-white'
                    : 'text-[#9CA3AF]'
                }`}
              />
            </div>
            <span
              className={`text-[11px] mt-0.5 ${
                activeTab === NavTab.EXPLORE && !selectedPrompt
                  ? 'text-white font-semibold'
                  : 'text-[#9CA3AF]'
              }`}
            >
              Images
            </span>
          </button>

          <button
            onClick={() => {
              setSelectedPrompt(null);
              setActiveTab(NavTab.VIDEOS);
            }}
            className="flex-1 h-full flex flex-col items-center justify-center cursor-pointer"
          >
            <div
              className={`w-[34px] h-[34px] rounded-full flex items-center justify-center transition-all duration-200 ${
                activeTab === NavTab.VIDEOS && !selectedPrompt
                  ? 'pix-button-gradient scale-105'
                  : ''
              }`}
            >
              <Video
                className={`w-5 h-5 ${
                  activeTab === NavTab.VIDEOS && !selectedPrompt
                    ? 'text-white'
                    : 'text-[#9CA3AF]'
                }`}
              />
            </div>
            <span
              className={`text-[11px] mt-0.5 ${
                activeTab === NavTab.VIDEOS && !selectedPrompt
                  ? 'text-white font-semibold'
                  : 'text-[#9CA3AF]'
              }`}
            >
              Videos
            </span>
          </button>

          <button
            onClick={() => {
              setSelectedPrompt(null);
              setActiveTab(NavTab.FAVORITE);
            }}
            className="flex-1 h-full flex flex-col items-center justify-center cursor-pointer"
          >
            <div
              className={`w-[34px] h-[34px] rounded-full flex items-center justify-center transition-all duration-200 relative ${
                activeTab === NavTab.FAVORITE && !selectedPrompt
                  ? 'pix-button-gradient scale-105'
                  : ''
              }`}
            >
              <Heart
                className={`w-5 h-5 ${
                  activeTab === NavTab.FAVORITE && !selectedPrompt
                    ? 'text-white'
                    : 'text-[#9CA3AF]'
                }`}
              />
              {favoriteIds.size > 0 && (
                <span className="absolute -top-0.5 -right-1 min-w-[16px] h-[16px] px-1 rounded-full bg-[#EC4899] text-[10px] font-bold text-white flex items-center justify-center">
                  {favoriteIds.size}
                </span>
              )}
            </div>
            <span
              className={`text-[11px] mt-0.5 ${
                activeTab === NavTab.FAVORITE && !selectedPrompt
                  ? 'text-white font-semibold'
                  : 'text-[#9CA3AF]'
              }`}
            >
              Favorite
            </span>
          </button>

          <button
            onClick={() => {
              setSelectedPrompt(null);
              setActiveTab(NavTab.ADMIN);
            }}
            className="flex-1 h-full flex flex-col items-center justify-center cursor-pointer"
          >
            <div
              className={`w-[34px] h-[34px] rounded-full flex items-center justify-center transition-all duration-200 ${
                activeTab === NavTab.ADMIN && !selectedPrompt
                  ? 'pix-button-gradient scale-105'
                  : ''
              }`}
            >
              <PlusCircle
                className={`w-5 h-5 ${
                  activeTab === NavTab.ADMIN && !selectedPrompt ? 'text-white' : 'text-[#9CA3AF]'
                }`}
              />
            </div>
            <span
              className={`text-[11px] mt-0.5 ${
                activeTab === NavTab.ADMIN && !selectedPrompt
                  ? 'text-white font-semibold'
                  : 'text-[#9CA3AF]'
              }`}
            >
              Admin
            </span>
          </button>
        </nav>

        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-22 left-1/2 -translate-x-1/2 z-50 bg-[#1C1C28]/95 border border-white/15 text-white text-[13px] px-4 py-2.5 rounded-full shadow-xl flex items-center gap-2 pointer-events-none animate-pix-card">
            <Check className="w-4 h-4 text-[#EC4899]" />
            <span>{toastMessage}</span>
          </div>
        )}
      </div>

      {/* More & Settings Bottom Sheet */}
      <MoreSettingsModal
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onOpenPrivacyPolicy={() => {
          setSelectedPrompt(null);
          setActiveTab(NavTab.PRIVACY);
        }}
        onOpenAdConsent={() => setIsAdConsentOpen(true)}
        onOpenAdminPanel={() => {
          setSelectedPrompt(null);
          setActiveTab(NavTab.ADMIN);
        }}
        showToast={showToast}
      />

      {/* Manage Ad Consent Modal */}
      {isAdConsentOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setIsAdConsentOpen(false)}
        >
          <div
            className="w-full max-w-[400px] bg-[#15151F] border border-white/10 rounded-[20px] p-5 space-y-4 shadow-2xl animate-pix-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-[17px] font-bold text-white">Manage Ad Consent</h3>
              <button
                onClick={() => setIsAdConsentOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 cursor-pointer"
              >
                <X className="w-4 h-4 text-[#9CA3AF]" />
              </button>
            </div>
            <p className="text-[13px] text-[#9CA3AF] leading-relaxed">
              Choose how Pixvid Lab personalizes ads shown to you via Google User Messaging
              Platform (UMP).
            </p>
            <div className="space-y-2.5">
              <button
                onClick={() => handleSaveAdConsent(true)}
                className={`w-full p-3.5 rounded-[12px] text-left border transition-colors cursor-pointer ${
                  personalizedAds
                    ? 'bg-[#1C1C28] border-[#EC4899] text-white'
                    : 'bg-[#1C1C28]/60 border-white/5 text-[#9CA3AF]'
                }`}
              >
                <div className="text-[14px] font-bold">Personalized Ads</div>
                <div className="text-[12px] text-[#9CA3AF] mt-0.5">
                  Show ads tailored to your interests
                </div>
              </button>
              <button
                onClick={() => handleSaveAdConsent(false)}
                className={`w-full p-3.5 rounded-[12px] text-left border transition-colors cursor-pointer ${
                  !personalizedAds
                    ? 'bg-[#1C1C28] border-[#EC4899] text-white'
                    : 'bg-[#1C1C28]/60 border-white/5 text-[#9CA3AF]'
                }`}
              >
                <div className="text-[14px] font-bold">Standard (Non-Personalized) Ads</div>
                <div className="text-[12px] text-[#9CA3AF] mt-0.5">
                  Show contextual ads without personal profiling
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default App;

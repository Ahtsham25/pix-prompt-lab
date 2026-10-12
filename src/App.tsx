import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Search,
  Heart,
  Menu,
  Sparkles,
  RefreshCw,
  X,
  Check,
  Video,
  Play,
  Image as ImageIcon,
} from 'lucide-react';
import { Prompt, PromptData, NavTab } from './types';
import { Constants, resolvePromptImageUrl, sortPromptsLatestFirst } from './constants';
import { PixvidLogo } from './components/PixvidLogo';
import { PromptDetailView } from './components/PromptDetailView';
import { MoreSettingsModal } from './components/MoreSettingsModal';
import { PrivacyPolicyView } from './components/PrivacyPolicyView';
import { AdBanner } from './components/AdBanner';
import { AdminPanelView } from './components/AdminPanelView';

const FAVORITES_STORAGE_KEY = 'pixprompt_favorite_ids';
const AD_CONSENT_STORAGE_KEY = 'pixprompt_ad_consent';

function checkIsAdminRoute(): boolean {
  const path = window.location.pathname.toLowerCase();
  const search = window.location.search.toLowerCase();
  const hash = window.location.hash.toLowerCase();
  return (
    path === '/admin' ||
    path.startsWith('/admin/') ||
    search.includes('admin=1') ||
    search.includes('mode=admin') ||
    hash === '#admin'
  );
}

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
  const [imgError, setImgError] = useState(false);
  const isVideo = prompt.type === 'video';

  useEffect(() => {
    setImgSrc(resolvePromptImageUrl(prompt.image_url));
    setImgError(false);
  }, [prompt.image_url]);

  return (
    <div
      onClick={() => onSelect(prompt)}
      style={{ animationDelay: `${Math.min(index * 40, 280)}ms` }}
      className={`animate-pix-card ${
        isVideo ? 'pix-flow-border' : 'pix-gradient-border'
      } rounded-[18px] h-[232px] sm:h-[248px] cursor-pointer group relative transition-transform duration-200 hover:-translate-y-0.5 active:scale-[0.98] shadow-lg shadow-black/40`}
      title={prompt.title}
    >
      <div className="w-full h-full bg-[#131322] rounded-[16.5px] overflow-hidden relative">
        {!imgError ? (
          <img
            src={imgSrc}
            alt={prompt.title}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => {
              if (imgSrc !== prompt.image_url) {
                setImgSrc(prompt.image_url);
              } else {
                setImgError(true);
              }
            }}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-4 text-center bg-gradient-to-br from-[#191636] via-[#27103C] to-[#12121F]">
            <PixvidLogo size="sm" />
            <span className="text-xs font-semibold text-white/85 line-clamp-2">{prompt.title}</span>
          </div>
        )}

        {/* Video indicator badge on video prompt cards */}
        {isVideo && (
          <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/15 flex items-center gap-1 text-[10px] font-semibold text-white shadow-sm">
            <Play className="w-2.5 h-2.5 fill-[#38BDF8] text-[#38BDF8]" />
            <span>Flow Video</span>
          </div>
        )}

        {/* Measured bottom gradient scrim for title, category & bookmark button (matches item_prompt.xml) */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-none" />

        {/* Card Title & Unboxed Category Metadata */}
        <div className="absolute left-3 right-12 bottom-2.5 pointer-events-none">
          <h3 className="text-[13px] font-bold text-white truncate leading-snug drop-shadow-xs">
            {prompt.title}
          </h3>
          <p className="text-[11px] text-[#CBD5E1]/85 truncate mt-0.5">{prompt.category}</p>
        </div>

        {/* Frosted Bookmark / Heart icon in bottom-right */}
        <button
          onClick={(e) => onToggleFavorite(prompt.id, e)}
          className="absolute bottom-2.5 right-2.5 w-[34px] h-[34px] rounded-full bg-black/55 backdrop-blur-md border border-white/15 flex items-center justify-center hover:scale-110 active:scale-90 transition-transform cursor-pointer"
          aria-label={isFavorite ? 'Remove from favorites' : 'Save to favorites'}
        >
          <Heart
            className={`w-4 h-4 transition-colors ${
              isFavorite ? 'fill-[#EC4899] text-[#EC4899]' : 'text-white'
            }`}
          />
        </button>
      </div>
    </div>
  );
};

export function App() {
  const [isStandaloneAdmin, setIsStandaloneAdmin] = useState<boolean>(() => checkIsAdminRoute());
  const [showSplash, setShowSplash] = useState<boolean>(() => !checkIsAdminRoute());
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


  useEffect(() => {
    const onPopState = () => {
      setIsStandaloneAdmin(checkIsAdminRoute());
    };
    window.addEventListener('popstate', onPopState);
    window.addEventListener('hashchange', onPopState);
    return () => {
      window.removeEventListener('popstate', onPopState);
      window.removeEventListener('hashchange', onPopState);
    };
  }, []);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
  }, []);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 2200);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  useEffect(() => {
    if (!showSplash) return;
    const timer = setTimeout(() => setShowSplash(false), 1450);
    return () => clearTimeout(timer);
  }, [showSplash]);

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

    setImagePrompts(sortPromptsLatestFirst(imgs));
    setVideoPrompts(sortPromptsLatestFirst(combinedVids));
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

  // Dedicated Standalone Admin Studio App (/admin) — completely separate from the User App
  if (isStandaloneAdmin) {
    return (
      <AdminPanelView
        categories={categories}
        imagePrompts={imagePrompts}
        videoPrompts={videoPrompts}
        onPromptAdded={(updatedData: PromptData) => {
          applyLoadedData(updatedData);
        }}
        onOpenUserApp={() => {
          window.history.pushState({}, '', '/');
          setIsStandaloneAdmin(false);
        }}
      />
    );
  }

  // Flagship Studio Splash Screen (SplashActivity.kt + activity_splash.xml)
  if (showSplash) {
    return (
      <div
        onClick={() => setShowSplash(false)}
        className="min-h-screen pix-ambient-bg pix-studio-grid flex flex-col items-center justify-center px-6 select-none cursor-pointer relative overflow-hidden"
      >
        {/* Ambient Faded Glowing Light Blooms */}
        <div
          className="absolute -top-28 -left-24 w-96 h-96 rounded-full bg-[#D946EF]/25 blur-[110px] pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute top-1/3 -right-28 w-96 h-96 rounded-full bg-[#06B6D4]/20 blur-[110px] pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-28 left-1/4 w-96 h-96 rounded-full bg-[#EC4899]/20 blur-[115px] pointer-events-none"
          aria-hidden="true"
        />

        {/* Center Studio Emblem + Concentric Halo Glow */}
        <div className="relative flex items-center justify-center">
          {/* Outer pulsing radial halo */}
          <div
            className="absolute w-52 h-52 rounded-full bg-gradient-to-tr from-[#38BDF8]/25 via-[#D946EF]/30 to-[#F43F5E]/25 blur-2xl animate-pix-halo pointer-events-none"
            aria-hidden="true"
          />
          {/* Subtle geometric studio ring */}
          <div
            className="absolute w-36 h-36 rounded-[38px] border border-white/10 rotate-6 pointer-events-none"
            aria-hidden="true"
          />
          <div className="animate-pix-splash relative z-10">
            <PixvidLogo size="xl" />
          </div>
        </div>

        {/* Brand Title & Studio Tagline */}
        <h1 className="mt-7 text-[32px] font-extrabold tracking-tight text-white animate-pix-card font-display">
          Pixvid <span className="pix-text-gradient">Lab</span>
        </h1>
        <p className="mt-1.5 text-[14px] font-medium text-[#A1A1B5] tracking-wide animate-pix-card">
          {Constants.SPLASH_TAGLINE}
        </p>

        {/* Luminous Shimmer Progress Indicator */}
        <div className="mt-14 w-40 h-1.5 bg-white/10 rounded-full overflow-hidden relative">
          <div className="w-1/2 h-full rounded-full pix-flow-gradient animate-pix-shimmer" />
        </div>
      </div>
    );
  }

  const isVideosScreen = activeTab === NavTab.VIDEOS;

  return (
    <div className="min-h-screen pix-ambient-bg text-white flex justify-center relative overflow-hidden">

      {/* Persistent Faded Glowing Ambient Background Orbs across the entire app */}
      <div
        className="fixed -top-32 left-1/2 -translate-x-[260px] w-[420px] h-[420px] rounded-full bg-[#D946EF]/20 blur-[120px] pointer-events-none z-0"
        aria-hidden="true"
      />
      <div
        className="fixed top-1/3 left-1/2 translate-x-[40px] w-[380px] h-[380px] rounded-full bg-[#06B6D4]/16 blur-[120px] pointer-events-none z-0"
        aria-hidden="true"
      />
      <div
        className="fixed -bottom-32 left-1/2 -translate-x-[180px] w-[440px] h-[440px] rounded-full bg-[#EC4899]/18 blur-[125px] pointer-events-none z-0"
        aria-hidden="true"
      />

      {/* Main App Container mirroring Android layout with translucent ambient glow showing through */}
      <div className="w-full max-w-[500px] min-h-screen bg-[#090913]/65 backdrop-blur-xl flex flex-col relative border-x border-white/10 shadow-[0_0_80px_rgba(0,0,0,0.75)] z-10">
        {selectedPrompt ? (
          <PromptDetailView
            prompt={selectedPrompt}
            isFavorite={favoriteIds.has(selectedPrompt.id)}
            onToggleFavorite={(id) => handleToggleFavorite(id)}
            onBack={() => setSelectedPrompt(null)}
            showToast={showToast}
          />
        ) : activeTab === NavTab.PRIVACY ? (
          <PrivacyPolicyView onBack={() => setActiveTab(NavTab.EXPLORE)} />
        ) : activeTab === NavTab.FAVORITE ? (
          /* Favorites Screen (activity_favorites.xml) */
          <div className="flex flex-col flex-1 min-h-0">
            <div className="mx-4 mt-3.5 pix-gradient-border rounded-[18px] shadow-lg shadow-black/25">
              <div className="h-[56px] pix-glass-panel rounded-[16.5px] flex items-center justify-between px-3.5">
                <div className="flex items-center gap-3">
                  <div>
                    <PixvidLogo size="md" />
                  </div>
                  <div className="flex flex-col leading-tight">
                    <span className="text-[18px] font-bold text-white font-display">
                      Favorites
                    </span>
                    <span className="text-[11px] text-[#A1A1B5]">
                      {favoritePrompts.length} saved prompt{favoritePrompts.length === 1 ? '' : 's'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="w-[30px] h-[30px] rounded-full pix-avatar-gradient shadow-sm" />
                  <button
                    onClick={() => setIsMenuOpen(true)}
                    className="w-9 h-9 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/15 transition-colors cursor-pointer"
                    aria-label="More and Settings"
                  >
                    <Menu className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-3.5 py-3.5">
              {favoritePrompts.length === 0 ? (
                <div className="h-full min-h-[360px] flex flex-col items-center justify-center px-8 text-center gap-3">
                  <div className="w-14 h-14 rounded-2xl pix-glass-panel border border-white/10 flex items-center justify-center">
                    <Heart className="w-6 h-6 text-[#EC4899]" />
                  </div>
                  <p className="text-[15px] font-semibold text-white">No saved prompts yet</p>
                  <p className="text-[13px] text-[#9CA3AF] leading-relaxed max-w-[260px]">
                    Tap the heart icon on any image or video prompt to save it here for instant
                    access.
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
            {/* Frosted Header Card: 3D Pixvid Lab logo + name + refresh + avatar + menu */}
            <div className="mx-4 mt-3.5 pix-gradient-border rounded-[18px] shadow-lg shadow-black/25">
              <div className="h-[56px] pix-glass-panel rounded-[16.5px] flex items-center justify-between px-3.5">
                <div className="flex items-center gap-3">
                  <div>
                    <PixvidLogo size="md" />
                  </div>
                  <div className="flex flex-col leading-tight">
                    <span className="text-[18px] font-bold text-white tracking-tight font-display">
                      {Constants.APP_NAME}
                    </span>
                    <span className="text-[11px] text-[#A1A1B5]">
                      {isVideosScreen
                        ? 'Google Flow Video Prompts'
                        : 'AI Image Prompts Studio'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={loadData}
                    title="Refresh prompts"
                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors cursor-pointer"
                    aria-label="Refresh prompts"
                  >
                    <RefreshCw
                      className={`w-4 h-4 text-[#A1A1B5] ${loading ? 'animate-spin' : ''}`}
                    />
                  </button>
                  <div className="w-[30px] h-[30px] rounded-full pix-avatar-gradient shadow-sm" />
                  <button
                    onClick={() => setIsMenuOpen(true)}
                    className="w-9 h-9 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/15 transition-colors cursor-pointer"
                    aria-label="More and Settings"
                  >
                    <Menu className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>
            </div>

            {/* Category Filter Controls */}
            <div className="mt-3.5 px-4 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0 h-[42px]">
              {categories.map((cat) => {
                const selected = cat.toLowerCase() === selectedCategory.toLowerCase();
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`h-[38px] px-[18px] rounded-[24px] text-[13px] whitespace-nowrap transition-all shrink-0 cursor-pointer ${
                      selected
                        ? isVideosScreen
                          ? 'pix-flow-gradient text-white font-bold shadow-md shadow-[#06B6D4]/25 scale-[1.02]'
                          : 'pix-button-gradient text-white font-bold shadow-md shadow-[#EC4899]/25 scale-[1.02]'
                        : 'bg-[#171728]/85 border border-white/10 text-[#D4D4E4] font-medium hover:bg-[#222238] hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            {/* Frosted Search Bar */}
            <div className="mx-4 mt-3 pix-gradient-border rounded-[16px] shadow-md shadow-black/20">
              <div className="h-[48px] bg-[#151525]/90 backdrop-blur-xl rounded-[14.5px] flex items-center px-3.5 gap-2.5">
                <Search className="w-5 h-5 text-[#38BDF8] shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    isVideosScreen
                      ? 'Search cinematic video prompts for Google Flow…'
                      : 'Search AI image prompts for Gemini & ChatGPT…'
                  }
                  className="w-full bg-transparent text-[13.5px] text-white placeholder-[#9CA3AF] focus:outline-none"
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
            <div className="flex-1 overflow-y-auto px-3.5 pt-3 pb-4">
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
                <div className="h-full min-h-[320px] flex flex-col items-center justify-center px-8 text-center gap-3">
                  <div className="w-14 h-14 rounded-2xl pix-glass-panel border border-white/10 flex items-center justify-center">
                    {isVideosScreen ? (
                      <Video className="w-6 h-6 text-[#38BDF8]" />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-[#EC4899]" />
                    )}
                  </div>
                  <p className="text-[15px] font-semibold text-white">
                    {isVideosScreen ? 'No video prompts yet' : 'No prompts found'}
                  </p>
                  <p className="text-[13px] text-[#9CA3AF] leading-relaxed max-w-[270px]">
                    {isVideosScreen
                      ? 'New Google Flow video prompts added from the Admin Studio will appear here.'
                      : 'Try selecting a different category or clearing your search query.'}
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    {visiblePrompts.map((prompt, index) => {
                      const showAdAfter = (index + 1) % Constants.AD_INTERVAL === 0;
                      return (
                        <React.Fragment key={`${activeTab}_${prompt.id}`}>
                          <PromptCard
                            prompt={prompt}
                            index={index}
                            isFavorite={favoriteIds.has(prompt.id)}
                            onSelect={(p) => setSelectedPrompt(p)}
                            onToggleFavorite={handleToggleFavorite}
                          />
                          {showAdAfter && (
                            <div className="col-span-2 my-1">
                              <AdBanner label={`Inline Grid Ad (After prompt #${index + 1})`} />
                            </div>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>

                  {/* Load More Button matching item_load_more.xml */}
                  {hasMore && (
                    <button
                      onClick={handleLoadMore}
                      className="w-full h-[52px] mt-4 mb-2 rounded-[16px] pix-button-gradient flex items-center justify-center gap-2 text-white text-[13.5px] font-bold hover:opacity-95 active:scale-[0.99] transition-all cursor-pointer shadow-lg shadow-[#EC4899]/25"
                    >
                      <Sparkles className="w-[18px] h-[18px]" />
                      <span>Load More Prompts</span>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Bottom Banner Ad (matches Android Activity layout adContainer above bottomNavBar) */}
        {!selectedPrompt && activeTab !== NavTab.PRIVACY && (
          <div className="px-3.5 py-1.5 shrink-0 bg-[#0E0E1B]/80 border-t border-white/5">
            <AdBanner label="AdMob Smart Banner" />
          </div>
        )}

        {/* Frosted Glass Bottom Navigation Bar — 3 User Tabs Only: Images, Videos, Favorite */}
        <nav className="h-[74px] bg-[#121220]/90 backdrop-blur-2xl border-t border-white/10 flex items-center justify-around pt-1.5 shrink-0 z-20">
          <button
            onClick={() => {
              setSelectedPrompt(null);
              setActiveTab(NavTab.EXPLORE);
            }}
            className="flex-1 h-full flex flex-col items-center justify-center cursor-pointer"
          >
            <div
              className={`w-[36px] h-[36px] rounded-full flex items-center justify-center transition-all duration-200 ${
                activeTab === NavTab.EXPLORE && !selectedPrompt
                  ? 'pix-button-gradient scale-105 shadow-md shadow-[#EC4899]/30'
                  : ''
              }`}
            >
              <ImageIcon
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
              className={`w-[36px] h-[36px] rounded-full flex items-center justify-center transition-all duration-200 ${
                activeTab === NavTab.VIDEOS && !selectedPrompt
                  ? 'pix-flow-gradient scale-105 shadow-md shadow-[#06B6D4]/30'
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
              className={`w-[36px] h-[36px] rounded-full flex items-center justify-center transition-all duration-200 relative ${
                activeTab === NavTab.FAVORITE && !selectedPrompt
                  ? 'pix-button-gradient scale-105 shadow-md shadow-[#EC4899]/30'
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
                <span className="absolute -top-0.5 -right-1 min-w-[16px] h-[16px] px-1 rounded-full bg-[#EC4899] text-[10px] font-bold text-white flex items-center justify-center tabular-nums">
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
        </nav>

        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-22 left-1/2 -translate-x-1/2 z-50 bg-[#1B1B2E]/95 backdrop-blur-xl border border-white/15 text-white text-[13px] font-medium px-4 py-2.5 rounded-full shadow-xl flex items-center gap-2 pointer-events-none animate-pix-card">
            <Check className="w-4 h-4 text-[#EC4899]" />
            <span>{toastMessage}</span>
          </div>
        )}
      </div>

      {/* More & Settings Bottom Sheet (No Admin link inside User App) */}
      <MoreSettingsModal
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onOpenPrivacyPolicy={() => {
          setSelectedPrompt(null);
          setActiveTab(NavTab.PRIVACY);
        }}
        onOpenAdConsent={() => setIsAdConsentOpen(true)}
        showToast={showToast}
      />

      {/* Manage Ad Consent Modal */}
      {isAdConsentOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setIsAdConsentOpen(false)}
        >
          <div
            className="w-full max-w-[400px] bg-[#141424]/95 backdrop-blur-2xl border border-white/15 rounded-[22px] p-5 space-y-4 shadow-2xl animate-pix-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-[17px] font-bold text-white font-display">Manage Ad Consent</h3>
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
                className={`w-full p-3.5 rounded-[14px] text-left border transition-colors cursor-pointer ${
                  personalizedAds
                    ? 'bg-[#1D1D32] border-[#EC4899] text-white'
                    : 'bg-[#181828]/60 border-white/10 text-[#9CA3AF]'
                }`}
              >
                <div className="text-[14px] font-bold">Personalized Ads</div>
                <div className="text-[12px] text-[#9CA3AF] mt-0.5">
                  Show ads tailored to your interests
                </div>
              </button>
              <button
                onClick={() => handleSaveAdConsent(false)}
                className={`w-full p-3.5 rounded-[14px] text-left border transition-colors cursor-pointer ${
                  !personalizedAds
                    ? 'bg-[#1D1D32] border-[#EC4899] text-white'
                    : 'bg-[#181828]/60 border-white/10 text-[#9CA3AF]'
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

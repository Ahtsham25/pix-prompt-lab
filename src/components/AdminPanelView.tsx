import React, { useState, useEffect, useCallback } from 'react';
import {
  Image as ImageIcon,
  Video,
  Sparkles,
  Upload,
  Check,
  Trash2,
  ExternalLink,
  RefreshCw,
  Key,
  Eye,
  EyeOff,
  Zap,
  CheckCircle2,
  AlertCircle,
  Gauge,
  Sliders,
  Maximize2,
  FileCheck,
  Minimize2,
} from 'lucide-react';
import { Prompt, PromptData } from '../types';
import {
  resolvePromptImageUrl,
  sortPromptsLatestFirst,
  formatPromptDateTime,
  getPromptTimestamp,
} from '../constants';
import { PixvidLogo } from './PixvidLogo';
import { compressImageToTarget, CompressionResult } from '../utils/imageCompressor';

interface AdminPanelViewProps {
  categories: string[];
  imagePrompts: Prompt[];
  videoPrompts: Prompt[];
  onPromptAdded: (updatedData: PromptData) => void;
  onOpenUserApp?: () => void;
}

export const AdminPanelView: React.FC<AdminPanelViewProps> = ({
  categories,
  imagePrompts,
  videoPrompts,
  onPromptAdded,
  onOpenUserApp,
}) => {
  const [token, setToken] = useState('');
  const [owner, setOwner] = useState('Ahtsham25');
  const [repo, setRepo] = useState('pix-prompt-lab');
  const [folderPath, setFolderPath] = useState('pixprompt-app');
  const [rememberToken, setRememberToken] = useState(false);

  // Gemini API Key state
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [rememberGeminiKey, setRememberGeminiKey] = useState(true);
  const [showApiKey, setShowApiKey] = useState(false);
  const [testingKey, setTestingKey] = useState(false);
  const [testKeyStatus, setTestKeyStatus] = useState<{ msg: string; ok: boolean } | null>(null);

  const [promptType, setPromptType] = useState<'image' | 'video'>('image');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [promptText, setPromptText] = useState('');
  const [tags, setTags] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string>('image/jpeg');
  const [imageExt, setImageExt] = useState<string>('jpg');

  // Smart Image Compression State (~40-50 KB for instant mobile loading)
  const [compressPreset, setCompressPreset] = useState<'mobile-fast' | 'crisp-hd' | 'ultra-light' | 'original'>('mobile-fast');
  const [compressing, setCompressing] = useState(false);
  const [compressionStats, setCompressionStats] = useState<CompressionResult | null>(null);
  const [originalDataUrl, setOriginalDataUrl] = useState<string | null>(null);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [activePreviewMode, setActivePreviewMode] = useState<'compressed' | 'original'>('compressed');

  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ msg: string; type: 'ok' | 'err' | 'loading' } | null>(
    null
  );

  useEffect(() => {
    const savedToken = localStorage.getItem('pixprompt_admin_token');
    if (savedToken) {
      setToken(savedToken);
      setRememberToken(true);
    }
    const savedOwner = localStorage.getItem('pixprompt_admin_owner');
    const savedRepo = localStorage.getItem('pixprompt_admin_repo');
    const savedPath = localStorage.getItem('pixprompt_admin_path');
    if (savedOwner) setOwner(savedOwner);
    if (savedRepo) setRepo(savedRepo);
    if (savedPath) setFolderPath(savedPath);

    const savedGeminiKey = localStorage.getItem('pixprompt_gemini_api_key');
    if (savedGeminiKey) {
      setGeminiApiKey(savedGeminiKey);
      setRememberGeminiKey(true);
    }
  }, []);

  const handleGeminiKeyChange = (newKey: string) => {
    setGeminiApiKey(newKey);
    if (rememberGeminiKey) {
      localStorage.setItem('pixprompt_gemini_api_key', newKey.trim());
    }
  };

  const handleRememberKeyToggle = (checked: boolean) => {
    setRememberGeminiKey(checked);
    if (checked) {
      localStorage.setItem('pixprompt_gemini_api_key', geminiApiKey.trim());
    } else {
      localStorage.removeItem('pixprompt_gemini_api_key');
    }
  };

  const handleTestGeminiKey = async () => {
    const key = geminiApiKey.trim();
    if (!key) {
      setTestKeyStatus({ msg: 'Please enter a Gemini API Key to test.', ok: false });
      return;
    }
    setTestingKey(true);
    setTestKeyStatus(null);
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${encodeURIComponent(
          key
        )}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'Hello, reply with {"status":"ok"}' }] }],
            generationConfig: { responseMimeType: 'application/json' },
          }),
        }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error?.message || `HTTP ${res.status}`);
      }
      setTestKeyStatus({ msg: 'Gemini API Key is valid and working!', ok: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'API key test failed';
      setTestKeyStatus({ msg, ok: false });
    } finally {
      setTestingKey(false);
    }
  };

  const analyzeImageWithGemini = useCallback(
    async (b64: string, mime: string, targetType: 'image' | 'video') => {
      setAnalyzing(true);
      setStatus({
        msg: `Gemini AI is analyzing your uploaded preview and generating ${
          targetType === 'video' ? 'Google Flow Video' : 'Image'
        } prompt details…`,
        type: 'loading',
      });

      try {
        let data: any = null;
        const key = geminiApiKey.trim();

        if (key) {
          const isVideo = targetType === 'video';
          const availableCategories =
            categories.filter((c) => c !== 'All').join(', ') ||
            'Trending, Cinematic, Fantasy, Portrait, Product, Nature';

          const instruction = isVideo
            ? `Analyze this preview visual and generate a production-grade AI VIDEO generation prompt specifically designed for Google Flow.
Describe camera movement (orbit, tracking shot, push-in, crane elevation), subject dynamics, atmospheric effects (smoke, particles, light flares), lighting, and cinematic mood so a creator can generate this as a cinematic video in Google Flow.
Also provide a catchy 3-6 word Title, pick best Category from [${availableCategories}], and provide 4-6 relevant Tags.
Return STRICT JSON format:
{
  "title": "string",
  "category": "string",
  "prompt_text": "string",
  "tags": ["tag1", "tag2", "tag3", "tag4"]
}`
            : `Analyze this image and generate an ultra-detailed AI IMAGE generation prompt designed for Google Gemini and ChatGPT.
Describe subject's pose, facial features, attire, lighting direction, color palette, environment, camera lens, depth-of-field, and realistic textures in rich detail.
Also provide a catchy 3-6 word Title, pick best Category from [${availableCategories}], and provide 4-6 relevant Tags.
Return STRICT JSON format:
{
  "title": "string",
  "category": "string",
  "prompt_text": "string",
  "tags": ["tag1", "tag2", "tag3", "tag4"]
}`;

          const reqBody = {
            contents: [
              {
                parts: [
                  { inlineData: { mimeType: mime, data: b64 } },
                  { text: instruction },
                ],
              },
            ],
            generationConfig: { responseMimeType: 'application/json' },
          };

          const models = ['gemini-3.8-flash', 'gemini-3.5-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];
          let lastErr: any = null;

          for (const model of models) {
            try {
              const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(
                key
              )}`;
              const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(reqBody),
              });

              if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                const msg = errData?.error?.message || `HTTP ${res.status}`;
                if (msg.includes('API_KEY_INVALID') || msg.includes('API key not valid')) {
                  throw new Error('Gemini API Key is invalid. Please check your key at Google AI Studio.');
                }
                throw new Error(`[${model}] ${msg}`);
              }

              const resJson = await res.json();
              const rawText = resJson?.candidates?.[0]?.content?.parts?.[0]?.text || '';
              if (!rawText) throw new Error('Empty response from ' + model);
              const cleaned = rawText.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
              data = JSON.parse(cleaned);
              break;
            } catch (err) {
              lastErr = err;
              if (err instanceof Error && err.message.includes('invalid')) throw err;
            }
          }

          if (!data) throw lastErr || new Error('Could not analyze with Gemini models');
        } else {
          const res = await fetch('/api/admin/analyze-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              imageBase64: b64,
              mimeType: mime,
              promptType: targetType,
              categories: categories.filter((c) => c !== 'All'),
            }),
          });

          data = await res.json().catch(() => ({}));
          if (!res.ok) {
            throw new Error(data.error || `Gemini analysis failed (${res.status})`);
          }
        }

        if (data.title) setTitle(data.title);
        if (data.category) setCategory(data.category);
        if (data.prompt_text) setPromptText(data.prompt_text);
        if (Array.isArray(data.tags)) {
          setTags(data.tags.join(', '));
        }

        setStatus({
          msg: '✨ Gemini AI automatically generated Title, Category, Prompt Text, and Tags!',
          type: 'ok',
        });
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'Could not analyze image with Gemini AI';
        setStatus({ msg: message, type: 'err' });
      } finally {
        setAnalyzing(false);
      }
    },
    [categories, geminiApiKey]
  );

  const processAndApplyImage = useCallback(
    async (
      source: File | string,
      preset: 'mobile-fast' | 'crisp-hd' | 'ultra-light' | 'original',
      inMime: string,
      inExt: string,
      triggerGemini = true
    ) => {
      // If user uploaded a GIF and hasn't explicitly chosen to compress it, keep GIF untouched
      if (inExt === 'gif' && preset === 'original') {
        let b64 = '';
        let dUrl = '';
        if (typeof source === 'string') {
          dUrl = source;
          b64 = source.split(',')[1] || '';
        } else {
          dUrl = await new Promise<string>((res) => {
            const r = new FileReader();
            r.onload = () => res(r.result as string);
            r.readAsDataURL(source);
          });
          b64 = dUrl.split(',')[1] || '';
        }
        setImagePreview(dUrl);
        setImageBase64(b64);
        setImageMimeType('image/gif');
        setImageExt('gif');
        setCompressionStats(null);
        if (triggerGemini && b64) {
          analyzeImageWithGemini(b64, 'image/gif', promptType);
        }
        return;
      }

      if (preset === 'original') {
        let b64 = '';
        let dUrl = '';
        if (typeof source === 'string') {
          dUrl = source;
          b64 = source.split(',')[1] || '';
        } else {
          dUrl = await new Promise<string>((res) => {
            const r = new FileReader();
            r.onload = () => res(r.result as string);
            r.readAsDataURL(source);
          });
          b64 = dUrl.split(',')[1] || '';
        }
        setImagePreview(dUrl);
        setImageBase64(b64);
        setImageMimeType(inMime);
        setImageExt(inExt);
        setCompressionStats(null);
        setActivePreviewMode('original');
        if (triggerGemini && b64) {
          analyzeImageWithGemini(b64, inMime, promptType);
        }
        return;
      }

      setCompressing(true);
      try {
        let targetSizeKb = 48; // Mobile Fast target: ~40-50 KB
        let maxDimension = 1080; // Retina crisp HD on phones
        let initialQuality = 0.82;

        if (preset === 'mobile-fast') {
          targetSizeKb = 48; // ~40-50 KB
          maxDimension = 1080;
          initialQuality = 0.82;
        } else if (preset === 'crisp-hd') {
          targetSizeKb = 72; // ~60-80 KB
          maxDimension = 1280;
          initialQuality = 0.88;
        } else if (preset === 'ultra-light') {
          targetSizeKb = 32; // ~25-35 KB
          maxDimension = 900;
          initialQuality = 0.70;
        }

        const compResult = await compressImageToTarget(source, {
          targetSizeKb,
          maxDimension,
          initialQuality,
          format: 'image/jpeg',
        });

        setCompressionStats(compResult);
        setImagePreview(compResult.dataUrl);
        setImageBase64(compResult.base64);
        setImageMimeType(compResult.mimeType);
        setImageExt(compResult.ext);
        setActivePreviewMode('compressed');

        if (triggerGemini && compResult.base64) {
          analyzeImageWithGemini(compResult.base64, compResult.mimeType, promptType);
        }
      } catch (err) {
        console.error('Image compression error:', err);
      } finally {
        setCompressing(false);
      }
    },
    [analyzeImageWithGemini, promptType]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setImagePreview(null);
      setImageBase64(null);
      setCompressionStats(null);
      setOriginalDataUrl(null);
      setOriginalFile(null);
      return;
    }

    setOriginalFile(file);
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const mime = file.type || (ext === 'gif' ? 'image/gif' : ext === 'png' ? 'image/png' : 'image/jpeg');
    setImageExt(ext);
    setImageMimeType(mime);

    // Keep raw data URL for live before/after quality comparisons
    const reader = new FileReader();
    reader.onload = (ev) => {
      const origData = ev.target?.result as string;
      setOriginalDataUrl(origData);
    };
    reader.readAsDataURL(file);

    processAndApplyImage(file, compressPreset, mime, ext, true);
  };

  const handlePresetChange = (preset: 'mobile-fast' | 'crisp-hd' | 'ultra-light' | 'original') => {
    setCompressPreset(preset);
    if (originalFile) {
      processAndApplyImage(originalFile, preset, imageMimeType, imageExt, false);
    } else if (originalDataUrl) {
      processAndApplyImage(originalDataUrl, preset, imageMimeType, imageExt, false);
    }
  };

  const handleTypeSwitch = (newType: 'image' | 'video') => {
    setPromptType(newType);
    if (imageBase64) {
      analyzeImageWithGemini(imageBase64, imageMimeType, newType);
    }
  };

  const utf8ToBase64 = (str: string) => btoa(unescape(encodeURIComponent(str)));
  const base64ToUtf8 = (b64: string) =>
    decodeURIComponent(escape(atob(b64.replace(/\n/g, ''))));

  const handleSave = async () => {
    if (!title.trim() || !category.trim() || !promptText.trim()) {
      setStatus({ msg: 'Title, Category, and Prompt text are required.', type: 'err' });
      return;
    }
    if (!imageBase64) {
      setStatus({ msg: 'Please upload a preview image or GIF thumbnail first.', type: 'err' });
      return;
    }

    setSaving(true);
    try {
      if (rememberToken && token.trim()) {
        localStorage.setItem('pixprompt_admin_token', token.trim());
      } else {
        localStorage.removeItem('pixprompt_admin_token');
      }
      localStorage.setItem('pixprompt_admin_owner', owner.trim());
      localStorage.setItem('pixprompt_admin_repo', repo.trim());
      localStorage.setItem('pixprompt_admin_path', folderPath.trim());

      setStatus({ msg: `Saving ${promptType} prompt to library…`, type: 'loading' });
      const localRes = await fetch('/api/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: promptType,
          title: title.trim(),
          category: category.trim(),
          prompt_text: promptText.trim(),
          tags: tags.trim(),
          imageBase64,
          imageExt,
        }),
      });

      if (!localRes.ok) {
        const errData = await localRes.json().catch(() => ({}));
        throw new Error(errData.error || `Server error (${localRes.status})`);
      }

      const localResult = await localRes.json();
      if (localResult.data) {
        onPromptAdded(localResult.data);
      }

      if (token.trim()) {
        setStatus({ msg: 'Uploading preview image to GitHub repository…', type: 'loading' });
        const cleanFolder = folderPath.trim().replace(/\/$/, '');
        const imagesDir = cleanFolder ? `${cleanFolder}/images` : 'images';
        const jsonFile = cleanFolder ? `${cleanFolder}/prompts.json` : 'prompts.json';
        const filename = `prompt_${Date.now()}.${imageExt}`;
        const apiBase = `https://api.github.com/repos/${owner.trim()}/${repo.trim()}/contents`;
        const authHeaders = {
          Authorization: `Bearer ${token.trim()}`,
          Accept: 'application/vnd.github+json',
          'Content-Type': 'application/json',
        };

        const imgPut = await fetch(`${apiBase}/${imagesDir}/${filename}`, {
          method: 'PUT',
          headers: authHeaders,
          body: JSON.stringify({
            message: `Add image ${filename} via Pixvid Lab Admin Studio`,
            content: imageBase64,
          }),
        });

        if (!imgPut.ok) {
          const err = await imgPut.json().catch(() => ({}));
          throw new Error(
            `Saved locally, but GitHub image upload failed: ${err.message || imgPut.status}`
          );
        }

        const cdnUrl = `https://cdn.jsdelivr.net/gh/${owner.trim()}/${repo.trim()}@main/${imagesDir}/${filename}`;

        setStatus({ msg: 'Updating prompts.json on GitHub…', type: 'loading' });
        const getRes = await fetch(`${apiBase}/${jsonFile}`, { headers: authHeaders });
        if (!getRes.ok) {
          throw new Error(
            `Saved locally, but could not read GitHub prompts.json (${getRes.status})`
          );
        }
        const getData = await getRes.json();
        const ghJson = JSON.parse(base64ToUtf8(getData.content));

        const nowMs = localResult.prompt?.timestamp || Date.now();
        const nowIso = localResult.prompt?.created_at || new Date(nowMs).toISOString();

        const ghEntry = {
          ...localResult.prompt,
          type: promptType,
          image_url: cdnUrl,
          created_at: nowIso,
          timestamp: nowMs,
        };

        if (promptType === 'video') {
          ghJson.video_prompts = sortPromptsLatestFirst([
            ghEntry,
            ...(ghJson.video_prompts || []),
          ]);
        } else {
          ghJson.prompts = sortPromptsLatestFirst([ghEntry, ...(ghJson.prompts || [])]);
        }

        ghJson.categories = ghJson.categories || [];
        if (
          !ghJson.categories.some(
            (c: string) => c.toLowerCase() === category.trim().toLowerCase()
          )
        ) {
          ghJson.categories.push(category.trim());
        }

        const putRes = await fetch(`${apiBase}/${jsonFile}`, {
          method: 'PUT',
          headers: authHeaders,
          body: JSON.stringify({
            message: `Add ${promptType} prompt "${title.trim()}" via Pixvid Lab Admin Studio`,
            content: utf8ToBase64(JSON.stringify(ghJson, null, 2)),
            sha: getData.sha,
          }),
        });

        if (!putRes.ok) {
          const err = await putRes.json().catch(() => ({}));
          throw new Error(
            `Saved locally, but could not commit prompts.json to GitHub: ${
              err.message || putRes.status
            }`
          );
        }

        setStatus({
          msg: `Published! "${title.trim()}" (${promptType}) saved locally and pushed to GitHub.`,
          type: 'ok',
        });
      } else {
        setStatus({
          msg: `Published! "${title.trim()}" added to ${
            promptType === 'video' ? 'Video Prompts (Flow)' : 'Image Prompts'
          }.`,
          type: 'ok',
        });
      }

      setTitle('');
      setPromptText('');
      setTags('');
      setImagePreview(null);
      setImageBase64(null);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to save prompt';
      setStatus({ msg: message, type: 'err' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePrompt = async (id: string, itemTitle: string) => {
    if (!window.confirm(`Are you sure you want to delete "${itemTitle}"?`)) {
      return;
    }

    setStatus({ msg: `Deleting "${itemTitle}"…`, type: 'loading' });

    try {
      // 1. Delete on local server
      let localSuccess = false;
      let returnedData = null;
      try {
        const res = await fetch(`/api/prompts/${encodeURIComponent(id)}`, {
          method: 'DELETE',
        });
        if (res.ok) {
          const result = await res.json();
          returnedData = result.data;
          localSuccess = true;
          if (returnedData) {
            onPromptAdded(returnedData);
          }
        }
      } catch (_) {}

      // 2. Delete on GitHub if token is provided
      if (token.trim()) {
        setStatus({ msg: `Removing "${itemTitle}" from GitHub repository…`, type: 'loading' });
        const cleanFolder = folderPath.trim().replace(/\/$/, '');
        const jsonFile = cleanFolder ? `${cleanFolder}/prompts.json` : 'prompts.json';
        const apiBase = `https://api.github.com/repos/${owner.trim()}/${repo.trim()}/contents`;
        const authHeaders = {
          Authorization: `Bearer ${token.trim()}`,
          Accept: 'application/vnd.github+json',
          'Content-Type': 'application/json',
        };

        const getRes = await fetch(`${apiBase}/${jsonFile}`, { headers: authHeaders });
        if (!getRes.ok) {
          throw new Error(`Could not fetch GitHub prompts.json (${getRes.status})`);
        }
        const getData = await getRes.json();
        const ghJson = JSON.parse(base64ToUtf8(getData.content));

        const prevImgCount = (ghJson.prompts || []).length;
        const prevVidCount = (ghJson.video_prompts || []).length;

        ghJson.prompts = (ghJson.prompts || []).filter((p: { id: string }) => p.id !== id);
        ghJson.video_prompts = (ghJson.video_prompts || []).filter((p: { id: string }) => p.id !== id);

        const putRes = await fetch(`${apiBase}/${jsonFile}`, {
          method: 'PUT',
          headers: authHeaders,
          body: JSON.stringify({
            message: `Delete prompt "${itemTitle}" via Pixvid Admin Studio`,
            content: utf8ToBase64(JSON.stringify(ghJson, null, 2)),
            sha: getData.sha,
          }),
        });

        if (!putRes.ok) {
          const err = await putRes.json().catch(() => ({}));
          throw new Error(err.message || `Failed to update GitHub (${putRes.status})`);
        }

        setStatus({ msg: `Deleted "${itemTitle}" and updated GitHub repository!`, type: 'ok' });
      } else if (localSuccess) {
        setStatus({ msg: `Deleted "${itemTitle}" from local library.`, type: 'ok' });
      } else {
        throw new Error('Could not delete prompt. Please check your connection or GitHub token.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not delete prompt';
      setStatus({ msg, type: 'err' });
    }
  };

  const currentList = promptType === 'video' ? videoPrompts : imagePrompts;

  return (
    <div className="min-h-screen pix-ambient-bg text-white flex justify-center py-6 px-4">
      <div className="w-full max-w-[680px] space-y-5 animate-pix-card">
        {/* Top Studio Bar */}
        <header className="pix-gradient-border rounded-[20px] shadow-2xl shadow-black/40">
          <div className="pix-glass-panel rounded-[18.5px] px-5 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <PixvidLogo size="md" />
              <div>
                <h1 className="text-[19px] font-bold text-white leading-tight font-display">
                  Pixvid Lab — Admin Studio
                </h1>
                <p className="text-[12px] text-[#A1A1B5]">
                  Upload any image or GIF — Gemini AI auto-generates the prompt &amp; metadata
                </p>
              </div>
            </div>

            {onOpenUserApp && (
              <button
                onClick={onOpenUserApp}
                className="px-3.5 py-2 rounded-[12px] bg-white/10 hover:bg-white/15 border border-white/10 text-[12.5px] font-semibold text-white flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors cursor-pointer"
              >
                <span>Preview User App</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </header>

        {/* Gemini AI API Key Configuration Card */}
        <div className="pix-glass-panel border border-[#A855F7]/30 bg-[#16132C]/85 rounded-[22px] p-5 shadow-2xl shadow-black/40 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-[#C084FC]">
              <Key className="w-4 h-4 text-[#C084FC]" />
              <h2 className="text-[14.5px] font-bold font-display text-white">
                Google Gemini AI API Key
              </h2>
            </div>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[12px] font-semibold text-[#38BDF8] hover:text-[#7DD3FC] flex items-center gap-1 transition-colors"
            >
              <span>Get Free Key</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <p className="text-[12px] text-[#A1A1B5] leading-relaxed">
            Enter your Google Gemini API Key below. You can generate multiple free keys from Google AI Studio and rotate or update them anytime.
          </p>

          <div className="relative">
            <input
              type={showApiKey ? 'text' : 'password'}
              value={geminiApiKey}
              onChange={(e) => handleGeminiKeyChange(e.target.value)}
              placeholder="AIzaSy... (Paste Gemini API Key from Google AI Studio)"
              className="w-full bg-[#171728] border border-white/10 focus:border-[#C084FC] rounded-[13px] px-4 py-2.5 pr-20 text-[13.5px] text-white placeholder-[#6B7280] outline-none transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowApiKey(!showApiKey)}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-[8px] bg-white/10 hover:bg-white/15 text-[11px] font-semibold text-white/80 transition-colors flex items-center gap-1 cursor-pointer"
            >
              {showApiKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              <span>{showApiKey ? 'Hide' : 'Show'}</span>
            </button>
          </div>

          <div className="flex items-center justify-between gap-3 pt-1 flex-wrap">
            <label className="flex items-center gap-2 cursor-pointer text-[12px] text-[#A1A1B5] hover:text-white transition-colors">
              <input
                type="checkbox"
                checked={rememberGeminiKey}
                onChange={(e) => handleRememberKeyToggle(e.target.checked)}
                className="w-4 h-4 rounded accent-[#C084FC] cursor-pointer"
              />
              <span>Remember API Key on this device</span>
            </label>

            <button
              type="button"
              onClick={handleTestGeminiKey}
              disabled={testingKey}
              className="px-3 py-1.5 rounded-[10px] bg-[#A855F7]/20 hover:bg-[#A855F7]/30 border border-[#A855F7]/40 text-[12px] font-semibold text-[#E9D5FF] flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Zap className={`w-3.5 h-3.5 ${testingKey ? 'animate-spin' : ''}`} />
              <span>{testingKey ? 'Testing…' : 'Test API Key'}</span>
            </button>
          </div>

          {testKeyStatus && (
            <div
              className={`p-2.5 rounded-[10px] text-[12px] flex items-center gap-2 ${
                testKeyStatus.ok
                  ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                  : 'bg-red-500/15 border border-red-500/30 text-red-300'
              }`}
            >
              {testKeyStatus.ok ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              )}
              <span>{testKeyStatus.msg}</span>
            </div>
          )}
        </div>

        {/* Main Upload + Gemini Auto-Generator Card */}
        <div className="pix-glass-panel border border-white/10 rounded-[22px] p-6 shadow-2xl shadow-black/40 space-y-5">
          {/* Step 1: Select Section Type */}
          <div>
            <label className="block text-[12.5px] font-semibold text-[#A1A1B5] mb-2">
              1. Choose Target Section
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleTypeSwitch('image')}
                className={`h-[48px] rounded-[14px] flex items-center justify-center gap-2.5 text-[13.5px] font-bold transition-all cursor-pointer ${
                  promptType === 'image'
                    ? 'pix-button-gradient text-white shadow-lg shadow-[#EC4899]/25'
                    : 'bg-[#171728] border border-white/10 text-[#9CA3AF] hover:text-white'
                }`}
              >
                <ImageIcon className="w-4 h-4" />
                <span>Image Prompt (Gemini / GPT)</span>
              </button>
              <button
                type="button"
                onClick={() => handleTypeSwitch('video')}
                className={`h-[48px] rounded-[14px] flex items-center justify-center gap-2.5 text-[13.5px] font-bold transition-all cursor-pointer ${
                  promptType === 'video'
                    ? 'pix-flow-gradient text-white shadow-lg shadow-[#06B6D4]/25'
                    : 'bg-[#171728] border border-white/10 text-[#9CA3AF] hover:text-white'
                }`}
              >
                <Video className="w-4 h-4" />
                <span>Video Prompt (Google Flow)</span>
              </button>
            </div>
          </div>

          {/* Step 2: Upload Preview Image / GIF with Smart Auto-Compressor */}
          <div className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <label className="text-[12.5px] font-semibold text-[#A1A1B5]">
                2. Upload Preview Image or GIF Thumbnail (Smart ~40-50 KB Compressor)
              </label>
              {imageBase64 && (
                <button
                  type="button"
                  onClick={() => analyzeImageWithGemini(imageBase64, imageMimeType, promptType)}
                  disabled={analyzing}
                  className="text-[12px] font-semibold text-[#38BDF8] hover:text-white flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${analyzing ? 'animate-spin' : ''}`} />
                  <span>{analyzing ? 'Analyzing…' : 'Re-Analyze with Gemini'}</span>
                </button>
              )}
            </div>

            {/* Smart Compression Presets Bar */}
            <div className="bg-[#121222] border border-white/10 rounded-[16px] p-3 space-y-2">
              <div className="flex items-center justify-between text-[11.5px] text-[#A1A1B5]">
                <div className="flex items-center gap-1.5 font-semibold text-white">
                  <Gauge className="w-3.5 h-3.5 text-[#38BDF8]" />
                  <span>Mobile Compression Target:</span>
                </div>
                <span className="text-[#38BDF8] font-medium">
                  {compressPreset === 'mobile-fast' && '⚡ Target: 40–50 KB (High-Speed Mobile Delivery)'}
                  {compressPreset === 'crisp-hd' && '💎 Target: 60–80 KB (Maximum HD Fidelity)'}
                  {compressPreset === 'ultra-light' && '🚀 Target: 25–35 KB (Ultra-Low Data Usage)'}
                  {compressPreset === 'original' && '📁 Keep Original (Raw Uncompressed File)'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => handlePresetChange('mobile-fast')}
                  className={`px-2.5 py-1.5 rounded-[10px] text-[11.5px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    compressPreset === 'mobile-fast'
                      ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 shadow-sm shadow-emerald-500/20'
                      : 'bg-white/5 border border-white/5 text-[#9CA3AF] hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span>⚡ 40–50 KB</span>
                  <span className="text-[10px] opacity-75 font-normal">(Fastest)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handlePresetChange('crisp-hd')}
                  className={`px-2.5 py-1.5 rounded-[10px] text-[11.5px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    compressPreset === 'crisp-hd'
                      ? 'bg-[#38BDF8]/20 border border-[#38BDF8]/50 text-[#38BDF8] shadow-sm shadow-[#38BDF8]/20'
                      : 'bg-white/5 border border-white/5 text-[#9CA3AF] hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span>💎 60–80 KB</span>
                  <span className="text-[10px] opacity-75 font-normal">(HD)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handlePresetChange('ultra-light')}
                  className={`px-2.5 py-1.5 rounded-[10px] text-[11.5px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    compressPreset === 'ultra-light'
                      ? 'bg-[#C084FC]/20 border border-[#C084FC]/50 text-[#E9D5FF] shadow-sm shadow-[#C084FC]/20'
                      : 'bg-white/5 border border-white/5 text-[#9CA3AF] hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span>🚀 25–35 KB</span>
                  <span className="text-[10px] opacity-75 font-normal">(Light)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handlePresetChange('original')}
                  className={`px-2.5 py-1.5 rounded-[10px] text-[11.5px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    compressPreset === 'original'
                      ? 'bg-amber-500/20 border border-amber-500/50 text-amber-300 shadow-sm shadow-amber-500/20'
                      : 'bg-white/5 border border-white/5 text-[#9CA3AF] hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span>📁 Original</span>
                  <span className="text-[10px] opacity-75 font-normal">(Raw)</span>
                </button>
              </div>
            </div>

            {/* Dropzone */}
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-white/15 hover:border-[#EC4899]/60 rounded-[18px] bg-[#141424]/80 p-5 cursor-pointer transition-colors relative overflow-hidden">
              <input
                type="file"
                accept="image/*,.gif"
                onChange={handleFileChange}
                className="hidden"
              />

              {compressing && (
                <div className="absolute inset-0 bg-[#0E0E1C]/90 backdrop-blur-sm flex flex-col items-center justify-center z-10 gap-2">
                  <div className="w-8 h-8 border-3 border-[#38BDF8] border-t-transparent rounded-full animate-spin" />
                  <span className="text-[13px] font-semibold text-white">
                    Compressing image to {compressPreset === 'mobile-fast' ? '40–50 KB' : 'target size'}…
                  </span>
                  <span className="text-[11.5px] text-[#A1A1B5]">
                    Preserving high-definition mobile clarity
                  </span>
                </div>
              )}

              {imagePreview ? (
                <div className="flex flex-col items-center gap-3 w-full">
                  <img
                    src={activePreviewMode === 'compressed' ? imagePreview : (originalDataUrl || imagePreview)}
                    alt="Uploaded preview"
                    className="max-h-[240px] rounded-[14px] object-contain shadow-lg"
                  />
                  <span className="text-[12px] text-[#A1A1B5] flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5 text-[#EC4899]" />
                    Click to choose a different image or GIF
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 py-4 text-center">
                  <div className="w-12 h-12 rounded-2xl pix-badge-gradient flex items-center justify-center shadow-lg shadow-[#A855F7]/25">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-[14px] font-bold text-white mt-1">
                    Click to upload Preview Image or GIF
                  </div>
                  <div className="text-[12px] text-[#9CA3AF] max-w-[380px]">
                    HD images (1MB–5MB) are automatically compressed to ~40–50 KB for ultra-fast mobile loading, and Gemini AI auto-generates all prompt details!
                  </div>
                </div>
              )}
            </label>

            {/* Compression Stats & Comparison Bar */}
            {compressionStats && (
              <div className="bg-[#121829] border border-emerald-500/30 rounded-[16px] p-3.5 text-[12px] space-y-2.5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Auto-Compressed &amp; Mobile-Optimized!</span>
                  </div>
                  <div className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[11px] border border-emerald-500/40">
                    -{compressionStats.savedPercentage}% Reduction ⚡
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  <div className="bg-black/30 rounded-[10px] p-2 border border-white/5">
                    <div className="text-[10px] text-[#9CA3AF] uppercase font-semibold">Original Size</div>
                    <div className="text-[13px] font-bold text-white mt-0.5">
                      {compressionStats.originalSizeKb > 1024
                        ? `${(compressionStats.originalSizeKb / 1024).toFixed(1)} MB`
                        : `${compressionStats.originalSizeKb} KB`}
                    </div>
                    <div className="text-[10px] text-[#6B7280]">
                      {compressionStats.originalWidth} × {compressionStats.originalHeight}
                    </div>
                  </div>

                  <div className="bg-emerald-500/10 rounded-[10px] p-2 border border-emerald-500/30">
                    <div className="text-[10px] text-emerald-400 uppercase font-semibold">Compressed Size</div>
                    <div className="text-[13px] font-bold text-emerald-300 mt-0.5">
                      {compressionStats.compressedSizeKb} KB
                    </div>
                    <div className="text-[10px] text-emerald-400/80">
                      {compressionStats.width} × {compressionStats.height} (HD)
                    </div>
                  </div>

                  <div className="bg-black/30 rounded-[10px] p-2 border border-white/5">
                    <div className="text-[10px] text-[#9CA3AF] uppercase font-semibold">Data Saved</div>
                    <div className="text-[13px] font-bold text-[#38BDF8] mt-0.5">
                      {Math.max(0, compressionStats.originalSizeKb - compressionStats.compressedSizeKb)} KB
                    </div>
                    <div className="text-[10px] text-[#6B7280]">Bandwidth saved</div>
                  </div>

                  <div className="bg-black/30 rounded-[10px] p-2 border border-white/5">
                    <div className="text-[10px] text-[#9CA3AF] uppercase font-semibold">Mobile Load Speed</div>
                    <div className="text-[13px] font-bold text-[#A855F7] mt-0.5">
                      &lt; 0.05s
                    </div>
                    <div className="text-[10px] text-[#6B7280]">Instant Glide Load</div>
                  </div>
                </div>

                {originalDataUrl && (
                  <div className="flex items-center justify-between pt-1 border-t border-white/10">
                    <span className="text-[11px] text-[#A1A1B5]">
                      Visual Quality Comparison:
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setActivePreviewMode('compressed')}
                        className={`px-2 py-0.5 rounded-[6px] text-[10.5px] font-semibold transition-colors cursor-pointer ${
                          activePreviewMode === 'compressed'
                            ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/50'
                            : 'text-[#9CA3AF] hover:text-white'
                        }`}
                      >
                        ⚡ Compressed ({compressionStats.compressedSizeKb} KB)
                      </button>
                      <button
                        type="button"
                        onClick={() => setActivePreviewMode('original')}
                        className={`px-2 py-0.5 rounded-[6px] text-[10.5px] font-semibold transition-colors cursor-pointer ${
                          activePreviewMode === 'original'
                            ? 'bg-amber-500/30 text-amber-300 border border-amber-500/50'
                            : 'text-[#9CA3AF] hover:text-white'
                        }`}
                      >
                        📷 Original ({compressionStats.originalSizeKb} KB)
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Status / Gemini Analysis Progress Banner */}
          {status && (
            <div
              className={`px-4 py-3 rounded-[14px] text-[13px] font-medium flex items-center gap-2.5 ${
                status.type === 'ok'
                  ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                  : status.type === 'err'
                  ? 'bg-red-500/15 border border-red-500/30 text-red-300'
                  : 'bg-[#1D1D35] border border-[#A855F7]/40 text-white'
              }`}
            >
              {status.type === 'loading' ? (
                <div className="w-4 h-4 border-2 border-[#38BDF8] border-t-transparent rounded-full animate-spin shrink-0" />
              ) : status.type === 'ok' ? (
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : null}
              <span>{status.msg}</span>
            </div>
          )}

          {/* Step 3: Auto-Filled Prompt Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[12px] font-semibold text-[#A1A1B5] mb-1.5">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={
                  promptType === 'video'
                    ? 'e.g. Cinematic Sunset Rider Motion'
                    : 'e.g. Golden Hour Portrait'
                }
                className="w-full bg-[#171728] border border-white/10 rounded-[13px] px-3.5 py-3 text-[14px] text-white placeholder-[#6B7280] focus:outline-none focus:border-[#EC4899]"
              />
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-[#A1A1B5] mb-1.5">
                Category
              </label>
              <input
                type="text"
                list="adminCategoryList"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Cinematic"
                className="w-full bg-[#171728] border border-white/10 rounded-[13px] px-3.5 py-3 text-[14px] text-white placeholder-[#6B7280] focus:outline-none focus:border-[#EC4899]"
              />
              <datalist id="adminCategoryList">
                {categories
                  .filter((c) => c !== 'All')
                  .map((cat) => (
                    <option key={cat} value={cat} />
                  ))}
              </datalist>
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-[#A1A1B5] mb-1.5">
              {promptType === 'video'
                ? 'Google Flow Video Prompt Text (Auto-Generated by Gemini)'
                : 'Image Prompt Text (Auto-Generated by Gemini)'}
            </label>
            <textarea
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              placeholder={
                promptType === 'video'
                  ? 'Upload an image above to auto-generate a Google Flow video prompt, or type here…'
                  : 'Upload an image above to auto-generate a detailed image prompt, or type here…'
              }
              rows={5}
              className="w-full bg-[#171728] border border-white/10 rounded-[13px] px-3.5 py-3 text-[13.5px] leading-relaxed text-white placeholder-[#6B7280] focus:outline-none focus:border-[#EC4899] resize-y"
            />
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-[#A1A1B5] mb-1.5">
              Tags (comma separated)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Trending, Cinematic, Google Flow"
              className="w-full bg-[#171728] border border-white/10 rounded-[13px] px-3.5 py-3 text-[14px] text-white placeholder-[#6B7280] focus:outline-none focus:border-[#EC4899]"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={saving || analyzing}
            className={`w-full h-[52px] rounded-[15px] ${
              promptType === 'video' ? 'pix-flow-gradient' : 'pix-button-gradient'
            } text-white text-[15px] font-bold flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 cursor-pointer`}
          >
            <Sparkles className="w-4 h-4" />
            <span>
              {saving
                ? 'Publishing…'
                : promptType === 'video'
                ? 'Publish to Video Prompts (Google Flow)'
                : 'Publish to Image Prompts'}
            </span>
          </button>
        </div>

        {/* Live Library Manager for Current Tab */}
        <div className="pix-glass-panel border border-white/10 rounded-[22px] p-6 shadow-xl shadow-black/30 space-y-3.5">
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-bold text-white font-display">
              {promptType === 'video'
                ? `Published Video Prompts (${videoPrompts.length})`
                : `Published Image Prompts (${imagePrompts.length})`}
            </h2>
            <span className="text-[12px] text-[#9CA3AF]">
              Click trash icon to remove any item
            </span>
          </div>

          {currentList.length === 0 ? (
            <div className="py-8 text-center text-[13px] text-[#9CA3AF] bg-[#141424]/60 rounded-[14px] border border-white/5">
              No {promptType === 'video' ? 'video' : 'image'} prompts in library yet. Upload an
              image above to create your first one!
            </div>
          ) : (
            <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1">
              {currentList.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 p-2.5 rounded-[13px] bg-[#171728]/90 border border-white/5"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={resolvePromptImageUrl(item.image_url)}
                      alt={item.title}
                      className="w-11 h-11 rounded-[9px] object-cover shrink-0 bg-[#121220]"
                    />
                    <div className="min-w-0">
                      <div className="text-[13.5px] font-bold text-white truncate">
                        {item.title}
                      </div>
                      <div className="text-[11.5px] text-[#9CA3AF] truncate">
                        {item.category}
                        {formatPromptDateTime(item) ? ` · ${formatPromptDateTime(item)}` : ''}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeletePrompt(item.id, item.title)}
                    className="w-9 h-9 rounded-[10px] bg-red-500/10 hover:bg-red-500/25 text-red-400 flex items-center justify-center shrink-0 transition-colors cursor-pointer"
                    title="Delete prompt"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Optional GitHub Sync Settings */}
        <div className="pix-glass-panel border border-white/10 rounded-[22px] p-6 shadow-xl shadow-black/30 space-y-3.5">
          <h2 className="text-[15px] font-bold text-[#EC4899] font-display">
            GitHub Repository Sync (Optional — Auto-Commits to GitHub)
          </h2>

          <div>
            <label className="block text-[12px] font-semibold text-[#A1A1B5] mb-1.5">
              GitHub Personal Access Token
            </label>
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx (leave blank for local save only)"
              className="w-full bg-[#171728] border border-white/10 rounded-[13px] px-3.5 py-2.5 text-[13.5px] text-white placeholder-[#6B7280] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[12px] font-semibold text-[#A1A1B5] mb-1">
                Repo Owner
              </label>
              <input
                type="text"
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                className="w-full bg-[#171728] border border-white/10 rounded-[12px] px-3 py-2 text-[13px] text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-[#A1A1B5] mb-1">
                Repo Name
              </label>
              <input
                type="text"
                value={repo}
                onChange={(e) => setRepo(e.target.value)}
                className="w-full bg-[#171728] border border-white/10 rounded-[12px] px-3 py-2 text-[13px] text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-[#A1A1B5] mb-1">
                App Folder Path
              </label>
              <input
                type="text"
                value={folderPath}
                onChange={(e) => setFolderPath(e.target.value)}
                className="w-full bg-[#171728] border border-white/10 rounded-[12px] px-3 py-2 text-[13px] text-white focus:outline-none"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-[12px] text-[#A1A1B5] cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={rememberToken}
              onChange={(e) => setRememberToken(e.target.checked)}
              className="rounded accent-[#D946EF]"
            />
            <span>Remember my GitHub token on this device</span>
          </label>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Image as ImageIcon, Video } from 'lucide-react';
import { PromptData } from '../types';
import { PixvidLogo } from './PixvidLogo';

interface AdminPanelViewProps {
  categories: string[];
  onBack: () => void;
  onPromptAdded: (updatedData: PromptData) => void;
}

export const AdminPanelView: React.FC<AdminPanelViewProps> = ({
  categories,
  onBack,
  onPromptAdded,
}) => {
  const [token, setToken] = useState('');
  const [owner, setOwner] = useState('Ahtsham25');
  const [repo, setRepo] = useState('pix-prompt-lab');
  const [folderPath, setFolderPath] = useState('pixprompt-app');
  const [rememberToken, setRememberToken] = useState(false);

  const [promptType, setPromptType] = useState<'image' | 'video'>('image');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [promptText, setPromptText] = useState('');
  const [tags, setTags] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageExt, setImageExt] = useState<string>('jpg');

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
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setImagePreview(null);
      setImageBase64(null);
      return;
    }
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    setImageExt(ext);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setImagePreview(dataUrl);
      const b64 = dataUrl.split(',')[1] || '';
      setImageBase64(b64);
    };
    reader.readAsDataURL(file);
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
      setStatus({ msg: 'Please choose a preview image.', type: 'err' });
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
        setStatus({ msg: 'Uploading image to GitHub repository…', type: 'loading' });
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
            message: `Add image ${filename} via Pixvid Lab Admin Panel`,
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
          throw new Error(`Saved locally, but could not read GitHub prompts.json (${getRes.status})`);
        }
        const getData = await getRes.json();
        const ghJson = JSON.parse(base64ToUtf8(getData.content));

        const ghEntry = {
          ...localResult.prompt,
          type: promptType,
          image_url: cdnUrl,
        };

        if (promptType === 'video') {
          ghJson.video_prompts = ghJson.video_prompts || [];
          ghJson.video_prompts.unshift(ghEntry);
        } else {
          ghJson.prompts = ghJson.prompts || [];
          ghJson.prompts.unshift(ghEntry);
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
            message: `Add ${promptType} prompt "${title.trim()}" via Pixvid Lab Admin Panel`,
            content: utf8ToBase64(JSON.stringify(ghJson, null, 2)),
            sha: getData.sha,
          }),
        });

        if (!putRes.ok) {
          const err = await putRes.json().catch(() => ({}));
          throw new Error(
            `Saved locally, but could not commit prompts.json to GitHub: ${err.message || putRes.status}`
          );
        }

        setStatus({
          msg: `Saved! "${title.trim()}" (${promptType}) added to library and pushed to GitHub.`,
          type: 'ok',
        });
      } else {
        setStatus({
          msg: `Saved! "${title.trim()}" added to ${
            promptType === 'video' ? 'Video Prompts' : 'Image Prompts'
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

  return (
    <div className="flex flex-col flex-1 min-h-0 animate-pix-card">
      {/* Frosted Studio Header */}
      <div className="mx-4 mt-3.5 pix-gradient-border rounded-[18px] shadow-lg shadow-black/25">
        <div className="h-[56px] pix-glass-panel rounded-[16.5px] flex items-center justify-between px-3.5">
          <div className="flex items-center gap-3">
            <PixvidLogo size="md" />
            <div>
              <h1 className="text-[16px] font-bold text-white leading-tight font-display">
                Pixvid Lab — Admin
              </h1>
              <p className="text-[11px] text-[#A1A1B5]">
                Add new Image or Video prompts to your library
              </p>
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

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* New Prompt Form */}
        <div className="pix-glass-panel border border-white/10 rounded-[18px] p-[18px] shadow-xl shadow-black/25">
          <h2 className="text-[14px] font-bold text-[#EC4899] mb-3 font-display">New Prompt</h2>

          <label className="block text-[12px] font-bold text-[#9CA3AF] mb-1.5">Prompt Type</label>
          <div className="grid grid-cols-2 gap-2.5 mb-3.5">
            <button
              type="button"
              onClick={() => setPromptType('image')}
              className={`h-[44px] rounded-[12px] flex items-center justify-center gap-2 text-[13px] font-bold transition-all cursor-pointer ${
                promptType === 'image'
                  ? 'pix-button-gradient text-white shadow-md shadow-[#EC4899]/20'
                  : 'bg-[#1C1C28] text-[#9CA3AF] hover:text-white'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              <span>Image Prompt</span>
            </button>
            <button
              type="button"
              onClick={() => setPromptType('video')}
              className={`h-[44px] rounded-[12px] flex items-center justify-center gap-2 text-[13px] font-bold transition-all cursor-pointer ${
                promptType === 'video'
                  ? 'pix-button-gradient text-white shadow-md shadow-[#EC4899]/20'
                  : 'bg-[#1C1C28] text-[#9CA3AF] hover:text-white'
              }`}
            >
              <Video className="w-4 h-4" />
              <span>Video Prompt (Flow)</span>
            </button>
          </div>

          <label className="block text-[12px] font-bold text-[#9CA3AF] mb-1.5">
            Preview Image / Thumbnail
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="w-full bg-[#1C1C28] rounded-[12px] p-3 text-[13px] text-[#9CA3AF] file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#D946EF] file:text-white cursor-pointer"
          />
          {imagePreview && (
            <img
              src={imagePreview}
              alt="Preview"
              className="mt-2.5 max-h-[200px] rounded-[12px] object-contain"
            />
          )}

          <label className="block text-[12px] font-bold text-[#9CA3AF] mt-3.5 mb-1.5">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={
              promptType === 'video'
                ? 'e.g. Golden Sunset Rider Motion'
                : 'e.g. Golden Hour Portrait'
            }
            className="w-full bg-[#1C1C28] rounded-[12px] px-3.5 py-3 text-[14px] text-white placeholder-[#6B7280] focus:outline-none focus:ring-1 focus:ring-[#A855F7]"
          />

          <label className="block text-[12px] font-bold text-[#9CA3AF] mt-3.5 mb-1.5">
            Category
          </label>
          <input
            type="text"
            list="adminCategoryList"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="e.g. Cinematic"
            className="w-full bg-[#1C1C28] rounded-[12px] px-3.5 py-3 text-[14px] text-white placeholder-[#6B7280] focus:outline-none focus:ring-1 focus:ring-[#A855F7]"
          />
          <datalist id="adminCategoryList">
            {categories
              .filter((c) => c !== 'All')
              .map((cat) => (
                <option key={cat} value={cat} />
              ))}
          </datalist>

          <label className="block text-[12px] font-bold text-[#9CA3AF] mt-3.5 mb-1.5">
            Prompt text
          </label>
          <textarea
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            placeholder={
              promptType === 'video'
                ? 'Paste the full Google Flow video generation prompt here...'
                : 'Paste the full image prompt here...'
            }
            rows={4}
            className="w-full bg-[#1C1C28] rounded-[12px] px-3.5 py-3 text-[14px] text-white placeholder-[#6B7280] focus:outline-none focus:ring-1 focus:ring-[#A855F7] resize-y"
          />

          <label className="block text-[12px] font-bold text-[#9CA3AF] mt-3.5 mb-1.5">
            Tags (comma separated)
          </label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="Trending, Cinematic, Google Flow"
            className="w-full bg-[#1C1C28] rounded-[12px] px-3.5 py-3 text-[14px] text-white placeholder-[#6B7280] focus:outline-none focus:ring-1 focus:ring-[#A855F7]"
          />

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full mt-[18px] h-[50px] rounded-[14px] pix-button-gradient text-white text-[15px] font-bold disabled:opacity-50 cursor-pointer"
          >
            {saving ? 'Saving…' : 'Save to prompts.json'}
          </button>

          {status && (
            <div
              className={`mt-3.5 px-3.5 py-3 rounded-[12px] text-[13px] leading-relaxed ${
                status.type === 'ok'
                  ? 'bg-emerald-500/15 text-emerald-400'
                  : status.type === 'err'
                  ? 'bg-red-500/15 text-red-400'
                  : 'bg-[#1C1C28] text-[#9CA3AF]'
              }`}
            >
              {status.msg}
            </div>
          )}
        </div>

        {/* Optional GitHub Connection Settings */}
        <div className="bg-[#15151F] rounded-[16px] p-[18px]">
          <h2 className="text-[14px] font-bold text-[#EC4899] mb-3">
            GitHub Sync (Optional — commits to repo)
          </h2>

          <label className="block text-[12px] font-bold text-[#9CA3AF] mb-1.5">
            GitHub Personal Access Token
          </label>
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="ghp_xxxxxxxxxxxxxxxxxxxx (leave blank for local save only)"
            className="w-full bg-[#1C1C28] rounded-[12px] px-3.5 py-3 text-[14px] text-white placeholder-[#6B7280] focus:outline-none focus:ring-1 focus:ring-[#A855F7]"
          />

          <div className="grid grid-cols-2 gap-2.5 mt-3.5">
            <div>
              <label className="block text-[12px] font-bold text-[#9CA3AF] mb-1.5">
                Repo owner
              </label>
              <input
                type="text"
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                className="w-full bg-[#1C1C28] rounded-[12px] px-3.5 py-3 text-[14px] text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[12px] font-bold text-[#9CA3AF] mb-1.5">
                Repo name
              </label>
              <input
                type="text"
                value={repo}
                onChange={(e) => setRepo(e.target.value)}
                className="w-full bg-[#1C1C28] rounded-[12px] px-3.5 py-3 text-[14px] text-white focus:outline-none"
              />
            </div>
          </div>

          <label className="block text-[12px] font-bold text-[#9CA3AF] mt-3.5 mb-1.5">
            Folder path inside repo
          </label>
          <input
            type="text"
            value={folderPath}
            onChange={(e) => setFolderPath(e.target.value)}
            className="w-full bg-[#1C1C28] rounded-[12px] px-3.5 py-3 text-[14px] text-white focus:outline-none"
          />

          <label className="flex items-center gap-2 text-[12px] text-[#9CA3AF] mt-3 cursor-pointer">
            <input
              type="checkbox"
              checked={rememberToken}
              onChange={(e) => setRememberToken(e.target.checked)}
              className="rounded accent-[#D946EF]"
            />
            <span>Remember my token on this device</span>
          </label>
        </div>
      </div>
    </div>
  );
};

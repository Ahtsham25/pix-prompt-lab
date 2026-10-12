import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface PromptRecord {
  id: string;
  type?: 'image' | 'video';
  category: string;
  title: string;
  prompt_text: string;
  image_url: string;
  tags: string[];
  created_at?: string;
  timestamp?: number;
}

function getPromptTimestamp(prompt: PromptRecord): number {
  if (typeof prompt.timestamp === 'number' && Number.isFinite(prompt.timestamp) && prompt.timestamp > 0) {
    return prompt.timestamp;
  }
  if (prompt.created_at) {
    const parsed = Date.parse(prompt.created_at);
    if (!Number.isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }
  const epochMatch = `${prompt.image_url || ''} ${prompt.id || ''}`.match(/(\d{13})/);
  if (epochMatch && epochMatch[1]) {
    return Number(epochMatch[1]);
  }
  const seqMatch = (prompt.id || '').match(/prompt_0*(\d+)$/i);
  if (seqMatch && seqMatch[1]) {
    return 1700000000000 + Number(seqMatch[1]) * 3600_000;
  }
  return 0;
}

function sortPromptsNewestFirst(list: PromptRecord[]): PromptRecord[] {
  return [...list].sort((a, b) => getPromptTimestamp(b) - getPromptTimestamp(a));
}

function getGeminiClient(customApiKey?: string): GoogleGenAI {
  const apiKey = (customApiKey && customApiKey.trim()) || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('No Gemini API Key provided. Please enter your Gemini API Key in the Admin Panel or set GEMINI_API_KEY in environment.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function getPromptsFilePaths(): string[] {
  const rootPath = path.join(__dirname, 'prompts.json');
  const subPath = path.join(__dirname, 'pixprompt-app', 'prompts.json');
  const paths: string[] = [];
  if (fs.existsSync(rootPath)) paths.push(rootPath);
  if (fs.existsSync(subPath)) paths.push(subPath);
  if (paths.length === 0) paths.push(rootPath);
  return paths;
}

function getImagesDirPaths(): string[] {
  const rootImages = path.join(__dirname, 'images');
  const subImages = path.join(__dirname, 'pixprompt-app', 'images');
  const dirs: string[] = [];
  if (fs.existsSync(rootImages)) dirs.push(rootImages);
  if (fs.existsSync(subImages)) dirs.push(subImages);
  if (dirs.length === 0) {
    fs.mkdirSync(rootImages, { recursive: true });
    dirs.push(rootImages);
  }
  return dirs;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '20mb' }));

  // Serve images from /images and /pixprompt-app/images
  const serveImage = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const requestedFile = path.basename(req.path);
    const dirs = getImagesDirPaths();
    for (const dir of dirs) {
      const fullPath = path.join(dir, requestedFile);
      if (fs.existsSync(fullPath)) {
        return res.sendFile(fullPath);
      }
      if (requestedFile === 'prompt_1791178917507.jpg') {
        const altPath = path.join(dir, 'prompt_1791179340233.jpg');
        if (fs.existsSync(altPath)) {
          return res.sendFile(altPath);
        }
      }
    }
    next();
  };

  app.use('/images', serveImage);
  app.use('/pixprompt-app/images', serveImage);

  // Serve standalone admin.html when requested directly
  app.get(['/admin.html', '/pixprompt-app/admin.html'], (_req, res, next) => {
    const subAdmin = path.join(__dirname, 'pixprompt-app', 'admin.html');
    const rootAdmin = path.join(__dirname, 'admin.html');
    if (fs.existsSync(rootAdmin)) return res.sendFile(rootAdmin);
    if (fs.existsSync(subAdmin)) return res.sendFile(subAdmin);
    next();
  });

  // GET /api/prompts - returns synchronized prompts.json data sorted strictly newest-first
  app.get('/api/prompts', (_req, res) => {
    try {
      const [primaryPath] = getPromptsFilePaths();
      if (!fs.existsSync(primaryPath)) {
        return res.json({
          categories: ['Trending', 'Cinematic', 'Fantasy', 'Portrait', 'Product', 'Nature'],
          prompts: [],
          video_prompts: [],
        });
      }
      const raw = fs.readFileSync(primaryPath, 'utf-8');
      const data = JSON.parse(raw);
      data.prompts = sortPromptsNewestFirst(data.prompts || []);
      data.video_prompts = sortPromptsNewestFirst(data.video_prompts || []);
      return res.json(data);
    } catch (err) {
      console.error('Error reading prompts.json:', err);
      return res.status(500).json({ error: 'Failed to load prompts.json' });
    }
  });

  app.get(['/prompts.json', '/pixprompt-app/prompts.json'], (_req, res) => {
    const [primaryPath] = getPromptsFilePaths();
    if (fs.existsSync(primaryPath)) {
      return res.sendFile(primaryPath);
    }
    return res.status(404).json({ error: 'prompts.json not found' });
  });

  // POST /api/admin/analyze-image - Uses Gemini Vision (gemini-3.8-flash) to auto-generate Title, Category, Prompt Text & Tags
  app.post('/api/admin/analyze-image', async (req, res) => {
    try {
      const { imageBase64, mimeType, promptType, categories, apiKey } = req.body;
      if (!imageBase64) {
        return res.status(400).json({ error: 'imageBase64 is required for Gemini analysis.' });
      }

      const isVideo = promptType === 'video';
      const availableCategories =
        Array.isArray(categories) && categories.length > 0
          ? categories.filter((c: string) => c !== 'All').join(', ')
          : 'Trending, Cinematic, Fantasy, Portrait, Product, Nature';

      const instruction = isVideo
        ? `Analyze this uploaded preview image/GIF and generate a production-grade AI VIDEO generation prompt specifically designed for Google Flow.
Describe the scene's dynamic camera movement (e.g. slow-motion tracking shot, gimbal orbit, dolly push-in, crane ascent), subject motion, atmospheric physics (wind, particles, smoke, light flares), lighting, lens characteristics, and cinematic mood so a user can recreate this exact visual as a high-definition cinematic video in Google Flow.
Also provide a catchy 3-6 word Title, choose the best matching Category from [${availableCategories}], and provide 4-6 relevant Tags.`
        : `Analyze this uploaded image and generate a comprehensive, ultra-detailed AI IMAGE generation prompt designed for Google Gemini and ChatGPT.
Describe the subject's pose, attire, lighting direction, color palette, environment, camera angle, lens depth-of-field, and realistic textures in rich detail. If a person is present, instruct the AI to preserve the reference subject's natural facial identity and proportions while recreating the exact scene, style, and lighting.
Also provide a catchy 3-6 word Title, choose the best matching Category from [${availableCategories}], and provide 4-6 relevant Tags.`;

      const ai = getGeminiClient(apiKey);
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: mimeType || 'image/jpeg',
                data: imageBase64,
              },
            },
            {
              text: instruction,
            },
          ],
        },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: {
                type: Type.STRING,
                description: 'Concise, evocative 3 to 6 word title for this prompt.',
              },
              category: {
                type: Type.STRING,
                description: `Best matching category from: ${availableCategories}`,
              },
              prompt_text: {
                type: Type.STRING,
                description: 'Detailed, production-ready AI generation prompt.',
              },
              tags: {
                type: Type.ARRAY,
                items: {
                  type: Type.STRING,
                },
                description: '4 to 6 descriptive tags.',
              },
            },
            required: ['title', 'category', 'prompt_text', 'tags'],
          },
        },
      });

      const rawText = response.text?.trim() || '{}';
      const parsed = JSON.parse(rawText);

      return res.json({
        ok: true,
        title: parsed.title || '',
        category: parsed.category || 'Cinematic',
        prompt_text: parsed.prompt_text || '',
        tags: Array.isArray(parsed.tags) ? parsed.tags : [],
      });
    } catch (err: unknown) {
      console.error('Gemini analyze-image error:', err);
      const message = err instanceof Error ? err.message : 'Failed to analyze image with Gemini';
      return res.status(500).json({ error: message });
    }
  });

  // POST /api/prompts - add a new image or video prompt with exact Date & Time and sort newest-first
  app.post('/api/prompts', (req, res) => {
    try {
      const { title, category, prompt_text, tags, type, imageBase64, imageExt, imageUrl } =
        req.body;
      if (!title || !category || !prompt_text) {
        return res.status(400).json({ error: 'Title, category, and prompt_text are required.' });
      }

      const nowMs = Date.now();
      const nowIso = new Date(nowMs).toISOString();
      const promptType = type === 'video' ? 'video' : 'image';
      const filePaths = getPromptsFilePaths();
      const primaryPath = filePaths[0];
      const raw = fs.existsSync(primaryPath)
        ? fs.readFileSync(primaryPath, 'utf-8')
        : JSON.stringify({
            categories: ['Trending', 'Cinematic', 'Fantasy', 'Portrait', 'Product', 'Nature'],
            prompts: [],
            video_prompts: [],
          });
      const data = JSON.parse(raw);

      let finalImageUrl = imageUrl || '/images/prompt1.jpg';
      if (imageBase64) {
        const ext = (imageExt || 'jpg').replace(/[^a-z0-9]/gi, '').toLowerCase() || 'jpg';
        const filename = `prompt_${nowMs}.${ext}`;
        const imgBuffer = Buffer.from(imageBase64, 'base64');
        for (const dir of getImagesDirPaths()) {
          fs.writeFileSync(path.join(dir, filename), imgBuffer);
        }
        finalImageUrl = `/images/${filename}`;
      }

      const slug = String(title)
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
        .slice(0, 40);
      const prefix = promptType === 'video' ? 'vid' : 'prompt';
      const newId = `${prefix}_${slug || nowMs}_${nowMs}`;

      const parsedTags: string[] = Array.isArray(tags)
        ? tags
        : typeof tags === 'string' && tags.trim()
        ? tags.split(',').map((t: string) => t.trim()).filter(Boolean)
        : [];

      const newEntry: PromptRecord = {
        id: newId,
        type: promptType,
        category: String(category).trim(),
        title: String(title).trim(),
        prompt_text: String(prompt_text).trim(),
        image_url: finalImageUrl,
        tags: parsedTags,
        created_at: nowIso,
        timestamp: nowMs,
      };

      if (promptType === 'video') {
        data.video_prompts = sortPromptsNewestFirst([
          newEntry,
          ...(Array.isArray(data.video_prompts) ? data.video_prompts : []),
        ]);
      } else {
        data.prompts = sortPromptsNewestFirst([
          newEntry,
          ...(Array.isArray(data.prompts) ? data.prompts : []),
        ]);
      }

      data.categories = Array.isArray(data.categories) ? data.categories : [];
      if (
        !data.categories.some((c: string) => c.toLowerCase() === newEntry.category.toLowerCase())
      ) {
        data.categories.push(newEntry.category);
      }

      const serialized = JSON.stringify(data, null, 2);
      for (const fp of filePaths) {
        fs.writeFileSync(fp, serialized, 'utf-8');
      }

      return res.json({ ok: true, prompt: newEntry, data });
    } catch (err) {
      console.error('Error saving prompt:', err);
      return res.status(500).json({ error: 'Failed to save prompt' });
    }
  });

  // DELETE /api/prompts/:id - remove an image or video prompt from prompts.json
  app.delete('/api/prompts/:id', (req, res) => {
    try {
      const targetId = req.params.id;
      const filePaths = getPromptsFilePaths();
      const primaryPath = filePaths[0];
      if (!fs.existsSync(primaryPath)) {
        return res.status(404).json({ error: 'prompts.json not found' });
      }
      const data = JSON.parse(fs.readFileSync(primaryPath, 'utf-8'));
      data.prompts = sortPromptsNewestFirst(
        (data.prompts || []).filter((p: { id: string }) => p.id !== targetId)
      );
      data.video_prompts = sortPromptsNewestFirst(
        (data.video_prompts || []).filter((p: { id: string }) => p.id !== targetId)
      );

      const serialized = JSON.stringify(data, null, 2);
      for (const fp of filePaths) {
        fs.writeFileSync(fp, serialized, 'utf-8');
      }
      return res.json({ ok: true, data });
    } catch (err) {
      console.error('Error deleting prompt:', err);
      return res.status(500).json({ error: 'Failed to delete prompt' });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Pixvid Lab server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();

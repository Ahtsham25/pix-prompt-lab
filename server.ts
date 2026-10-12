import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

  app.use(express.json({ limit: '15mb' }));

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

  // GET /api/prompts - returns synchronized prompts.json data
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

  // POST /api/prompts - add a new image or video prompt and keep both JSON files synchronized
  app.post('/api/prompts', (req, res) => {
    try {
      const { title, category, prompt_text, tags, type, imageBase64, imageExt, imageUrl } =
        req.body;
      if (!title || !category || !prompt_text) {
        return res.status(400).json({ error: 'Title, category, and prompt_text are required.' });
      }

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
        const filename = `prompt_${Date.now()}.${ext}`;
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
      const newId = `${prefix}_${slug || Date.now()}_${Date.now().toString().slice(-5)}`;

      const parsedTags: string[] = Array.isArray(tags)
        ? tags
        : typeof tags === 'string' && tags.trim()
        ? tags.split(',').map((t: string) => t.trim()).filter(Boolean)
        : [];

      const newEntry = {
        id: newId,
        type: promptType,
        category: String(category).trim(),
        title: String(title).trim(),
        prompt_text: String(prompt_text).trim(),
        image_url: finalImageUrl,
        tags: parsedTags,
      };

      if (promptType === 'video') {
        data.video_prompts = Array.isArray(data.video_prompts)
          ? [newEntry, ...data.video_prompts]
          : [newEntry];
      } else {
        data.prompts = Array.isArray(data.prompts) ? [newEntry, ...data.prompts] : [newEntry];
      }

      data.categories = Array.isArray(data.categories) ? data.categories : [];
      if (!data.categories.some((c: string) => c.toLowerCase() === newEntry.category.toLowerCase())) {
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

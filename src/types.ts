export interface Prompt {
  id: string;
  category: string;
  title: string;
  prompt_text: string;
  image_url: string;
  tags: string[];
  type?: 'image' | 'video';
  created_at?: string;
  timestamp?: number;
}

export interface PromptData {
  categories: string[];
  prompts: Prompt[];
  video_prompts?: Prompt[];
}

export enum NavTab {
  EXPLORE = 'EXPLORE',
  VIDEOS = 'VIDEOS',
  FAVORITE = 'FAVORITE',
  PRIVACY = 'PRIVACY',
}

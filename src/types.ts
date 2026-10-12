export interface Prompt {
  id: string;
  type?: 'image' | 'video';
  category: string;
  title: string;
  prompt_text: string;
  image_url: string;
  tags: string[];
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
  ADMIN = 'ADMIN',
  PRIVACY = 'PRIVACY',
}

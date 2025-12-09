export interface FacebookStory {
  fileType: string;
  mediaUrl: string;
  filePath: string;
  isStory: boolean;
  storyMediaType: 'video' | 'photo';
}

export interface FacebookPage {
  id: string;
  name: string;
  page_token: string;
  category?: string;
  link?: string;
}

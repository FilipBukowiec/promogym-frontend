export interface FacebookStory {
    mediaType: 'photo' | 'video';
    mediaUrl: string;
}


export interface FacebookPage {
    id: string;
    name: string;
    page_token: string;
    category?: string;
    link?: string

}
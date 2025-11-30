export interface FacebookStory {
    postId: string;
    status: string;
    medaType: 'photo' | 'video';
    mediaUrl: string;
    storyUrl: string;
}


export interface FacebookPage {
    id: string;
    name: string;
    page_token: string;
    category?: string;

}
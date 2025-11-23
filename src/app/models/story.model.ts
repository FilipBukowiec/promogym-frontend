export interface Story {
    postId: string;
    status: string;
    medaType: 'photo' | 'video';
    mediaUrl: string;
    storyUrl: string;
}
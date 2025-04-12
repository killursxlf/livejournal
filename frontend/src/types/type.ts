export interface CurrentUser {
    id: string;
    name: string;
    username: string;
    avatar: string; 
    token?: string;
  }
  
export interface CommunityMember {
    userId: string;
    role: "ADMIN" | "MODERATOR" | "MEMBER";
    joinedAt: string;
    notificationsEnabled: boolean;
    user: CurrentUser;
}

export interface CommentData {
    id: string;
    content: string;
    createdAt: string;
    author: {
      id: string;
      username: string;
      name: string;
      avatar?: string;
    };
  }
  
export interface PostTag {
    postId: string;
    tagId: string;
    tag: {
      id: string;
      name: string;
    };
}
  
export interface Post {
    id: string;
    title: string;
    content: string;
    createdAt: string;
    author: {
      id: string,
      username: string;
      name: string;
      avatar?: string;
    };
    postTags?: PostTag[];
    likeCount: number;
    isLiked: boolean;
    commentCount: number;
    comments?: CommentData[];
    isSaved: boolean;
    community?: {
      avatar: string;
      name: string;
      id: string;
    };
    publicationMode: "USER" | "COMMUNITY" | undefined;
}
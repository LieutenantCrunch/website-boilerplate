declare namespace WebsiteBoilerplate {
    export interface Post {
        canDelete: Boolean;
        lastEditedOn: Date | null;
        commentCount: number;
        postedOn: Date;
        postText: string | null;
        postTitle: string | null;
        postType: number;
        postedBy: PostedByDetails;
        uniqueId: string;
        postFiles: PostFileInfo[] | undefined;
        commentPage?: number;
        postComments?: PostComment[];
    }

    export interface PostComment {
        canDelete: Boolean;
        commentText: string;
        parentComment?: {
            commentText: string;
            postedBy: {
                displayName: string;
                displayNameIndex: number;
            };
            uniqueId: string;
        }
        postedBy: PostedByDetails;
        uniqueId: string;
        childComments?: PostComment[];
    }
    
    export interface PostFileInfo {
        fileName: string;
        mimeType: string;
        originalFileName: string;
        size: number;
        thumbnailFileName?: string;
    }

    export interface PostNotification {
        commentId?: string;
        createdOn: Date;
        message: string;
        postId: string;
        status: number;
        triggeredBy?: string[];
        type: number;
        uniqueId: string;
    }

    export interface PostedByDetails {
        displayName: string;
        displayNameIndex: number;
        pfpSmall: string;
        profileName: string;
        uniqueId: string;
    }

    export interface RemoveUserConnectionResults {
        success: Boolean;
        wasMutual: Boolean;
    }

    export interface UpdateUserConnectionResults {
        actionTaken: number;
        userConnection: UserDetails;
        success: Boolean;
    }

    export interface UserConnectionDetails {
        [id: string]: UserDetails;
    }

    export interface UserConnectionTypeDictionary {
        [id: string]: boolean;
    }

    export interface UserDetails {
        allowPublicAccess?: Boolean;
        connectedToCurrentUser?: Boolean;
        connectionTypes?: UserConnectionTypeDictionary;
        email?: string;
        displayName: string;
        displayNameIndex: number;
        isBlocked: Boolean;
        isMutual?: Boolean;
        pfp: string;
        pfpSmall: string;
        profileName: string;
        roles?: string[];
        uniqueId: string;
        hasUnseenPostNotifications?: Boolean;
        preferences?: UserPreferences;
    }

    export interface UserPreferences {
        customAudience: string | undefined;
        feedFilter: number;
        mediaVolume: number;
        postAudience: number;
        postType: number;
        showMyPostsInFeed: Boolean;
        startPage: string | undefined;
    }

    export interface UserSearchResults {
        currentPage: number;
        total: number;
        users: UserDetails[];
    }
}

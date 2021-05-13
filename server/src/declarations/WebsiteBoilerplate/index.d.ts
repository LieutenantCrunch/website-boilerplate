declare namespace WebsiteBoilerplate {
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
    }

    export interface UserSearchResults {
        currentPage: number;
        total: number;
        users: UserDetails[];
    }

    export interface UserConnectionTypeDictionary {
        [id: string]: boolean;
    }

    export interface UserConnectionDetails {
        [id: string]: UserDetails;
    }

    export interface UpdateUserConnectionResults {
        actionTaken: number;
        userConnection: UserDetails;
        success: Boolean;
    }

    export interface RemoveUserConnectionResults {
        success: Boolean;
        wasMutual: Boolean;
    }

    export interface Post {
        lastEditedOn: Date | null;
        commentCount: number;
        postedOn: Date;
        postText: string | null;
        postTitle: string | null;
        postType: number;
        postedBy: {
            displayName: string;
            displayNameIndex: number;
            pfpSmall: string;
            profileName: string;
            uniqueId: string;
        };
        uniqueId: string;
        postFiles: PostFileInfo[] | undefined;
        commentPage?: number;
        postComments?: PostComment[];
    }

    export interface PostFileInfo {
        fileName: string;
        mimeType: string;
        originalFileName: string;
        size: number;
        thumbnailFileName?: string;
    }

    export interface PostComment {
        commentText: string;
        parentComment?: {
            commentText: string;
            postedBy: {
                displayName: string;
                displayNameIndex: number;
            };
            uniqueId: string;
        }
        postedBy: {
            displayName: string;
            displayNameIndex: number;
            pfpSmall: string;
            profileName: string;
            uniqueId: string;
        };
        uniqueId: string;
        childComments?: PostComment[];
    }
}

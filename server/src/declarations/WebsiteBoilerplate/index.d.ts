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
}
declare namespace WebsiteBoilerplate {
    export interface ProfileInfo {
        displayName: string;
        displayNameIndex: number;
        pfpSmall: string;
        uniqueId: string;
        connectionTypes?: UserConnectionTypeDictionary;
    }

    export interface UserDetails {
        connectedToCurrentUser?: Boolean;
        connectionTypes?: UserConnectionTypeDictionary;
        email?: string;
        displayName: string;
        displayNameIndex: number;
        isBlocked: Boolean;
        isMutual: Boolean;
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
}
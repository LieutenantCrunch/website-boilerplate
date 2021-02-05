declare namespace WebsiteBoilerplate {
    export interface ProfileInfo {
        displayName: string;
        displayNameIndex: number;
        pfpSmall: string;
        uniqueId: string;
        connectionTypes?: UserConnectionTypeDictionary;
    }

    export interface UserDetails {
        email?: string;
        displayName: string;
        displayNameIndex: number;
        pfp: string;
        pfpSmall: string;
        roles: string[];
        uniqueId: string;
        profileName: string;
        connectionTypes?: UserConnectionTypeDictionary;
        connectedToCurrentUser?: Boolean;
    }

    export interface UserSearchResults {
        currentPage: number;
        total: number;
        users: {
            displayName: string;
            displayNameIndex: number;
            uniqueId: string;
            pfpSmall: string;
            profileName: string;
        }[];
    }

    export interface UserConnectionTypeDictionary {
        [id: string]: boolean;
    }

    export interface UserConnectionDetails {
        [id: string]: {
            displayName: string;
            displayNameIndex: number;
            pfpSmall: string
            isMutual: Boolean;
            connectionTypes: UserConnectionTypeDictionary;
            profileName: string;
        };
    }
}
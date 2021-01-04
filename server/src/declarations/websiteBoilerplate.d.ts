declare namespace WebsiteBoilerplate {
    export interface UserDetails {
        email?: string,
        displayName: string,
        displayNameIndex: number,
        pfp: string,
        roles: string[],
        uniqueID: string,
        connectionTypes?: UserConnectionTypeDictionary
    }

    export interface UserSearchResults {
        currentPage: number,
        total: number,
        users: {
            displayName: string,
            displayNameIndex: number,
            uniqueID: string,
            pfpSmall: string
        }[]
    }

    export interface UserConnectionTypeDictionary {
        [id: string]: boolean
    }

    export interface UserConnectionDetails {
        [id: string]: {
            displayName: string,
            displayNameIndex: number,
            pfp: string
            isMutual: Boolean,
            connectionTypes: UserConnectionTypeDictionary
        }
    }
}
declare namespace WebsiteBoilerplate {
    export interface UserDetails {
        email: string,
        displayName: string,
        displayNameIndex: number,
        pfp: string,
        roles: string[],
        uniqueID: string
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

    export interface UserConnectionDetails {
        [id: string]: {
            displayName: string,
            displayNameIndex: number,
            pfp: string
            isMutual: Boolean,
            uniqueID: string
        }
    }
}
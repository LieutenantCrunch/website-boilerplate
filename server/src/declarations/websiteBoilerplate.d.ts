declare namespace WebsiteBoilerplate {
    export interface UserDetails {
        email: string,
        displayName: string,
        displayNameIndex: number,
        pfp: string,
        roles: string[]
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
}
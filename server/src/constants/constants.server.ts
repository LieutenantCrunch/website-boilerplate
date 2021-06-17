export const LISTEN_PORT: number = 3000; // The port the server will listen on for http
export const LISTEN_PORT_SECURE: number = 3443; // The port the server will listen on for https

export const JWT_EXPIRATION_DAYS: number = 30;
export const RPT_EXPIRATION_MINUTES: number = 5; // Reset Password Token Expiration
export const RPT_MAX_ACTIVE_TOKENS: number = 5; // The maximum allowable number of active Reset Password Tokens

// All values are in milliseconds. Note that cached values can be manually cleared, so they can be set to a fairly high value
export const CACHE_DURATIONS = Object.freeze({
    CONNECTION_TYPES: 12 * 60 * 60 * 1000, // Connection types won't change very often
    USER_BY_ID: 12 * 60 * 60 * 1000, // This will only change if a user is deleted
    USER_BY_PROFILE_NAME: 12 * 60 * 60 * 1000, // This will only change if a user is deleted
    USER_BY_UNIQUE_ID: 12 * 60 * 60 * 1000, // This will only change if a user is deleted
    USER_BLOCKS: 12 * 60 * 60 * 1000, // This will only change if a user is unblocked
    USER_PREFERENCE_START_PAGE: 24 * 60 * 60 * 1000 // This will get invalidated if they change it, so it can be long
});

export const CACHE_KEY_CONNECTION_TYPES_DICT: string = 'db.connectionTypesDict'; // The connection types dictionary used by dbMethods
export const CACHE_KEY_CONNECTION_TYPES_ARRAY: string = 'db.connectionTypesArray'; // The connection types array used by dbMethods

export const DB_USER_FETCH_PAGE_SIZE: number = 5; // The number of users to fetch at one time
export const DB_FEED_FETCH_PAGE_SIZE: number = 5; // The number of posts to fetch at one time for feeds
export const DB_COMMENT_FETCH_PAGE_SIZE: number = 2; // The number of post comments to fetch at one time

export const INVALIDATE_TOKEN_MODE = Object.freeze({
    SPECIFIC: 0,
    OTHERS: 1,
    ALL: 2
});

export const EMAIL_FROM: string = '"Website Boilerplate" <test@test.test>';

export const VERIFY_TOKEN_RESULTS = Object.freeze({
    VALID: 0,
    INVALID: 1,
    EXPIRED: 2,
    ERROR: 3
});

export const READ_NOTIFICATION_EXPIRATION_DAYS = 7; // The number of days read notifications will stick around before being auto-purged

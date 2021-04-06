export const JWT_EXPIRATION_DAYS: number = 30;
export const RPT_EXPIRATION_MINUTES: number = 5; // Reset Password Token Expiration
export const RPT_MAX_ACTIVE_TOKENS: number = 5; // The maximum allowable number of active Reset Password Tokens
export const CONNECTION_TYPES_CACHE_HOURS: number = 6; // The number of hours connection types will be cached for since they won't change very often

export const CACHE_KEY_CONNECTION_TYPES_DICT: string = 'db.connectionTypesDict'; // The connection types dictionary used by databaseHelper

export const DB_USER_FETCH_PAGE_SIZE: number = 5; // The number of users to fetch at one time
export const DB_FEED_FETCH_PAGE_SIZE: number = 20; // The number of posts to fetch at one time for feeds

export const INVALIDATE_TOKEN_MODE = Object.freeze({
    SPECIFIC: 0,
    OTHERS: 1,
    ALL: 2
});

export const EMAIL_FROM: string = '"Website Boilerplate" <test@test.test>';
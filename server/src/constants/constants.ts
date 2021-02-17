export const BASE_URL: string = 'http://localhost:3000/';
export const BASE_API_URL: string = `${BASE_URL}api/`;
export const BASE_USERS_URL: string = `${BASE_URL}u/`;

export const API_PATH_AUTH: string = 'auth/';
export const API_PATH_USERS: string = 'users/';

export const JWT_EXPIRATION_DAYS: number = 30;
export const RPT_EXPIRATION_MINUTES: number = 5; // Reset Password Token Expiration
export const RPT_MAX_ACTIVE_TOKENS: number = 5; // The maximum allowable number of active Reset Password Tokens
export const CONNECTION_TYPES_CACHE_HOURS: number = 6; // The number of hours connection types will be cached for since they won't change very often

export const DISPLAY_NAME_CHANGE_DAYS: number = 30; // The number of days a user must wait between display name changes
export const PROFILE_NAME_REGEX_PATTERN: string = "^[\-\._~]*(?:[a-z0-9][\-\._~]*){3,}$";
export const PROFILE_NAME_REGEX_FLAGS: string = "i";
export const PROFILE_NAME_REGEX: RegExp = new RegExp(PROFILE_NAME_REGEX_PATTERN, PROFILE_NAME_REGEX_FLAGS);

export const CACHE_KEY_CONNECTION_TYPES_DICT: string = 'db.connectionTypesDict'; // The connection types dictionary used by databaseHelper

export const DB_USER_FETCH_PAGE_SIZE: number = 5; // The number of users to fetch at one time

export const INVALIDATE_TOKEN_MODE = {
    SPECIFIC: 0,
    OTHERS: 1,
    ALL: 2
};

Object.freeze(INVALIDATE_TOKEN_MODE);

export const UPDATE_USER_CONNECTION_ACTIONS = {
    NONE: 0,
    ADDED: 1,
    UPDATED: 2
};

Object.freeze(UPDATE_USER_CONNECTION_ACTIONS);

export const EMAIL_FROM: string = '"Website Boilerplate" <test@test.test>';

export const BASE_URL: string = 'http://localhost:3000/';
export const BASE_API_URL: string = `${BASE_URL}api/`;

export const API_PATH_AUTH: string = 'auth/';
export const API_PATH_USERS: string = 'users/';

export const JWT_EXPIRATION_DAYS: number = 30;
export const RPT_EXPIRATION_MINUTES: number = 5; // Reset Password Token Expiration
export const RPT_MAX_ACTIVE_TOKENS: number = 5; // The maximum allowable number of active Reset Password Tokens

export const INVALIDATE_TOKEN_MODE = {
    SPECIFIC: 0,
    OTHERS: 1,
    ALL: 2
};

Object.freeze(INVALIDATE_TOKEN_MODE);

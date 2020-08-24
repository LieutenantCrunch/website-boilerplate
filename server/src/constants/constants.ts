export const BASE_API_URL: string = 'http://localhost:3000/api/';

export const API_PATH_AUTH: string = 'auth/';
export const API_PATH_USERS: string = 'users/';

export const JWT_EXPIRATION_DAYS: number = 30;

export const INVALIDATE_TOKEN_MODE = {
    SPECIFIC: 0,
    OTHERS: 1,
    ALL: 2
};

Object.freeze(INVALIDATE_TOKEN_MODE);

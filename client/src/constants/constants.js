export const BASE_API_URL = 'http://localhost:3000/api/';

// Top level api paths
export const API_PATH_AUTH = 'auth/';
export const API_PATH_USERS = 'users/';
export const API_PATH_POSTS = 'posts/';

// Users api subpaths
export const API_PATH_PFP = 'pfp/';
export const API_PATH_PUBLIC = 'public/';

// Static paths
export const STATIC_IMAGE_PATH = '/i/s/';

// Frequently used static images
export const STATIC_IMAGES = Object.freeze({
    PFP_DEFAULT: STATIC_IMAGE_PATH + 'pfpDefault.svgz',
    WAVEFORM: STATIC_IMAGE_PATH + 'waveform.png'
});

// User Search Status
export const USER_SEARCH_STATUS = Object.freeze({
    NO_RESULTS: 0, /* No results from the server */
    RESULTS: 1, /* Results from the server, does not guarantee users were returned */
    CANCELLED: 2 /* The request to the server was cancelled */
});

export const USER_SEARCH_RESULTS = Object.freeze({
    CACHE_LENGTH: 1 /* Number of minutes to retain fetched results before grabbing new ones */
});

export const USER_SEARCH_TRIGGER = Object.freeze({
    KEYBOARD: 0,
    MOUSE: 1
});

export const UPDATE_USER_CONNECTION_ACTIONS = Object.freeze({
    NONE: 0,
    ADDED: 1,
    UPDATED: 2
});

export const POST_TYPES = Object.freeze({
    TEXT: 0,
    IMAGE: 1,
    VIDEO: 2,
    AUDIO: 3
});
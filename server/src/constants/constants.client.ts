// Static Paths
export const BASE_URL: string = 'http://localhost:3000/';
export const BASE_API_URL: string = `${BASE_URL}api/`;
export const BASE_USERS_URL: string = `${BASE_URL}u/`;
export const STATIC_IMAGE_PATH = '/i/s/';

// API Paths
export const API_PATH_AUTH: string = 'auth/';
export const API_PATH_USERS: string = 'users/';
export const API_PATH_POSTS: string = 'posts/';

// Users api subpaths
export const API_PATH_PFP = 'pfp/';
export const API_PATH_PUBLIC = 'public/';

// Frequently used static images
export const STATIC_IMAGES = Object.freeze({
    PFP_DEFAULT: STATIC_IMAGE_PATH + 'pfpDefault.svgz',
    WAVEFORM: STATIC_IMAGE_PATH + 'waveform.png'
});

// Generic Constants
export const MAX_UPLOAD_SIZE = 128; /* 128 Megabytes */
export const AUDIO_WAVEFORM_DIMS = Object.freeze({ /* Dimensions of Audio Waveform images */
    WIDTH: 640,
    HEIGHT: 120
});

// User Settings
export const DISPLAY_NAME_CHANGE_DAYS: number = 30; // The number of days a user must wait between display name changes
export const PROFILE_NAME_REGEX_PATTERN: string = "^[\-\._~]*(?:[a-z0-9][\-\._~]*){3,}$";
export const PROFILE_NAME_REGEX_FLAGS: string = "i";
export const PROFILE_NAME_REGEX: RegExp = new RegExp(PROFILE_NAME_REGEX_PATTERN, PROFILE_NAME_REGEX_FLAGS);

// User Search
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

// Connections
export const UPDATE_USER_CONNECTION_ACTIONS = Object.freeze({
    NONE: 0,
    ADDED: 1,
    UPDATED: 2
});

// Posts
export const POST_TYPES = Object.freeze({
    TEXT: 0,
    IMAGE: 1,
    VIDEO: 2,
    AUDIO: 3,
    ALL: 1000
});

export const POST_TYPES_NAMES = Object.freeze({
    [POST_TYPES.TEXT]: 'Text Posts',
    [POST_TYPES.IMAGE]: 'Image Posts',
    [POST_TYPES.VIDEO]: 'Video Posts',
    [POST_TYPES.AUDIO]: 'Audio Posts',
    [POST_TYPES.ALL]: 'All Posts'
});

export const POST_AUDIENCES = Object.freeze({
    CONNECTIONS: 0,
    EVERYONE: 1,
    CUSTOM: 2
});

export const SOCKET_EVENTS = Object.freeze({
    NOTIFY_USER: Object.freeze({
        NEW_COMMENT: 'newComment'
    })
});

export const NOTIFICATION_STATUS = Object.freeze({
    READ: 0,
    UNREAD: 1,
    SEEN_ONCE: 2,
    UNSEEN: 3
});

export const NOTIFICATION_TYPES = Object.freeze({
    COMMENT: 0,
    COMMENT_REPLY: 1
});

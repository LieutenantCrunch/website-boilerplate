export const isNullOrWhiteSpaceOnly = (text) => (!text || text.trim().replace(/\u{AD}/giu, '').length === 0);

export const capitalizeString = (s) => {
    if (typeof s !== 'string') {
        return '';
    }

    return s.charAt(0).toUpperCase() + s.slice(1);
};

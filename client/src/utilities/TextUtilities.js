export const isNullOrWhiteSpaceOnly = (text) => (!text || text.trim().replace(/\u{AD}/giu, '').length === 0);

export const capitalizeString = (s) => {
    if (typeof s !== 'string') {
        return '';
    }

    return s.charAt(0).toUpperCase() + s.slice(1);
};

export const adjustGUIDDashes = (guid, add = false) => {
    if (add) {
        if (guid.length === 32) {
            return `${guid.substring(0, 8)}-${guid.substring(8, 12)}-${guid.substring(12, 16)}-${guid.substring(16, 20)}-${guid.substring(20)}`;
        }

        return guid;
    }
    else {
        return guid.replace(/\-/g, '');
    }
};

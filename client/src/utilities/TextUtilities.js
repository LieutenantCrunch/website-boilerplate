import * as Constants from '../constants/constants';

export const isNullOrWhiteSpaceOnly = (text) => (!text || text.trim().replace(/\u{AD}/giu, '').length === 0);

export const capitalizeString = (s) => {
    if (typeof s !== 'string') {
        return '';
    }

    return s.charAt(0).toUpperCase() + s.slice(1);
};

/**
 * Takes a GUID and adds or removes dashes from it
 * @param {string} guid A valid GUID with or without dashes
 * @param {Boolean} add If true, dashes will be added to the GUID if necessary, else they will be removed
 * @returns The same GUID with or without dashes as specified by the add paramter or undefined if the GUID is not valid
 */
 export const adjustGUIDDashes = (guid, add = false) => {
    if (guid) {
        let matchResults = guid.match(Constants.GUID_REGEX_DASH_OPTIONAL);

        if (matchResults && matchResults.length === 6) {
            // The full match is stored at index 0
            if (add) {
                return `${matchResults[1]}-${matchResults[2]}-${matchResults[3]}-${matchResults[4]}-${matchResults[5]}`;
            }
            else {
                return `${matchResults[1]}${matchResults[2]}${matchResults[3]}${matchResults[4]}${matchResults[5]}`;
            }
        }
    }

    return undefined;
};

/**
 * Takes a string and determines if it's a valid GUID containing dashes
 * @param {string} guid A string that could potentially be a dashed GUID
 * @returns true if the string is a dashed guid, else false
 */
export const isDashedGUID = (guid) => {
    if (guid) {
        return Constants.GUID_REGEX.test(guid);
    }

    return false;
};

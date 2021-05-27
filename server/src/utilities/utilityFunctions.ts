import * as ClientConstants from '../constants/constants.client';

// Source: https://www.w3schools.com/JS/js_random.asp
export const randomInt = (min: number, max: number): number => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const isNullOrWhiteSpaceOnly = (text: string | null | undefined): Boolean => (!text || text.trim().replace(/\u{AD}/giu, '').length === 0);

/**
 * Takes a GUID and adds or removes dashes from it
 * @param {string} guid A valid GUID with or without dashes
 * @param {Boolean} add If true, dashes will be added to the GUID if necessary, else they will be removed
 * @returns The same GUID with or without dashes as specified by the add paramter or undefined if the GUID is not valid
 */
export const adjustGUIDDashes = (guid: string | undefined, add: Boolean = false): string | undefined => {
    if (guid) {
        let matchResults: string[] | null = guid.match(ClientConstants.GUID_REGEX_DASH_OPTIONAL);

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

export const dateFromInput = (input: string | number | Date | null | undefined): Date | undefined => {
    try {
        switch (typeof input) {
            case 'number': {
                return new Date(input)
            }
            case 'string': {
                if (/^[0-9]+$/.test(input)) {
                    let numberValue: number = Number(input);

                    if (!isNaN(numberValue)) {
                        return new Date(numberValue);
                    }
                }
                else {
                    return new Date(Date.parse(input));
                }

                break;
            }
            case 'object': {
                if (input instanceof Date) {
                    return input;
                }
            }
            default:
                break;
        }
    }
    catch (err) {
        // Oh well
    }

    return undefined;
};

/**
 * Takes a string and determines if it's a valid GUID containing dashes
 * @param {string} guid A string that could potentially be a dashed GUID
 * @returns true if the string is a dashed guid, else false
 */
export const isDashedGUID = (guid: string | undefined): Boolean => {
    if (guid) {
        return ClientConstants.GUID_REGEX.test(guid);
    }

    return false;
};

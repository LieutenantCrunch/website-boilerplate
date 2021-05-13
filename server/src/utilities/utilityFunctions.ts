// Source: https://www.w3schools.com/JS/js_random.asp
export const randomInt = (min: number, max: number): number => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const isNullOrWhiteSpaceOnly = (text: string | null | undefined): Boolean => (!text || text.trim().replace(/\u{AD}/giu, '').length === 0);

export const adjustGUIDDashes = (guid: string, add: Boolean = false): string => {
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

// Source: https://www.w3schools.com/JS/js_random.asp
export const randomInt = (min: number, max: number): number => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const isNullOrWhiteSpaceOnly = (text: string | null | undefined): Boolean => (!text || text.trim().replace(/\u{AD}/giu, '').length === 0);

// Returns a new array with the item at the specified index removed
export const newArrayWithItemRemoved = (sourceArray, itemIndex) => {
    return sourceArray.reduce((finalArray, currentItem, index) => {
        if (index !== itemIndex) {
            finalArray.push(currentItem);
        }

        return finalArray;
    }, []);
};

// Add a function to the Date object for adding days to a date
interface Date {
    addDays(days: number): Date;
}

Date.prototype.addDays = function (days: number): Date {
    if (!days) {
        return this;
    }

    let date = this;
    
    date.setDate(date.getDate() + days);

    return date;
};
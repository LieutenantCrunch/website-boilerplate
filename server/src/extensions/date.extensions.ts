// Add a function to the Date object for adding days to a date
interface Date {
    addDays(days: number): Date;
    addMinutes(minutes: number): Date;
    greaterThan(date: Date): Boolean;
    lessThan(date: Date): Boolean;
}

Date.prototype.addDays = function (days: number): Date {
    if (!days) {
        return this;
    }

    let date: Date = this;
    
    date.setDate(date.getDate() + days);

    return date;
};

Date.prototype.addMinutes = function (minutes: number): Date {
    if (!minutes) {
        return this;
    }

    let date: Date = this;

    date.setTime(date.getTime() + minutes * 60000);

    return date;
};

Date.prototype.greaterThan = function (date: Date): Boolean {
    return this.getTime() > date.getTime();
};

Date.prototype.lessThan = function (date: Date): Boolean {
    return this.getTime() < date.getTime();
};

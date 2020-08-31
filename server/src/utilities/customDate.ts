export default class CustomDate extends Date {
    constructor() {
        super();
    }

    addDays(days: number) : Date {
        let temp = new Date(this.valueOf());
        temp.setDate(temp.getDate() + days);
        return temp;
    }
}
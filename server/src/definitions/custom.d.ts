// Add an optional userID property to the ExpressJS Request object so it can be set if necessary
declare namespace Express {
    export interface Request {
        userId?: string
    }
}
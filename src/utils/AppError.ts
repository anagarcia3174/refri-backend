import { ErrorType } from "../types/error.types";


class AppError extends Error {
    message: string;
    status: number;
    type: ErrorType;

    constructor(message: string, status: number = 500, type: ErrorType){
        super(message);
        this.message = message;
        this.status = status;
        this.type = type;

        Error.captureStackTrace(this, this.constructor);
    }
}

export default AppError;
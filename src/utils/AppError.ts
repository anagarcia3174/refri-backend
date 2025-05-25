import { StatusCodes } from "http-status-codes";



class AppError extends Error {
    code: string;
    message: string;
    statusCode: number;

    constructor(message: string, statusCode = StatusCodes.INTERNAL_SERVER_ERROR, code: string){
        super(message);
        this.message = message;
        this.statusCode = statusCode;
        this.code = code;

        Error.captureStackTrace(this, this.constructor);
    }
}
export default AppError;

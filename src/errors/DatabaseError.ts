import { CustomError } from "../utils/CustomError";

export class DatabaseError extends CustomError{
    StatusCode: number=400;
    constructor(){
        super('Database crashed, Try again later')
        Object.setPrototypeOf(this,DatabaseError.prototype);
    }
    serialize(): { message: string; } {
        return{message:'Database crashed, Try again later'}
    }
}
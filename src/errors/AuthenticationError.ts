import { CustomError } from "../utils/CustomError";

export class AuthenticationError extends CustomError{
    StatusCode: number=401;
    constructor(){
        super('User Unauthenticated')
        Object.setPrototypeOf(this,AuthenticationError.prototype);
    }
    serialize(): { message: string; } {
        return{message:'User unaunthenticated'}
    }
}
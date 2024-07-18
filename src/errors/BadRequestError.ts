import { CustomError } from "../utils/CustomError";

export class BadRequestError extends CustomError{
    StatusCode: number=400;
    constructor(public message:string){
        super(message)
        Object.setPrototypeOf(this,BadRequestError.prototype);
    }
    serialize(): { message: string; } {
        return{message:this.message}
    }
}
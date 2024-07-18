import { CustomError } from "../utils/CustomError";

export class BlockedError extends CustomError{
    StatusCode: number=460;
    constructor(public message:string){
        super(message)
        Object.setPrototypeOf(this,BlockedError.prototype);
    }
    serialize(): { message: string; } {
        return{message:this.message}
    }
}
import { CustomError } from "../utils/CustomError";

export class ConflictError extends CustomError {
   
    StatusCode: number = 409;

    constructor(public message: string) {
        super(message);
        Object.setPrototypeOf(this, ConflictError.prototype);
    }

    serialize(): { message: string } {
        return { message: this.message };
    }
}

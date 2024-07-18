import { CustomError } from "../utils/CustomError";

export class ForbiddenError extends CustomError {
    StatusCode: number = 403;

    constructor(public message: string) {
        super(message);
        Object.setPrototypeOf(this, ForbiddenError.prototype);
    }

    serialize(): { message: string } {
        return { message: this.message };
    }
}

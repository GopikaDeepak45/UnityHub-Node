import { CustomError } from "../utils/CustomError";



export class ValidationError extends CustomError {
    StatusCode = 400;
    private errors: string[];

    constructor(errors: string[]) {
        super('Validation failed');
        this.errors = errors;
        Object.setPrototypeOf(this, ValidationError.prototype);
    }

    serialize() {
        return {
            message: 'Validation failed',
            errors: this.errors,
        };
    }
}

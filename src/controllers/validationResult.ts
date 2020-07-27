import { validationResult } from 'express-validator';
import { Request } from 'express';

function isValidInput(req: Request): boolean {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return false;
    }
    return true;
}

export default isValidInput;

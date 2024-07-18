import { ErrorRequestHandler, NextFunction, Request, Response } from 'express';
import { CustomError } from '../utils/CustomError';

export const errorHandler: ErrorRequestHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
    if(error instanceof CustomError){
      console.log(error)
        return res.status(error.StatusCode).json(error.serialize())
    }
    console.log(error)
    return res.status(500).json('Something went wrong!')
};
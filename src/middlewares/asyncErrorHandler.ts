import { Request, Response, NextFunction, RequestHandler } from 'express';

const asyncErrorHandler = (fn: RequestHandler): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction): Promise<void> => {
    return Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export default asyncErrorHandler;

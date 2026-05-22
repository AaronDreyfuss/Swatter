import { Request, Response } from 'express';

const respond = (_req: Request, res: Response) =>
  res.status(res.locals.status as number).json(res.locals.data);

export default respond;

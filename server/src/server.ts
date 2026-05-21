import express, { NextFunction, Request, Response } from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

app.use(express.json());

declare global {
  namespace Express {
    interface Locals {
      data?: unknown;
      status?: number;
    }
  }
}

interface AppError {
  log?: string;
  status?: number;
}

// Routes will be mounted here as they are built

app.use('*', (_req: Request, res: Response) => {
  res.status(404).json({ err: 'Not found' });
});

app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
  const defaultErr: Required<AppError> = {
    log: 'Express error handler caught unknown middleware error',
    status: 500,
  };
  const errorObj = {
    ...defaultErr,
    ...(typeof err === 'object' && err !== null ? err : {}),
  };
  console.error(errorObj.log);
  return res.status(errorObj.status).json({
    err: process.env.NODE_ENV === 'production' ? 'An error occurred' : errorObj.log,
  });
});

// Supertest imports app directly and binds its own port - only listen when run as the entry point
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

export default app;

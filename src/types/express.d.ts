export {};

declare global {
  namespace Express {
    interface User {
      id: string;
      sub: string;
    }

    interface Request {
      user?: User;
    }
  }
}

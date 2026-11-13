export interface ErrorDetail {
  path: string;
  message: string;
}

export class HttpError extends Error {
  public readonly status: number;
  public readonly errors?: ErrorDetail[];

  constructor(status: number, message: string, errors?: ErrorDetail[]) {
    super(message);
    this.status = status;
    this.errors = errors;
    this.name = "HttpError";
  }
}

const defaultMessages: Record<number, string> = {
  400: "Bad Request",
  401: "Unauthorized",
  403: "Forbidden",
  404: "Not Found",
  409: "Conflict",
  500: "Internal Server Error",
};

export const createHttpError = (
  status: number,
  message = defaultMessages[status] ?? "Error",
  errors?: ErrorDetail[],
): HttpError => {
  return new HttpError(status, message, errors);
};

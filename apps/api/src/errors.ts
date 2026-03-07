export class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export const invariant = (
  condition: unknown,
  status: number,
  message: string,
): asserts condition => {
  if (!condition) {
    throw new HttpError(status, message);
  }
};

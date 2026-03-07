export async function unwrapResponse<T>(
  request: Promise<{
    data: T | null;
    error: {
      value?: {
        message?: string;
      };
    } | null;
  }>,
): Promise<T> {
  const response = await request;

  if (response.error) {
    const maybeError = response.error as {
      value?: {
        message?: string;
      };
    };

    throw new Error(maybeError.value?.message ?? "Request failed");
  }

  if (response.data === null) {
    throw new Error("Empty response");
  }

  return response.data as T;
}

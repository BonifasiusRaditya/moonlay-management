/**
 * Handles API response that may be wrapped in a data property
 */
export function unwrapApiResponse<T>(response: unknown): T {
  if (
    response &&
    typeof response === 'object' &&
    'data' in response &&
    response.data !== null
  ) {
    return response.data as T;
  }
  return response as T;
}


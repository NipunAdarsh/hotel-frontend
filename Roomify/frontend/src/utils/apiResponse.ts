export const readApiResponse = async <T>(response: Response): Promise<T & { error?: string }> => {
  const contentType = response.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    return (await response.json()) as T & { error?: string };
  }

  await response.text();

  return {
    error: `The API returned ${response.status} ${response.statusText}. Please check that the backend server is running on the expected API URL.`
  } as T & { error?: string };
};

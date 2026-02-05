export function unwrapApiResponse<T>(res: unknown): T {
    if (typeof res === 'object' && res !== null && 'data' in res) {
        // `res` may be an AxiosResponse-like object
        return (res as { data: T }).data;
    }
    return res as T;
}

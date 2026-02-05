import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { fetchByIsbn } from '@/lib/services/openLibrary';

const realFetch = global.fetch;

beforeEach(() => {
  vi.resetAllMocks();
});

afterEach(() => {
  global.fetch = realFetch;
});

test('fetchByIsbn falls back to work authors when edition lacks authors', async () => {
  // Mock sequence:
  // 1) /isbn/:isbn.json -> edition with works but no authors
  // 2) /works/OL*.json -> work with authors array containing author key
  // 3) /authors/OL*.json -> author name

  global.fetch = vi.fn(async (url: string) => {
    if (url.includes('/isbn/9780765326355.json')) {
      return {
        ok: true,
        json: async () => ({
          title: 'The Way of Kings',
          works: [{ key: '/works/OL15358691W' }],
          publish_date: 'August 31st 2010',
          number_of_pages: 1008,
        }),
      } as Response;
    }

    if (url.includes('/works/OL15358691W.json')) {
      return {
        ok: true,
        json: async () => ({ authors: [{ author: { key: '/authors/OL123A' } }] }),
      } as Response;
    }

    if (url.includes('/authors/OL123A.json')) {
      return {
        ok: true,
        json: async () => ({ name: 'Brandon Sanderson' }),
      } as Response;
    }

    throw new Error('unexpected fetch: ' + url);
  }) as unknown as typeof fetch;

  const md = await fetchByIsbn('9780765326355');
  expect(md).not.toBeNull();
  expect(md?.authors).toEqual(['Brandon Sanderson']);
  expect(md?.title).toBe('The Way of Kings');
});

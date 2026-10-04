import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';
import { missingEnvKeys } from '../../tests/integration/fixtures/env';
import { send, test } from './fixtures';

const { BeforeAll, When, Then } = createBdd(test);

// Same gate as the specs: without the integration secrets (a fork, a fresh
// clone) the features skip rather than fail.
BeforeAll(async () => {
    const missing = missingEnvKeys();
    test.skip(missing.length > 0, `Missing integration env: ${missing.join(', ')}`);
});

When(
    'an anonymous caller sends {word} {word}',
    async ({ anonRequest, exchange }, method: string, path: string) => {
        exchange.response = await send(anonRequest, method, path);
    },
);

When(
    'a signed-in non-admin sends {word} {word}',
    async ({ userRequest, exchange }, method: string, path: string) => {
        exchange.response = await send(userRequest, method, path);
    },
);

Then('the response status is {int}', async ({ exchange }, status: number) => {
    expect(exchange.response, 'a request was sent').toBeDefined();
    expect(exchange.response?.status()).toBe(status);
});

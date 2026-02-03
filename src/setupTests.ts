import '@testing-library/jest-dom';
import { vi } from 'vitest';
import React from 'react';
import { JSDOM } from 'jsdom';

// Ensure DOM globals exist in case the test environment does not provide them
if (typeof globalThis.window === 'undefined') {
    const dom = new JSDOM('<!doctype html><html><body></body></html>');
    // @ts-expect-error assigning JSDOM window to global in test shim
    globalThis.window = dom.window;
    // forward other common globals
    globalThis.document = dom.window.document;
    globalThis.HTMLElement = dom.window.HTMLElement;
    globalThis.Node = dom.window.Node;
    globalThis.navigator = dom.window.navigator;

    // Shim canvas getContext to avoid jsdom "Not implemented" warnings when axe or libraries access canvas
    if (typeof globalThis.HTMLCanvasElement !== 'undefined' && !globalThis.HTMLCanvasElement.prototype.getContext) {
        // @ts-expect-error adding getContext shim in test environment
        globalThis.HTMLCanvasElement.prototype.getContext = function () {
            return {} as CanvasRenderingContext2D;
        };
    }
}

// Mock next/image to a plain img element for tests
vi.mock('next/image', () => ({
    default: (input: Record<string, unknown>) => {
        const { src, alt, priority, ...rest } = input;
        const props: Record<string, unknown> = { src, alt, ...rest };
        // Coerce priority to a string to avoid React "non-boolean attribute" warnings in tests
        if (priority !== undefined) props.priority = String(priority);
        return React.createElement('img', props as Record<string, unknown>);
    }
}));

// Mock next/link to a plain anchor element
vi.mock('next/link', () => ({
    default: (input: { children?: unknown; href?: string;[key: string]: unknown }) => {
        const { children, href, ...rest } = input;
        return React.createElement('a', { href, ...rest } as Record<string, unknown>, children as React.ReactNode);
    }
}));

'use client';

import * as RadixSelect from '@radix-ui/react-select';

/**
 * Reusable, accessible Select built on Radix UI. Unlike a native `<select>`, the
 * option list is real DOM, so options get hover highlighting and a pointer
 * cursor (native option popups ignore CSS `cursor`). Styled to match the
 * `.form-input` controls; theme-aware via the `.dark` class.
 *
 * Empty-string values are supported as a "no filter / All" choice — Radix
 * forbids empty item values, so we map `''` to an internal sentinel.
 */
export interface SelectOption {
    value: string;
    label: string;
}

interface SelectProps {
    value: string;
    onValueChange: (value: string) => void;
    options: SelectOption[];
    id?: string;
    placeholder?: string;
    ariaLabel?: string;
    /** Extra classes for the trigger. */
    className?: string;
}

/** Radix disallows empty-string item values; use a sentinel internally. */
const EMPTY_VALUE = '__empty__';
const toRadix = (v: string) => (v === '' ? EMPTY_VALUE : v);
const fromRadix = (v: string) => (v === EMPTY_VALUE ? '' : v);

function Chevron() {
    return (
        <svg
            aria-hidden="true"
            viewBox="0 0 16 16"
            className="h-4 w-4 opacity-70"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M4 6l4 4 4-4" />
        </svg>
    );
}

export default function Select({
    value,
    onValueChange,
    options,
    id,
    placeholder,
    ariaLabel,
    className = '',
}: SelectProps) {
    return (
        <RadixSelect.Root
            value={toRadix(value)}
            onValueChange={(v) => onValueChange(fromRadix(v))}
        >
            <RadixSelect.Trigger
                id={id}
                aria-label={ariaLabel}
                className={`form-input flex w-full items-center justify-between gap-2 ${className}`}
            >
                <RadixSelect.Value placeholder={placeholder} />
                <RadixSelect.Icon>
                    <Chevron />
                </RadixSelect.Icon>
            </RadixSelect.Trigger>
            <RadixSelect.Portal>
                <RadixSelect.Content
                    position="popper"
                    sideOffset={4}
                    className="z-50 max-h-[var(--radix-select-content-available-height)] min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-md border border-[var(--color-norwegian-300)] bg-[var(--color-norwegian-50)] shadow-lg dark:border-[var(--color-norwegian-600)] dark:bg-[var(--color-bg-dark)]"
                >
                    <RadixSelect.Viewport className="p-1">
                        {options.map((opt) => (
                            <RadixSelect.Item
                                key={opt.value || EMPTY_VALUE}
                                value={toRadix(opt.value)}
                                className="relative flex cursor-pointer select-none items-center rounded px-2 py-1.5 pr-7 text-sm text-[var(--color-norwegian-700)] outline-none data-[highlighted]:bg-[var(--color-norwegian-100)] data-[state=checked]:font-medium dark:text-[var(--color-norwegian-200)] dark:data-[highlighted]:bg-[rgba(255,255,255,0.08)]"
                            >
                                <RadixSelect.ItemText>
                                    {opt.label}
                                </RadixSelect.ItemText>
                                <RadixSelect.ItemIndicator className="absolute right-2 inline-flex">
                                    <svg
                                        aria-hidden="true"
                                        viewBox="0 0 16 16"
                                        className="h-4 w-4 text-[var(--color-fjord-600)]"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <path d="M13 4L6 11 3 8" />
                                    </svg>
                                </RadixSelect.ItemIndicator>
                            </RadixSelect.Item>
                        ))}
                    </RadixSelect.Viewport>
                </RadixSelect.Content>
            </RadixSelect.Portal>
        </RadixSelect.Root>
    );
}

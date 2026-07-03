'use client';
import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

/** Shape of a passkey list item returned by `auth.passkey.list()`. */
interface Passkey {
    id: string;
    friendly_name?: string;
    created_at: string;
    last_used_at?: string;
}

/**
 * Map an experimental passkey error (AuthError or WebAuthnError) to a friendly,
 * user-facing message. Handles the documented experimental error codes plus the
 * user-cancelled ceremony case.
 */
function friendlyError(
    error: { code?: string; name?: string; message?: string } | null,
    fallback: string,
): string {
    if (!error) return fallback;
    switch (error.code) {
        case 'webauthn_credential_exists':
            return 'That passkey is already registered.';
        case 'ERROR_CEREMONY_ABORTED':
            return 'Passkey prompt was cancelled.';
        default:
            // The browser surfaces a user cancellation as a DOMException too.
            if (error.name === 'NotAllowedError') {
                return 'Passkey prompt was cancelled.';
            }
            return error.message || fallback;
    }
}

function formatDate(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

/**
 * Passkey management (enroll / list / rename / delete) for the signed-in user.
 *
 * Gated behind `NEXT_PUBLIC_ENABLE_PASSKEYS === 'true'` (ADR 0006). When the
 * flag is off this renders nothing. The caller is responsible for only mounting
 * it for an authenticated user; it is strictly additive and never replaces any
 * existing sign-in method. The flag is read at call time so tests can stub it.
 */
export default function PasskeyManager() {
    const [passkeys, setPasskeys] = useState<Passkey[]>([]);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState('');

    const enabled = process.env.NEXT_PUBLIC_ENABLE_PASSKEYS === 'true';

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const supabase = createClient();
            const { data, error: listError } =
                await supabase.auth.passkey.list();
            if (listError) {
                setError(
                    friendlyError(listError, 'Could not load your passkeys.'),
                );
                setPasskeys([]);
                return;
            }
            setError(null);
            setPasskeys((data ?? []) as Passkey[]);
        } catch {
            setError('Could not load your passkeys.');
            setPasskeys([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!enabled) return;
        void load();
    }, [enabled, load]);

    if (!enabled) {
        return null;
    }

    async function addPasskey() {
        setError(null);
        setBusy(true);
        try {
            const supabase = createClient();
            const { error: registerError } =
                await supabase.auth.registerPasskey();
            if (registerError) {
                setError(
                    friendlyError(registerError, 'Could not add a passkey.'),
                );
                return;
            }
            await load();
        } catch {
            setError('Could not add a passkey.');
        } finally {
            setBusy(false);
        }
    }

    async function deletePasskey(passkeyId: string) {
        setError(null);
        setBusy(true);
        try {
            const supabase = createClient();
            const { error: deleteError } = await supabase.auth.passkey.delete({
                passkeyId,
            });
            if (deleteError) {
                setError(
                    friendlyError(deleteError, 'Could not delete the passkey.'),
                );
                return;
            }
            await load();
        } catch {
            setError('Could not delete the passkey.');
        } finally {
            setBusy(false);
        }
    }

    function startRename(passkey: Passkey) {
        setEditingId(passkey.id);
        setEditingName(passkey.friendly_name ?? '');
    }

    function cancelRename() {
        setEditingId(null);
        setEditingName('');
    }

    async function saveRename(passkeyId: string) {
        setError(null);
        setBusy(true);
        try {
            const supabase = createClient();
            const { error: updateError } = await supabase.auth.passkey.update({
                passkeyId,
                friendlyName: editingName,
            });
            if (updateError) {
                setError(
                    friendlyError(updateError, 'Could not rename the passkey.'),
                );
                return;
            }
            cancelRename();
            await load();
        } catch {
            setError('Could not rename the passkey.');
        } finally {
            setBusy(false);
        }
    }

    return (
        <section data-testid="passkey-manager" className="mt-8">
            <h2 className="text-xl font-semibold mb-2">Passkeys</h2>
            <p className="mb-4 text-sm">
                Passkeys let you sign in with your device&apos;s biometrics or
                screen lock. They are an additional sign-in method — your
                password and magic-link still work.
            </p>
            <div className="mb-4">
                <button
                    type="button"
                    data-testid="passkey-add"
                    className="btn btn--primary"
                    disabled={busy}
                    onClick={addPasskey}
                >
                    {busy ? 'Working…' : 'Add a passkey'}
                </button>
            </div>
            {error ? (
                <div role="alert" className="mb-4 text-sm text-red-600">
                    {error}
                </div>
            ) : null}
            {loading ? (
                <p className="text-sm" data-testid="passkey-loading">
                    Loading passkeys…
                </p>
            ) : passkeys.length === 0 ? (
                <p className="text-sm" data-testid="passkey-empty">
                    You have no passkeys yet.
                </p>
            ) : (
                <ul data-testid="passkey-list" className="space-y-3">
                    {passkeys.map((passkey) => (
                        <li
                            key={passkey.id}
                            data-testid={`passkey-item-${passkey.id}`}
                            className="flex flex-wrap items-center justify-between gap-3 rounded border border-[var(--color-norwegian-200)] p-3"
                        >
                            {editingId === passkey.id ? (
                                <div className="flex flex-1 flex-wrap items-center gap-2">
                                    <label
                                        htmlFor={`passkey-name-${passkey.id}`}
                                        className="sr-only"
                                    >
                                        Passkey name
                                    </label>
                                    <input
                                        id={`passkey-name-${passkey.id}`}
                                        data-testid={`passkey-rename-input-${passkey.id}`}
                                        className="form-input flex-1"
                                        value={editingName}
                                        onChange={(e) =>
                                            setEditingName(e.target.value)
                                        }
                                        maxLength={120}
                                    />
                                    <button
                                        type="button"
                                        data-testid={`passkey-rename-save-${passkey.id}`}
                                        className="btn btn--primary"
                                        disabled={busy}
                                        onClick={() => saveRename(passkey.id)}
                                    >
                                        Save
                                    </button>
                                    <button
                                        type="button"
                                        data-testid={`passkey-rename-cancel-${passkey.id}`}
                                        className="btn"
                                        disabled={busy}
                                        onClick={cancelRename}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div className="min-w-0">
                                        <p className="font-medium">
                                            {passkey.friendly_name ||
                                                'Unnamed passkey'}
                                        </p>
                                        <p className="text-xs">
                                            Added{' '}
                                            {formatDate(passkey.created_at)}
                                            {passkey.last_used_at
                                                ? ` · Last used ${formatDate(passkey.last_used_at)}`
                                                : ''}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            data-testid={`passkey-rename-${passkey.id}`}
                                            className="btn"
                                            disabled={busy}
                                            onClick={() => startRename(passkey)}
                                        >
                                            Rename
                                        </button>
                                        <button
                                            type="button"
                                            data-testid={`passkey-delete-${passkey.id}`}
                                            className="btn"
                                            disabled={busy}
                                            onClick={() =>
                                                deletePasskey(passkey.id)
                                            }
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}

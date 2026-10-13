import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();

/**
 * This isolated template checkout did not contain the platform's existing
 * Supabase client. A single optional public-key client is exposed for standalone
 * adapters; in the host CRM, pass/reuse its current API functions and client
 * instead of creating a second one.
 */
export const supabaseClient: SupabaseClient | null =
  supabaseUrl && publishableKey
    ? createClient(supabaseUrl, publishableKey, {
        global: {
          fetch: (input, init) => {
            const headers = new Headers(input instanceof Request ? input.headers : undefined);
            new Headers(init?.headers).forEach((value, key) => headers.set(key, value));
            // Supabase's Authorization header remains untouched; the publishable
            // key is an additional request header, never a service-role secret.
            headers.set('apikey', publishableKey);
            return fetch(input, { ...init, headers });
          },
        },
      })
    : null;

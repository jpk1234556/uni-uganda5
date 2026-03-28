import { createClient } from '@supabase/supabase-js'

const env = (import.meta as { env?: Record<string, string | undefined> }).env ?? {}
const supabaseUrl = env.VITE_SUPABASE_URL
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY

let supabase: any

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables. Please check your .env.local file.')
    // Create a dummy client to prevent app crash by returning graceful errors
    const createErrorMock = () => Promise.resolve({ data: null, error: new Error('Supabase not configured') });
    
    // Create chainable mock that eventually returns an error for any query
    const createChainableMock = () => {
        const chain: any = {};
        const methods = ['select', 'eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'like', 'ilike', 'is', 'in', 'order', 'limit', 'single', 'maybeSingle'];
        methods.forEach(method => {
            chain[method] = () => chain; // return self for chaining
        });
        // Override the terminal methods to resolve to our error mock
        chain.then = (resolve: any) => resolve({ data: null, error: new Error('Supabase not configured') });
        return chain;
    };

    supabase = {
        from: (_table: string) => ({
            select: createChainableMock,
            insert: createErrorMock,
            update: createErrorMock,
            delete: createErrorMock,
        }),
        auth: { 
            getSession: () => Promise.resolve({ data: { session: null }, error: null }), 
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
            signUp: createErrorMock,
            signInWithPassword: createErrorMock,
            signOut: createErrorMock,
            getUser: createErrorMock,
        }
    }
} else {
    supabase = createClient(supabaseUrl, supabaseAnonKey)
}

export { supabase }

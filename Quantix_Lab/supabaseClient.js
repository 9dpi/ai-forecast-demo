// MOCK SUPABASE CLIENT FOR BACKTESTING
export const supabase = {
    from: () => ({
        select: () => ({
            eq: () => ({
                single: () => Promise.resolve({ data: null }),
                order: () => ({ limit: () => Promise.resolve({ data: [] }) })
            })
        }),
        insert: () => Promise.resolve({ error: null }),
        update: () => ({ eq: () => Promise.resolve({ error: null }) })
    })
};
console.log('[SUPABASE] Running in LAB MODE (MOCK) ✅');

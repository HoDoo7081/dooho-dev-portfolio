export const ok = (data?: any) => ({ status: 'success', ...(data ? { data } : {}) });

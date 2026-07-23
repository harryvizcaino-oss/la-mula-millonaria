import { supabase, isSupabaseConfigured } from './supabase';

/**
 * Fila de la tabla `transactions` de Supabase (ver migración 001).
 * Convención: `amount` siempre positivo; el signo lo da `type`
 * ('spend' = gasto, 'earn'/'reward'/'iap'/'ad' = ingreso).
 */
export interface TransactionRow {
  id: number;
  type: string;
  amount: number;
  description: string | null;
  created_at: string;
}

/** Últimas transacciones del usuario, más recientes primero. */
export async function fetchTransactions(userId: string, limit = 50): Promise<TransactionRow[]> {
  if (!isSupabaseConfigured || !userId) return [];
  const { data, error } = await supabase
    .from('transactions')
    .select('id, type, amount, description, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) {
    console.error('[transactions] Failed to fetch:', error);
    return [];
  }
  return (data ?? []) as TransactionRow[];
}

/**
 * Inserta una transacción del usuario con sesión activa. Best-effort: en
 * modo offline/anónimo (o si falla la red) no hace nada y nunca lanza.
 */
export async function recordTransaction(input: {
  type: 'earn' | 'spend' | 'reward' | 'iap' | 'ad';
  amount: number;
  description?: string;
}): Promise<void> {
  if (!isSupabaseConfigured) return;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    if (!userId) return;
    const { error } = await supabase.from('transactions').insert({
      user_id: userId,
      type: input.type,
      amount: Math.abs(input.amount),
      description: input.description ?? null,
    });
    if (error) console.error('[transactions] Failed to record:', error);
  } catch (err) {
    console.error('[transactions] Failed to record:', err);
  }
}

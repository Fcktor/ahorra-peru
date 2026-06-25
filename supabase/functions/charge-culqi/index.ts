import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CULQI_SECRET_KEY = Deno.env.get('CULQI_SECRET_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, content-type',
      },
    });
  }

  try {
    const { token, userId } = await req.json();
    if (!token || !userId) throw new Error('Faltan parámetros');

    // Cobrar con Culqi
    const chargeRes = await fetch('https://api.culqi.com/v2/charges', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CULQI_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: 1200,
        currency_code: 'PEN',
        source_id: token,
        description: 'AhorraPeru Pro - Suscripción mensual',
      }),
    });

    const charge = await chargeRes.json();
    if (!chargeRes.ok || charge.object !== 'charge') {
      throw new Error(charge.user_message ?? 'Error en el cobro');
    }

    // Actualizar plan del usuario a 'pro'
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const { error } = await supabase
      .from('profiles')
      .update({ plan: 'pro' })
      .eq('id', userId);

    if (error) throw error;

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
});

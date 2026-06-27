import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const { userId, userEmail } = await req.json();
  const accessToken = Deno.env.get('MP_ACCESS_TOKEN')!;
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;

  const preference = {
    items: [{
      title: 'AhorraPeru Pro — Suscripción mensual',
      quantity: 1,
      unit_price: 12,
      currency_id: 'PEN',
    }],
    payer: { email: userEmail },
    back_urls: {
      success: 'https://ahorra-peru.vercel.app/pago-exitoso',
      failure: 'https://ahorra-peru.vercel.app/pago-cancelado',
      pending: 'https://ahorra-peru.vercel.app/pago-cancelado',
    },
    auto_return: 'approved',
    notification_url: `${supabaseUrl}/functions/v1/mp-webhook`,
    external_reference: userId,
  };

  const res = await fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(preference),
  });

  const data = await res.json();

  if (!res.ok) {
    return new Response(
      JSON.stringify({ error: data.message ?? 'Error al crear preferencia de pago' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  return new Response(
    JSON.stringify({ init_point: data.init_point, preference_id: data.id }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  );
});

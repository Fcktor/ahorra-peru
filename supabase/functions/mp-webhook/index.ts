import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const body = await req.json().catch(() => ({}));

  if (body.type !== 'payment') {
    return new Response('ok', { status: 200 });
  }

  const paymentId = body.data?.id;
  if (!paymentId) {
    return new Response('ok', { status: 200 });
  }

  const accessToken = Deno.env.get('MP_ACCESS_TOKEN')!;

  const paymentRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { 'Authorization': `Bearer ${accessToken}` },
  });

  const payment = await paymentRes.json();

  if (payment.status !== 'approved') {
    return new Response('ok', { status: 200 });
  }

  const userId = payment.external_reference;
  if (!userId) {
    return new Response('ok', { status: 200 });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  await supabase
    .from('profiles')
    .update({ plan: 'pro' })
    .eq('id', userId);

  return new Response('ok', { status: 200 });
});

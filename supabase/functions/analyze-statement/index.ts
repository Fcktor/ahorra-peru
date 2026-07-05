import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `Eres un analista financiero de AhorraPeru. Vas a recibir el PDF de un estado de cuenta bancario peruano. Léelo cuidadosamente y extrae los movimientos de gasto (débitos, compras, retiros, cargos) — ignora depósitos e ingresos.

Con esos movimientos:
1. Agrúpalos en categorías de gasto claras (ej. Comida y delivery, Transporte, Suscripciones, Entretenimiento, Compras, Servicios, Salud, Otros).
2. Identifica los gastos individuales más grandes.
3. Señala gastos que parezcan evitables o impulsivos (suscripciones duplicadas, delivery frecuente, compras no esenciales), explicando brevemente el motivo.
4. Da recomendaciones concretas y accionables para reducir gastos y aumentar el ahorro, en soles y en el contexto peruano.
5. Sugiere un monto mensual realista para ahorrar y un resumen breve del plan.

Responde SIEMPRE llamando a la herramienta "extraer_analisis" con los datos — no respondas en texto libre.`;

const ANALYSIS_TOOL = {
  name: 'extraer_analisis',
  description: 'Registra el análisis financiero extraído de un estado de cuenta bancario.',
  input_schema: {
    type: 'object',
    properties: {
      periodo: { type: 'string', description: 'Período que cubre el estado de cuenta, ej. "Junio 2026"' },
      total_gastado: { type: 'number', description: 'Suma total de gastos identificados, en soles' },
      categorias: {
        type: 'array',
        description: 'Gasto agrupado por categoría',
        items: {
          type: 'object',
          properties: {
            nombre: { type: 'string' },
            monto: { type: 'number' },
            porcentaje: { type: 'number', description: 'Porcentaje del total gastado, 0-100' },
          },
          required: ['nombre', 'monto', 'porcentaje'],
        },
      },
      top_gastos: {
        type: 'array',
        description: 'Los gastos individuales más grandes',
        items: {
          type: 'object',
          properties: {
            descripcion: { type: 'string' },
            monto: { type: 'number' },
            fecha: { type: 'string' },
          },
          required: ['descripcion', 'monto'],
        },
      },
      gastos_evitables: {
        type: 'array',
        description: 'Gastos que parecen evitables o impulsivos',
        items: {
          type: 'object',
          properties: {
            descripcion: { type: 'string' },
            monto: { type: 'number' },
            motivo: { type: 'string' },
          },
          required: ['descripcion', 'monto', 'motivo'],
        },
      },
      recomendaciones: {
        type: 'array',
        description: 'Recomendaciones concretas para ahorrar más',
        items: { type: 'string' },
      },
      plan_ahorro: {
        type: 'object',
        properties: {
          monto_sugerido_mensual: { type: 'number' },
          resumen: { type: 'string' },
        },
        required: ['monto_sugerido_mensual', 'resumen'],
      },
    },
    required: ['total_gastado', 'categorias', 'top_gastos', 'gastos_evitables', 'recomendaciones', 'plan_ahorro'],
  },
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No autenticado');

    const authClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user }, error: userError } = await authClient.auth.getUser();
    if (userError || !user) throw new Error('No autenticado');

    const { pdfBase64 } = await req.json();
    if (!pdfBase64) throw new Error('Falta el PDF del estado de cuenta');

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY')!;
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-5',
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        tools: [ANALYSIS_TOOL],
        tool_choice: { type: 'tool', name: 'extraer_analisis' },
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'document',
                source: { type: 'base64', media_type: 'application/pdf', data: pdfBase64 },
              },
              { type: 'text', text: 'Analiza este estado de cuenta y llama a la herramienta extraer_analisis con el resultado.' },
            ],
          },
        ],
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message ?? 'Error al contactar a Claude');
    }

    const toolUse = data.content?.find((block: { type: string }) => block.type === 'tool_use');
    if (!toolUse) throw new Error('No se pudo leer el estado de cuenta');

    const analysis = toolUse.input;

    const dbClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    const { data: saved, error: insertError } = await dbClient
      .from('bank_statement_analyses')
      .insert({
        user_id: user.id,
        periodo: analysis.periodo ?? null,
        total_gastado: analysis.total_gastado,
        categorias: analysis.categorias,
        top_gastos: analysis.top_gastos,
        gastos_evitables: analysis.gastos_evitables,
        recomendaciones: analysis.recomendaciones,
        plan_ahorro: analysis.plan_ahorro,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return new Response(JSON.stringify(saved), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `Eres un asesor financiero de AhorraPeru, una app peruana de comparación de productos de ahorro e inversión. Tu rol es ayudar a los usuarios a entender sus opciones de ahorro en Perú y orientarlos hacia la mejor decisión según su perfil.

PRODUCTOS EN LA APP:
1. Depósito a Plazo Fijo BCP — TREA 6–8.5%, riesgo muy bajo, liquidez al vencimiento, mínimo S/ 500
2. Depósito a Plazo Fijo Interbank — TREA 6.5–9%, riesgo muy bajo, liquidez al vencimiento, mínimo S/ 500
3. Depósito a Plazo (Cajas/Financieras) — TREA 8–12%, riesgo muy bajo, liquidez al vencimiento, mínimo S/ 250
4. Cuenta de Ahorros (banca múltiple) — TREA 0.5–2.5%, riesgo muy bajo, liquidez inmediata, sin mínimo
5. Fondo Mutuo Conservador — rendimiento estimado 5–8%, riesgo bajo, liquidez 1–3 días, mínimo S/ 100
6. Fondo Mutuo Moderado — rendimiento estimado 6–12%, riesgo medio, liquidez 1–3 días, mínimo S/ 100
7. CTS — TREA 3.5–7%, riesgo muy bajo, liquidez restringida, solo planilla
8. AFP — rendimiento histórico 5–10%, riesgo medio, liquidez largo plazo, para pensión

FUNCIONES DE LA APP:
- Tab "Comparar": lista todos los productos con filtros
- Tab "Calcular": calcula cuánto ganarás o cómo llegar a una meta
- Tab "Mi Plan": estrategia de ahorro en capas
- Tab "Tasas": ranking visual de tasas por producto
- Tab "Glosario": definiciones de términos financieros
- Botón "+" en cada producto → seleccionar dos → botón "Comparar →": comparación lado a lado

CONCEPTOS:
- TREA: Tasa de Rendimiento Efectiva Anual — lo que realmente ganas en 1 año con capitalización
- FSD: Fondo de Seguro de Depósitos — protege hasta S/ 122,000 (se actualiza trimestralmente) en bancos, financieras, cajas municipales y rurales reguladas
- CTS: Compensación por Tiempo de Servicios — beneficio laboral, mayo y noviembre
- AFP: Administradora de Fondos de Pensiones — descuenta 10% del sueldo, para la jubilación

INSTRUCCIONES:
- Responde SIEMPRE en español peruano, de manera conversacional y directa
- Máximo 3–4 oraciones por respuesta, sin listas a menos que sea necesario
- Si el usuario pide recomendación, pregunta: monto, plazo y tolerancia al riesgo antes de responder
- No inventes tasas ni productos fuera de los listados
- No asesores sobre acciones, criptomonedas u otros activos no listados en la app
- Si no sabes algo, dilo honestamente`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const apiKey = Deno.env.get('ANTHROPIC_API_KEY')!;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 400,
        system: SYSTEM_PROMPT,
        messages,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message ?? 'Error al contactar el asistente');
    }

    const reply: string = data.content?.[0]?.text ?? 'Lo siento, no pude generar una respuesta.';

    return new Response(
      JSON.stringify({ reply }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});

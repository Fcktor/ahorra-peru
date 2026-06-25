// Reemplaza con tu llave pública de Culqi cuando la tengas
// pk_test_... en desarrollo, pk_live_... en producción
export const CULQI_PUBLIC_KEY = 'pk_test_REEMPLAZAR';

export const PLAN_PRO_AMOUNT = 1200; // S/12.00 en centavos

export function loadCulqiScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return resolve();
    if ((window as any).Culqi) return resolve();

    const script = document.createElement('script');
    script.src = 'https://checkout.culqi.com/js/v4';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('No se pudo cargar Culqi'));
    document.head.appendChild(script);
  });
}

export function openCulqiCheckout(onToken: (token: string) => void) {
  const culqi = (window as any).Culqi;
  if (!culqi) return;

  culqi.publicKey = CULQI_PUBLIC_KEY;
  culqi.settings({
    title: 'AhorraPeru Pro',
    currency: 'PEN',
    amount: PLAN_PRO_AMOUNT,
    description: 'Suscripción mensual Pro',
  });

  (window as any).culqi = () => {
    if (culqi.token) {
      onToken(culqi.token.id);
      culqi.close();
    } else if (culqi.order) {
      culqi.close();
    }
  };

  culqi.open();
}

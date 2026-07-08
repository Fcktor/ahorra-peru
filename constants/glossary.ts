export interface GlossaryTerm {
  term: string;
  definition: string;
  example?: string;
}

export const GLOSSARY: GlossaryTerm[] = [
  {
    term: 'TREA',
    definition: 'Tasa de Rendimiento Efectivo Anual. Es el porcentaje real que ganas al año en un depósito o cuenta, ya incluyendo la capitalización de intereses. Es el número que debes comparar entre bancos.',
    example: 'Si un depósito tiene TREA 8%, cada S/ 1,000 que deposites te generará S/ 80 en un año.',
  },
  {
    term: 'Tasa de Referencia BCRP',
    definition: 'La tasa que fija el Banco Central de Reserva del Perú (nuestro banco central). Es como el "precio del dinero" en el país. Cuando sube, los bancos pagan más por tus ahorros. Cuando baja, te pagan menos.',
    example: 'Si la tasa de referencia es 4.75%, los bancos fijarán sus tasas de ahorros y préstamos alrededor de ese número.',
  },
  {
    term: 'TIPMN',
    definition: 'Tasa de Interés Pasiva Promedio en Moneda Nacional. Es el promedio de lo que todos los bancos pagan a sus ahorristas en soles. Sirve como referencia para saber si tu banco te paga bien o poco.',
    example: 'Si la TIPMN es 3% y tu banco solo te paga 0.5%, tu banco te está pagando muy por debajo del promedio.',
  },
  {
    term: 'FSD (Fondo de Seguro de Depósitos)',
    definition: 'Es el seguro que protege tu dinero en bancos peruanos. Si un banco quiebra, el FSD te devuelve hasta S/ 122,000 por persona (el monto se actualiza trimestralmente). Es por eso que los depósitos en bancos se consideran sin riesgo.',
    example: 'Si tienes S/ 80,000 en BCP y el banco quebrara (algo casi imposible), el FSD te devolvería todo.',
  },
  {
    term: 'Liquidez',
    definition: 'Qué tan rápido puedes convertir tu inversión en efectivo sin perder dinero. Una cuenta de ahorros tiene liquidez inmediata. Un depósito a plazo fijo tiene baja liquidez porque no puedes sacarlo antes de que venza.',
    example: 'Si necesitas el dinero de emergencia, necesitas una inversión con alta liquidez.',
  },
  {
    term: 'Plazo',
    definition: 'El tiempo que se acuerda dejar el dinero invertido. A mayor plazo, generalmente mayor tasa de interés. Los plazos típicos son 30, 60, 90, 180 o 360 días.',
    example: 'Un depósito a 360 días suele pagar más que uno a 30 días porque el banco puede planificar mejor con tu dinero.',
  },
  {
    term: 'Interés compuesto',
    definition: 'Cuando los intereses que ganas también empiezan a generar intereses. Con el tiempo, tu dinero crece de forma exponencial, no lineal. Es el principio más poderoso de las finanzas personales.',
    example: 'S/ 10,000 al 8% anual con interés compuesto = S/ 14,693 en 5 años (no S/ 14,000 como sería sin compuesto).',
  },
  {
    term: 'Inflación',
    definition: 'El aumento general de precios. Si la inflación es 3% anual y tu ahorro rinde 2%, en realidad estás perdiendo poder adquisitivo. Tu tasa real es negativa.',
    example: 'Si hoy compras S/ 100 en víveres, el año que viene esos mismos víveres costarán S/ 103 con inflación del 3%.',
  },
  {
    term: 'Tasa real',
    definition: 'Es tu rentabilidad después de descontar la inflación. Es el número que verdaderamente importa: cuánto más poder de compra tienes al final.',
    example: 'TREA 8% con inflación 3% = tasa real de aproximadamente 4.85%. Ese es tu ganancia real.',
  },
  {
    term: 'Fondo mutuo',
    definition: 'Un vehículo de inversión donde muchas personas juntan su dinero y un gestor profesional lo invierte en bonos, acciones u otros instrumentos. No está garantizado como un depósito, pero suele tener mejor rentabilidad.',
    example: 'Es como un pool de dinero: 1,000 personas ponen S/ 500 cada una y un experto invierte ese millón de soles.',
  },
  {
    term: 'Diversificación',
    definition: 'No poner todos los huevos en la misma canasta. Distribuir tu ahorro en diferentes instrumentos para reducir el riesgo. Si uno baja, los otros pueden compensar.',
    example: '50% en depósito a plazo, 30% en fondo mutuo conservador, 20% en cuenta de ahorros de emergencia.',
  },
  {
    term: 'CTS',
    definition: 'Compensación por Tiempo de Servicios. Un beneficio laboral obligatorio para trabajadores en planilla. Tu empleador deposita el equivalente a medio sueldo dos veces al año en un banco que tú eliges. Genera intereses.',
    example: 'Si ganas S/ 2,000, tu empleador deposita S/ 1,000 en mayo y S/ 1,000 en noviembre en tu cuenta CTS.',
  },
  {
    term: 'AFP',
    definition: 'Administradora de Fondos de Pensiones. Gestiona el 10% de tu sueldo que se destina a tu pensión de jubilación. Existen 4: Prima, Integra, Habitat y Profuturo. Puedes elegir entre fondos de distinto riesgo (0 al 3).',
    example: 'Con Fondo 2 (mixto), una persona de 30 años suele tener mejor rentabilidad a largo plazo que con Fondo 0 (conservador).',
  },
  {
    term: 'SBS',
    definition: 'Superintendencia de Banca, Seguros y AFP. El regulador que supervisa todos los bancos, financieras y fondos de pensiones en Perú. Publica información de tasas de interés de todos los bancos para que puedas comparar.',
    example: 'En sbs.gob.pe puedes ver qué tasa paga cada banco por sus depósitos y tomar la mejor decisión.',
  },
  {
    term: 'BCRP',
    definition: 'Banco Central de Reserva del Perú. Es el banco del gobierno. No atiende al público pero controla la política monetaria del país: fija la tasa de referencia y controla la inflación.',
    example: 'Cuando el BCRP sube la tasa de referencia, los bancos suelen subir también las tasas de sus depósitos.',
  },
];

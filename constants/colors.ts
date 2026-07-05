export const Colors = {
  // Brand / interactive — verde oscuro fintech
  primary:       '#0E7A47',   // Verde marca — botón sólido + texto blanco
  primaryLight:  '#34B378',   // Verde claro — NO usar con texto blanco, solo fondos de chip/badge/gradiente
  primaryDark:   '#0A5233',   // Verde más oscuro — segundo stop de gradientes, texto de badges "riesgo muy bajo"
  // Positive / success semantic — ganancias, aciertos, "pros", riesgo muy bajo
  accent:        '#10B981',
  accentLight:   '#A7F3D0',
  // Decorative secondary accent — naranja, ya no protagonista pero se conserva para landing y badge "PRO"
  highlight:      '#E8842E',
  highlightLight: '#F7C99A',
  highlightDark:  '#B5661E',
  // Semantic
  warning:       '#C8891C',   // Ámbar cálido — riesgo medio / caución. NO usar con texto blanco encima
  danger:        '#DC2626',   // Rojo — errores, "cons", riesgo alto
  // Surfaces — crema cálido
  background:    '#F6F4EC',   // Fondo de pantalla
  surface:       '#FFFDF7',   // Tarjetas
  surfaceHigh:   '#F0EDE2',   // Elevado / seleccionado / chips neutros
  // Borders
  border:        '#E2DECF',   // Borde sutil cálido
  // Text
  textPrimary:   '#12211B',   // Casi negro cálido
  textSecondary: '#5B6B62',   // Cualquier texto con información real
  textMuted:     '#8A9188',   // Solo decorativo/disabled — nunca dato real
  // Risk colors — alias de los semánticos de arriba
  riskLow:       '#10B981',   // = accent
  riskBajo:      '#2F80ED',   // azul, concepto propio
  riskMedium:    '#C8891C',   // = warning
  riskHigh:      '#DC2626',   // = danger
};

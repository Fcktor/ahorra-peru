export const Colors = {
  // Brand / interactive — emerald green
  primary:       '#0E7A54',   // Verde marca — único color apto para botón sólido + texto blanco
  primaryLight:  '#34B378',   // Verde claro — NO usar con texto blanco, solo fondos de chip/badge/gradiente
  // Positive / success semantic — usado en toda la app para ganancias, aciertos, "pros", riesgo muy bajo
  accent:        '#10B981',   // Verde distinto al primary (evita confundir "marca" con "resultado positivo")
  accentLight:   '#A7F3D0',
  // Decorative secondary accent — naranja inspirado en la referencia, solo landing y badge "PRO"
  highlight:      '#E8842E',
  highlightLight: '#F7C99A',
  highlightDark:  '#B5661E',  // Única variante de naranja apta para texto blanco
  // Semantic
  warning:       '#F59E0B',   // Ámbar — riesgo medio / caución. NO usar con texto blanco encima
  danger:        '#DC2626',   // Rojo — errores, "cons", riesgo alto
  // Surfaces — light
  background:    '#F7F7F2',   // Blanco cálido — fondo de pantalla
  surface:       '#FFFFFF',   // Tarjetas
  surfaceHigh:   '#E8F3EC',   // Elevado / seleccionado — verde muy pálido
  // Borders
  border:        '#E4E7E1',   // Borde sutil claro
  // Text
  textPrimary:   '#16211B',   // Casi negro cálido
  textSecondary: '#5B6B61',   // Cualquier texto con información real
  textMuted:     '#6E7D74',   // Solo decorativo/disabled — nunca dato real
  // Risk colors — alias de los semánticos de arriba (igual que en la paleta anterior)
  riskLow:       '#10B981',   // = accent
  riskBajo:      '#2F80ED',   // azul, concepto propio
  riskMedium:    '#F59E0B',   // = warning
  riskHigh:      '#DC2626',   // = danger
};

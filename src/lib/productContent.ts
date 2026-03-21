/**
 * MVP product-specific CRO content for Revolución Fit PDPs.
 * Content by product handle — falls back to generic for unknown products.
 */

export interface ProductCROContent {
  /** Benefit-oriented headline (replaces raw title) */
  headline: string;
  /** Short value proposition subtitle */
  subtitle: string;
  /** 4–6 benefit bullets */
  benefits: string[];
  /** What's included */
  includes: string[];
  /** How to use steps */
  howToUse: string[];
  /** Comparison table rows: [criteria, ours, generic] */
  comparison: [string, string, string][];
  /** Social proof / testimonials */
  testimonials: { name: string; text: string; rating: number }[];
}

const rodilleraContent: ProductCROContent = {
  headline: 'Alivio inmediato para tu rodilla — sin limitar tu movimiento',
  subtitle: 'Estabilización rotuliana profesional para el día a día, ejercicio o recuperación.',
  benefits: [
    'Estabiliza la rótula sin comprimir en exceso',
    'Diseño transpirable para uso prolongado',
    'Ajuste universal con cierre regulable',
    'Ideal para caminar, subir escaleras o entrenar',
    'Material ligero y discreto bajo la ropa',
    'Lavable a mano, se seca rápido',
  ],
  includes: [
    '1× Rodillera estabilizadora de rótula',
    'Guía rápida de uso y ajuste',
    'Bolsa de transporte',
  ],
  howToUse: [
    'Coloca la rodillera con la abertura alineada a la rótula.',
    'Ajusta las correas laterales hasta sentir soporte sin presión excesiva.',
    'Úsala durante la actividad. Retírala después para descansar.',
  ],
  comparison: [
    ['Estabilización rotuliana', '✓ Específica', '✗ Genérica'],
    ['Transpirabilidad', '✓ Tejido mesh', '✗ Neopreno cerrado'],
    ['Ajuste personalizable', '✓ Correas regulables', '✗ Talla fija'],
    ['Comodidad prolongada', '✓ Uso todo el día', '✗ Molesta en horas'],
    ['Soporte postventa', '✓ WhatsApp directo', '✗ Sin soporte'],
    ['Pago contra reembolso', '✓ Pagas al recibir', '✗ Solo online'],
  ],
  testimonials: [
    { name: 'Carmen L.', text: 'La uso para caminar y noto mucha diferencia. Al principio dudé por el pago online, pero con contra reembolso me animé.', rating: 5 },
    { name: 'Javier M.', text: 'Muy buen ajuste, no se mueve al subir escaleras. Me confirmaron el pedido por WhatsApp en menos de 2 horas.', rating: 5 },
    { name: 'Ana R.', text: 'Ligera y cómoda. La llevo debajo del pantalón y nadie la nota. Envío rápido.', rating: 4 },
  ],
};

const masajeadorContent: ProductCROContent = {
  headline: 'Calor terapéutico + masaje para tu rodilla, desde casa',
  subtitle: 'Alivio natural con calefactor integrado y vibración relajante. Sin cables, recargable.',
  benefits: [
    'Calefactor infrarrojo para alivio natural del malestar',
    'Vibración de masaje con 3 intensidades',
    'Batería recargable — úsalo sin cables ni enchufe',
    'Fácil de colocar con cierre ajustable',
    'Ideal para reposo, lectura o antes de dormir',
    'Pantalla táctil con control de temperatura y modo',
  ],
  includes: [
    '1× Masajeador de rodilla con calefactor',
    'Cable de carga USB-C',
    'Manual de instrucciones en español',
    'Bolsa de almacenamiento',
  ],
  howToUse: [
    'Carga completamente el dispositivo antes del primer uso (≈2h).',
    'Envuelve la rodilla con el masajeador y ajusta el cierre.',
    'Selecciona modo de calor y/o vibración desde la pantalla táctil.',
    'Usa sesiones de 15–20 minutos, hasta 3 veces al día.',
  ],
  comparison: [
    ['Calor terapéutico', '✓ Infrarrojo integrado', '✗ Sin calor'],
    ['Masaje vibración', '✓ 3 intensidades', '✗ Manual o sin masaje'],
    ['Portabilidad', '✓ Batería recargable', '✗ Con cable'],
    ['Facilidad de uso', '✓ Pantalla táctil', '✗ Botones confusos'],
    ['Soporte postventa', '✓ WhatsApp directo', '✗ Sin soporte'],
    ['Pago contra reembolso', '✓ Pagas al recibir', '✗ Solo online'],
  ],
  testimonials: [
    { name: 'Miguel Á.', text: 'Lo uso antes de dormir y noto la rodilla mucho más relajada. El calor es muy agradable.', rating: 5 },
    { name: 'Lucía P.', text: 'Me encanta poder usarlo sin cables. Lo llevo al sofá o a la cama. Muy práctico.', rating: 5 },
    { name: 'Fernando S.', text: 'Lo compré con pago al recibir porque no quería arriesgar. Llegó en 3 días y funciona perfecto.', rating: 4 },
  ],
};

const genericContent: ProductCROContent = {
  headline: '',
  subtitle: 'Calidad profesional con pago contra reembolso.',
  benefits: [
    'Materiales de alta calidad y duraderos',
    'Diseño ergonómico para máxima comodidad',
    'Uso sencillo desde el primer día',
    'Ideal para uso diario o deportivo',
  ],
  includes: [
    'Producto + embalaje protector',
  ],
  howToUse: [
    'Sigue las instrucciones incluidas en el paquete.',
    'Consulta nuestro soporte si tienes dudas.',
  ],
  comparison: [
    ['Calidad materiales', '✓ Premium', '✗ Básica'],
    ['Comodidad', '✓ Diseño ergonómico', '✗ Genérica'],
    ['Soporte postventa', '✓ WhatsApp directo', '✗ Sin soporte'],
    ['Pago contra reembolso', '✓ Pagas al recibir', '✗ Solo online'],
  ],
  testimonials: [],
};

const contentMap: Record<string, ProductCROContent> = {
  'rodillera-estabilizadora-de-rotula-1': rodilleraContent,
  'masajeador-de-rodilla-con-calefactor': masajeadorContent,
};

export function getProductCROContent(handle: string): ProductCROContent {
  return contentMap[handle] || genericContent;
}

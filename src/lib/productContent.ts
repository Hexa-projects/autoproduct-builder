/**
 * MVP product-specific CRO content for Revolución Fit PDPs.
 * Content by product handle — falls back to generic for unknown products.
 */

export interface ProductCROContent {
  headline: string;
  subtitle: string;
  benefits: string[];
  includes: string[];
  howToUse: string[];
  comparison: [string, string, string][];
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
    { name: 'Carmen L. · Madrid', text: 'La uso para caminar y noto mucha diferencia. Con contra reembolso me animé sin dudar.', rating: 5 },
    { name: 'Javier M. · Barcelona', text: 'Buen ajuste, no se mueve al subir escaleras. Me confirmaron por WhatsApp en 2 horas.', rating: 5 },
    { name: 'Ana R. · Valencia', text: 'Ligera y cómoda. La llevo debajo del pantalón y nadie la nota. Envío en 3 días.', rating: 4 },
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
    { name: 'Miguel Á. · Sevilla', text: 'Lo uso antes de dormir y noto la rodilla más relajada. El calor es muy agradable.', rating: 5 },
    { name: 'Lucía P. · Málaga', text: 'Me encanta poder usarlo sin cables. Lo llevo al sofá o a la cama. Muy práctico.', rating: 5 },
    { name: 'Fernando S. · Zaragoza', text: 'Llegó en 3 días y funciona perfecto. Con pago al recibir no tenía nada que perder.', rating: 4 },
  ],
};

const giroscopioContent: ProductCROContent = {
  headline: 'Fortalece tu muñeca y antebrazo en minutos al día',
  subtitle: 'Giroscopio de mano para rehabilitación, fuerza y prevención de lesiones.',
  benefits: [
    'Fortalece muñeca, antebrazo y dedos de forma progresiva',
    'Ideal para rehabilitación del túnel carpiano y tendinitis',
    'Sin pilas ni cables — funciona por inercia giroscópica',
    'Compacto y portátil — úsalo en casa, oficina o viaje',
    'Mejora agarre y resistencia para deportes de raqueta o escalada',
    'Pantalla LED integrada con contador de RPM',
  ],
  includes: [
    '1× Giroscopio de mano profesional',
    'Cuerda de arranque',
    'Manual de uso en español',
  ],
  howToUse: [
    'Enrolla la cuerda de arranque en la ranura del giroscopio.',
    'Tira de la cuerda con un movimiento firme para activar el giro.',
    'Rota la muñeca de forma circular para mantener y aumentar la velocidad.',
    'Empieza con 2-3 minutos al día e incrementa progresivamente.',
  ],
  comparison: [
    ['Fortalecimiento progresivo', '✓ Resistencia variable', '✗ Peso fijo'],
    ['Rehabilitación', '✓ Recomendado por fisios', '✗ Uso limitado'],
    ['Portabilidad', '✓ Cabe en el bolsillo', '✗ Equipamiento pesado'],
    ['Sin electricidad', '✓ Funciona por inercia', '✗ Necesita pilas'],
    ['Soporte postventa', '✓ WhatsApp directo', '✗ Sin soporte'],
    ['Pago contra reembolso', '✓ Pagas al recibir', '✗ Solo online'],
  ],
  testimonials: [
    { name: 'Carlos D. · Madrid', text: 'Tenía dolor de muñeca por el ordenador. En 2 semanas notaba mejoría clara. Muy recomendable.', rating: 5 },
    { name: 'Marta J. · Bilbao', text: 'Lo uso en la oficina. Es silencioso y entretenido. Mi agarre ha mejorado mucho.', rating: 5 },
    { name: 'Pedro R. · Alicante', text: 'Llegó rápido y pagué al repartidor. Funciona muy bien para calentar antes de escalar.', rating: 4 },
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
  'giroscopio-de-mano-para-fortalecer-muneca': giroscopioContent,
};

export function getProductCROContent(handle: string): ProductCROContent {
  return contentMap[handle] || genericContent;
}

export interface GeoProvince {
  id: string;
  name: string;
}

export interface GeoCity {
  id: string;
  provinceId: string;
  name: string;
}

export const ARGENTINA_PROVINCES: GeoProvince[] = [
  { id: 'misiones', name: 'Misiones' },
  { id: 'buenos_aires', name: 'Buenos Aires' },
  { id: 'caba', name: 'Ciudad Autónoma de Buenos Aires' },
  { id: 'cordoba', name: 'Córdoba' },
  { id: 'santa_fe', name: 'Santa Fe' },
  { id: 'mendoza', name: 'Mendoza' },
  { id: 'corrientes', name: 'Corrientes' },
  { id: 'chaco', name: 'Chaco' },
  { id: 'entre_rios', name: 'Entre Ríos' },
  { id: 'tucuman', name: 'Tucumán' },
  { id: 'salta', name: 'Salta' },
  { id: 'jujuy', name: 'Jujuy' },
  { id: 'santiago_del_estero', name: 'Santiago del Estero' },
  { id: 'san_juan', name: 'San Juan' },
  { id: 'san_luis', name: 'San Luis' },
  { id: 'neuquen', name: 'Neuquén' },
  { id: 'rio_negro', name: 'Río Negro' },
  { id: 'chubut', name: 'Chubut' },
  { id: 'santa_cruz', name: 'Santa Cruz' },
  { id: 'tierra_del_fuego', name: 'Tierra del Fuego' },
  { id: 'la_pampa', name: 'La Pampa' },
  { id: 'la_rioja', name: 'La Rioja' },
  { id: 'catamarca', name: 'Catamarca' },
  { id: 'formosa', name: 'Formosa' },
];

export const ARGENTINA_CITIES: GeoCity[] = [
  // Misiones
  { id: 'posadas', provinceId: 'misiones', name: 'Posadas' },
  { id: 'obera', provinceId: 'misiones', name: 'Oberá' },
  { id: 'eldorado', provinceId: 'misiones', name: 'Eldorado' },
  { id: 'puerto_iguazu', provinceId: 'misiones', name: 'Puerto Iguazú' },
  { id: 'apostoles', provinceId: 'misiones', name: 'Apóstoles' },
  { id: 'leandro_n_alem', provinceId: 'misiones', name: 'Leandro N. Alem' },
  { id: 'montecarlo', provinceId: 'misiones', name: 'Montecarlo' },
  { id: 'san_vicente', provinceId: 'misiones', name: 'San Vicente' },

  // CABA
  { id: 'caba_centro', provinceId: 'caba', name: 'Centro / Retiro' },
  { id: 'caba_palermo', provinceId: 'caba', name: 'Palermo' },
  { id: 'caba_belgrano', provinceId: 'caba', name: 'Belgrano' },
  { id: 'caba_puerto_madero', provinceId: 'caba', name: 'Puerto Madero' },
  { id: 'caba_recoleta', provinceId: 'caba', name: 'Recoleta' },
  { id: 'caba_caballito', provinceId: 'caba', name: 'Caballito' },

  // Buenos Aires
  { id: 'la_plata', provinceId: 'buenos_aires', name: 'La Plata' },
  { id: 'mar_del_plata', provinceId: 'buenos_aires', name: 'Mar del Plata' },
  { id: 'bahia_blanca', provinceId: 'buenos_aires', name: 'Bahía Blanca' },
  { id: 'tandil', provinceId: 'buenos_aires', name: 'Tandil' },
  { id: 'san_isidro', provinceId: 'buenos_aires', name: 'San Isidro' },
  { id: 'vicente_lopez', provinceId: 'buenos_aires', name: 'Vicente López' },
  { id: 'quilmes', provinceId: 'buenos_aires', name: 'Quilmes' },
  { id: 'pilar', provinceId: 'buenos_aires', name: 'Pilar' },
  { id: 'moron', provinceId: 'buenos_aires', name: 'Morón' },

  // Córdoba
  { id: 'cordoba_capital', provinceId: 'cordoba', name: 'Córdoba Capital' },
  { id: 'villa_carlos_paz', provinceId: 'cordoba', name: 'Villa Carlos Paz' },
  { id: 'rio_cuarto', provinceId: 'cordoba', name: 'Río Cuarto' },
  { id: 'villa_maria', provinceId: 'cordoba', name: 'Villa María' },
  { id: 'san_francisco', provinceId: 'cordoba', name: 'San Francisco' },

  // Santa Fe
  { id: 'rosario', provinceId: 'santa_fe', name: 'Rosario' },
  { id: 'santa_fe_capital', provinceId: 'santa_fe', name: 'Santa Fe Capital' },
  { id: 'rafaela', provinceId: 'santa_fe', name: 'Rafaela' },
  { id: 'venado_tuerto', provinceId: 'santa_fe', name: 'Venado Tuerto' },

  // Mendoza
  { id: 'mendoza_capital', provinceId: 'mendoza', name: 'Mendoza Capital' },
  { id: 'godoy_cruz', provinceId: 'mendoza', name: 'Godoy Cruz' },
  { id: 'san_rafael', provinceId: 'mendoza', name: 'San Rafael' },
  { id: 'guaymallen', provinceId: 'mendoza', name: 'Guaymallén' },

  // Corrientes
  { id: 'corrientes_capital', provinceId: 'corrientes', name: 'Corrientes Capital' },
  { id: 'goya', provinceId: 'corrientes', name: 'Goya' },
  { id: 'paso_de_los_libres', provinceId: 'corrientes', name: 'Paso de los Libres' },
  { id: 'curuzu_cuatia', provinceId: 'corrientes', name: 'Curuzú Cuatiá' },

  // Chaco
  { id: 'resistencia', provinceId: 'chaco', name: 'Resistencia' },
  { id: 'saenz_pena', provinceId: 'chaco', name: 'Presidencia Roque Sáenz Peña' },
  { id: 'villa_angela', provinceId: 'chaco', name: 'Villa Ángela' },

  // Entre Ríos
  { id: 'parana', provinceId: 'entre_rios', name: 'Paraná' },
  { id: 'concordia', provinceId: 'entre_rios', name: 'Concordia' },
  { id: 'gualeguaychu', provinceId: 'entre_rios', name: 'Gualeguaychú' },

  // Tucumán
  { id: 'san_miguel_de_tucuman', provinceId: 'tucuman', name: 'San Miguel de Tucumán' },
  { id: 'yerba_buena', provinceId: 'tucuman', name: 'Yerba Buena' },
  { id: 'tafi_viejo', provinceId: 'tucuman', name: 'Tafí Viejo' },

  // Salta
  { id: 'salta_capital', provinceId: 'salta', name: 'Salta Capital' },
  { id: 'san_ramon_de_la_nueva_oran', provinceId: 'salta', name: 'Orán' },
  { id: 'tartagal', provinceId: 'salta', name: 'Tartagal' },

  // Jujuy
  { id: 'san_salvador_de_jujuy', provinceId: 'jujuy', name: 'San Salvador de Jujuy' },
  { id: 'palpala', provinceId: 'jujuy', name: 'Palpalá' },
  { id: 'san_pedro_de_jujuy', provinceId: 'jujuy', name: 'San Pedro de Jujuy' },

  // Neuquén
  { id: 'neuquen_capital', provinceId: 'neuquen', name: 'Neuquén Capital' },
  { id: 'san_martin_de_los_andes', provinceId: 'neuquen', name: 'San Martín de los Andes' },
  { id: 'zapala', provinceId: 'neuquen', name: 'Zapala' },

  // Río Negro
  { id: 'san_carlos_de_bariloche', provinceId: 'rio_negro', name: 'San Carlos de Bariloche' },
  { id: 'viedma', provinceId: 'rio_negro', name: 'Viedma' },
  { id: 'general_roca', provinceId: 'rio_negro', name: 'General Roca' },
  { id: 'cipolletti', provinceId: 'rio_negro', name: 'Cipolletti' },

  // San Juan
  { id: 'san_juan_capital', provinceId: 'san_juan', name: 'San Juan Capital' },
  { id: 'rawson', provinceId: 'san_juan', name: 'Rawson' },

  // San Luis
  { id: 'san_luis_capital', provinceId: 'san_luis', name: 'San Luis Capital' },
  { id: 'villa_mercedes', provinceId: 'san_luis', name: 'Villa Mercedes' },

  // Santiago del Estero
  { id: 'santiago_capital', provinceId: 'santiago_del_estero', name: 'Santiago del Estero Capital' },
  { id: 'la_banda', provinceId: 'santiago_del_estero', name: 'La Banda' },

  // Chubut
  { id: 'comodoro_rivadavia', provinceId: 'chubut', name: 'Comodoro Rivadavia' },
  { id: 'trelew', provinceId: 'chubut', name: 'Trelew' },
  { id: 'puerto_madryn', provinceId: 'chubut', name: 'Puerto Madryn' },

  // Santa Cruz
  { id: 'rio_gallegos', provinceId: 'santa_cruz', name: 'Río Gallegos' },
  { id: 'caleta_olivia', provinceId: 'santa_cruz', name: 'Caleta Olivia' },

  // Tierra del Fuego
  { id: 'ushuaia', provinceId: 'tierra_del_fuego', name: 'Ushuaia' },
  { id: 'rio_grande', provinceId: 'tierra_del_fuego', name: 'Río Grande' },

  // Formosa
  { id: 'formosa_capital', provinceId: 'formosa', name: 'Formosa Capital' },
  { id: 'clorinda', provinceId: 'formosa', name: 'Clorinda' },

  // Catamarca
  { id: 'catamarca_capital', provinceId: 'catamarca', name: 'San Fernando del Valle de Catamarca' },

  // La Rioja
  { id: 'la_rioja_capital', provinceId: 'la_rioja', name: 'La Rioja Capital' },
  { id: 'chilecito', provinceId: 'la_rioja', name: 'Chilecito' },

  // La Pampa
  { id: 'santa_rosa', provinceId: 'la_pampa', name: 'Santa Rosa' },
  { id: 'general_pico', provinceId: 'la_pampa', name: 'General Pico' },
];

export const DEFAULT_JOB_CATEGORIES = [
  { id: 'tecnologia', name: 'Tecnología y Software' },
  { id: 'diseno', name: 'Diseño, Creatividad y UX/UI' },
  { id: 'marketing', name: 'Marketing y Ventas' },
  { id: 'administracion', name: 'Administración y Finanzas' },
  { id: 'recursos_humanos', name: 'Recursos Humanos' },
  { id: 'ingenieria', name: 'Ingeniería y Producción' },
  { id: 'salud', name: 'Salud y Medicina' },
  { id: 'educacion', name: 'Educación y Capacitación' },
  { id: 'logistica', name: 'Logística y Operaciones' },
  { id: 'atencion_cliente', name: 'Atención al Cliente y Soporte' },
  { id: 'legales', name: 'Legales y Compliance' },
  { id: 'oficios', name: 'Oficios y Mantenimiento' },
];

export function getCitiesByProvince(provinceId?: string): GeoCity[] {
  if (!provinceId) return [];
  return ARGENTINA_CITIES.filter((c) => c.provinceId === provinceId);
}

export function getProvinceName(provinceId?: string): string {
  if (!provinceId) return '';
  return ARGENTINA_PROVINCES.find((p) => p.id === provinceId)?.name || provinceId;
}

export function getCityName(cityId?: string): string {
  if (!cityId) return '';
  return ARGENTINA_CITIES.find((c) => c.id === cityId)?.name || cityId;
}

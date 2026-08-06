// lib/reservas/genderByName.ts
//
// Inferencia de género a partir del primer nombre, pensada para nombres
// comunes en Argentina. No es exacta (~90% de aciertos esperados) — se usa
// solo para decidir prioridad de piso en grupos grandes, nunca para negar
// una reserva. El admin siempre puede reasignar la mesa manualmente.

function normalize(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // saca acentos
}

// Nombres masculinos que terminan en "a" (excepción a la heurística de terminación)
const MALE_ENDING_A = new Set([
  'luca', 'nahuel', 'joaquin', // por si llega sin acento
  'tobias', 'matias', 'elias', 'jonas', 'lucas',
  'ezequiel', // no termina en a pero por las dudas de matches parciales no afecta
])

// Nombres femeninos comunes que NO terminan en "a"/"i"/"y" (excepción a la heurística)
const FEMALE_NAMES = new Set([
  'maria', 'ana', 'sofia', 'sofía', 'valentina', 'camila', 'martina', 'lucia', 'lucía',
  'julieta', 'agustina', 'victoria', 'catalina', 'emilia', 'josefina', 'renata',
  'mia', 'mía', 'abril', 'delfina', 'guadalupe', 'milagros', 'candela', 'antonella',
  'micaela', 'daniela', 'florencia', 'carolina', 'paula', 'laura', 'lorena', 'romina',
  'yamila', 'brenda', 'jazmin', 'jazmín', 'melina', 'melisa', 'mariana', 'adriana',
  'gabriela', 'patricia', 'silvia', 'claudia', 'monica', 'mónica', 'veronica', 'verónica',
  'andrea', 'sandra', 'sabrina', 'natalia', 'valeria', 'vanesa', 'vanessa', 'yesica',
  'jesica', 'jessica', 'noelia', 'estefania', 'estefanía', 'ailen', 'ailén', 'ayelen',
  'ayelén', 'rocio', 'rocío', 'belen', 'belén', 'ines', 'inés', 'isabel', 'carmen',
  'pilar', 'luz', 'noor', 'yasmin', 'yasmín', 'dolores', 'constanza', 'esperanza',
  'soledad', 'milena', 'ariadna', 'zoe', 'zoé', 'elena', 'irene', 'raquel', 'ruth',
  'noemi', 'noemí', 'ivon', 'ivon', 'jimena', 'ximena', 'lourdes', 'marisol', 'mercedes',
  'nadia', 'nair', 'nayla', 'oriana', 'priscila', 'rosario', 'salome', 'salomé',
  'tamara', 'valentin_f', // placeholder, ignorar
])

const MALE_NAMES = new Set([
  'juan', 'jose', 'josé', 'carlos', 'luis', 'jorge', 'martin', 'martín', 'diego',
  'pablo', 'pedro', 'miguel', 'sebastian', 'sebastián', 'nicolas', 'nicolás',
  'gonzalo', 'facundo', 'ignacio', 'santiago', 'tomas', 'tomás', 'matias', 'matías',
  'lucas', 'joaquin', 'joaquín', 'benjamin', 'benjamín', 'franco', 'bruno', 'agustin',
  'agustín', 'gaston', 'gastón', 'ezequiel', 'emanuel', 'maximiliano', 'ariel',
  'alejandro', 'fernando', 'ricardo', 'roberto', 'raul', 'raúl', 'hector', 'héctor',
  'oscar', 'ruben', 'rubén', 'sergio', 'daniel', 'federico', 'guillermo', 'gustavo',
  'marcelo', 'mariano', 'mario', 'rodrigo', 'rodolfo', 'walter', 'cristian', 'cristián',
  'kevin', 'brian', 'ivan', 'iván', 'axel', 'thiago', 'valentino', 'dylan', 'damian',
  'damián', 'leandro', 'leonardo', 'esteban', 'julian', 'julián', 'nahuel', 'lautaro',
  'ramiro', 'renzo', 'ulises', 'octavio', 'maximo', 'máximo', 'francisco', 'andres',
  'andrés', 'alberto', 'eduardo', 'enrique', 'antonio', 'angel', 'ángel', 'adrian',
  'adrián', 'alan', 'elias', 'elías', 'emilio', 'ezequias',
])

export type InferredGender = 'F' | 'M' | 'unknown'

export function inferGender(fullName: string): InferredGender {
  if (!fullName) return 'unknown'
  const firstName = normalize(fullName.split(' ')[0])
  if (!firstName) return 'unknown'

  if (FEMALE_NAMES.has(firstName)) return 'F'
  if (MALE_NAMES.has(firstName)) return 'M'

  // Heurística de terminación (válida en la gran mayoría de nombres en castellano)
  if (MALE_ENDING_A.has(firstName)) return 'M'
  if (firstName.endsWith('a')) return 'F'
  if (firstName.endsWith('o')) return 'M'

  return 'unknown'
}

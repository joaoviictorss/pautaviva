// Primeira camada da triagem: barata e sem rede. Não decide sozinha — só sinaliza para a IA e para a moderação.
type Category = 'ofensa' | 'ódio' | 'ameaça'

// shortcut: lista curta mantida à mão; ampliar conforme a moderação encontrar termos novos.
const TERMS: Record<Category, string[]> = {
  ofensa: [
    'idiota', 'imbecil', 'otario', 'babaca', 'burro', 'estupido', 'retardado', 'mongoloide', 'desgracado',
    'filho da puta', 'fdp', 'puta', 'caralho', 'porra', 'merda', 'bosta', 'cuzao', 'arrombado', 'vagabundo',
    'canalha', 'safado', 'corno', 'escroto', 'piranha', 'vadia', 'verme', 'buceta', 'foder', 'fuder',
    'vai se foder', 'vai tomar no cu', 'pau no cu', 'vsf', 'tnc', 'lixo humano',
  ],
  ódio: ['viado', 'bicha', 'sapatao', 'traveco', 'macaco imundo', 'volta pra sua terra'],
  ameaça: ['vou te matar', 'vou matar', 'te pegar na saida', 'merece morrer', 'vai morrer', 'vou te encontrar'],
}

const LEET: Record<string, string> = { '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't', '@': 'a', $: 's' }

/** Minúsculas, sem acento, sem leetspeak e sem letra repetida ("D3sgraçaaado" → "desgracado"). */
export function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[013457@$]/g, (char) => LEET[char])
    .replace(/(\p{L})\1+/gu, '$1')
    .split(/[^\p{L}]+/u)
    .filter(Boolean)
    .join(' ')
}

// o feminino e o plural de cada termo também contam
function forms(term: string) {
  const base = normalize(term)
  const variants = base.endsWith('o') ? [base, `${base.slice(0, -1)}a`] : [base]
  return [...variants, ...variants.map((variant) => `${variant}s`)]
}

const PATTERNS = Object.entries(TERMS).flatMap(([category, terms]) =>
  terms.map((term) => ({ term, category: category as Category, forms: forms(term) })),
)

export function findOffensiveTerms(text: string) {
  // espaços nas pontas: só casa palavra inteira ("Cassiano" não casa "cu")
  const padded = ` ${normalize(text)} `
  return PATTERNS.filter((pattern) => pattern.forms.some((form) => padded.includes(` ${form} `))).map(
    ({ term, category }) => ({ term, category }),
  )
}

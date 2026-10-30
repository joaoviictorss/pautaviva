import assert from 'node:assert/strict'
import { test } from 'node:test'

import { findOffensiveTerms } from './offensive-words.js'

const terms = (text: string) => findOffensiveTerms(text).map(({ term }) => term)

test('pega acento, leetspeak, letra repetida, feminino e plural', () => {
  assert.deepEqual(terms('marcos desgraçado'), ['desgracado'])
  assert.deepEqual(terms('D3SGRAÇAAADA'), ['desgracado'])
  assert.deepEqual(terms('bando de idiotas'), ['idiota'])
  assert.deepEqual(terms('Se aprovarem isso, vou te matar'), ['vou te matar'])
})

test('não casa pedaço de palavra nem comentário limpo', () => {
  assert.deepEqual(terms('O Cassiano propôs a coleta de lixo no bairro'), [])
  assert.deepEqual(terms('Concordo, a proposta melhora a iluminação da escola'), [])
})

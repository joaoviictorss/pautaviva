import assert from 'node:assert/strict'
import { test } from 'node:test'

import { screenComment } from './comment-moderation.js'

test('reprova automaticamente comentários que contenham termos da lista', async () => {
  const logger = { error() {} }

  for (const text of [
    'Essa política de moradia é estúpida e mal planejada.',
    'A proposta de coleta seletiva está uma merda.',
  ]) {
    const result = await screenComment(text, logger)

    assert.equal(result.classification, 'INAPPROPRIATE')
    assert.equal(result.autoRejected, true)
    assert.match(result.reason, /reprovado automaticamente/)
  }
})

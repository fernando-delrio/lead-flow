import assert from 'node:assert/strict'
import test from 'node:test'
import { calculateShipping, calculateTotal } from '../src/cart.js'

test('an empty cart has no shipping cost', () => {
  assert.equal(calculateShipping([]), 0)
  assert.equal(calculateTotal([]), 0)
})

test('a cart pays standard shipping', () => {
  const items = [{ price: 20, quantity: 2 }]
  assert.equal(calculateShipping(items), 4.99)
  assert.equal(calculateTotal(items), 44.99)
})

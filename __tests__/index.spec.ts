import { expect } from 'chai'

import { get, search } from '../src'

it('should return say', () => {
  const say = get(102, 'en')
  expectSay(say)
})

it('should search for say', () => {
  const say = search('say', 'en')
  expectSay(say)
})

it('should search for say with fuzzy search', () => {
  const say = search('/sai', 'en', 1)
  expectSay(say)
})

it('should not search for say with 0 distance', () => {
  const say = search('/sai', 'en', 0)
  expect(say).to.be.a('undefined')
})

function expectSay(macro: any) {
  expect(macro).to.have.property('ID', 102)
  expect(macro).to.have.property('Command', '/say')
  expect(macro).to.have.a.property('Description').which.include('Sends a message to all PCs within a small radius.')
}

/**
 * Unit tests for the action's main functionality, src/main.js
 */
import { describe, it, mock, afterEach } from 'node:test'
import assert from 'node:assert/strict'

const debug = mock.fn()
const getInput = mock.fn()
const setFailed = mock.fn()
const setOutput = mock.fn()
const exportVariable = mock.fn()
const info = mock.fn()

// Mock the GitHub Actions core library
// ESM: Need to mock whole module
mock.module('@actions/core', {
  namedExports: {
    debug,
    getInput,
    setFailed,
    setOutput,
    exportVariable,
    info
  }
})

const getAllMatches = mock.fn()

const { nextBuildNumber } = await import('../src/quayio.js')

// ESM: Need to mock whole module, can't mock single function
mock.module('../src/quayio.js', {
  namedExports: {
    getAllMatches,
    nextBuildNumber
  }
})

const { run } = await import('../src/main.js')

describe('main', () => {
  afterEach(() => {
    debug.mock.resetCalls()
    getInput.mock.resetCalls()
    setFailed.mock.resetCalls()
    setOutput.mock.resetCalls()
    exportVariable.mock.resetCalls()
    info.mock.resetCalls()
    getAllMatches.mock.resetCalls()
  })

  it('runs main with mocks', async function () {
    debug.mock.mockImplementation((...args) => console.debug(...args))
    getInput.mock.mockImplementation(a => {
      if (a === 'version') return '1.2.3'
      if (a === 'repository') return 'owner/repo'
      if (a === 'strict') return 'true'
      if (a === 'allTags') return 'false'
      throw new Error(`Invalid input name ${a}`)
    })

    getAllMatches.mock.mockImplementation(() => [
      '1.2.3-1',
      '1.2.3-62',
      '1.2.3-53'
    ])

    await run()

    assert.equal(getInput.mock.callCount(), 4)

    assert.equal(getAllMatches.mock.callCount(), 1)
    assert.deepEqual(getAllMatches.mock.calls[0].arguments, [
      'owner/repo',
      '1.2.3',
      true
    ])

    assert.equal(setOutput.mock.callCount(), 2)
    assert.deepEqual(setOutput.mock.calls[0].arguments, [
      'tags',
      ['1.2.3-1', '1.2.3-62', '1.2.3-53']
    ])
    assert.deepEqual(setOutput.mock.calls[1].arguments, ['buildNumber', 63])

    assert.equal(exportVariable.mock.callCount(), 2)
    assert.deepEqual(exportVariable.mock.calls[0].arguments, [
      'GET_QUAYIO_TAGS_TAGS',
      ['1.2.3-1', '1.2.3-62', '1.2.3-53']
    ])
    assert.deepEqual(exportVariable.mock.calls[1].arguments, [
      'GET_QUAYIO_TAGS_BUILDNUMBER',
      63
    ])
  })

  it('checks main returns errors', async function () {
    debug.mock.mockImplementation((...args) => console.debug(...args))
    getInput.mock.mockImplementation(a => {
      if (a === 'version') return '1.2.3'
      if (a === 'repository') return 'owner/repo'
      if (a === 'strict') return 'invalid'
      if (a === 'allTags') return 'invalid'
      throw new Error(`Invalid input name ${a}`)
    })

    await run()

    assert.equal(getInput.mock.callCount(), 4)
    assert.equal(getAllMatches.mock.callCount(), 0)
    assert.equal(setOutput.mock.callCount(), 0)
    assert.equal(exportVariable.mock.callCount(), 0)

    assert.equal(setFailed.mock.callCount(), 1)
    assert.deepEqual(setFailed.mock.calls[0].arguments, [
      "strict must be 'true' or 'false': invalid"
    ])
  })
})

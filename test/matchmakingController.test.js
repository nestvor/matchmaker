/**
 * Tests for the matchmaking controller
 */
'use strict'

let config = require('../config')
config.db.path = 'test/db'

const sinon = require('sinon')
const chai = require('chai')
const assert = chai.assert
const constants = require('../constants')
const controller = require('../matchmaking/matchmakingController')
const matchmaking = require('../matchmaking/matchmaking')

let req
let res

describe('Matchmaking controller - input params', function () {
  beforeEach(() => {
    setRequestResponseStubs()
  })

  it('empty player handle', () => {
    controller.findMatch(req, res)
    assert.equal(res.responseStatus, 400)
    assert.equal(res.message, 'Player handle is required!')
  })

  it('empty game', () => {
    req.params.playerHandle = 'hankey'
    controller.findMatch(req, res)

    assert.equal(res.responseStatus, 400)
    assert.equal(res.message, 'Game is required!')
  })
})

describe('Matchmaking controller - response codes', function () {
  let sandbox

  beforeEach(() => {
    setRequestResponseStubs()
    req.params.playerHandle = 'hankey'
    req.query.game = 'UT99'

    sandbox = sinon.sandbox.create()
  })

  afterEach(() => {
    sandbox.restore()
  })

  it('bad request', () => {
    let error = new Error()
    error.name = constants.PLAYER_HANDLE_REQUIRED
    sandbox.stub(matchmaking, 'findMatch').callsArgWith(2, error)

    controller.findMatch(req, res)

    // expect bad request response
    assert.equal(res.responseStatus, 400)
  })

  it('no response', () => {
    let error = new Error()
    error.name = constants.NO_MATCHING_PLAYERS_FOUND
    sandbox.stub(matchmaking, 'findMatch').callsArgWith(2, error)

    controller.findMatch(req, res)

    // expect no content response
    assert.equal(res.responseStatus, 204)
  })

  it('internal server error', () => {
    sandbox.stub(matchmaking, 'findMatch').callsArgWith(2, new Error('unknown'))

    controller.findMatch(req, res)

    // expect internal error response
    assert.equal(res.responseStatus, 500)
    assert.equal(res.message, 'Oops, something went wrong')
  })

  it('ok response', () => {
    sandbox.stub(matchmaking, 'findMatch').callsArgWith(2, null, {
      codename: 'Godlike Bot',
      rankings: [{game: 'UT99', totalScore: 99999999}]
    })

    controller.findMatch(req, res)

    // expect ok response
    assert.equal(res.responseStatus, 200)
    assert.exists(res.json)
    assert.equal(res.json.codename, 'Godlike Bot')
  })
})

/**
 * (re)sets the request and response stubs
 */
function setRequestResponseStubs () {
  req = {params: {}, query: {}}
  res = {
    send: (message) => {
      res.message = message
    },
    json: (json) => {
      res.responseStatus = 200
      res.json = json
    },
    status: (responseStatus) => {
      res.responseStatus = responseStatus
      return res
    }
  }
}
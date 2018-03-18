/**
 * Tests for the matchmaking logic
 */
'use strict'

let config = require('../config')
config.db.path = 'test/db'

const sinon = require('sinon')
const chai = require('chai')
const assert = chai.assert
const constants = require('../constants')
const matchmaking = require('../matchmaking/matchmaking')
const playerRepository = require('../model/playerRepository')

describe('Matchmaking logic - input params', () => {
  it('null player handle', (done) => {
    matchmaking.findMatch(null, 'Overwatch', (err, data) => {
      assert.exists(err)
      assert.notExists(data)
      assert.equal(err.name, constants.PLAYER_HANDLE_REQUIRED)
      done()
    })
  })

  it('null game name', (done) => {
    matchmaking.findMatch('hankey', null, (err, data) => {
      assert.exists(err)
      assert.notExists(data)
      assert.equal(err.name, constants.GAME_REQUIRED)
      done()
    })
  })
})

describe('Matchmaking logic - player repository problems', () => {
  it('player with handle not found', (done) => {
    matchmaking.findMatch('hankey', 'UT99', (err, data) => {
      assert.exists(err)
      assert.notExists(data)
      assert.equal(err.name, constants.PLAYER_WITH_HANDLE_NOT_FOUND)
      done()
    })
  })

  it('queue for game is empty', (done) => {
    matchmaking.findMatch('MISSE', 'UT99', (err, data) => {
      assert.exists(err)
      assert.notExists(data)
      assert.equal(err.name, constants.NO_PLAYERS_IN_QUEUE_FOR_GAME)
      done()
    })
  })

  it('queue is not reachable', (done) => {
    let sandbox = sinon.sandbox.create()

    // simulate unreachable queue
    sandbox.stub(playerRepository, 'getAllPlayers').yields(null)

    matchmaking.findMatch('MISSE', 'UT99', (err, data) => {
      assert.exists(err)
      assert.notExists(data)
      assert.equal(err.name, constants.ALL_PLAYERS_LIST_EMPTY)
      sandbox.restore()
      done()
    })
  })
})

describe('Matchmaking logic - actual matching', () => {
  let sandbox

  beforeEach(() => {
    sandbox = sinon.sandbox.create()
  })

  afterEach(() => {
    sandbox.restore()
  })

  it('no potential matches', (done) => {
    // simulate opponent with crazy skill rating
    sandbox.stub(playerRepository, 'getAllPlayers').yields(null, [{
      codename: 'Godlike Bot',
      rankings: [{game: 'UT99', totalScore: 99999999}]
    }])

    matchmaking.findMatch('MISSE', 'UT99', (err, data) => {
      assert.exists(err)
      assert.notExists(data)
      assert.equal(err.name, constants.NO_MATCHING_PLAYERS_FOUND)
      done()
    })
  })

  it('select correct match - skill rating', (done) => {
    // simulate potential opponents
    sandbox.stub(playerRepository, 'getAllPlayers').yields(null, [
      {
        codename: 'Novice Bot',
        queuedFrom: new Date(),
        rankings: [{game: 'UT99', totalScore: 410}]
      },
      {
        codename: 'Adept Bot',
        queuedFrom: new Date(),
        rankings: [{game: 'UT99', totalScore: 899}]
      }])

    matchmaking.findMatch('MISSE', 'UT99', (err, data) => {
      assert.notExists(err)
      assert.exists(data)

      // expect to match Novice Bot since the skill gap is lesser
      assert.equal(data.codename, 'Novice Bot')
      done()
    })
  })

  it('select correct match - long queue time', (done) => {
    let now = new Date()
    let agesAgo = new Date().setHours(now.getHours() - 10)

    // simulate potential opponents - adept bot has spent a lot of time in the queue
    sandbox.stub(playerRepository, 'getAllPlayers').yields(null, [
      {
        codename: 'Novice Bot',
        queuedFrom: now,
        rankings: [{game: 'UT99', totalScore: 410}]
      },
      {
        codename: 'Adept Bot',
        queuedFrom: agesAgo,
        rankings: [{game: 'UT99', totalScore: 899}]
      }])

    matchmaking.findMatch('MISSE', 'UT99', (err, data) => {
      assert.notExists(err)
      assert.exists(data)

      // expect to match Adept Bot since he spent ages in the queue
      assert.equal(data.codename, 'Adept Bot')
      done()
    })
  })
})

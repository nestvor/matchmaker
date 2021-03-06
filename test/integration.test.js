/**
 * Integration test for the matchmaking service
 */
'use strict'

const chai = require('chai')
const assert = chai.assert
const request = require('request')

const base = 'http://localhost:3000'

describe('Integration test', () => {
  let server

  before(function () {
    reconnectDataSource()
    server = require('../app')
  })

  after(function (done) {
    server.close(done)
  })

  it('should find a valid match', (done) => {
    request.get(base + '/matchmaker/CABA?game=USF4', (err, res, body) => {
      assert.notExists(err)
      assert.exists(body)
      assert.equal(res.statusCode, 200)
      done()
    })
  })
})

/**
 * Ensures that the integration test will use the larger data set
 */
function reconnectDataSource () {
  delete require.cache[require.resolve('../model/playerRepository')]
  let config = require('../config')
  config.db.path = 'db'
  require('../model/playerRepository')
}

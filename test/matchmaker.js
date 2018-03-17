const expect = require('chai').expect
const matchmaker = require('../matchmaking/matchmakingController')

describe('Matchmaker', function () {
  describe('List all tasks', function () {
    it('lists all tasks', function () {
      let res = {}
      res.json = function (json) {
        return json
      }

      let drek = matchmaker.list_all_tasks(null, res)

      expect(drek).to.equal({message: 'Task successfully deleted'})
    })
  })
})

/**
 * The player repository. Methods that deal with persistent data go here
 */
'use strict'

let db = require('diskdb')
db = db.connect('db', ['players'])

/**
 * Finds the player with the specified handle in the repository.
 * @param playerHandle the player handle to search for
 * @param callback the callback to call once done
 */
module.exports.getPlayerByHandle = function (playerHandle, callback) {
  let player = db.players.findOne({codename: playerHandle})
  callback(null, player)
}

/**
 * Retrieves all players from the repository.
 * @param callback the callback to call once done
 */
module.exports.getAllPlayers = function (callback) {
  let players = db.players.find()
  callback(null, players)
}

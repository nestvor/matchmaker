/**
 * The controller that handles matchmaking requests
 */
'use strict'

const constants = require('../constants')
const matchmaking = require('./matchmaking')

/**
 * Attempts to match the provided player with a suitable opponent for the specified game
 * @param req the request object that holds the player handle and the game name
 * @param res the response object that receives the response
 */
module.exports.findMatch = function (req, res) {
  let playerHandle = req.params.playerHandle
  if (!playerHandle) {
    res.status(400).send('Player handle is required!')
    return
  }

  let game = req.query.game
  if (!game) {
    res.status(400).send('Game is required!')
    return
  }

  // find a match!
  matchmaking.findMatch(playerHandle, game, function (err, data) {
    if (err) {
      switch (err.name) {
        case constants.PLAYER_HANDLE_REQUIRED:
        case constants.GAME_REQUIRED:
        case constants.PLAYER_WITH_HANDLE_NOT_FOUND:
        case constants.ALL_PLAYERS_LIST_EMPTY:
          res.status(400).send(err.message)
          break
        case constants.NO_PLAYERS_IN_QUEUE_FOR_GAME:
        case constants.NO_MATCHING_PLAYERS_FOUND:
          res.status(204).send(err.message)
          break
        default:
          res.status(500).send('Oops, something went wrong')
      }
    }

    res.json(data)
  })
}

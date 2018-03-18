/**
 * The core matchmaking logic
 */
'use strict'

const constants = require('../constants')
const config = require('../config')
const async = require('async')
const randomDate = require('random-datetime')
const playerRepository = require('../model/playerRepository')

/**
 * Matches the given player to a suitable opponent in the provided game.<br>
 * The flow is as follows:<br>
 * - fetch the player we are matching for<br>
 * - perform checks on the player<br>
 * - build the queue of waiting players (note: this is currently simulated by simply returning the entire data set sans
 * the actual player<br>
 * - find the best match for the player in the queue and return it<br>
 * The order of the tasks, where needed, is enforced using the async utility
 * @param playerHandle the player we are finding a suitable opponent for
 * @param game the game for which the matching is being done
 * @param done the callback to call once finished
 */
module.exports.findMatch = function (playerHandle, game, done) {
  if (!playerHandle) {
    let error = new Error('Player handle is required to perform matching')
    error.name = constants.PLAYER_HANDLE_REQUIRED
    done(error)
    return
  }

  if (!game) {
    let error = new Error('Game is required to perform matching')
    error.name = constants.GAME_REQUIRED
    done(error)
    return
  }

  async.auto({
    playerByHandle: (callback) => {
      playerRepository.getPlayerByHandle(playerHandle, callback)
    },
    checkPlayer: ['playerByHandle', (results, callback) => {
      checkPlayerToMatch(results.playerByHandle, game, callback)
    }],
    allPlayers: playerRepository.getAllPlayers,
    queue: ['checkPlayer', 'allPlayers', (results, callback) => {
      buildQueue(results, game, callback)
    }],
    match: ['queue', (results, callback) => {
      match(results.playerByHandle, game, results.queue, callback)
    }]
  },
  (err, results) => {
    if (err) {
      done(err)
      return
    }

    done(null, results.match)
  })
}

/**
 * Peforms checks on the player for whom the matchmaking is being done.
 * @param playerToCheck the player to check
 * @param game the name of the game the matching is being done for
 * @param callback the callback
 */
function checkPlayerToMatch (playerToCheck, game, callback) {
  // the player needs to exist in the data set
  if (!playerToCheck) {
    let error = new Error('Player with provided handle not found')
    error.name = constants.PLAYER_WITH_HANDLE_NOT_FOUND
    callback(error)
    return
  }

  // if the player has no game rankings, init with an empty array
  let rankings = playerToCheck.rankings
  if (!rankings) {
    rankings = []
  }

  // fetch the rankings for our game
  let gameRanking = getPlayerGameRanking(playerToCheck, game)

  // no rankings for this game, create a 'beginner' ranking for the player
  if (!gameRanking || gameRanking.length === 0) {
    playerToCheck.rankings.push({game: game, totalScore: 0, rank: constants.UNRANKED})
  }

  callback(null)
}

/**
 * Builds a waiting player queue using the dataset players.<br>
 * The queue is built up of the entire set, while omitting the player the matchmaking is being done for.<br>
 * This function applies random queue time timestamps, this enables preferential treatment of players that have
 * spent more time in the waiting queue
 * @param results the object that holds the results of previous tasks
 * @param game the game for which the queue is being built
 * @param callback the callback
 */
function buildQueue (results, game, callback) {
  // fail if the dataset cannot be loaded
  let allPlayers = results.allPlayers
  if (!allPlayers) {
    let error = new Error('The list of all players is null or empty')
    error.name = constants.ALL_PLAYERS_LIST_EMPTY
    callback(error)
    return
  }

  let playerToMatch = results.playerByHandle

  // filters all the players with rankings in the specified game sans the user we are doing the matching for
  allPlayers = allPlayers.filter((player) => {
    return player.codename !== playerToMatch.codename &&
      player.rankings &&
      player.rankings.filter(function (gameRanking) {
        return gameRanking.game === game
      }).length > 0
  })

  // no players in queue for the game, fail
  if (allPlayers.length === 0) {
    let error = new Error('No players currently in queue for game: ' + game)
    error.name = constants.NO_PLAYERS_IN_QUEUE_FOR_GAME
    callback(error)
    return
  }

  // since our data set does not include information about the amount of time players have spent in the queue, we apply
  // random queue times
  allPlayers.forEach((queuePlayer) => {
    if (queuePlayer.queuedFrom) {
      return
    }

    let now = new Date()
    queuePlayer.queuedFrom = randomDate({
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      day: now.getDate(),
      hour: now.getHours()
    })
  })

  callback(null, allPlayers)
}

/**
 * Attempts to find the best match for the player among the queued players.<br>
 * - find potential matches that are of similar skill rating, the skill difference can be configured. If no matches are
 * found, the search is repeated for a configurable amount of times, each search using a wider skill gap.
 * - potential matches are then scored based on several parameters, the best match is then returned as the result.
 * @param player the player for which the matching is being done
 * @param game the game the matching is being done for
 * @param queue the queued players
 * @param callback the callback
 */
function match (player, game, queue, callback) {
  let potentialMatches = []
  let SKILL_DIFFERENCE_PER_RETRY = config.skillDifferencePerRetry
  let MAX_RETRIES = config.maxPotentialMatchRetries
  let attempt = 1

  // attempt to find potential matches according to the maximum skill difference, each attempt widens the net
  while (attempt <= MAX_RETRIES && potentialMatches.length === 0) {
    potentialMatches = getPotentialMatches(player, game, queue, SKILL_DIFFERENCE_PER_RETRY * attempt)
    attempt++
  }

  // no matches found after several tries, fail
  if (potentialMatches.length === 0) {
    let error = new Error('No matching players found, please try again later')
    error.name = constants.NO_MATCHING_PLAYERS_FOUND
    callback(error)
    return
  }

  // find the best match among the candidates
  let bestMatch = determineBestMatch(player, game, potentialMatches)

  callback(null, bestMatch)
}

/**
 * Filters the queue for players whose game ranking in the specified game does not differ from the player's by more than
 * the provided threshold.
 * @param player the player for whom the matchmaking is being done
 * @param game the game for which the ranking will be considered
 * @param queue the queued players
 * @param maxDifference the max game ranking difference that is still considered
 */
function getPotentialMatches (player, game, queue, maxDifference) {
  let gameRanking = getPlayerGameRanking(player, game)

  return queue.filter((queuePlayer) => {
    let queuePlayerRating = getPlayerGameRanking(queuePlayer, game)
    return Math.abs(gameRanking.totalScore - queuePlayerRating.totalScore) <= maxDifference
  })
}

/**
 * Gets the ranking for a player in the specified game.
 * @param player the player for whom the game ranking is being determined
 * @param game determines the game ranking that will be considered
 * @returns the player ranking for the specified game
 */
function getPlayerGameRanking (player, game) {
  // no player, no ranking
  if (!player) {
    return null
  }

  // player has no rankings, nothing is returned
  let rankings = player.rankings
  if (!rankings || rankings.length === 0) {
    return null
  }

  // find the game ranking
  let gameRankings = rankings.filter((gameRanking) => {
    return gameRanking.game === game
  })

  if (!gameRankings || gameRankings === 0) {
    return null
  }

  return gameRankings[0]
}

/**
 * Determines the best opponent for the specified player among potential opponents
 * @param player the player for whom the matchmaking is being done
 * @param game determines the game ranking that will be considered
 * @param potentialMatches potential opponents
 * @return the best match for the player among potential opponents
 */
function determineBestMatch (player, game, potentialMatches) {
  if (potentialMatches.length === 1) {
    return potentialMatches[0]
  }

  let bestScore = Number.MIN_SAFE_INTEGER
  let scoringTimestamp = new Date()
  let bestMatch

  // iterate through the candidates and select the best one based on the calculated score
  potentialMatches.forEach((potentialMatch) => {
    let score = scorePlayer(player, game, potentialMatch, scoringTimestamp)

    if (score > bestScore) {
      bestScore = score
      bestMatch = potentialMatch
    }
  })

  return bestMatch
}

/**
 * Performs the scoring of a potential opponent based on the following:<br>
 * - the time the opponent has spent in the queue<br>
 * - the difference between totalScore (overall MMR)<br>
 * - the difference between the ranks<br>
 * The weights for all criteria are configurable.
 * @param player the player for whom the matchmaking is being done
 * @param game determines the game ranking that will be considered
 * @param opponent the opponent being scored
 * @param scoringTimestamp the timestamp when the scoring was triggered
 * @return the calculated matchmaking score of the opponent
 */
function scorePlayer (player, game, opponent, scoringTimestamp) {
  let ranking = getPlayerGameRanking(player, game)
  let potentialMatchRanking = getPlayerGameRanking(opponent, game)

  let score = 0

  // adjust score according to the time spent in queue
  score += ((scoringTimestamp - opponent.queuedFrom) / 1000) * config.queueTimeWeight

  // adjust score based on the total score difference
  score += Math.abs(ranking.totalScore - potentialMatchRanking.totalScore) * config.totalScoreDifferenceWeight

  // adjust score based on the rank difference
  if (ranking.rank === constants.UNRANKED && potentialMatchRanking.rank === constants.UNRANKED) {
    // both are unraked
    score += config.bothUnrakedWeight
  } else if (ranking.rank !== constants.UNRANKED && potentialMatchRanking.rank !== constants.UNRANKED) {
    // both are ranked
    score += Math.abs(ranking.rank - potentialMatchRanking.rank) * config.bothRankedWeight
  } else {
    // one is ranked and the other is not
    score += config.onlyOneRankedWeight
  }

  return score
}

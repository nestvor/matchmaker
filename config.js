/**
 * The configuration used by the matchmaking service app
 */
'use strict'

let config = {}

config.port = process.env.PORT || 3000
config.maxPotentialMatchRetries = process.env.MAX_MATCH_RETRY || 5
config.skillDifferencePerRetry = process.env.SKILL_DIFFERENCE_PER_RETRY || 1000
config.queueTimeWeight = process.env.QUEUE_TIME_WEIGHT || 2
config.totalScoreDifferenceWeight = process.env.TOTAL_SCORE_DIFFERENCE_WEIGHT || -1
config.bothUnrakedWeight = process.env.BOTH_UNRANKED_WEIGHT || 100
config.bothRankedWeight = process.env.BOTH_RANKED_WEIGHT || -1
config.onlyOneRankedWeight = process.env.ONLY_ONE_RANKED_WEIGHT || -100

module.exports = config

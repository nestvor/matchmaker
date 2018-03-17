/**
 * The routes definition of the matchmaking service
 */
'use strict'

/**
 * Defines the routes used by the matchmaking service app
 * @param app the app to configure
 */
module.exports = function (app) {
  var controller = require('../matchmaking/matchmakingController')

  app.route('/matchmaker/:playerHandle').get(controller.findMatch)
}

/**
 * The main entry point of the matchmaking service application. Spawns the express server that does the magic
 * @type {*|createApplication}
 */
'use strict'

const config = require('./config')
const express = require('express')
const app = express()

// get the routes
require('./routes')(app)

app.listen(config.port)

console.log('Matchmaker RESTful API service started on: ' + config.port)

'use strict'

/**
 * Loads the libraries
 */
var g = require('co-express')
  , moment = require('moment')
  , request = require('co-request')

/**
 * Loads the models
 */
var User = require('../models/user')
  , Itinerary = require('../models/itinerary')

/**
 * Generates the user route
 * @param express.Router router
 */
exports = module.exports = (router) => {
  let root = '/users/me/itineraries'

  router.route(root)
    .get(User.authenticator, all)

  router.route(root + '/search')
    .get(User.authenticator, search)

  router.route(root + '/:id')
    .get(User.authenticator, one)
}

/**
 * Returns all itineraries for user
 */
var all = g(function* (req, res, next) {

  // Finds the itineraries
  var itineraries = yield Itinerary.findAll({
    attributes : Itinerary.attr,
    where : {
      userId : req.user.id
    }
  })

  res.spit(itineraries)

})

/**
 * Returns a single itinerary for user
 */
var one = g(function* (req, res, next) {

  // Finds the itinerary
  var itinerary = yield Itinerary.findOne({
    attributes : Itinerary.attr,
    where : {
      id     : req.params.id,
      userId : req.user.id
    }
  })

  if (itinerary == null) {
    res.err(res.errors.ITINERARY_NOT_FOUND, 404)
  } else {
    res.spit(itineraries)
  }

})

/**
 * Search for an itinerary
 * @query name Itinerary name
 */
var search = g(function* (req, res, next) {

  let name = req.query.name || ''

  // Finds the itineraries
  var itineraries = yield Itinerary.findAll({
    attributes : Itinerary.attr,
    where : {
      name   : { $like : '%'+ name +'%' },
      userId : req.user.id
    }
  })

  res.spit(itineraries)

})

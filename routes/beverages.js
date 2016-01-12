'use strict'

/**
 * Loads the libraries
 */
var g = require('co-express')
  , moment = require('moment')
  , crypto = require('crypto')
  , fbAuth = require('../misc/facebook-auth')
  , request = require('co-request')

/**
 * Loads the models
 */
var User = require('../models/user')
var Beverage = require('../models/beverage')

/**
 * Generates the user route
 * @param express.Router router
 */
exports = module.exports = (router) => {
  let root = '/beverages'

  router.route(root)
    .post(User.authenticator, User.isAdmin, create)

  router.route(root)
    .get(find)
}

/**
 * Creates a beverage
 * @post name    The name of the beverage
 * @post picture A picture of the beverage
 * @post price   The price for unit
 * @post max     The maximum purchase amount allowed
 */
var create = g(function* (req, res, next) {

  if (!req.body.name    ||
      !req.body.picture ||
      !req.body.price   ||
      !req.body.max) {
    res.err(res.errors.MISSING_PARAMS, 400)
    return
  }

  if (req.body.name.length < 2 ||
      req.body.picture.length < 2) {
    res.err(res.errors.PARAM_TOO_SHORT, 400)
    return
  }

  // Creates a new beverage
  let beverage = (yield Beverage.create({
    name    : req.body.name,
    picture : req.body.picture,
    price   : req.body.price,
    max     : req.body.max
  })).dataValues

  res.spit(beverage)

})

/**
 * Returns the list of beverages
 */
var find = g(function* (req, res, next) {
  let beverages = yield Beverage.findAll()

  res.spit(beverages)
})

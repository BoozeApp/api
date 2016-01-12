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
var Order = require('../models/order')

/**
 * Generates the order route
 * @param express.Router router
 */
exports = module.exports = (router) => {
  let root = '/orders'

  router.route(root)
    .post(User.authenticator, create)

  router.route(root)
    .get(User.authenticator, find)

  router.route(root + '/:oid/beverages/:bid')
    .post(User.authenticator, addBeverage)

  /*router.route(root + '/:id')
    .get(User.authenticator, get)

  router.route(root + '/:id/place')
    .post(User.authenticator, place)

  router.route(root + '/:id/transit')
    .post(User.authenticator, User.staffUp, transit)

  router.route(root + '/:id/fulfill')
    .post(User.authenticator, User.staffUp, fulfill)

  router.route(root + '/:id/reject')
    .post(User.authenticator, User.staffUp, reject)*/
}

/**
 * Creates an order
 * @post address   The address to deliver
 * @post latitude  The latitude to deliver
 * @post longitude The longitude to deliver
 */
var create = g(function* (req, res, next) {

  if (!req.body.address  ||
      !req.body.latitude ||
      !req.body.longitude) {
    res.err(res.errors.MISSING_PARAMS, 400)
    return
  }

  if (req.body.address.length < 5) {
    res.err(res.errors.PARAM_TOO_SHORT, 400)
    return
  }

  // Creates a new order
  let order = (yield Order.create({
    clientId  : req.user.id,
    address   : req.body.address,
    latitude  : req.body.latitude,
    longitude : req.body.longitude
  })).dataValues

  res.spit(order)

})

/**
 * Returns the list of orders of user
 */
var find = g(function* (req, res, next) {
  let orders = yield Order.findAll({
    attributes : Order.attr,
    where : {
      clientId : req.user.id
    },
    include : [{
      model   : Order.Beverage,
      as      : 'beverages',
      attributes : ['createdAt'],
      include : [ Beverage ]
    }]
  })

  res.spit(orders)
})

/**
 * Puts a beverage in the order
 * @param oid Order id
 * @param bid Beverage id
 * @body amount The amount of beverages
 */
var addBeverage = g(function* (req, res, next) {
  if (!req.body.amount) {
    res.err(res.errors.MISSING_PARAMS, 400)
  }

  let order = yield Order.findOne({
    attributes : Order.attr,
    where : {
      id : req.params.oid
    }
  })

  if (order == null) {
    res.err(res.errors.ORDER_NOT_FOUND, 404)
    return
  }

  let beverage = yield Beverage.findOne({
    attributes : Beverage.attr,
    where : {
      id : req.params.bid
    }
  })

  if (beverage == null) {
    res.err(res.errors.BEVERAGE_NOT_FOUND, 404)
    return
  }

  if (req.body.amount > beverage.max) {
    res.err(res.errors.BEVERAGE_MAX_EXCEEDED, 406)
    return
  }

  let exists = (yield Order.Beverage.findOne({
    where : {
      orderId    : order.id,
      beverageId : beverage.id
    }
  })) != null

  if (exists) {
    res.err(res.errors.BEVERAGE_ALREADY_EXISTS_IN_ORDER, 406)
    return
  }

  yield Order.Beverage.create({
    orderId    : order.id,
    beverageId : beverage.id,
    amount     : req.body.amount || 1
  })

  yield find(req, res, next)
})

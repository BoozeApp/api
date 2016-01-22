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
var Device = require('../models/device')

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

  router.route(root + '/placed')
    .get(User.authenticator, User.staffUp, placed)

  router.route(root + '/in_transit')
    .get(User.authenticator, User.staffUp, inTransit)

  router.route(root + '/fulfilled')
    .get(User.authenticator, User.staffUp, fulfilled)

  router.route(root + '/rejected')
    .get(User.authenticator, User.staffUp, rejected)

  router.route(root + '/:oid')
    .get(User.authenticator, get)

  router.route(root + '/:oid/message')
    .post(User.authenticator, User.staffUp, message)

  router.route(root + '/:oid/place')
    .put(User.authenticator, place)

  router.route(root + '/:oid/beverages/:bid')
    .post(User.authenticator, addBeverage)

  router.route(root + '/:oid/transit')
    .put(User.authenticator, User.staffUp, transit)

  router.route(root + '/:oid/fulfill')
    .put(User.authenticator, User.staffUp, fulfill)

  router.route(root + '/:oid/reject')
    .post(User.authenticator, User.staffUp, reject)
}

/**
 * Creates an order
 * @post address   The address to deliver
 * @post change    The change to deliver
 * @post latitude  The latitude to deliver
 * @post longitude The longitude to deliver
 */
var create = g(function* (req, res, next) {

  if (!req.body.address  ||
      !req.body.change   ||
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
    change    : req.body.change,
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
    attributes : { exclude : ['clientId', 'staffId'] },
    where : {
      clientId : req.user.id
    },
    include : [{
      model : Beverage
    }, {
      model : User,
      as    : 'staff'
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

  if (order.status != 'draft') {
    res.err(res.errors.ORDER_ALREADY_OFF_DRAFT, 409)
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

  yield get(req, res, next)
})

/**
 * Returns the order
 */
var get = g(function* (req, res, next) {
  
  var where, userAs

  if (req.user.level == 'client') {
    where = {
      id : req.params.oid,
      clientId : req.user.id
    }

    userAs = 'staff'

  } else {
    where = {
      id : req.params.oid
    }

    userAs = 'client'
  }

  let order = yield Order.findOne({
    attributes : { exclude : ['clientId', 'staffId'] },
    where   : where,
    include : [{
      model : Beverage
    }, {
      model : User,
      as    : userAs
    }]
  })

  if (order == null) {
    res.err(res.errors.ORDER_NOT_FOUND, 404)
    return
  }
  
  res.spit(order)
})

/**
 * Places the order
 */
var place = g(function* (req, res, next) {
  let order = yield Order.findOne({
    attributes : { exclude : ['clientId', 'staffId'] },
    where : {
      id : req.params.oid,
      clientId : req.user.id
    },
    include : [{
      model : Beverage
    }, {
      model : User,
      as    : 'client'
    }]
  })

  if (order == null) {
    res.err(res.errors.ORDER_NOT_FOUND, 404)
    return
  }

  if (order.status != 'draft') {
    res.err(res.errors.ORDER_ALREADY_OFF_DRAFT, 409)
    return
  }

  var amount = 0

  for (var i in order.beverages) {
    var value = order.beverages[i].price
    value *= order.beverages[i].orderBeverage.amount
    amount += value
  }

  order.amount = amount
  order.status = 'placed'
  yield order.save()

  yield Device.push.placed(order)

  res.spit(order)
})

/**
 * Finds all placed orders
 */
var placed = g(function* (req, res, next) {
  let orders = yield Order.findAll({
    attributes : { exclude : ['clientId', 'staffId'] },
    where : {
      status : 'placed'
    },
    include : [{
      model : Beverage
    }, {
      model : User,
      as    : 'client'
    }]
  })

  res.spit(orders)
})

/**
 * Finds all in transit orders
 */
var inTransit = g(function* (req, res, next) {
  let orders = yield Order.findAll({
    attributes : { exclude : ['clientId', 'staffId'] },
    where : {
      status : 'in_transit'
    },
    include : [{
      model : Beverage
    }, {
      model : User,
      as    : 'client'
    }]
  })

  res.spit(orders)
})

/**
 * Finds all fulfilled orders
 */
var fulfilled = g(function* (req, res, next) {
  let orders = yield Order.findAll({
    attributes : { exclude : ['clientId', 'staffId'] },
    where : {
      status : 'fulfilled'
    },
    include : [{
      model : Beverage
    }, {
      model : User,
      as    : 'client'
    }]
  })

  res.spit(orders)
})

/**
 * Finds all rejected orders
 */
var rejected = g(function* (req, res, next) {
  let orders = yield Order.findAll({
    attributes : { exclude : ['clientId', 'staffId'] },
    where : {
      status : 'rejected'
    },
    include : [{
      model : Beverage
    }, {
      model : User,
      as    : 'client'
    }]
  })

  res.spit(orders)
})

/**
 * Send a message
 * @post message The message
 */
var message = g(function* (req, res, next) {
  if (!req.body.message) {
    res.err(res.errors.MISSING_PARAMS, 400)
    return
  }

  let order = yield Order.findOne({
    attributes : { exclude : ['clientId', 'staffId'] },
    where : {
      id      : req.params.oid,
      staffId : req.user.id
    },
    include : [{
      model : Beverage
    }, {
      model : User,
      as    : 'client'
    }]
  })

  if (order == null) {
    res.err(res.errors.ORDER_NOT_FOUND, 404)
    return
  }

  if (order.status != 'in_transit') {
    res.err(res.errors.ORDER_ALREADY_OFF_IN_TRANSIT, 409)
    return
  }

  yield Device.push.message(order, req.body.message)

  res.spit(order)
})

/**
 * Transit the order
 */
var transit = g(function* (req, res, next) {
  let order = yield Order.findOne({
    attributes : { exclude : ['clientId', 'staffId'] },
    where : {
      id : req.params.oid
    },
    include : [{
      model : Beverage
    }, {
      model : User,
      as    : 'client'
    }]
  })

  if (order == null) {
    res.err(res.errors.ORDER_NOT_FOUND, 404)
    return
  }

  if (order.status != 'placed') {
    res.err(res.errors.ORDER_ALREADY_OFF_PLACED, 409)
    return
  }

  order.status  = 'in_transit'
  order.staffId = req.user.id
  yield order.save()

  yield Device.push.inTransit(order)

  res.spit(order)
})

/**
 * Fulfill the order
 */
var fulfill = g(function* (req, res, next) {
  let order = yield Order.findOne({
    attributes : { exclude : ['clientId', 'staffId'] },
    where : {
      id      : req.params.oid,
      staffId : req.user.id
    },
    include : [{
      model : Beverage
    }, {
      model : User,
      as    : 'client'
    }]
  })

  if (order == null) {
    res.err(res.errors.ORDER_NOT_FOUND, 404)
    return
  }

  if (order.status != 'in_transit') {
    res.err(res.errors.ORDER_ALREADY_OFF_IN_TRANSIT, 409)
    return
  }

  order.status  = 'fulfilled'
  yield order.save()

  res.spit(order)
})

/**
 * Reject the order
 * @body reason The reason message
 */
var reject = g(function* (req, res, next) {
  if (!req.body.reason) {
    res.err(res.errors.MISSING_PARAMS, 400)
    return
  }

  if (req.body.reason.length < 4) {
    res.err(res.errors.PARAM_TOO_SHORT, 400)
    return
  }

  let order = yield Order.findOne({
    attributes : { exclude : ['clientId', 'staffId'] },
    where : {
      id : req.params.oid
    },
    include : [{
      model : Beverage
    }, {
      model : User,
      as    : 'client'
    }]
  })

  if (order == null) {
    res.err(res.errors.ORDER_NOT_FOUND, 404)
    return
  }

  if (order.status != 'placed') {
    res.err(res.errors.ORDER_ALREADY_OFF_PLACED, 409)
    return
  }

  order.status       = 'rejected'
  order.staffId      = req.user.id
  order.statusReason = req.body.reason
  yield order.save()

  res.spit(order)
})

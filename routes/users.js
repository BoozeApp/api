'use strict'

/**
 * Loads the libraries
 */
var g = require('co-express')
  , moment = require('moment')
  , crypto = require('crypto')
  , fbSDK = require('../misc/facebook-auth')
  , request = require('co-request')

/**
 * Loads the models
 */
var User = require('../models/user')
  , Device = require('../models/device')

/**
 * Generates the user route
 * @param express.Router router
 */
exports = module.exports = (router) => {
  let root = '/users'

  router.route(root + '/me')
    .get(User.authenticator, me)

  router.route(root + '/me')
    .post(User.authenticator, edit)

  router.route(root)
    .post(create)

  router.route(root + '/fb-auth')
    .post(fbAuth)

  router.route(root + '/auth')
    .post(auth)
}

/**
 * Returns the current user
 */
var me = g(function* (req, res, next) {
  res.spit(req.user)
})

/**
 * Authenticates an user from its FB token
 * @post fb_token     The facebook token
 * @post device_token The device token
 * @post device_type  The device type
 */
var fbAuth = g(function* (req, res, next) {
  if (!req.body.fb_token    ||
      !req.body.device_type ||
      !req.body.device_token) {
    res.err(res.errors.MISSING_PARAMS, 400)
    return
  }

  let fbToken = req.body.fb_token

  // Gets the user from facebook
  var fbUser = yield fbSDK(fbToken)

  if (fbUser.error) {
    res.err(res.errors.FB_TOKEN_DENIED, 401)
  } else {

    // Finds the user on database
    var user = yield User.findOne({
      attributes : User.attr,
      where : {
        facebookId : fbUser.id
      }
    })

    if (user == null) {

      // Finds the user on database
      var user = yield User.findOne({
        attributes : User.attr,
        where : {
          email : fbUser.email
        }
      })

      if (user == null) {

        // Creates user if not exists
        user = (yield User.create({
          name       : fbUser.name,
          email      : fbUser.email,
          facebookId : fbUser.id,
          picture    : fbUser.picture.data.url
        })).dataValues

      } else {

        user.name = fbUser.name
        user.email = fbUser.email
        user.picture = fbUser.picture.data.url
        user.facebookId = fbUser.id

        yield user.save()
      }

    } else {

      user.name = fbUser.name
      user.email = fbUser.email
      user.picture = fbUser.picture.data.url

      yield user.save()

      // Destroy users old tokens
      // TODO: use in future
      // yield User.Token.destroy({
      //     where : { userId : user.id }
      // })

    }

    let accessToken = crypto.createHash('sha512')
    accessToken.update(fbToken)
    accessToken.update(moment().format())

    // Creates a token for session
    var userToken = (yield User.Token.create({
      userId      : user.id,
      accessToken : accessToken.digest('base64')
    })).dataValues

    user = user.dataValues
    user.accessToken = userToken.accessToken

    yield Device.destroy({
      where : { token : req.body.device_token }
    })

    yield Device.create({
      userId : user.id,
      token  : req.body.device_token,
      type   : req.body.device_type
    })

    res.spit(user)
  }
})

/**
 * Authenticates an user
 * @post email        The email address
 * @post password     The password
 * @post device_token The device token
 * @post device_type  The device type
 */
var auth = g(function* (req, res, next) {
  if (!req.body.email       ||
      !req.body.password    ||
      !req.body.device_type ||
      !req.body.device_token) {
    res.err(res.errors.MISSING_PARAMS, 400)
    return
  }

  // Finds the user on database
  var user = yield User.findOne({
    where : {
      email : req.body.email
    }
  })

  // If user does not exists
  if (user == null) {
    res.err(res.errors.USER_NOT_FOUND, 404)
    return
  }

  // Builds the password
  let password = crypto.createHash('sha512')
  password.update(req.body.password)
  password.update(req.body.email)
  password = password.digest('base64')

  // Password is incorrect
  if (user.password != password) {
    res.err(res.errors.PASSWORD_INCORRECT, 401)
    return
  }

  // Builds the access token
  let accessToken = crypto.createHash('sha512')
  accessToken.update(user.email)
  accessToken.update(moment().format())

  // Creates a token for session
  var userToken = (yield User.Token.create({
    userId      : user.id,
    accessToken : accessToken.digest('base64')
  })).dataValues

  user = user.dataValues
  user.accessToken = userToken.accessToken

  delete user.password

  yield Device.destroy({
    where : { token : req.body.device_token }
  })

  yield Device.create({
    userId : user.id,
    token  : req.body.device_token,
    type   : req.body.device_type
  })

  res.spit(user)
})

/**
 * Creates an user
 * @post name         The name
 * @post email        The email address
 * @post password     The password
 * @post device_token The device token
 * @post device_type  The device type
 */
var create = g(function* (req, res, next) {
  if (!req.body.name        ||
      !req.body.email       ||
      !req.body.password    ||
      !req.body.device_type ||
      !req.body.device_token) {
    res.err(res.errors.MISSING_PARAMS, 400)
    return
  }

  // Finds the user on database
  var user = yield User.findOne({
    attributes : User.attr,
    where : {
      email : req.body.email
    }
  })

  // If user already exists
  if (user != null) {
    res.err(res.errors.EMAIL_ALREADY_EXISTS, 406)
    return
  }

  // Builds the password
  let password = crypto.createHash('sha512')
  password.update(req.body.password)
  password.update(req.body.email)
  password = password.digest('base64')

  // Creates user
  user = (yield User.create({
    name     : req.body.name,
    email    : req.body.email,
    password : password
  })).dataValues

  // Builds the access token
  let accessToken = crypto.createHash('sha512')
  accessToken.update(user.email)
  accessToken.update(moment().format())

  // Creates a token for session
  var userToken = (yield User.Token.create({
    userId      : user.id,
    accessToken : accessToken.digest('base64')
  })).dataValues

  user.accessToken = userToken.accessToken
  delete user.password

  yield Device.destroy({
    where : { token : req.body.device_token }
  })

  yield Device.create({
    userId : user.id,
    token  : req.body.device_token,
    type   : req.body.device_type
  })

  user.level = 'client'

  res.spit(user)
})

/**
 * Updates the current user
 * @post telephone The user's telephone number
 */
var edit = g(function* (req, res, next) {
  if (!req.body.telephone) {
    res.err(res.errors.MISSING_PARAMS, 400)
    return
  }

  req.user.telephone = req.body.telephone
  yield req.user.save()

  res.spit(req.user)
})

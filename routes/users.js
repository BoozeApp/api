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
  , Device = require('../models/device')

/**
 * Generates the user route
 * @param express.Router router
 */
exports = module.exports = (router) => {
  let root = '/users'

  router.route(root + '/me')
    .get(User.authenticator, me)

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
var auth = g(function* (req, res, next) {
  if (!req.body.fb_token    ||
      !req.body.device_type ||
      !req.body.device_token) {
    res.err(res.errors.MISSING_PARAMS, 400)
    return
  }

  let fbToken = req.body.fb_token

  // Gets the user from facebook
  var fbUser = yield fbAuth(fbToken)

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

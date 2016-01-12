'use strict'

var g = require('co-express')
  , moment = require('moment')
  , Sequelize = require('sequelize')
  , sequelize = require('../config/database')().sequelize

/**
 * @apiDefine authentication Access rights needed.
 * A query parameter <code>access_token</code> is required.
 *
 * @apiVersion 1.0.0
 */

/**
 * The user model
 */
var User = sequelize.define('user', {
  id : {
    type          : Sequelize.INTEGER,
    primaryKey    : true,
    autoIncrement : true
  },
  name       : { type : Sequelize.STRING },
  email      : { type : Sequelize.STRING },
  facebookId : { type : Sequelize.STRING },
  picture    : { type : Sequelize.STRING }
})

/**
 * The user image model
 */
var UserToken = sequelize.define('userToken', {
  userId      : { type : Sequelize.INTEGER },
  accessToken : { type : Sequelize.STRING  },
  expireAt    : { type : Sequelize.DATE    }
})

/**
 * Creates the relationship
 */
User.hasMany(UserToken)

/**
 * Creates the relationship
 */
UserToken.belongsTo(User)

/**
 * The user attributes
 */
User.attr = {
  /* all */
}

/**
 * The userToken attributes
 */
UserToken.attr = {
  /* all */
}

// Associates UserToken with User
User.Token = UserToken

/**
 * Associates an authenticator
 */
User.authenticator = g(function* (req, res, next) {

  let accessToken = req.query.access_token || null

  var userToken = yield User.Token.findOne({
    attributes : User.Token.attr,
    include    : [ User ],
    where : {
      accessToken : accessToken
    }
  })

  if (userToken == null || moment().isAfter(userToken.expireAt)) {
    res.err(res.errors.ACCESS_DENIED, 401)
  } else {
    req.user = userToken.user

    next()
  }
  
})

/**
 * Expose models/user
 */
exports = module.exports = User

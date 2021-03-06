'use strict'

var g = require('co-express')
  , Sequelize = require('sequelize')
  , sequelize = require('../config/database')().sequelize

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
  password   : { type : Sequelize.STRING },
  facebookId : { type : Sequelize.STRING },
  picture    : { type : Sequelize.STRING },
  level      : { type : Sequelize.ENUM('client', 'staff', 'admin') },
  telephone  : { type : Sequelize.STRING },
  latitude   : { type : Sequelize.DOUBLE },
  longitude  : { type : Sequelize.DOUBLE }
})

/**
 * The user image model
 */
var UserToken = sequelize.define('userToken', {
  userId      : { type : Sequelize.INTEGER },
  accessToken : { type : Sequelize.STRING  }
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
  exclude : ['password']
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

  var userToken = yield UserToken.findOne({
    attributes : User.Token.attr,
    include    : [{
      model      : User,
      attributes : User.attr
    }],
    where : {
      accessToken : accessToken
    }
  })

  if (userToken == null) {
    res.err(res.errors.ACCESS_DENIED, 401)
  } else {
    req.user = userToken.dataValues.user

    next()
  }
  
})

/**
 * Associates a level verification
 */
User.staffUp = g(function* (req, res, next) {

  if (!req.user || req.user.level == 'client') {
    res.err(res.errors.NOT_ENOUGH_PERMISSION, 403)
  } else {
    next()
  }

})

/**
 * Associates admin verification
 */
User.isAdmin = g(function* (req, res, next) {
  
  if (!req.user || req.user.level != 'admin') {
    res.err(res.errors.NOT_ENOUGH_PERMISSION, 403)
  } else {
    next()
  }

})

/**
 * Expose models/user
 */
exports = module.exports = User

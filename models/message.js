'use strict'

var g = require('co-express')
  , Sequelize = require('sequelize')
  , sequelize = require('../config/database')().sequelize

var User = require('./user')
  , Order = require('./order')

/**
 * The message model
 */
var Message = sequelize.define('message', {
  id : {
    type          : Sequelize.INTEGER,
    primaryKey    : true,
    autoIncrement : true
  },
  text       : { type : Sequelize.STRING  },
  senderId   : { type : Sequelize.INTEGER },
  receiverId : { type : Sequelize.INTEGER },
  orderId    : { type : Sequelize.INTEGER }
})

/**
  * Creates the relationship
  */
Message.belongsTo(User,  { as : 'sender'   })
Message.belongsTo(User,  { as : 'receiver' })
Message.belongsTo(Order)

/**
 * The message attributes
 */
Message.attr = { }

/**
 * Expose models/message
 */
exports = module.exports = Message

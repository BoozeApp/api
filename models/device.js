'use strict'

var g = require('co-express')
  , co = require('co')
  , Sequelize = require('sequelize')
  , sequelize = require('../config/database')().sequelize
  , gcm = require('node-gcm')

var User = require('./user')
  , Order = require('./order')

/**
  * The device model
  */
var Device = sequelize.define('device', {
  id : {
    type          : Sequelize.INTEGER,
    primaryKey    : true,
    autoIncrement : true
  },
  userId : { type : Sequelize.INTEGER },
  token  : { type : Sequelize.STRING  },
  type   : { type : Sequelize.ENUM('ios', 'android') }
})

/**
  * Creates the relationship
  */
Device.belongsTo(User)

/**
  * The attributes
  */
Device.attr = {
  /* all */
}

/**
 * Device's push notifications
 */
Device.push = {
  send : function *(message, tokens) {
    var sender = new gcm.Sender(process.env.GOOGLE_API_KEY)

    sender.send(message, tokens, 4, function (err, result) {
      if (err) console.log(err)
    })
  },

  inTransit : function *(order) {
    var message = new gcm.Message()

    message.addData({
      orderId : order.id,
      code    : "order-in-transit"
    })

    var _tokens = yield Device.findAll({
      where : {
        userId : order.client.id
      }
    })

    var tokens = []

    for (var i in _tokens) {
      tokens.push(_tokens[i].token)
    }

    yield Device.push.send(message, tokens)
  },

  placed : function *(order) {
    var message = new gcm.Message()

    message.addData({
      orderId : order.id,
      code    : "order-placed"
    })

    var _tokens = yield Device.findAll({
      include : [{
        model : User,
        where : {
          level : { $ne : 'client' }
        }
      }]
    })

    var tokens = []

    for (var i in _tokens) {
      tokens.push(_tokens[i].token)
    }

    yield Device.push.send(message, tokens)
  },

  message : function *(order, destination, text) {
    var message = new gcm.Message()

    message.addData({
      orderId : order.id,
      code    : "order-message",
      message : text
    })

    var userId = destination == 'client' ? order.client.id : order.staff.id

    var _tokens = yield Device.findAll({
      where : {
        userId : userId
      }
    })

    var tokens = []

    for (var i in _tokens) {
      tokens.push(_tokens[i].token)
    }

    yield Device.push.send(message, tokens)
  }
}

/**
  * Expose models/device
  */
exports = module.exports = Device

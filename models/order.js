'use strict'

var g = require('co-express')
  , Sequelize = require('sequelize')
  , sequelize = require('../config/database')().sequelize

var User = require('./user')
  , Beverage = require('./beverage')

/**
  * The order model
  */
var Order = sequelize.define('order', {
  id : {
    type          : Sequelize.INTEGER,
    primaryKey    : true,
    autoIncrement : true
  },
  clientId     : { type : Sequelize.INTEGER },
  staffId      : { type : Sequelize.INTEGER },
  amount       : { type : Sequelize.DOUBLE },
  change       : { type : Sequelize.DOUBLE },
  status       : { type : Sequelize.ENUM('draft', 'placed', 'in_transit', 'fulfilled', 'rejected') },
  statusReason : { type : Sequelize.STRING },
  address      : { type : Sequelize.STRING },
  latitude     : { type : Sequelize.DOUBLE },
  longitude    : { type : Sequelize.DOUBLE }
})

/**
  * Creates the relationship
  */
Order.belongsTo(User, { as : 'client' })
Order.belongsTo(User, { as : 'staff'  })

/**
  * The orderBeverages model
  */
var OrderBeverage = sequelize.define('orderBeverage', {
  id : {
    type          : Sequelize.INTEGER,
    primaryKey    : true,
    autoIncrement : true
  },
  orderId    : { type : Sequelize.INTEGER },
  beverageId : { type : Sequelize.INTEGER },
  amount     : { type : Sequelize.INTEGER }
})

/* Creates the relationship */
Order.hasMany(OrderBeverage, { as : 'beverages' })
OrderBeverage.belongsTo(Beverage)
OrderBeverage.belongsTo(Order)

/* Creates the alias */
Order.Beverage = OrderBeverage

/**
  * The attributes
  */
Order.attr = {
  /* all */
}

Order.Beverage.attr = {
  /* all */
}

/**
  * Expose models/order
  */
exports = module.exports = Order

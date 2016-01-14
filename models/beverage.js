'use strict'

var g = require('co-express')
  , Sequelize = require('sequelize')
  , sequelize = require('../config/database')().sequelize

/**
 * The beverage model
 */
var Beverage = sequelize.define('beverage', {
  id : {
    type          : Sequelize.INTEGER,
    primaryKey    : true,
    autoIncrement : true
  },
  name    : { type : Sequelize.STRING },
  picture : { type : Sequelize.STRING },
  price   : { type : Sequelize.DOUBLE },
  max     : { type : Sequelize.DOUBLE },
})

/**
 * The beverage attributes
 */
Beverage.attr = {
  
}

/**
 * Expose models/beverage
 */
exports = module.exports = Beverage

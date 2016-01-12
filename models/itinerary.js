'use strict'

var g = require('co-express')
  , Sequelize = require('sequelize')
  , sequelize = require('../config/database')().sequelize

var User = require('./user')
  , City = require('./city')

/**
  * The itinerary model
  */
var Itinerary = sequelize.define('itinerary', {
  id : {
    type          : Sequelize.INTEGER,
    primaryKey    : true,
    autoIncrement : true
  },
  userId      : { type : Sequelize.INTEGER },
  cityId      : { type : Sequelize.INTEGER },
  name        : { type : Sequelize.STRING  }
})

/**
  * Creates the relationship
  */
Itinerary.belongsTo(User)
Itinerary.belongsTo(City)

/**
  * The itinerary attributes
  */
Itinerary.attr = {
  /* all */
}

/**
  * Expose models/itinerary
  */
exports = module.exports = Itinerary

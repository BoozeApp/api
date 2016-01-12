'use strict'

var g         = require('co-express')
  , moment    = require('moment')
  , Sequelize = require('sequelize')
  , sequelize = require('../config/database')().sequelize
  , sabre     = require('../misc/sabre-api')

/**
 * The AppToken model
 */
var AppToken = sequelize.define('appToken', {
  id         : { type : Sequelize.STRING, primaryKey : true },
  token      : { type : Sequelize.TEXT },
  type       : { type : Sequelize.STRING },
  expireAt   : { type : Sequelize.DATE }
})

/**
 * The AppToken attributes
 */
AppToken.attr = {
  /* all */
}

/**
 * Check token validation based on expire date
 */
AppToken.isValid = function (appToken) {
  if(!appToken || !appToken.token || !appToken.expireAt) return false
  return moment().isBefore(appToken.expireAt)
}

/**
 * Get existent token if valid or a new one
 */
AppToken.getAccessToken = g(function* (id) {
  if(!id) return null

  //return existent token if still valid
  var appToken = yield AppToken.findOne({where: {id : id}})
  if(AppToken.isValid(appToken)) return appToken.dataValues

  return yield AppToken.refresh(id)
})

/**
 * Force token recreation
 */
AppToken.refresh = g(function* (id) {
  if(!id) return null

  var appToken = {}

  switch (id) {
    case 'sabre':
      appToken = yield sabre.auth()
      break
  }

  if(!AppToken.isValid(appToken)) return null

  var row = yield AppToken.findOrCreate({where: {id: id}, defaults: appToken})
  let isNewRecord = !!row[1]

  if(!row)
    console.log('Failed to find or create AppToken', id, appToken, row)

  else if(!isNewRecord)
    yield AppToken.update(appToken, {where: {id: id}})

  return appToken
})

/**
 * Expose models/AppToken
 */
module.exports = AppToken

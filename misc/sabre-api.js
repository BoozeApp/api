'use strict'

var g         = require('co-express')
  , request   = require('co-request')
  , moment    = require('moment')
  , AppToken  = require('../models/appToken')

let ID = module.exports.ID = 'sabre'

var cachedAppToken = null
module.exports.getAppToken = g(function*() {
  if(cachedAppToken && AppToken.isValid(cachedAppToken)) return cachedAppToken
  return cachedAppToken = yield AppToken.getAccessToken(ID)
})

module.exports.auth = g(function*() {
  var options = {
    url: 'https://api.test.sabre.com/v2/auth/token',
    form: {grant_type: 'client_credentials'},
    headers: {
      'Authorization': `Basic ${process.env.SABRE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  }

  var response = yield request.post(options)
  if (response.error || response.statusCode != 200) {
    console.log("sabre error: \r\n", response.statusCode, response.body)
    return {}
  }

  var result = JSON.parse(response.body)

  return cachedAppToken = {
    id:       ID,
    token:    result.access_token,
    type:     result.token_type || 'Bearer',
    expireAt: moment().add(result.expires_in, 'seconds')
  }
})

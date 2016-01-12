'use strict'

/**
 * Loads the libraries
 */
var g           = require('co-express')
  , request     = require('co-request')
  , crypto      = require('crypto')
  , querystring = require('querystring')
  , sabre       = require('../misc/sabre-api')
  , AppToken    = require('../models/appToken')

/**
 * Loads the models
 */
var City  = require('../models/city')
  , User  = require('../models/user')

/**
 * Generates the city route
 * @param express.Router router
 */
exports = module.exports = (router) => {
  let root = '/cities'

  router.route(root + '/search')
    .get(search)

  router.route(root + '/:id')
    .get(User.authenticator, get)
}

/**
 * Returns a list of cities based on search queries
 * @query (opt) name     City name
 * @query (opt) country  City country
 */
var search = g(function* (req, res, next) {
  var name     = req.query.name     || ''
  var country  = req.query.country  || ''
  var limit    = req.query.limit    || 3
  var offset   = req.query.offset   || 0

  var cities = yield City.findAll({
    attributes : City.attr,
    where : {
      $and : [
        { name    : { $like : '%'+ name    +'%' } },
        { country : { $like : '%'+ country +'%' } }
      ]
    },
    limit  : limit,
    offset : offset
  })

  // Load cities from the third-party API
  if (cities.length < limit) {

    if (name == '') {
      console.log("search error: empty query \r\n")
      res.err(res.errors.QUERY_IS_EMPTY, 400)
      return
    }

    name = name.replace(/[ ,]/g, ".")

    var sabreQuery = querystring.stringify({
      query    : name,
      category : 'CITY',
      limit    : limit
    })

    var sabreToken = yield sabre.getAppToken()

    var options = {
      url: `https://api.test.sabre.com/v1/lists/utilities/geoservices/autocomplete?${sabreQuery}`,
      headers: {
        'Authorization': `${sabreToken.type} ${sabreToken.token}`
      }
    }

    var sabreRes = yield request(options)

    if (sabreRes.error || sabreRes.statusCode != 200) {

      console.log("sabre error: \r\n", sabreRes.statusCode, sabreRes.error)

      // Access denied, token is probably expired
      if (sabreRes.statusCode == 401) {
        yield AppToken.refresh(sabre.ID)
        return yield search(req, res, next)
      }

      // Couldn't refresh token...
      // Try to return cities from database
      if (cities.length > 0) {
        res.spit(cities)
      } else {
        res.err(res.errors.FAILED_TO_SEARCH_LOCATION, sabreRes.statusCode)
      }
      
      return

    } else {

      var body = JSON.parse(sabreRes.body)
      cities = []

      for (let _city of body.Response.grouped["category:CITY"].doclist.docs) {

        var city = {
          name      : _city.city,
          country   : _city.country
        }

        if (city.name && city.country) {
          city = yield City.createFromObject(city)

          cities.push(city)
        }

      }
    }
  }

  res.spit(cities)
})

/**
 * Returns an city by id
 */
var get = g(function* (req, res, next) {
  let id = req.params.id

  let city = yield City.findOne({
    attributes : City.attr,
    where : {
      id : id
    }
  })

  if (city == null) {
    res.err(res.errors.CITY_ID_NOT_FOUND, 404)
  } else {
    res.spit(city)
  }
})

'use strict'

var yelp = require('yelp').createClient({
  consumer_key    : process.env.YELP_OAUTH_CONSUMER_KEY,
  consumer_secret : process.env.YELP_OAUTH_CONSUMER_SECRET,
  token           : process.env.YELP_OAUTH_TOKEN,
  token_secret    : process.env.YELP_OAUTH_TOKEN_SECRET
})

/**
 * Expose misc/yelpSearch
 */
exports = module.exports = (query) => {
  return new Promise(function(resolve, reject) {
    yelp.search(query, function(error, data) {
      if (typeof data != 'object') {
        data = {
          error : error
        }
      }
      
      resolve(data)
    })
  })
}

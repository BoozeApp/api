'use strict'

var fs = require('fs')

/**
 * Enables all routes
 * @param express.Router router
 */
var main = (router) => {

  // All route files
  var files = fs.readdirSync('routes')

  for (var i in files) {
    if (files[i] == 'main.js')
      continue

    require('./' + files[i])(router)
  }
}

/**
 * Expose routes/main
 */
exports = module.exports = main

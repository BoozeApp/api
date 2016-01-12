'use strict'

var Sequelize = require('sequelize')

/**
 * The database object
 */
var struct = {
  generated : false,
  sequelize : null
}

/**
 * Instantiates a connection with sequelize
 * @return json struct
 */
function database() {

  if (struct.generated) {
    return struct
  }

  if (process.env.CONN_FULL_URL_USE == 'true') {
    struct.sequelize = new Sequelize(
      process.env.CONN_FULL_URL,
      {
        dialect : process.env.CONN_DIALECT,
        logging : false,
        pool : {
          max  : 5,
          min  : 0,
          idle : 10000
        }
      }
    )
  } else {
    struct.sequelize = new Sequelize(
      process.env.CONN_DATABASE,
      process.env.CONN_USERNAME,
      process.env.CONN_PASSWORD,
      {
        host    : process.env.CONN_HOST,
        dialect : process.env.CONN_DIALECT,
        logging : false,
        pool : {
          max  : 5,
          min  : 0,
          idle : 10000
        }
      }
    )
  }
  struct.generated = true

  return struct

}

/**
 * Expose config/database
 */
exports = module.exports = database

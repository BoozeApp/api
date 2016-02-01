'use strict'

var errors = {
  /**
   * Errors code and description
   */
  '100' : 'Unknown error',
  '101' : 'Query cannot be empty',
  '102' : 'Failed to create destination',
  '103' : 'Failed to search for location',
  '104' : 'Failed to get top destinations',
  '105' : 'Failed to search on Yelp',
  '106' : 'City id not found',
  '107' : 'Access denied (token might be expired)',
  '108' : 'Facebook token denied',
  '109' : 'Order not found',
  '110' : 'Beverage not found',
  '111' : 'A given parameter is too short',
  '112' : 'Missing required parameters',
  '113' : 'Access denied (needs higher level)',
  '114' : 'Beverage amount exceeded',
  '115' : 'Beverage exists already in the order',
  '116' : 'Order is already off draft status',
  '117' : 'Order is already off placed status',
  '118' : 'Order is already off in_transit status',
  '119' : 'Order is already off fulfilled status',
  '120' : 'User not found',
  '121' : 'Password is incorrect',
  '122' : 'Email address already exists',

  /**
   * Helpers
   */
  UNKNOWN_ERROR : 100,
  QUERY_IS_EMPTY : 101,
  FAILED_TO_CREATE_DESTINATION : 102,
  FAILED_TO_SEARCH_LOCATION : 103,
  FAILED_TO_GET_TOP_DESTINATIONS : 104,
  FAILED_TO_SEARCH_YELP : 105,
  CITY_ID_NOT_FOUND : 106,
  ACCESS_DENIED : 107,
  FB_TOKEN_DENIED : 108,
  ORDER_NOT_FOUND : 109,
  BEVERAGE_NOT_FOUND : 110,
  PARAM_TOO_SHORT : 111,
  MISSING_PARAMS : 112,
  NOT_ENOUGH_PERMISSION : 113,
  BEVERAGE_MAX_EXCEEDED : 114,
  BEVERAGE_ALREADY_EXISTS_IN_ORDER : 115,
  ORDER_ALREADY_OFF_DRAFT : 116,
  ORDER_ALREADY_OFF_PLACED : 117,
  ORDER_ALREADY_OFF_IN_TRANSIT : 118,
  ORDER_ALREADY_OFF_FULFILLED : 119,
  USER_NOT_FOUND : 120,
  PASSWORD_INCORRECT : 121,
  EMAIL_ALREADY_EXISTS : 122
}

/**
 * Expose misc/erros
 *
 * It modifies the response when an error is found.
 *
 * @param res The response handler.
 * @param code The intern error code.
 * @param status The HTTP/1.1 response code.
 */
exports = module.exports = (req, res, next) => {

  res.err = (code, status) => {
    var description = '[ \'#' + code + '\', \''

    description += errors[code] + '\' ]'

    res.statusCode = status
    res.writeHead(status, description, {'content-type' : 'text/plain'})
    res.end()
  }

  res.errors = errors

  next()
  
}

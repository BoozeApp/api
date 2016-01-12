'use strict'

/**
 * Expose misc/isArray
 */
exports = module.exports = (what) => {
  return Object.prototype.toString.call(what) === '[object Array]';
}

'use strict'

var g       = require('co-express')
  , request = require('co-request')

/**
 * Expose misc/format
 */
exports = module.exports = g(function* (location, limit) {

  limit = limit > 0 ? limit : 4

  var url = `http://ajax.googleapis.com/ajax/services/search/images?v=1.0&as_filetype=jpg&as_rights=cc_publicdomain&imgsz=large&imgtype=photo&key=${process.env.GOOGLE_API_KEY}&q=${location}`
  var googleRes = yield request(url)
  
  if (!googleRes.error && googleRes.statusCode == 200) {

      var allImages = JSON.parse(googleRes.body).responseData.results

      var images = []

      for(let i = 0; i < limit && i < allImages.length; i++) {
        var image = {
          width  : allImages[i].width,
          height : allImages[i].height,
          url    : allImages[i].url
        }

        images.push(image)
      }

      return images
  }

  return []
  
})

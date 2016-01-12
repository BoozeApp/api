
var bold = '\033[1m'
  , red = '\033[31m'
  , green = '\033[32m'
  , yellow = '\033[33m'
  , end = '\033[0m'

var ss = [200, 201, 204]
var sc = [304]

/**
 * Expose misc/format
 */
exports = module.exports = (req, res, next) => {

  var before = new Date().getTime()

  req.on('end', function() {

    var after = new Date().getTime()
    var time = after - before
    
    var success = `\
${bold}${req.method} ${req._parsedUrl.path} ${end} ${green}(${res.statusCode}, ${time}ms)${end}\
`

    var cache = `\
${bold}${req.method} ${req._parsedUrl.path} ${end} ${yellow}(${res.statusCode}, ${time}ms)${end}\
`

    var error = `\
${bold}${req.method} ${req._parsedUrl.path} ${end} ${red}(${res.statusCode}, ${time}ms)${end}\
`

    if (ss.indexOf(res.statusCode) != -1) {
      console.log(success)
    } else if (sc.indexOf(res.statusCode) != -1) {
      console.log(cache)
    } else {
      console.log(error)
    }
  })

  next()
}

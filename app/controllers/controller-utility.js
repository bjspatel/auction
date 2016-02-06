var http     = require('http');
var ctrlUtil = {};

/*
 * Gets the type of the object
 */
ctrlUtil.type = (function(global) {
  var cache = {};
  return function(obj) {
    var key;
    return (obj === null || obj === undefined) ? 'null' // null
      : obj === global ? 'global'                       // global object in nodejs
      : (key = typeof obj) !== 'object' ? key           // basic: string, boolean, number, undefined, function
      : obj.nodeType ? 'object'                         // DOM element
      : cache[key = ({}).toString.call(obj)]            // cached. date, regexp, error, object, array, math
      || (cache[key] = key.slice(8, -1).toLowerCase()); // get XXXX from [object XXXX], and cache it
  };
}(this));

/*
 * Responds to the client with appropriate status code and message, on the basis of specified data
 * If the data object is error, then error code is determined, and standard http message is sent
 * In rest of the cases status code of 200 is sent with proper message on basis of data type
 */
ctrlUtil.respond = function(res, data) {
  var dataType = ctrlUtil.type(data);
  if(dataType === 'error') {
    var errorCode = data.errorCode || 500;
    var message = data.customMessage || http.STATUS_CODES[errorCode];
    console.log(data);
    console.log(data.stack);
    res.status(errorCode);
    res.end(message);
  } else if(dataType === 'array' || dataType === 'object') {
    res.status(200).json(data);     // Respond with status code 200, and array data or object data as message in json format
  } else if(dataType === 'null') {
    res.status(200).end('OK');     // Respond with status code 200, and standard http message 'OK'
  } else {
    res.status(200).end(data);     // Respond with status code 200, and stringified data
  }
};

module.exports = ctrlUtil;

var _          = require('lodash');
var util       = require('util');
var errorRepo  = {};

// Error code and Error message-template map
errorRepo.metadata = {

  'ERR_INTERNAL': 'Internal Error. %s',

  'ERR_DBCONNECTION': 'Database connection lost on \"%s\".',
  'ERR_DBOPERATION': 'Database operation failed while \"%s\".',

  'ERR_DBOP_DUPLICATE': 'Dataobject already exists.',
  'ERR_DBOP_REFNOTFOUND': '\"%s\" reference id not found in the database.',
  'ERR_DBOP_DATANOTFOUND': '\"%s\" not found.',

  'ERR_BID_INCONSISTENT': 'Bid inconsistant',
  'ERR_OTHER': '%s'
};

/*
 * Prepares custom error object, using th specified error type, and customization attributes to fill in
*/
errorRepo.prepare = function(error, errType, msgEntities, properties) {
  msgEntities          = _.isArray(msgEntities) ? msgEntities : [msgEntities];
  properties           = properties || {};
  properties.message   = error.message || undefined;

  // Initialize basic attributes
  error.type           = errType;
  error.message        = util.format(errorRepo.metadata[errType], msgEntities);  // Fill the message-template with given entities
  if(!!properties['description']) error.message += '\n' + properties['description'];

  // Merge custom attributes to error object
  _.merge(error, properties);
  return error;
};

/*
 * Prepares error objects for various database operation errors
 */
errorRepo.prepareDBError = function(error, dbError, msgEntities) {
  var errType = '';
  if (dbError.code === '23505') errType = 'ERR_DBOP_DUPLICATE';
  var properties = dbError;
  return errorRepo.prepare(error, errType, msgEntities, properties);
};

module.exports = errorRepo;

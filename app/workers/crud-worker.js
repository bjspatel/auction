var Promise    = require('bluebird');
var bookshelf  = require('../init/db').bookshelf;
var errorRepo  = require('../lib/error-repo');
var crudWorker = {};

crudWorker.transactor = null;

String.prototype.capitalize = function() {
  return this.charAt(0).toUpperCase() + this.slice(1).toLowerCase();
};

/*
 * Creates a transactor, and preserves it in module
 */
crudWorker.beginTransaction = function() {
  return new Promise(function(resolve, reject) {
    bookshelf.transaction(function(t) {
      crudWorker.transactor = t;
      resolve(t);
    })
    .then(function(object) {
      console.log('Transation committed');
    })
    .catch(function(err) {
      console.log('Transaction failed');
    });
  });
};

/*
 * Commits transaction, if present, else throws error
 */
crudWorker.commitTransaction = function(object) {
  if(!!crudWorker.transactor) {
    crudWorker.transactor.commit(object);
    crudWorker.transactor = null;
  }
  else errorRepo.prepare(new Error(), '', null, { 'customMessage': 'Transaction has not been started before commmit' });
};

/*
 * Rollbacks transaction, if present, else throws error
 */
crudWorker.rollbackTransaction = function() {
  if(!!crudWorker.transactor) {
    crudWorker.transactor.rollback();
    crudWorker.transactor = null;
  }
  else errorRepo.prepare(new Error(), '', null, { 'customMessage': 'Transaction has not been started before rollback' });
};

/*
 * Cancels the transaction, if present
 */
crudWorker.dispatchTransaction = function() {
  if(!!crudWorker.transactor) crudWorker.rollbackTransaction();
};

/*
 * Creates row in database using specified data in options, in the specified model
 */
crudWorker.create = function(Model, options) {
  return new Promise(function(resolve, reject) {
    var saveOptions   = (!!crudWorker.transactor) ? { 'transacting': crudWorker.transactor } : null;
    var isMultiInsert = (Object.prototype.toString.call(options.data) === '[object Array]');
    if(!!options.criteria) {
      // Read the database to see if the record already exists
      crudWorker.read(Model, options)
      .then(function(fetchedObjects) {
        if(!fetchedObjects || fetchedObjects.length === 0) {
          // Record doesn't exist, so create a new one with given data
          var creationPromise = isMultiInsert
              ? Model.collection(options.data).invokeThen('save', null, saveOptions)
              : Model.forge(options.data).save(null, saveOptions);
          creationPromise
          .then(resolve)
          .catch(reject);
        } else {
          // Record already exists
          if(!!options.errorIfExists) reject(errorRepo.prepare(new Error(), 'ERR_DBOP_DUPLICATE', null, { 'errorCode': 422 }));
          else resolve(fetchedObjects);
        }
      });
    } else {
      // No criteria given; Create new row without any duplicate verification
      var creationPromise = isMultiInsert
          ? Model.collection(options.data).invokeThen('save', null, saveOptions)
          : Model.forge(options.data).save(null, saveOptions);
      creationPromise
      .then(resolve)
      .catch(reject);
    }
  });
};

/*
 * Reads rows from database using specified criteria in options, from the specified model
 */
crudWorker.read = function(Model, options) {
  options = options || {};
  var isOne = !!options.isOne;
  var fetchFunction = !!isOne ? 'fetch' : 'fetchAll';

  var fetchOptions = {};
  if(!!crudWorker.transactor) fetchOptions['transacting'] = crudWorker.transactor;
  if(!!options['withRelated']) fetchOptions['withRelated'] = options['withRelated'];

  return new Model()
    .query({ 'where': options.criteria })
    [fetchFunction](fetchOptions);
};

/*
 * Updates row in database using specified criteria with specified data in options, in the specified model
 */
crudWorker.update = function(Model, options) {
  return new Promise(function(resolve, reject) {

    var fetchOptions = (!!crudWorker.transactor) ? { 'transacting': crudWorker.transactor } : null;
    // Loads row in from the database using criteria
    new Model(options.criteria)
    .fetch(fetchOptions)
    .then(function(fetchedObject) {
      if(!fetchedObject) reject(errorRepo.prepare(new Error(), 'ERR_DBOP_DATANOTFOUND', null, { 'errorCode': 422 }));
      else {
        var updateOptions = (!!crudWorker.transactor) ? { 'transacting': crudWorker.transactor, 'patch': true } : null;
        // Save the specified data in the row
        fetchedObject.save(options.data, updateOptions)
        .then(resolve)
        .catch(reject);
      }
    });
  });
};

/*
 * Updates two-rows in database that depicts exchange of specified value in specified column
 */
crudWorker.exchange = function(Model, options) {

  var fetchOptions  = (!!crudWorker.transactor) ? { 'transacting': crudWorker.transactor } : null;
  var updateOptions = (!!crudWorker.transactor) ? { 'transacting': crudWorker.transactor, 'patch': true } : null;
  var modelName     = Model.prototype['tableName'].capitalize();
  var updatedObjs   = {};

  return new Promise(function(resolve, reject) {

    // Loads row in from the database using criteria
    new Model(options['incr_criteria'])
    .fetch(fetchOptions)
    .then(function(incrObject) {
      if(!incrObject) reject(errorRepo.prepare(new Error(), 'ERR_DBOP_DATANOTFOUND', null, { 'errorCode': 400 }));
      else {
        var data = {};
        data[options['column']] = parseInt(incrObject.get(options['column'])) + parseInt(options['value']);
        return incrObject.save(data, updateOptions)
      }
    })
    .then(function(updatedObject) {
      // Increament done
      updatedObjs['incr_' + modelName] = JSON.parse(JSON.stringify(updatedObject));
      return new Model(options['decr_criteria']).fetch(fetchOptions);
    })
    .then(function(decrObject) {
      if(!decrObject) reject(errorRepo.prepare(new Error(), 'ERR_DBOP_DATANOTFOUND', null, { 'errorCode': 400 }));
      else {
        var data = {};
        data[options['column']] = parseInt(decrObject.get(options['column'])) - parseInt(options['value']);
        return decrObject.save(data, updateOptions)
      }
    })
    .then(function(updatedObject) {
      // Decrement done
      updatedObjs['decr_' + modelName] = JSON.parse(JSON.stringify(updatedObject));

      // Exchange done
      resolve(updatedObjs);
    })
    .catch(reject);
  });
};

/*
 * Execute crud action;
 */
crudWorker.do = function(action, modelName, options, carrier) {
  return new Promise(function(resolve, reject) {
    var Model = bookshelf.model(modelName);
    crudWorker[action](Model, options)
    .then(function(processedObject) {
      if(!!carrier) {
        carrier[modelName] = JSON.parse(JSON.stringify(processedObject));
        resolve([processedObject, carrier]);
      } else {
        resolve(processedObject);
      }
    })
    .catch(reject);
  });
};

module.exports = crudWorker;

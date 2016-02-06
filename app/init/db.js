var _      = require("lodash");
var async  = require("async");
var schema = require('./schema').Schema;
var config = require('../../config/development');

var knexOptions = {};
if(!!config.db.connectionString) {
  knexOptions['connection'] = config.db.connectionString;
  knexOptions['client']     = 'pg',
  knexOptions['ssl']        = true;
} else {
  knexOptions['client']     = 'postgresql';
  knexOptions['connection'] = {
    'host': config.db.host,
    'user': config.db.username,
    'password': config.db.password,
    'database': config.db.database,
    'charset': 'utf-8',
    'debug': true
  }
}

var knex = require('knex')(knexOptions);

var bookshelf = require('bookshelf')(knex);

bookshelf.plugin('registry');    // Plugin registration for accessing models using bookshelf object
bookshelf.plugin('visibility');  // Plugin registration for hiding fields of data objects while serialization

module.exports.bookshelf = bookshelf;
module.exports.knex      = knex;
/*
 * Verifies database tables, to match with schema;
 * If any table from Schema.js is missing in database, then they are created with specified fields and field-types
*/
module.exports.verifyDB  = function(expressInitializer) {

  /*
   * Creates table using knex; Creates columns with specified datatypes in the callback after table creation
   */
  var createTable = function (tableName) {
    return bookshelf.knex.schema.createTable(tableName, function (table) {
      var column;
      var columnKeys = _.keys(schema[tableName]);

      columnKeys.forEach(function (key) {

        // Sepcify column datatype
        if (schema[tableName][key].type === "text" && schema[tableName][key].hasOwnProperty("fieldtype")) {
          column = table[schema[tableName][key].type](key, schema[tableName][key].fieldtype);
        } else if (schema[tableName][key].type === "string" && schema[tableName][key].hasOwnProperty("maxlength")) {
          column = table[schema[tableName][key].type](key, schema[tableName][key].maxlength);
        } else if (!table[schema[tableName][key].type]) {
          column = table['specificType'](key, schema[tableName][key].type);
        } else {
          column = table[schema[tableName][key].type](key);
        }

        //Specify column attributes
        if (schema[tableName][key].hasOwnProperty("nullable") && schema[tableName][key].nullable === true) {
          column.nullable();
        } else {
          column.notNullable();
        }

        if (schema[tableName][key].hasOwnProperty("primary") && schema[tableName][key].primary === true) {
          column.primary();
        }

        if (schema[tableName][key].hasOwnProperty("unique") && schema[tableName][key].unique === true) {
          column.unique();
        }

        if (schema[tableName][key].hasOwnProperty("unsigned") && schema[tableName][key].unsigned === true) {
          column.unsigned();
        }

        if (schema[tableName][key].hasOwnProperty("references")) {
          column.references(schema[tableName][key].references);
        }

        if (schema[tableName][key].hasOwnProperty("defaultTo")) {
          column.defaultTo(schema[tableName][key].defaultTo);
        }
      });
    });
  };

  /*
   * Verify if the table exists
   */
  var doesTableExist = function (tableName) {
    return bookshelf.knex.schema.hasTable(tableName);
  };

  // var dropPlayers = function() {
  //   console.log('DROPPING PLAYER');
  //   bookshelf.knex.schema.dropTable('players')
  //   .then(function(data) {
  //     console.log('DROPPED PLAYER');
  //     console.log(data);
  //   });
  // };

  /*
   * Starts checking for tables existstance, and creates if it's not found
   */
  var initDb = function (callback) {
    var calls = [];                   // Stores table creation function calls, to make sure no two runs together while execution
    var tableNames = _.keys(schema);  // Names of tables to verify in database

    tableNames.forEach(function (tableName) {

      var f = function (callback) {
        doesTableExist(tableName)
        .then(function (exists) {
          if (!exists) {
            console.log("Creating database table " + tableName + "...");

            createTable(tableName)
            .then(function (result) {
              console.log("---> Created database table " + tableName);
              callback(null, result);
            })
            .catch(function (err) {
              console.log("Error creating " + tableName + " table " + err);
              callback(err, null);
            });
          } else {
            callback(null, exists);
          }
        })
        .catch(function (error) {
          console.log("Error creating " + tableName + " table " + error);
          callback(error, null)
        });
      };

      calls.push(f);
    });

    // Call each table creation function in series, to make sure no two get executed in parallel
    async.series(calls, function (err, result) {
      if (!err) {
        console.log("> Finished initialising database table");
        // Initialize Server by setting express middleware
        callback();
      } else {
        // Abort the server startup
        console.log("> Error initialising database table: " + err);
        console.log(err.stack);
      }
    });
  };

  // Call to start all the table verification and creation
  initDb(expressInitializer);
};

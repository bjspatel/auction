//-----------------------Initialize DB-------------------------\\
var db = require('./app/init/db');
var expressInitializer = require('./app/init/express');

//----------------Verify tables in the database----------------\\
db.verifyDB(expressInitializer);

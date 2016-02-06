//-------------------------------load modules---------------------------------\\
var http         = require('http');
var path         = require('path');
var express      = require('express');
var logger       = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser   = require('body-parser');
var passport     = require('passport');
var session      = require('express-session');
var SessionStore = require('session-file-store')(session);

var config       = require('../../config/development');
var sessionPath  = path.join(__dirname, path.normalize(config.web.sessionStoregePath));

module.exports = function() {

  //--------------------setup the express application-------------------------\\
  var app = express();

  app.use(logger('dev'))            //logs every request to console
    .use(cookieParser())            //use cookie - needed for auth
    .use(bodyParser.json({          // to support JSON-encoded bodies
      'limit': '50mb'
    }))
    .use(bodyParser.urlencoded({    // to support URL-encoded bodies
      'limit': '50mb',
      'extended': false
    }))
    .use(session({                  //configures sessions setting
      'store': new SessionStore({ 'path': sessionPath }),
      'secret':config.web.sessionSecret,
      'resave': false,
      'saveUninitialized': true
    }))
    .use(passport.initialize())
    .use(passport.session());
    passport.serializeUser(function (user, done) { done(null, user); });
    passport.deserializeUser(function(user, done) { done(null, user); });

  //------------------------setup templating engine---------------------------\\
  app.set('views', path.join(__dirname, '..', '..', 'public'));
  app.engine('html', require('ejs').renderFile);
  app.set('view engine', 'html');
  app.use(express.static(path.join(__dirname, '..', '..', 'public')));

  //---------------------update host value in config--------------------------\\
  app.use(function(req, res, next) {
    config.web.host = req.headers.host;
    next();
  });

  //-------------------------initialize bookshelf-----------------------------\\
  require('./db');

  //--------------------------initialize models-------------------------------\\
  require('./models');

  //--------------------------initialize routes-------------------------------\\
  require('./routes')(app);

  //-----------------------------start server---------------------------------\\
  // app.listen(config.web.port, function() {
  //   console.log("> Server is running on port: " + config.web.port);
  // });

  var server = http.createServer(app);
  var io     = require('socket.io')(server);
  require('./socket')(io);

  server.listen(config.web.port, function() {
    console.log("> Server is running on port: " + config.web.port);
  });
};

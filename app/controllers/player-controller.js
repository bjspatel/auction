var http         = require('http');
var ctrlUtil     = require('./controller-utility');
var playerWorker = require('../workers/player-worker');
var playerCtrl   = {};

/*
 * [CRUD Functions]
 */
playerCtrl.login = function(req, res) {
  playerWorker.loginPlayer(req.body.name)
  .then(function(loggedInPlayer) {
    ctrlUtil.respond(res, loggedInPlayer);
  })
  .catch(function(err) {
    ctrlUtil.respond(res, err);
  });
};

playerCtrl.exchange = function(req, res) {
  playerWorker.exchange(req.body)
  .then(function(loggedInPlayer) {
    ctrlUtil.respond(res, loggedInPlayer);
  })
  .catch(function(err) {
    ctrlUtil.respond(res, err);
  });
};

playerCtrl.read = function(req, res) {
  var data = (!!req.query && Object.keys(req.query).length > 0) ? req.query : req.body;
  playerWorker.readPlayers(req.body.name)
  .then(function(fetchedPlayers) {
    ctrlUtil.respond(res, fetchedPlayers);
  })
  .catch(function(err) {
    ctrlUtil.respond(res, err);
  });
};

playerCtrl.update = function(req, res) {
  if(!!req.file) req.body.picture = req.file.filename;
  playerWorker.updatePlayer(req.user.email, req.body, res)
  .catch(function(err) {
    ctrlUtil.respond(res, err);
  });
};

playerCtrl.isLoggedIn = function(req, res, next) {
  // Verify the session stored on server
  if(req.isAuthenticated()) {
    next();
  }
  else res.status(401).end(http.STATUS_CODES[401]);
};

module.exports = playerCtrl;

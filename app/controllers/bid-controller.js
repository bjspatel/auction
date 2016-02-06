var http      = require('http');
var ctrlUtil  = require('./controller-utility');
var bidWorker = require('../workers/bid-worker');
var bidCtrl   = {};

/*
 * [CRUD Functions]
 */
bidCtrl.place = function(req, res) {
  bidWorker.placeBid(req.body)
  .then(function(createdAuction) {
    ctrlUtil.respond(res, createdAuction);
  })
  .catch(function(err) {
    ctrlUtil.respond(res, err);
  });
};

bidCtrl.read = function(req, res) {
  var data = (!!req.query && Object.keys(req.query).length > 0) ? req.query : req.body;
  bidWorker.readBid(req.body)
  .then(function(fetchedBids) {
    ctrlUtil.respond(res, fetchedBids);
  })
  .catch(function(err) {
    ctrlUtil.respond(res, err);
  });
};

module.exports = bidCtrl;

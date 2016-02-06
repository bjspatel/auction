var http          = require('http');
var ctrlUtil      = require('./controller-utility');
var auctionWorker = require('../workers/auction-worker');
var bookshelf     = require('../init/db').bookshelf;
var Auction       = bookshelf.model('Auction');
var auctionCtrl   = {};

/*
 * [CRUD Functions]
 */
auctionCtrl.start = function(req, res) {
  auctionWorker.startAuction(req.body)
  .then(function(createdAuction) {
    ctrlUtil.respond(res, createdAuction);
  })
  .catch(function(err) {
    ctrlUtil.respond(res, err);
  });
};

auctionCtrl.end = function(req, res) {
  auctionWorker.endAuction(req.body)
  .then(function(createdAuction) {
    ctrlUtil.respond(res, createdAuction);
  })
  .catch(function(err) {
    ctrlUtil.respond(res, err);
  });
};

module.exports = auctionCtrl;

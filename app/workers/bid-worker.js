var Promise    = require('bluebird');
var crudWorker = require('./crud-worker');
var workerUtil = require('./worker-utility');
var errorRepo  = require('../lib/error-repo');
var bidWorker  = {};

/*
 * Create the bid; Respond with the associated auction, bid and deep information asosciated with them
 */
bidWorker.placeBid = function(data) {
  return new Promise(function(resolve, reject) {

    data['now']     = new Date();
    var dataCarrier = { 'data': data };
    crudWorker.dispatchTransaction();

    // Execute all db operations for creating bid in single transaction
    crudWorker.beginTransaction()
    .then(function() { return readPlayer(dataCarrier); })
    .spread(readAuction)
    .spread(createBid)
    .spread(updateAuction)
    .then(function(updatedAuction) {
      // Respond
      crudWorker.commitTransaction();
      resolve(workerUtil.generateResponse(dataCarrier));
    })
    .catch(function(err) {
      // Reject bid on error
      crudWorker.rollbackTransaction();
      reject(err);
    });
  });
};

function readPlayer(dataCarrier) {
  var data = dataCarrier['data'];
  // Read player
  var playerOpts = {
    'criteria': { 'id': data['player_id'] },
    'isOne':    true
  };
  return crudWorker.do('read', 'Player', playerOpts, dataCarrier);
}

function readAuction(fetchedPlayer, dataCarrier) {
  var data = dataCarrier['data'];
  // Verify if the bid amount is less than the coins player has
  if(dataCarrier['Player']['coins'] < data['amount'])
    throw errorRepo.prepare(new Error(), 'ERR_BID_INCONSISTENT', null, { 'customMessage': 'Your bid is greater than the coins with you' });

  // Read the open auction
  var auctionOpts = {
    'criteria':    { 'open': true },
    'isOne':       true,
    'withRelated': ['winning_bid']
  };
  return crudWorker.do('read', 'Auction', auctionOpts, dataCarrier);
}

function createBid(fetchedAuction, dataCarrier) {
  var data = dataCarrier['data'];
  // Validate the bid amount
  if(dataCarrier['Auction']['min_value'] > data['amount']) {
    // Bid is less than minimum auction value
    throw errorRepo.prepare(new Error(), 'ERR_BID_INCONSISTENT', null, { 'customMessage': 'Your bid is less than the minimum value' });
  } else if(!!dataCarrier['Auction']['winning_bid'] && dataCarrier['Auction']['winning_bid']['amount'] >= data['amount']) {
    // Bid is not greater than last bid
    throw errorRepo.prepare(new Error(), 'ERR_BID_INCONSISTENT', null, { 'customMessage': 'Your bid is not greater than the last bid' });
  } else {
    //Create bid
    var bidOpts = {
      'data':          {
        'auction_id': dataCarrier['Auction']['id'],
        'player_id':  data['player_id'],
        'amount':     data['amount'],
        'created':    data['now']
      }
    };
    return crudWorker.do('create', 'Bid', bidOpts, dataCarrier);
  }
}

function updateAuction(createdBid, dataCarrier) {
  var data = dataCarrier['data'];
  // Update auction with bid information
  var auctionOpts = {
    'criteria':    { 'open': true },
    'isOne':       true,
    'data':        {
      'winning_bid': dataCarrier['Bid']['id'],
      'updated':     data['now']
    }
  };
  return crudWorker.do('update', 'Auction', auctionOpts, dataCarrier);
}

module.exports = bidWorker;

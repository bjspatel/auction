var _             = require('lodash');
var Promise       = require('bluebird');
var crudWorker    = require('./crud-worker');
var workerUtil    = require('./worker-utility');
var auctionWorker = {};

/*
 * Create the auction if not exists; Responds the auction data with deep information loded from database
 */
auctionWorker.startAuction = function(data) {
  return new Promise(function(resolve, reject) {

    var now = new Date();
    crudWorker.dispatchTransaction();

    //Create auction
    var auctionOpts = {
      'criteria':      { 'open': true },
      'isOne':         true,
      'errorIfExists': true,
      'data':          {
        'player_id': data['player_id'],
        'item_id':   data['item_id'],
        'quantity':  data['quantity'],
        'min_value': data['min_value'],
        'open':      true,
        'created':   now,
        'updated':   now
      }
    };
    crudWorker.do('create', 'Auction', auctionOpts)
    .then(function(createdAuction) {
      var processedObj = { 'Auction': createdAuction };
      resolve(workerUtil.generateResponse(processedObj));
    })
    .catch(function(err) {
      // Reject if an auction is already open
      if(!!err['type'] && err['type'] === 'ERR_DBOP_DUPLICATE') err['customMessage'] = 'An auction is already running.';
      reject(err);
    });
  });
};

/*
 * Ends the auction, if exists; Respond with the auction, involved players, involved items information
 */
auctionWorker.endAuction = function() {
  return new Promise(function(resolve, reject) {

    var dataCarrier = {};
    crudWorker.dispatchTransaction();

    crudWorker.beginTransaction()
    .then(function() { return closeBid(dataCarrier) })
    .spread(readFullAuction)
    .spread(exchangePlayersCoins)
    .spread(exchangeItemsQuantity)
    .spread(function(updatedItems, dataCarrier) {
      crudWorker.commitTransaction();
      resolve(workerUtil.generateResponse(dataCarrier));
    })
    .catch(function(err) {
      // Reject
      crudWorker.rollbackTransaction();
      reject(err);
    });
  });
};

function closeBid(dataCarrier) {
  // Close the open bid
  var auctionOpts = {
    'criteria':    { 'open': true },
    'data':        { 'open': false }
  };
  return crudWorker.do('update', 'Auction', auctionOpts, dataCarrier);
}

function readFullAuction(updatedAuction, dataCarrier) {
  // Load the auction with all the required information
  var auctionOpts = {
    'criteria':    { 'id': dataCarrier['Auction']['id'] },
    'isOne':       true,
    'withRelated': ['winning_bid', 'player', 'item', 'winning_bid.player.items']
  };
  return crudWorker.do('read', 'Auction', auctionOpts, dataCarrier);
}

function exchangePlayersCoins(fetchedAuction, dataCarrier) {
  if(!dataCarrier['Auction']['winning_bid']) throw errorRepo.prepare(new Error(), 'ERR_AUCTION_FAILED');

  // Exchange players' coins
  var sellingPlayer = dataCarrier['Auction']['player'];
  var buyingPlayer  = dataCarrier['Auction']['winning_bid']['player'];
  var playerOpts = {
    'incr_criteria': { 'id': sellingPlayer['id'] },
    'decr_criteria': { 'id': buyingPlayer['id'] },
    'column':        'coins',
    'value':         dataCarrier['Auction']['winning_bid']['amount']
  };
  return crudWorker.do('exchange', 'Player', playerOpts, dataCarrier);
}

function exchangeItemsQuantity(updatedPlayers, dataCarrier) {
    // Exchange Items' quantity
    var sellingItem = dataCarrier['Auction']['item'];
    var buyerItems  = dataCarrier['Auction']['winning_bid']['player']['items'];
    var buyingItem  = _.find( buyerItems, { 'name': sellingItem['name'] });

    var itemOpts = {
      'incr_criteria': { 'id': buyingItem['id'] },
      'decr_criteria': { 'id': sellingItem['id'] },
      'column':        'quantity',
      'value':         dataCarrier['Auction']['quantity']
    };
    return crudWorker.do('exchange', 'Item', itemOpts, dataCarrier);
}

module.exports = auctionWorker;

var Promise      = require('bluebird');
var crudWorker   = require('./crud-worker');
var workerUtil   = require('./worker-utility');
var playerWorker = {};

/*
 * Create the player and items if not exists; Respond with the player, items and current auction data
 */
playerWorker.loginPlayer = function(name) {
  return new Promise(function(resolve, reject) {
    var dataCarrier = {};
    dataCarrier['name'] = name;
    crudWorker.beginTransaction()
    .then(function() { return createPlayer(dataCarrier); })
    .spread(createItems)
    .spread(readAuction)
    .spread(function(fetchedAuction, dataCarrier) {
      // Commit
      crudWorker.commitTransaction(dataCarrier);
      resolve(workerUtil.generateResponse(dataCarrier));
    })
    .catch(function(err) {
      // Rollback
      crudWorker.rollbackTransaction();
      reject(err);
    });
  });
};

function createPlayer(dataCarrier) {
  var name = dataCarrier['name'];
  //Create player
  var playerOpts = {
    'criteria': { 'name': name },
    'isOne':    true,
    'data':     { 'name': name, 'coins': 1000 }
  };
  return crudWorker.do('create', 'Player', playerOpts, dataCarrier);
}

function createItems(createdPlayer, dataCarrier) {
  //Create items
  var playerId = dataCarrier['Player']['id'];
  var itemsOpts = {
    'criteria': { 'player_id': playerId },
    'data': workerUtil.generateDefaultItemData(playerId)
  };
  return crudWorker.do('create', 'Item', itemsOpts, dataCarrier);
}

function readAuction(createdItems, dataCarrier) {
  //Read auction
  var auctionOpts = {
    'criteria':    { 'open': true },
    'isOne':       true,
    'withRelated': ['winning_bid']
  };
  return crudWorker.do('read', 'Auction', auctionOpts, dataCarrier);
}

// playerWorker.exchange = function(data) {
//   var playerOpts = {
//     'incr_criteria': { 'name': data['buyer'] },
//     'decr_criteria': { 'name': data['seller'] },
//     'column': 'coins',
//     'value': data['amount']
//   };
//   return crudWorker.do('exchange', 'Player', playerOpts);
// };

module.exports = playerWorker;

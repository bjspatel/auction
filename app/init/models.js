var bookshelf = require('./db').bookshelf;

// Create Item model
var Item = bookshelf.Model.extend({
  'tableName': 'item'
});

// Create Player model
var Player = bookshelf.Model.extend({
  'tableName': 'player',
  'items': function() {
    return this.hasMany(Item);
  }
});

// Create Auction model
var Auction = bookshelf.Model.extend({
  'tableName': 'auction',
  'player': function() {
    return this.belongsTo(Player);
  },
  'item': function() {
    return this.belongsTo(Item);
  },
  'winning_bid': function() {
    return this.belongsTo(Bid, 'winning_bid');
  }
});

// Create Bid model
var Bid = bookshelf.Model.extend({
  'tableName': 'bid',
  'auction': function() {
    return this.belongsTo(Auction);
  },
  'player': function() {
    return this.belongsTo(Player);
  }
});

// Register models to bookshelf, for using later
bookshelf.model('Player', Player);
bookshelf.model('Item', Item);
bookshelf.model('Auction', Auction);
bookshelf.model('Bid', Bid);

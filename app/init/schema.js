// Database tables' schema definitions, to be used for verification and creation
var Schema = {
  'player': {
    'id':    { 'type': 'increments', 'nullable': false, 'primary': true },
    'name':  { 'type': 'string', 'maxlength': 254, 'nullable': false, 'unique': true },
    'coins': { 'type': 'integer', 'nullable': true }
  },

  'item': {
    'id':        { 'type': 'increments', 'nullable': false, 'primary': true },
    'name':      { 'type': 'string', 'nullable': false },
    'player_id': { 'type': 'integer', 'nullable': false },
    'quantity':  { 'type': 'integer', 'nullable': false }
  },

  'auction': {
    'id':          { 'type': 'increments', 'nullable': false, 'primary': true },
    'player_id':   { 'type': 'integer', 'nullable': false },
    'item_id':     { 'type': 'integer', 'nullable': false },
    'quantity':    { 'type': 'integer', 'nullable': false },
    'open':        { 'type': 'boolean', 'nullable': false },
    'created':     { 'type': 'datetime', 'nullable': false },
    'updated':     { 'type': 'datetime', 'nullable': false },
    'min_value':   { 'type': 'float', 'nullable': false },
    'winning_bid': { 'type': 'integer', 'nullable': true }
  },

  'bid': {
    'id':         { 'type': 'increments', 'nullable': false, 'primary': true },
    'auction_id': { 'type': 'integer', 'nullable': false },
    'player_id':  { 'type': 'integer', 'nullable': false},
    'amount':     { 'type': 'float', 'nullable': false },
    'created':    { 'type': 'datetime', 'nullable': false }
  }
};

module.exports.Schema = Schema;

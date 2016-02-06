var playerCtrl   = require('../controllers/player-controller');
var auctionCtrl  = require('../controllers/auction-controller');
var bidCtrl      = require('../controllers/bid-controller');

/*
 * Registers users routs in app
 */
module.exports = function(app) {

  app.route('/')
  .get(function(req, res) {
    res.render('index.html');
  });

  /*
   * CRUD Routes
   */
  app.route('/api/v1/players')
  .post(playerCtrl.login);

  app.route('/api/v1/players/exchange')
  .post(playerCtrl.exchange);

  app.route('/api/v1/auction/start')
  .post(auctionCtrl.start);

  app.route('/api/v1/auction/end')
  .post(auctionCtrl.end);

  app.route('/api/v1/bid')
  .post(bidCtrl.place);
};

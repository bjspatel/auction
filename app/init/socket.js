var playerWorker  = require('../workers/player-worker');
var auctionWorker = require('../workers/auction-worker');

module.exports = function(io) {

  io.of("/nsAuction").on("connection", function(socket){
    console.log("Connection established on server!!");

    socket.on("cLogin", function(name) {
      playerWorker.loginPlayer(name)
      .then(function(loggedInData) {
        socket.emit('sLoggedIn', loggedInData);
      })
      .catch(function(err) {
        socket.emit('sLogInFailed', err);
      });
    });

    socket.on("cStartAuction", function(data) {
      auctionWorker.startAuction(data)
      .then(function(auctionData) {
        socket.emit('sAuctionStarted', auctionData);
      })
      .catch(function(err) {
        socket.emit('sAuctionFailed', err);
      });
    });

  });

};

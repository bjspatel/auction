'use strict';

angular.module('app.auction', []);

angular
.module('app.auction')
.controller('AuctionController', ['Socket', 'SharedService', function(Socket, SharedService) {
    var vm   = this;
  }
])
.directive('auction',function() {
  return {
    'restrict':    'E',
    'reaplce':     true,
    'templateUrl': 'modules/auction-widget/view/auction.html'
  };
});

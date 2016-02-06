'use strict';

angular.module('app.items', []);

angular
.module('app.items')
.controller('AuctionDialogController', ['$mdDialog', 'Socket', 'SharedService',
  function($mdDialog, Socket, SharedService) {
    var vm       = this;
    vm.shared    = SharedService['data'];
    vm.item      = vm.shared['dialogData'];
    vm.eventData = {
      'quantity': 1,
      'min_value': 1
    };

    Socket.on('sAuctionStarted', function(data) {
      for(var key in data['Auction'])
        vm.shared.auction[key] = data['Auction'][key];
      $mdDialog.hide();
    });

    vm.startAuction = function() {
      vm.eventData['item_id']   = vm.shared['dialogData']['id'];
      vm.eventData['player_id'] = vm.shared.player['id'];
      Socket.emit('cStartAuction', vm.eventData);
		};

    vm.closeDialog = function() {
      delete vm.shared['dialogData'];
      $mdDialog.hide();
    };
  }]
)
.controller('ItemsController', ['$mdDialog', 'Socket', 'SharedService', function($mdDialog, Socket, SharedService) {
    var vm    = this;
    vm.shared = SharedService.data;
    vm.items  = vm.shared.items;

    vm.images = {
      'carrot': '/images/carrot.png',
      'bread': '/images/bread.png',
      'diamond': '/images/diamond.png'
    };

    vm.showDialog = function(ev, item) {
      vm.shared.dialogData = item
      $mdDialog.show({
        templateUrl: 'modules/items-widget/view/start-auction-form.html',
        targetEvent: ev
      });
    };
  }
])
.directive('items',function() {
  return {
    'restrict':    'E',
    'reaplce':     true,
    'templateUrl': 'modules/items-widget/view/items.html'
  };
});

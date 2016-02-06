'use strict';

angular.module('app.player', []);

angular
.module('app.player')
.controller('PlayerController', ['Socket', 'SharedService', function(Socket, SharedService) {
    var vm   = this;
    vm.player = SharedService.data['player'];
    vm.shared = SharedService.data;
    vm.shared.isLoggedIn = false;

    Socket.on('sLoggedIn', function(data) {
      for(var key in data['Player']) {
        vm.shared.player[key] = data['Player'][key];
      }

      var totalItems = vm.shared.items.length;
      Array.prototype.splice.apply(vm.shared.items, [0, totalItems].concat(data['Item']));

      if(!!data['Auction']) {
        for(var key in data['Auction'])
          vm.shared.auction[key] = data['Auction'][key];
      } else {
        vm.shared.auction['running'] = false;
      }

      vm.shared.isLoggedIn = true;
    });

    vm.login = function() {
      vm.shared['isLoggedIn'] = true;
      Socket.emit('cLogin', vm.player['name']);
    };
  }
])
.directive('player',function() {
  return {
    'restrict':    'E',
    'reaplce':     true,
    'templateUrl': 'modules/player-widget/view/player.html'
  };
});

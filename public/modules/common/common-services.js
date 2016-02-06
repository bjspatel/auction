'use strict';

angular.module('app.common', []);

angular.module('app.common')
.factory('SharedService', ['$rootScope', function($rootScope) {

    var sharedService = {};
    sharedService.data = {
      'player': {},
      'items': [],
      'auction': {},
      'isLoggedIn': false
    };
    sharedService.shareData = function(dataObject) {
      sharedService.data = dataObject;
    };
    return sharedService;
  }
])
.factory('Socket', ['$rootScope', 'SharedService', function($rootScope, SharedService) {
    var socket = io.connect('/nsAuction');
    return {
      'on': function(eventName, callback) {
        socket.on(eventName, function() {
          var args = arguments;
          $rootScope.$apply(function() {
            callback.apply(socket, args);
          });
        })
      },
      'emit': function(eventName, data, callback) {
        socket.emit(eventName, data, function() {
          var args= arguments;
          $rootScope.$apply(function() {
            if(callback) {
              callback.apply(socket, args);
            }
          });
        });
      }
    };
  }]
);

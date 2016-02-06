var MessageModel = require("../models/message-model");
var UserModel    = require("../models/user-model");

module.exports = function(io, player) {

  io.of("/nsMessages")
  .on("connection", function(socket) {

    socket.on("srv_postConnect", function(data) {

      onlineUsers.addUser(data.user);
      socket.user = onlineUsers.getUser(data.user.user_name);
      socket.emit('cli_updateOnlineUsers', onlineUsers.getAllUsers());

      new MessageModel()
      .getHistoryMessages()
      .then(function(fetchedMessages) {
        var fetchedMessages = JSON.parse(JSON.stringify(fetchedMessages)),
          messages     = [],
          msgUserNames = [];
          for(var i=0; i<fetchedMessages.length; i++) {
            msgUserNames.push(fetchedMessages[i].user_name);
            var currentMessage = {
              'message':  fetchedMessages[i].message,
              'datetime': fetchedMessages[i].datetime,
              'user':     fetchedMessages[i].user_name
            };
            messages.push(currentMessage);
          }

          new UserModel()
          .getUsers(msgUserNames)
          .then(function(usersObject) {
            for(var i=0; i<messages.length; i++) {
              messages[i].user = usersObject[messages[i].user];
            }
            socket.emit('cli_addOldMessages', JSON.stringify(messages));
          });

          var userStatus = {
            'message': (data.user.first_name + " " + data.user.last_name + " has joined the room."),
            'type':    'userStatus',
            'users':   onlineUsers.getAllUsers()
          };
          socket.broadcast.emit("cli_notification", JSON.stringify(userStatus));
        });
      });

      socket.on("srv_message", function(data) {
        var dateObject = new Date();
        data.datetime = dateObject.toISOString();

        var messageObject = {
          'message':   data.message,
          'user_name': data.user.user_name,
          'datetime':  dateObject
        };

        new MessageModel()
        .addMessage(messageObject)
        .then(function(savedMessage) {
          messageData      = savedMessage.toJSON();
          messageData.user = onlineUsers.getUser(messageData.user_name);
          var onlineUser   = onlineUsers.getUser(messageData.user_name);

          socket.broadcast.emit("cli_message", JSON.stringify(messageData));
        });
      });

      socket.on("srv_typing", function(data) {
        var user = onlineUsers.getUser(data);
        socket.broadcast.emit("cli_typing", JSON.stringify({ user: user }));
      });

      socket.on('disconnect', function () {
        onlineUsers.removeUser(socket.user);
        var leftData = {
          'message':	(socket.user.first_name + " " + socket.user.last_name + " has left the room."),
          'type': 	'userStatus',
          'users': 	onlineUsers.getAllUsers()
        };
        socket.broadcast.emit("cli_notification", JSON.stringify(leftData));
      });
  });
};

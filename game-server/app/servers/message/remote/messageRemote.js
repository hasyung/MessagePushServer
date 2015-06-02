module.exports = function (app) {
  return new MessageRemote(app);
};

var MessageRemote = function (app) {
  this.app = app;
  this.channelService = app.get('channelService');
};

MessageRemote.prototype.add = function (uid, sid, name, flag, callback) {
  //name is actual rid, com.avatar.airline_hrms*public
  var channel = this.channelService.getChannel(name, flag);

  if (!!channel) {
    channel.add(uid, sid);

    var param = {
      //package: msg.package, // 应用报名
      message_key: 'system', // 消息标识
      username: uid.split("*")[0], // 消息发送者
      target: "*", // 目标接收者
      content: {}, // 消息体
    };

    channel.pushMessage('Enter', param);
  }

  callback(this.get_room_names(name, flag));
};

MessageRemote.prototype.get_room_names = function (name, flag) {
  var users = [];
  var channel = this.channelService.getChannel(name, flag);

  if (!!channel) {
    users = channel.getMembers();
  }

  for (var i = 0; i < users.length; i++) {
    users[i] = users[i].split('*')[0];
  }

  return users;
};

MessageRemote.prototype.kick = function (uid, sid, name, callback) {
  var channel = this.channelService.getChannel(name, false);

  // leave channel
  if (!!channel) {
    channel.leave(uid, sid);
  }

  var username = uid.split('*')[0];
  var param = {
    route: 'Leave',
    username: username
  };

  channel.pushMessage(param);

  if (!!callback) callback();
};

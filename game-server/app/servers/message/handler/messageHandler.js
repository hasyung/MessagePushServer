var messageRemote = require('../remote/messageRemote');

module.exports = function(app) {
  return new Handler(app);
};

var Handler = function(app) {
  this.app = app;
};

Handler.prototype.send = function (msg, session, next) {
  var rid = session.get('rid');
  var username = session.uid.split('*')[0];
  var channelService = this.app.get('channelService');

  var param = {
    package: msg.package, // 应用报名
    message_key: msg.message_key, // 消息标识
    username: username, // 消息发送者
    target: msg.target, // 目标接收者
    content: msg.content, // 消息体
  };

  channel = channelService.getChannel(rid, false);

  if (msg.target == '*') {
    //the target is all users
    channel.pushMessage('Message', param);
  } else {
    //the target is specific user
    //debugger*public
    var tuid = msg.target + '*' + rid;
    var member = channel.getMember(tuid);

    if (!!member) {
      var tsid = member['sid'];

      channelService.pushMessageByUids('Message', param, [
        {
          uid: tuid,
          sid: tsid
        }
      ]);
    } else {
      console.error("cannot find member named ", tuid);
    }

    // 推送移动客户端
    var array = ["ios", "android"];

    if (msg.target.indexOf("web_") >= 0) {
      array.forEach(function(item) {
        var mobile_target = msg.target.replace("web_", item + "_");
        var mobile_tuid = mobile_target + '*' + rid;
        var mobile_member = channel.getMember(mobile_tuid);
        console.log(mobile_member);

        if (!!mobile_member) {
          param["target"] = mobile_target;
          channelService.pushMessageByUids('Message', param, [{uid: mobile_tuid, sid: mobile_member['sid']}]);
        }
      });
    }
  }

  next(null, {
    code: 'success',
    route: msg.route
  });
};

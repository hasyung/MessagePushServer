module.exports = function(app) {
  return new Handler(app);
};

var Handler = function(app) {
  this.app = app;
};

var handler = Handler.prototype;

handler.enter = function (msg, session, next) {
  var self = this;
  //apk package name or public/common
  var rid = msg.rid;
  //apk linkname
  var uid = msg.username + '*' + rid;

  if (!msg.username || msg.username.length == 0) {
    throw new Error("username_required");
  }

  var sessionService = self.app.get('sessionService');

  if (!!sessionService.getByUid(uid)) {
    next(null, {code: 'failed', message: "duplicate_login"});
    return;
  }

  //create session or user
  session.bind(uid);

  //set firstly then push
  session.set('rid', rid);
  session.push('rid', function (err) {
    if (err) {
      console.error('set rid for session service failed! error is : %j', err.stack);
    }
  });

  session.on('closed', onUserLeave.bind(null, self.app));

  //put user into channel
  self.app.rpc.message.messageRemote.add(session, uid, self.app.get('serverId'), rid, true, function (users) {
    self.app.rpc.geo.geoRemote.add(session, uid, self.app.get('serverId'), rid, true, function () {
      next(null, {
        code: 'success',
        users: users
      });
    });
  });
};

var onUserLeave = function (app, session) {
  if (!session || !session.uid) {
    return;
  }

  app.rpc.message.messageRemote.kick(session, session.uid, app.get('serverId'), session.get('rid'), null);
  app.rpc.geo.geoRemote.kick(session, session.uid, app.get('serverId'), session.get('rid'), null);
};

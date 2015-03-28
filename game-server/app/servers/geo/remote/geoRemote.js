module.exports = function (app) {
  return new GeoRemote(app);
};

var GeoRemote = function (app) {
  this.app = app;
  this.channelService = app.get('channelService');
};

GeoRemote.prototype.add = function (uid, sid, name, flag, callback) {
  //name is actual rid, com.avatar.airline_hrms*public
  var channel = this.channelService.getChannel(name, flag);

  if (!!channel) {
      channel.add(uid, sid);
  }

  if(!!callback) {
      callback();
  }
};

GeoRemote.prototype.kick = function (uid, sid, name, callback) {
  var channel = this.channelService.getChannel(name, false);

  // leave channel
  if (!!channel) {
      channel.leave(uid, sid);
  }

  if (!!callback) {
      callback();
  }
};

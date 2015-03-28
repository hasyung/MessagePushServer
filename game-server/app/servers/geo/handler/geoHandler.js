var async = require('async');
var Stepify = require('stepify');
var geolib = require('geolib');
var redis = require('redis');
var redis_client = redis.createClient(6382);

var geoRemote = require('../remote/geoRemote');

module.exports = function(app) {
  return new Handler(app);
};

var Handler = function(app) {
  this.app = app;
};

Handler.prototype.report = function (msg, session, next) {
  var app = this.app;
  var rid = session.get('rid');
  var username = session.uid.split('*')[0];
  var lat = msg.location[0];
  var lng = msg.location[1];
  var expire = msg.expire || 30;

  addGeoToRedis(rid, username, msg.location, expire, app);

  getNearestUsers(rid, username, lat, lng, msg.distance, function(err, users) {
    publishGeo(username, msg.location, app, rid, users);
    next(null, {
      code: 'success',
      route: msg.route,
      users: users
    });
  });
}

// 管理redis集合的缓存名称
// rid 房间名称
var getSetName = function(rid) {
  return rid + "_set";
}

// 将geo数据存入redis
// rid 房间名称
// username 当前session的注册名
// location [经度,维度]
// expire 缓存失效时间
var addGeoToRedis = function (rid, username, location, expire, app) {
  clearTimeout(app.globalTimeoutHash[username]);

  redis_client.set(username, location);
  redis_client.expire(username, expire);
  redis_client.sadd(getSetName(rid), username);

  app.globalTimeoutHash[username] = setTimeout(function() {
    redis_client.del(username, function(err, reply) {
      console.log("location for " + username + " removed from K/V after timeout");
    });

    redis_client.srem(getSetName(rid), username, function(err, reply) {
      console.log("username removed from SET after timeout");
    });

    delete app.globalTimeoutHash[username];
  }, expire * 1000);
}

// 查找附近的用户
// rid 房间名称
// current_employeename 当前sesion的注册名
// lat 经度
// lng 维度
// distance 距离容差
// callback 回调函数
var getNearestUsers = function(rid, current_employeename, lat, lng, distance, callback) {
  Stepify()
    .step('enum_users', function() {
      var root = this;

      redis_client.smembers(rid + "_set", function(err, users) {
        users = users.filter(function(item) {return item !== current_employeename});
        root.done(err, users);
      });
    })
    .step('get_location', function(users) {
      var members = {};
      var root = this;

      async.map(users, function(username, item_callback) {
        redis_client.get(username, function(err, location) {
          if (!!location)
            item_callback(null, {username: username, location: location.split(",")});
          else
            item_callback(null, null);
        });
      }, function(err, results) {
        results = results.filter(function(x) {return x != null});
        root.done(null, results);
      });
    })
    .step('filter_nearest', function(members) {
       var users = [];

       members.forEach(function(item) {
         var source_location = {latitude: item['location'][0], longitude: item['location'][1]};
         var st_distance = geolib.getDistance(source_location, {latitude: lat, longitude: lng});

         item['distance'] = st_distance;
         if(st_distance <= distance) users.push(item);
       });

       this.done(null, users);
    })
    .step('trigger_callback', function(users) {
      callback(null, users);
    }).run();
}

// 广播位置
// username 当前session的注册名
// location [经度，维度]
// app 全局application对象
// rid 房间名称
// users 包含{username: 注册名, location: 地理位置, distance: 距离}的集合
var publishGeo = function(username, location, app, rid, users) {
  var channelService = app.get('channelService');
  var channel = channelService.getChannel(rid, true);

  var param = {
    location: location,
    username: username,
    distance: -1
  };

  //channel = channelService.getChannel(rid, false);
  //channel.pushMessage('Geo', param);

  users.forEach(function(user) {
    console.log(user["username"], username);

    if (user["username"] != username) {
      var tuid = user["username"] + '*' + rid;
      var tsid = channel.getMember(tuid)['sid'];
      var source_location = {latitude: location[0], longitude: location[1]};
      var target_location = user["location"];

      param["distance"] = geolib.getDistance(source_location, {latitude: target_location[0], longitude: target_location[1]});
      channelService.pushMessageByUids('Geo', param, [
          {
              uid: tuid,
              sid: tsid
          }
      ]);
    }
  });
}

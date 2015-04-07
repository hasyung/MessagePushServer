var pomelo = require('pomelo');
var routeUtil = require('./app/util/routeUtil');
var schedule = require('node-schedule');

/**
 * Init app for client.
 */
var app = pomelo.createApp();
app.set('name', 'PushServer');

// app configuration
app.configure('production|development', 'connector', function() {
  app.set('connectorConfig',
    {
      connector: pomelo.connectors.sioconnector,
      transports: ['websocket'], //websocket, htmlfile, xhr-polling, jsonp-polling, flashsocket
      heartbeats: true,
      disconnectOnTimeout: true,
      closeTimeout: 10,
      heartbeatTimeout: 10,
      heartbeatInterval: 3,
      handshake: function(msg, callback) {
        console.log("--handshake message: ", message);
        callback(null, {});
      }
    });
});

app.configure('production|development', function () {
    //route configures
    app.route('message', routeUtil.message);
    app.route('geo', routeUtil.geo);
    //app.filter(pomelo.timeout());
});

app.configure('production|development', 'geo', function () {
  var globalTimeoutHash = {};
  app.set('globalTimeoutHash', globalTimeoutHash, true);

  var rule = new schedule.RecurrenceRule();
  rule.second = 30;

  //var globalCrontabJob = schedule.scheduleJob(rule, function() {
      //console.log("--Timeout Items Size: ", Object.keys(app.globalTimeoutHash).length);
      //console.log("--Timeout Items: ", Object.keys(app.globalTimeoutHash));
  //});

  app.set("globalCrontabJob", globalCrontabJob, true);
});

// start app
app.start();

process.on('uncaughtException', function (err) {
  console.error('Caught exception: ' + err.stack);
});

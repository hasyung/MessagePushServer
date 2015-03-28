var dispatcher = require('./dispatcher');

module.exports.message = function(session, msg, app, callback) {
    var servers = app.getServersByType('message');

    if(!servers || servers.length === 0) {
        callback(new Error('can not find message servers.'));
        return;
    }

    var res = dispatcher.dispatch(session.get('rid'), servers);
    callback(null, res.id);
};

module.exports.geo = function(session, msg, app, callback) {
    var servers = app.getServersByType('geo');

    if(!servers || servers.length === 0) {
        callback(new Error('can not find geo servers.'));
        return;
    }

    var res = dispatcher.dispatch(session.get('rid'), servers);
    callback(null, res.id);
};

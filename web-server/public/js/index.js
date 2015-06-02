var pomelo = window.pomelo;
var host = "127.0.0.1";
var port = "9927";

util = {
    urlRE: /https?:\/\/([-\w\.]+)+(:\d+)?(\/([^\s]*(\?\S+)?)?)?/g,
    //  html sanitizer
    toStaticHTML: function(inputHtml) {
        inputHtml = inputHtml.toString();
        return inputHtml.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    },

    //pads n with zeros on the left,
    //digits is minimum length of output
    //zeroPad(3, 5); returns "005"
    //zeroPad(2, 500); returns "500"
    zeroPad: function(digits, n) {
        n = n.toString();
        while(n.length < digits)
            n = '0' + n;
        return n;
    },

    //it is almost 8 o'clock PM here
    //timeString(new Date); returns "19:49"
    timeString: function(date) {
        var minutes = date.getMinutes().toString();
        var hours = date.getHours().toString();
        return this.zeroPad(2, hours) + ":" + this.zeroPad(2, minutes);
    },

    //does the argument only contain whitespace?
    isBlank: function(text) {
        var blank = /^\s*$/;
        return(text.match(blank) !== null);
    }
};

function enter() {
  pomelo.init({
    host: host,
    port: port,
    log: true
  }, function() {
      var rid = $("#rid").val();
      var username = $("#username").val();

      pomelo.request("connector.entryHandler.enter", {username: username, rid: rid}, function(data) {
        if (data.code == 'failed') {
          add_log("#FF0000", "DUPLICATE_ERROR");
        } else {
          add_log("#00CC99", data.users.length + "个人");
          add_log("#00CC99", data.users.join(","));
        }
    });
  });
}

function send() {
  var params = {
    package: 'com.cdavatar.sichuan_airline_hrms',
    content: {agree: "yes", body: $("#content").val()},
    username: $("#username").val(),
    target: $("#to").val()
  };

  pomelo.request("message.messageHandler.send", params, function(data) {
    if (data.code == 'failed') {
      add_log("#FF0000", "SEND ERROR");
    }
  });
}

function handle_report() {
    var location = $("#location").val();

    var params = {
        location: location.split(","),
        username: $("#username").val(),
        distance: 10000000,
        expire: 30
    };

    report_request(params);
}

function auto_report(bool) {
    if(bool) {
        report = setInterval(function(){
            var params = {
                location: [(""+(Math.random()+1)).substring(0,5), (""+(Math.random()+2)).substring(0,5)],
                username: $("#username").val(),
                distance: 10000000,
                expire: 30
            };
            report_request(params);
        }, 10 * 1000);
    } else {
        clearInterval(report);
    }
}

function start_report() {
    auto_report(true);
}

function stop_report() {
    add_log("#999900", $("#username").val() + " 停止上报!")
    auto_report(false);
}

function report_request(params) {
    add_log("#6611FF", $("#username").val() + " 上报位置!")

    pomelo.request("geo.geoHandler.report", params, function(data) {
        if (data.code == 'failed') {
            add_log("#FF0000", "REPORT ERROR");
        }

        for (var x in data.users) {
            var user = data.users[x];
            add_log("#080808", "上报返回列表:  " + JSON.stringify(user, null, '\t'));
        }
    });
}

$(document).ready(function(){
    pomelo.on('Message', function(data){
        add_log("#0000FF", JSON.stringify(data, null, '\t'));
    });

    pomelo.on('Geo', function(data){
        add_log("#0000FF", "收到上报通知:  " + JSON.stringify(data, null, '\t'));
    });

    pomelo.on('Enter', function(data){
        add_log("#FF00CC", "收到进入事件:  " + data.username + " enter");
    });

    pomelo.on('Leave', function(data){
        add_log("#FF00CC", "收到离开事件:  " + data.username + " leave");
    });

});

function scrollTop(psconsole){
    psconsole.scrollTop(
        psconsole[0].scrollHeight - psconsole.height()
    );
}

function add_log(color, message) {
    var psconsole = $('#logHistory')
    var messageElement = $(document.createElement("table"));
    var content = '<tr style="color:' + color + '">' + '<td class="col-sm-1">' + util.timeString(new Date()) + '</td>' + '<td class="col-sm-2" >系统消息</td>' + '<td>' + message + '</td>' + '</tr>';
    messageElement.html(content);
    psconsole.append(messageElement);
    scrollTop(psconsole);
}

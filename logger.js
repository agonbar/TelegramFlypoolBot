var colors = require('colors');

var formatMsg = function (msg) {
    return "[" + (new Date(Date.now())).toLocaleString() + "] => " + msg;
}

module.exports = {
    info: function (msg) { console.log(colors.green(formatMsg(msg))); },
    trace: function (msg) { console.log(colors.yellow(formatMsg(msg))); },
    error: function (msg) { console.log(colors.red(formatMsg(msg))); }
}
var TelegramBot = require('node-telegram-bot-api');
var request = require('request');
var http = require('http');
var https = require('https');
var util = require("util");

var usUrl = 'http://zcash.flypool.org/api/miner_new/t1ZGwVoKpoTHV9bN1w6VXTXUHyhMykPT2D9';
//var valuesUrl = 'https://poloniex.com/public?command=returnTicker'
var token = '283923768:AAG13x1pnvKzn5YnfhEpZpFR1SxfLBSeDAY';
var bot = new TelegramBot(token, {polling: true});

var lastTrans = '';
//var rate = 0;
//var usdvalue = 0;
var conversations = {};

// Any kind of message
bot.onText(/\/subscrib(.+)/, function (msg, match) {
  var fromId = msg.chat.id;
  if (conversations[fromId] != true) conversations[fromId] = true
  console.log(util.inspect(conversations, {showHidden: false, depth: null}));
});

bot.onText(/\/statu(.+)/, function (msg, match) {
  var fromId = msg.chat.id;
  http.get(usUrl, function(res){
      var body = '';
      res.on('data', function(chunk){
          body += chunk;
      });
      res.on('end', function(){
          var apiResponse = JSON.parse(body);
          var mess = '';
          for(work in apiResponse.workers) {
            mess = mess + 'Worker: '+apiResponse.workers[work].worker+
            ', '+apiResponse.workers[work].hashrate+'\n';
          }
          bot.sendMessage(fromId, mess);
      });
  });
});

setInterval(function() {
  //console.log('Interval' + util.inspect(conversations, {showHidden: false, depth: null}));

  /*https.get(valuesUrl, function(res){
      var body = '';
      res.on('data', function(chunk){
          body += chunk;
      });
      res.on('end', function(){
        var json = JSON.parse(body);
         rate = json.BTC_ZEC.last;
         usdvalue = json.USDT_BTC.last;
      });
  });*/

  http.get(usUrl, function(res){
      var body = '';
      res.on('data', function(chunk){
          body += chunk;
      });
      res.on('end', function(){
          var apiResponse = JSON.parse(body);
          if (lastTrans != apiResponse.payouts[0].txHash) {
            lastTrans = apiResponse.payouts[0].txHash;
            zec = apiResponse.payouts[0].amount/100000000;
            for (pend in conversations) {
              bot.sendMessage(pend, 'Paid '+zec+'ZEC on '+apiResponse.payouts[0].paidOn);
            }
          } else {
            //for (pend in conversations) bot.sendMessage(pend, 'No change');
          };
      });
  });
}, 10000);

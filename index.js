const path = require('path');
const JsonDB = require('node-json-db');
var TelegramBot = require('node-telegram-bot-api');
const config = require(path.join(__dirname, "config.json"));

const FlypoolAPI = require(path.join(__dirname, "apis", "flypool"));
const PoloniexAPI = require(path.join(__dirname, "apis", "poloniex"));

var db = new JsonDB("./bot_db", true, false);

var bot = new TelegramBot(config.telegram_token, { polling: true });

var ZEC_BTC = 0;
var ZEC_USD = 0;

bot.onText(/\/subscribe(.*)/, function (msg, match) {
    var content = String(match[1]).trim();
    if (content.length == 35) {
        db.push("/wallet/" + msg.from.id, { address: content });
        bot.sendMessage(msg.from.id, "Subscribed to this wallet.");
    }
    else {
        bot.sendMessage(msg.from.id, "⚠ Zcash address incorrect.\n<code>/subscribe t1*********************************</code>", { parse_mode: "html" });
    }
});

bot.onText(/\/status(.*)/, function (msg, match) {
    var wallets = [];
    try { wallets = db.getData("/wallet/" + msg.from.id); } catch (err) { }

    for (var wi in wallets) {
        FlypoolAPI.getStatus(wallets[wi])
            .then(function (result) {
                bot.sendMessage(msg.from.id, formatStatus(result), { parse_mode: "html" });
            })
            .catch(console.error);
    }

    if (wallets.length == 0) {
        bot.sendMessage(msg.from.id, "Subscribe to a wallet before.");
    }
});

bot.onText(/\/workers(.*)/, function (msg, match) {
    var wallets = [];
    try { wallets = db.getData("/wallet/" + msg.from.id); } catch (err) { }

    for (var wi in wallets) {
        FlypoolAPI.getStatus(wallets[wi])
            .then(function (result) {
                bot.sendMessage(msg.from.id, formatWorkers(result), { parse_mode: "html" });
            })
            .catch(console.error);
    }

    if (wallets.length == 0) {
        bot.sendMessage(msg.from.id, "Subscribe to a wallet before.");
    }
});

function formatTransaction(trans) {
    var exchange = "";
    var adjust = 1000000;
    if (ZEC_BTC && ZEC_BTC > 0) exchange += " ≈ " + Math.round(ZEC_BTC * (result.unpaid / 100000000) * adjust) / adjust + " BTC";
    if (ZEC_USD && ZEC_USD > 0) exchange += " ≈ " + Math.round(ZEC_USD * (result.unpaid / 100000000) * adjust) / adjust + " USD";

    return "<b>New payout</b> <a href=\"http://zcash.flypool.org/miners/" + trans.miner + "/payouts\">🔗</a>" + "\n" + "\n" +
        "<b>Address:</b> " + trans.miner + "\n" +
        "<b>Blocks: </b> " + trans.start + " → " + trans.end + "\n" +
        "<b>Amount: </b> " + Math.round(result.amount / 100000000 * adjust) / adjust + exchange + "\n" +
        "<b>Instant:</b> " + new Date(trans.paidOn).toLocaleString();
}

function formatWorkers(trans) {
    var msg = "<b>Miners info</b> <a href=\"http://zcash.flypool.org/miners/" + trans.address + "/payouts\">🔗</a>" + "\n" + "\n";

    for (var c in trans.workers) {
        msg += "<b>" + trans.workers[c].worker + "</b> → " + trans.workers[c].hashrate + "\n";
    }

    return msg;
}

function formatStatus(result) {
    var workers = 0;
    var shares = 0;
    var ishares = 0;
    for (var x in result.workers) {
        if (result.workers[x].workerLastSubmitTime * 1000 > (Date.now() - 1000 * 60 * 5)) workers++;
        shares += result.workers[x].validShares;
        ishares += result.workers[x].invalidShares;
    }

    var exchange = "";
    var adjust = 1000000;
    if (ZEC_BTC && ZEC_BTC > 0) exchange += " ≈ " + Math.round(ZEC_BTC * (result.unpaid / 100000000) * adjust) / adjust + " BTC";
    if (ZEC_USD && ZEC_USD > 0) exchange += " ≈ " + Math.round(ZEC_USD * (result.unpaid / 100000000) * adjust) / adjust + " USD";

    return "<b>Pool status</b> <a href=\"http://zcash.flypool.org/miners/" + result.address + "\">🔗</a>" + "\n" + "\n" +
        "<b>Address:</b> " + result.address + "\n" +
        "<b>Mined:</b> " + Math.round(result.unpaid / 100000000 * adjust) / adjust + " ZEC" + exchange + "\n" +
        "<b>Active workers:</b> " + workers + "\n" +
        "<b>Hashrate:</b> " + Math.round(result.avgHashrate * 100) / 100 + " H/s\n" +
        "<b>Shares → Valid:</b> " + shares + "\n" +
        "<b>Shares → Invalid:</b> " + ishares + "\n";
}

function sendUpdateTransactions() {
    var wallets = {};

    var data = [];
    try { data = db.getData("/wallet"); } catch (err) { }

    for (var userId in data) {
        var address = data[userId].address;
        if (wallets[address]) { wallets[address].push(userId); }
        else { wallets[address] = [userId]; }
    }

    for (var walletAddr in wallets) {
        FlypoolAPI.getStatus(walletAddr)
            .then(function (result) {
                var dataPays = [];
                var toSend = [];

                try {
                    dataPays = db.getData("/pays/" + walletAddr);
                }
                catch (err) { }

                for (var pi in result.payouts) {
                    var saved = false;
                    for (var dp in dataPays) {
                        if (dataPays[dp].id == result.payouts[pi].id) saved = true;
                    }

                    if (!saved) {
                        dataPays.push(result.payouts[pi]);
                        toSend.push(result.payouts[pi]);
                    }
                }

                db.push("/pays/" + walletAddr, dataPays);

                for (var userIndex in wallets[walletAddr]) {
                    userId = Number(wallets[walletAddr][userIndex]);

                    for (var tsi in toSend) {
                        bot.sendMessage(userId, formatTransaction(toSend[tsi]), { parse_mode: "html" });
                    }
                }
            });
    }
}

function sendUpdates() {
    sendUpdateTransactions();
}

setInterval(sendUpdates, config.update_interval);

function updateExchange() {
    PoloniexAPI.returnTicker()
        .then(function (response) {
            ZEC_BTC = response["BTC_ZEC"].last;
            ZEC_USD = response["USDT_ZEC"].last;
        })
        .catch(console.error);
}

setInterval(updateExchange, config.update_exchange);
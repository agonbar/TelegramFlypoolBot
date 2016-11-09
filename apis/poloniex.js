const request = require('request');

const URL = "https://poloniex.com";
const PATH_TICKER = "/public?command=returnTicker";

class PoloniexApi {
    static returnTicker() {
        return new Promise(function (resolve, reject) {
            var options = { url: URL + PATH_TICKER };

            request.get(options, function (error, response) {
                if (!error && response.statusCode == 200) {
                    try { resolve(JSON.parse(response.body)); }
                    catch (err) { resolve(response.body); }
                }
                else reject(error !== null ? error : response.statusCode);
            });
        });
    }
}

module.exports = PoloniexApi;
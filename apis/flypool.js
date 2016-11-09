const request = require('request');

const URL = "http://zcash.flypool.org/api";
const PATH_STAT = "/miner_new/";

class FlypoolApi {
    static getStatus(account) {
        return new Promise(function (resolve, reject) {
            var options = { url: URL + PATH_STAT + String(account) };

            request.get(options, function (error, response) {
                if (!error && response.statusCode == 200) {
                    if (String(response.body).indexOf("Not found") == -1) {
                        try { resolve(JSON.parse(response.body)); }
                        catch (err) { resolve(response.body); }
                    }
                    else reject(404);
                }
                else reject(error !== null ? error : response.statusCode);
            });
        });
    }
}

module.exports = FlypoolApi;
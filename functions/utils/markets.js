const functions = require("firebase-functions");
const config = functions.config();
const request = require("request");

exports.getMarkets = () => {
  const cryptoInfoKeys = [];
  const options = {
    url: config.kinta.api,
    headers: {
      Authorization: config.kinta.authorization,
    },
  };

  return new Promise((resolve, reject) => {
    request(options, (error, response, body) => {
      if (!error && response.statusCode === 200) {
        const jsonBody = JSON.parse(body);
        jsonBody.data.forEach((crypto) => {
          const key =
          `${crypto.market}_${crypto.baseCurrency}_${crypto.quoteCurrency}`;
          cryptoInfoKeys[key] = crypto;
        });
        resolve(cryptoInfoKeys);
      } else {
        functions.logger.error("Error getMarket");
        reject(cryptoInfoKeys);
      }
    });
  });
};

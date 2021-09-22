const functions = require("firebase-functions");
const config = functions.config();
const request = require("request");

exports.getMarkets = () => {
  let cryptoInfoKeys = [];
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

        const keys = jsonBody.data.map((crypto) => {
          return `${crypto.market}_${crypto.baseCurrency}_${crypto.quoteCurrency}`;
        });

        resolve({ keys, cryptos: jsonBody.data });
      } else {
        functions.logger.error("Error getMarket");
        reject(cryptoInfoKeys);
      }
    });
  });
};

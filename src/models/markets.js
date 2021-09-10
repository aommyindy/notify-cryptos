require("dotenv").config();
import request from "request";

export function getMarkets(callback) {
  let cryptoInfoKeys = [];

  const options = {
    url: process.env.API_KINTA_URL,
    headers: {
      Authorization: process.env.API_KINTA_AUTHORIZATION,
    },
  };
  request(options, (error, response, body) => {
    if (!error && response.statusCode == 200) {
      const jsonBody = JSON.parse(body);
      jsonBody.data.map((crypto) => {
        const key = `${crypto.market}_${crypto.baseCurrency}_${crypto.quoteCurrency}`;
        cryptoInfoKeys[key] = crypto;
      });
      callback(cryptoInfoKeys);
    } else {
      console.log("Error getMarket");
    }
  });
}

function filterCryptos(cryptos) {
  return cryptos.filter((crypto) => getInterested(crypto));
}


function getInterested(crypto) {
  const key = `${crypto.market}_${crypto.baseCurrency}_${crypto.quoteCurrency}`;
  const foundInterested = interested.cryptos.filter((item) => item.key == key);
  return foundInterested.length > 0;
}

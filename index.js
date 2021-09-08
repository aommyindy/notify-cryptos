require("dotenv").config();
const cron = require("node-cron");
const request = require("request");
const interested = require("./interested.json");

cron.schedule("*/15 * * * *", () => {
  getCryptos();
});

function getCryptos() {
  const options = {
    url: process.env.API_KINTA_URL,
    headers: {
      Authorization: process.env.API_KINTA_AUTHORIZATION,
    },
  };
  request(options, (error, response, body) => {
    if (!error && response.statusCode == 200) {
      const jsonBody = JSON.parse(body);
      const cryptos = filterCryptos(jsonBody.data);
      notification(cryptos);
    } else {
      console.log(response);
    }
  });
}

function getInterested(crypto) {
  const key = `${crypto.market}_${crypto.baseCurrency}_${crypto.quoteCurrency}`;
  const foundInterested = interested.cryptos.filter((item) => item.key == key);
  return foundInterested.length > 0;
}

function filterCryptos(cryptos) {
  return cryptos.filter((crypto) => getInterested(crypto));
}

function notification(cryptos) {
  cryptos.map((crypto) => {
    const key = `${crypto.market}_${crypto.baseCurrency}_${crypto.quoteCurrency}`;
    interested.cryptos.map((interestedCrypto) => {
      if (
        key == interestedCrypto.key &&
        crypto.lastPrice < interestedCrypto.priceLowerThan
      ) {
        send(
          `${key} ${crypto.lastPrice} < ${interestedCrypto.priceLowerThan} ${crypto.quoteCurrency}`
        );
      }

      if (
        key == interestedCrypto.key &&
        crypto.lastPrice > interestedCrypto.priceHigherThan
      ) {
        send(
          `${key} ${crypto.lastPrice} > ${interestedCrypto.priceHigherThan} ${crypto.quoteCurrency}`
        );
      }
    });
  });
}

function send(message) {
  const options = {
    url: process.env.API_NOTIFY_URL,
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: "Bearer " + process.env.API_NOTIFY_AUTHORIZATION,
    },
    qs: { message },
  };
  request(options, (error, response, body) => {
    if (error) {
      const jsonBody = JSON.parse(body);
      console.log(jsonBody);
    }
  });
}

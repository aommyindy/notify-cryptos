import cron from "node-cron";
import { getMarkets } from "./models/markets";
import { getConditions } from "./models/conditions";
import { send } from './models/notify';
import express from 'express';

const app = express();

cron.schedule("*/15 * * * *", () => {
  checkConditions();
});

app.listen(3000);


function checkConditions() {
  getMarkets((cryptos) => {
    getConditions((condition) => {
      console.log(condition)
      if (cryptos[condition.key]) {
        const message = getMessage(condition.key, condition, cryptos[condition.key]);
        if (message) {
          send(message)
        }
      }
    });
  });
}

function getMessage(key, condition, crypto) {
  if (crypto.lastPrice < condition.priceLowerThan) {
    return `${key} ${crypto.lastPrice} < ${condition.priceLowerThan} ${crypto.quoteCurrency}`;
  }
  if (crypto.lastPrice > condition.priceHigherThan) {
    return `${key} ${crypto.lastPrice} > ${condition.priceHigherThan} ${crypto.quoteCurrency}`;
  }
}

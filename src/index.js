import cron from 'node-cron'
import { getMarkets } from './models/markets'
import { getConditions } from './models/conditions'
import { send } from './models/notify'

cron.schedule('*/15 * * * *', () => {
  run()
})

function run () {
  getMarkets((cryptos) => {
    getConditions((condition) => {
      if (cryptos[condition.key]) {
        const message = checkConditions(condition, cryptos[condition.key])
        if (message) {
          send(message)
        }
      }
    })
  })
}

function checkConditions (condition, crypto) {
  if (crypto.lastPrice < condition.priceLowerThan) {
    return `${crypto.baseCurrency} (${crypto.market}) ${crypto.lastPrice} < ${condition.priceLowerThan} ${crypto.quoteCurrency}`
  }
  if (crypto.lastPrice > condition.priceHigherThan) {
    return `${crypto.baseCurrency} (${crypto.market}) ${crypto.lastPrice} > ${condition.priceHigherThan} ${crypto.quoteCurrency}`
  }
}

import request from 'request'
require('dotenv').config()

export function getMarkets (callback) {
  const cryptoInfoKeys = []

  const options = {
    url: process.env.API_KINTA_URL,
    headers: {
      Authorization: process.env.API_KINTA_AUTHORIZATION
    }
  }
  request(options, (error, response, body) => {
    if (!error && response.statusCode === 200) {
      const jsonBody = JSON.parse(body)
      jsonBody.data.forEach((crypto) => {
        const key = `${crypto.market}_${crypto.baseCurrency}_${crypto.quoteCurrency}`
        cryptoInfoKeys[key] = crypto
      })
      callback(cryptoInfoKeys)
    } else {
      console.log('Error getMarket')
    }
  })
}

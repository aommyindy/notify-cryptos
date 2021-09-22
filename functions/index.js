"use strict"

const functions = require("firebase-functions")
const admin = require('firebase-admin')
admin.initializeApp()
const firestore = admin.firestore()

const regionFunctions = functions.region("asia-northeast3")
const config = functions.config()

const { getMarkets } = require("./utils/markets")
const { send } = require("./utils/lineNotify")

exports.scheduledFunction = regionFunctions
    .pubsub.schedule("*/15 * * * *")
    .timeZone("Asia/Bangkok")
    .onRun((context) => {
        run()
    })

async function run() {
    const cryptos = await getMarkets();
    const conditions = await getConditions();

    conditions.forEach(async (condition) => {
        if (cryptos[condition.key]) {
            const message = checkConditions(condition, cryptos[condition.key])
            if (message) {
                functions.logger.info(message);
                await send(message)
            }
        }
    })
}

function getConditions() {
    return new Promise((resolve, reject) => {
        let conditions = []
        firestore.collection('conditions').get().then((snapshot) => {
            if (snapshot.empty) reject(conditions)
            snapshot.forEach((item) => {
                conditions.push(item.data())
            })

            resolve(conditions)
        })
    })
}

function checkConditions(condition, crypto) {
    if (crypto.lastPrice < condition.priceLowerThan) {
        return `${crypto.baseCurrency} ${crypto.lastPrice} < ${condition.priceLowerThan} ${crypto.quoteCurrency}`
    }
    if (crypto.lastPrice > condition.priceHigherThan) {
        return `${crypto.baseCurrency}  ${crypto.lastPrice} > ${condition.priceHigherThan} ${crypto.quoteCurrency}`
    }
}
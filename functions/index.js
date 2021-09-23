"use strict";

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { WebhookClient } = require("dialogflow-fulfillment");
// const { Card, Suggestion } = require('dialogflow-fulfillment');

admin.initializeApp();
const firestore = admin.firestore();

const regionFunctions = functions.region("asia-northeast3");

const { getMarkets } = require("./utils/markets");
const { send } = require("./utils/lineNotify");

exports.run = regionFunctions.https.onRequest(async (req, res) => {
    const conditions = await getConditions();
    const { keys, cryptos } = await getMarkets();

    res.json({
        conditions,
        keys,
    });
});

exports.scheduledFunction = regionFunctions.pubsub
    .schedule("*/15 * * * *")
    .timeZone("Asia/Bangkok")
    .onRun((context) => {
        run();
    });

process.env.DEBUG = "dialogflow:debug"; // enables lib debugging statements
exports.dialogflowFirebaseFulfillment = functions.https.onRequest(
    (request, response) => {
        const agent = new WebhookClient({ request, response });

        function setNotify(agent) {
            const param = request.body.queryResult.parameters;
            const baseCurrency = param.baseCurrency[0].toUpperCase();
            const lower = param.lowerThen ? "LOWER" : "";
            const higher = param.higherThen ? "HIGHER" : "";
            const key = `${param.market}_${baseCurrency}_THB`;
            const priceLowerThan = lower === "LOWER" ? { priceLowerThan: param.number[0] } : null;
            const priceHigherThan = lower === "HIGHER" ? { priceHigherThan: param.number[0] } : null;
            const dataUpdate = {
                key: key.toUpperCase(),
                ...priceLowerThan,
                ...priceHigherThan
            }

            functions.logger.info(dataUpdate);
            firestore
                .collection("conditions")
                .doc(`${key}_${lower}${higher}`)
                .set(dataUpdate);
            agent.add(`ตั้งเตือนเรียบร้อย`);
        }

        let intentMap = new Map();
        intentMap.set("setNotify", setNotify);

        agent.handleRequest(intentMap);
    }
);

async function run() {
    const conditions = await getConditions();
    const { keys, cryptos } = await getMarkets();
    conditions.forEach(async (condition) => {
        const index = keys.indexOf(condition.key);
        if (cryptos[index]) {
            const message = checkConditions(condition, cryptos[index]);
            if (message) {
                functions.logger.info(message);
                await send(message);
            }
        }
    });
}

function getConditions() {
    return new Promise((resolve, reject) => {
        const conditions = [];
        firestore
            .collection("conditions")
            .get()
            .then((snapshot) => {
                if (snapshot.empty) reject(conditions);
                snapshot.forEach((item) => {
                    conditions.push(item.data());
                });

                resolve(conditions);
            });
    });
}

function checkConditions(condition, crypto) {
    if (crypto.lastPrice < condition.priceLowerThan) {
        return `${crypto.baseCurrency} ${crypto.lastPrice} < ${condition.priceLowerThan} ${crypto.quoteCurrency}`;
    }
    if (crypto.lastPrice > condition.priceHigherThan) {
        return `${crypto.baseCurrency}  ${crypto.lastPrice} > ${condition.priceHigherThan} ${crypto.quoteCurrency}`;
    }
}

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

    res.json({
        conditions,
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
        const param = request.body.queryResult.parameters;
        const baseCurrency = param.baseCurrency;
        const lower = param.lowerThen ? "LOWER" : "";
        const higher = param.higherThen ? "HIGHER" : "";
        const key = `${param.market}_${baseCurrency}_THB`.toUpperCase();
        const docKey = `${key}_${lower}${higher}`.toUpperCase();

        function setNotify(agent) {
            const priceLowerThan =
                lower === "LOWER" ? { priceLowerThan: param.number } : null;
            const priceHigherThan =
                higher === "HIGHER"
                    ? { priceHigherThan: param.number }
                    : null;
            const dataUpdate = {
                key: key,
                ...priceLowerThan,
                ...priceHigherThan,
            };

            if (
                typeof param.market == "string" ||
                typeof param.number == "number" ||
                typeof param.baseCurrency == "string"
            ) {
                functions.logger.info(dataUpdate);
                firestore.collection("conditions").doc(docKey).set(dataUpdate);
                agent.end(`ตั้งเตือน ${docKey} ${param.number}`);
            } else {
                agent.end(`ผิดพลาด ${docKey} ${param.number}`);
            }
        }

        function delNotify(agent) {
            if (
                typeof param.market === "string" &&
                typeof param.baseCurrency === "string"
            ) {
                if (lower.length === 0 && higher.length === 0) {
                    const docHigher = `${key}_HIGHER`;
                    const docLower = `${key}_LOWER`;
                    firestore.collection("conditions").doc(docHigher).delete();
                    firestore.collection("conditions").doc(docLower).delete();
                    agent.end(`ยกเลิกเตือนเรียบร้อย ${docHigher} และ ${docLower}`);
                } else {
                    firestore.collection("conditions").doc(docKey).delete();
                    agent.end(`ยกเลิกเตือนเรียบร้อย ${docKey}`);
                }
                
            } else {
                agent.end(`ผิดพลาด ${docKey}`);
            }
        }

        let intentMap = new Map();
        intentMap.set("setNotify", setNotify);
        intentMap.set("delNotify", delNotify);

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

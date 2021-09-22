import request from 'request'
require('dotenv').config()
const functions = require('firebase-functions')

export async function send (message) {
  const options = {
    url: process.env.API_NOTIFY_URL,
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: 'Bearer ' + process.env.API_NOTIFY_AUTHORIZATION
    },
    qs: { message }
  }
  request(options, (error, response, body) => {
    if (error) {
      const jsonBody = JSON.parse(body)
      functions.logger.error(jsonBody)
    }
  })
}

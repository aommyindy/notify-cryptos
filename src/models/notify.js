import request from 'request'
require('dotenv').config()

export async function send (message) {
  if (process.env.NODE_ENV === 'development') {
    console.log(message)
    return
  }

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
      console.log(jsonBody)
    }
  })
}

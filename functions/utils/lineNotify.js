const functions = require("firebase-functions");
const config = functions.config();
const request = require("request");

exports.send = (message) => {
  const options = {
    url: config.linenotify.api,
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Authorization": "Bearer " + config.linenotify.authorization,
    },
    qs: {message},
  };


  return new Promise((resolve, reject) => {
    request(options, (error, response, body) => {
      if (error) {
        const jsonBody = JSON.parse(body);
        functions.logger.error(jsonBody);
        reject(jsonBody);
      }
      resolve(response);
    });
  });
};

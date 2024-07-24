const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");
const axios = require("axios");

const app = express();
const port = 8007;

app.use(bodyParser.json());

let motionDetected = false;
let isNew = false;

const apiKeys = {
  esp32: "16d7a4fca7442dda3ad93c9a726597e4",
};

telegramApiToken = "188428767:AEhcC4SpIDyZbMHeqgU8OAWeaJGF4KqzGIFGDVVn";
telegramURL = "https://tapi.bale.ai/bot" + telegramApiToken + "/sendMessage";

async function postDataToTelegram(address, data) {
  axios
    .post(address, data)
    .then(function (response) {
      console.log(response);
    })
    .catch(function (error) {
      console.log(error);
    });
}

// Log file path
const logFilePath = path.join(__dirname, "logs.csv");

// Ensure log file exists and has the correct headers
if (!fs.existsSync(logFilePath)) {
  fs.writeFileSync(logFilePath, "date,time,detected\n");
}
// API endpoint for ESP32 to send motion detection
app.post("/api/motion", (req, res) => {
  if (req.body.apiKey == apiKeys.esp32) {
    motionDetected = req.body.detected;
    isNew = true;
    date = new Date();
    date.setHours(date.getHours() + 3);
    date.setMinutes(date.getMinutes() + 30);
    date = date.toLocaleString("fa-IR");
    const logEntry = `${date},${req.body.detected}\n`;
    fs.appendFile(logFilePath, logEntry, (err) => {
      if (err) {
        console.error("Failed to save log:", err);
        res.status(500).send({ success: false, message: "Failed to save log" });
      } else {
        console.log(
          `Motion ${
            parseInt(req.body.detected) ? "detected" : "stopped"
          } and logged on ${new Date().toISOString()}`
        );
        res.status(200).send({ success: true });
        const requestBody = {
          chat_id: "1292108244",
          text: `Motion ${
            parseInt(req.body.detected) ? "detected" : "stopped"
          } on ${date}`,
        };
        postDataToTelegram(telegramURL, requestBody);
      }
    });
  } else {
    res.status(400).send({ success: false, message: "Unauthorized request" });
  }
});

// API endpoint for clients to check motion detection status
app.get("/api/status", (req, res) => {
  if (isNew) {
    res
      .status(200)
      .send({ isEmpty: false, date: date, detected: motionDetected });
    isNew = false;
  } else {
    res.status(200).send({ isEmpty: true });
  }
});

app.get("/status", (req, res) => {
  const filePath = path.join(__dirname, "public", "status.html");
  res.sendFile(filePath);
});

// API endpoint to get logs for the last hour
app.get("/logs", (req, res) => {
  const filePath = path.join(__dirname, "public", "log.html");
  res.sendFile(filePath);
});

app.get("/api/logs", (req, res) => {
  const filePath = path.join(__dirname, "logs.csv");
  res.sendFile(filePath);
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

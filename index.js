const express = require("express");
const cors = require("cors");
const session = require("express-session");
const bodyParser = require("body-parser");

const secrets = require("./config/secrets.js");
const router = require("./routes/handler.js");
require("dotenv/config");

const app = express();
app.use(
  cors({
    origin: ["http://localhost:3000"],
    methods: ["GET", "POST"],
    credentials: true,
  })
);
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set("trust proxy", 1);
app.use(
  session({
    secret: secrets.cookieSecret,
    resave: false,
    saveUninitialized: true,
    cookie: {
      //secure: true, // requires https connection
      maxAge: 1000 * 60 * 60, // 1 hour
    },
  })
);
app.use(router);

const port = process.env.REACT_APP_PORT;

app.listen(port, () => {
  console.log(`running on port ${port}`);
});

const express = require("express");
const cors = require("cors");
const session = require("express-session");

const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");

const bcrypt = require("bcrypt");
const saltRounds = 10;

const connection = require("./database.js");
const secret = require("./secret.js");
require("dotenv/config");

//const router = express.Router();
const app = express();
app.use(
  cors({
    origin: ["http://localhost:3000"],
    methods: ["GET", "POST"],
    credentials: true,
  })
);
app.use(express.json());
/* app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "http://localhost:3000");
  res.header("Access-Control-Allow-Credentials", true);
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
}); */
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.set("trust proxy", 1);
app.use(
  session({
    secret: secret,
    resave: false,
    saveUninitialized: true,
    cookie: {
      //secure: true, // requires https connection
      maxAge: 1000 * 60 * 60, // 1 hour
    },
  })
);

app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  // check if user already exists
  connection.query(
    "SELECT * FROM users WHERE email = ?;",
    [email],
    (err, result) => {
      if (err) {
        if (err.code === "ECONNREFUSED") {
          res.send({ error: true, message: "Unable to connect to database" });
        } else {
          console.log(err);
          res.send({ error: true, message: "Error" });
        }
        return;
      }
      // user already exists
      if (result.length > 0) {
        res.send({ error: true, message: "Email already has an account" });
        return;
      }
      // user does not exist, continue to register
      // hash password
      bcrypt.hash(password, saltRounds, (err, hash) => {
        if (err) {
          console.log(err);
          res.send({ error: true, message: "Error" });
          return;
        }
        // register to database
        connection.query(
          "INSERT INTO users (email, password) VALUES (?,?);",
          [email, hash],
          (err, result) => {
            if (err) {
              if (err.code === "ECONNREFUSED") {
                res.send({
                  error: true,
                  message: "Unable to connect to database",
                });
              } else {
                console.log(err);
                res.send({ error: true, message: "Error" });
              }
              return;
            }
            // register successful
            res.send({ error: false, message: "Sign up successful!" });
          }
        );
      });
    }
  );
});

app.get("/login", (req, res) => {
  if (req.session.user) {
    res.send({ loggedIn: true, user: req.session.user });
  } else {
    res.send({
      loggedIn: false,
    });
  }
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  connection.query(
    "SELECT * FROM users WHERE email = ?;",
    [email, password],
    (err, result) => {
      if (err) {
        if (err.code === "ECONNREFUSED") {
          res.send({ error: true, message: "Unable to connect to database" });
        } else {
          console.log(err);
          res.send({ error: true, message: "Error" });
        }
        return;
      }
      // if email found
      if (result.length > 0) {
        // unhash password
        bcrypt.compare(password, result[0].password, (err, matches) => {
          if (matches) {
            req.session.user = result;
            console.log(req.session.user);
            res.send({ error: false, result: result[0] });
          } else {
            res.send({ error: true, message: "Incorrect email or password" });
          }
        });
      }
      // if email not found
      else {
        res.send({ error: true, message: "Incorrect email or password" });
      }
    }
  );
});

app.post("/logout", (req, res) => {
  res.redirect("http://localhost:3000/goals");
});

const port = process.env.REACT_APP_PORT;

app.listen(port, () => {
  console.log(`running on port ${port}`);
});

/* app.post("/get", (req, res) => {
  const query = req.body.query;
  const pageSize = 25;

  const api_url = `${process.env.REACT_APP_FOOD_API_LINK}api_key=${
    process.env.REACT_APP_FOOD_API_KEY
  }&query=${encodeURIComponent(query)}&pageSize=${pageSize}`;

  fetch(api_url)
    .then((response) => response.json())
    .then((json) => {
      console.log(json);
    });
}); */

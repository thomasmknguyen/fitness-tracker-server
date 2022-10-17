const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const saltRounds = 10;

const connection = require("../config/database.js");
const secrets = require("../config/secrets.js");

router.post("/api/auth/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  // check if user already exists
  connection.query(
    "SELECT * FROM users WHERE email = ?;",
    [email],
    (queryErr, queryResult) => {
      if (queryErr) {
        if (queryErr.code === "ECONNREFUSED") {
          res.send({ error: true, message: "Unable to connect to database" });
        } else {
          console.log(queryErr);
          res.send({ error: true, message: "Error" });
        }
        return;
      }
      // user already exists
      if (queryResult.length > 0) {
        res.send({ error: true, message: "Email already has an account" });
        return;
      }
      // user does not exist, continue to register
      // hash password
      bcrypt.hash(password, saltRounds, (hashErr, hash) => {
        if (hashErr) {
          console.log(hashErr);
          res.send({ error: true, message: "Error" });
          return;
        }
        // register to database
        connection.query(
          "INSERT INTO users (email, password) VALUES (?,?);",
          [email, hash],
          (queryErr, queryResult) => {
            if (queryErr) {
              if (queryErr.code === "ECONNREFUSED") {
                res.send({
                  error: true,
                  message: "Unable to connect to database",
                });
              } else {
                console.log(queryErr);
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

router.get("/api/auth/login", (req, res) => {
  if (req.session.user) {
    //res.send({ loggedIn: true, user: req.session.user });
    res.send({ loggedIn: true, cookie: req.session.cookie });
  } else {
    res.send({
      loggedIn: false,
    });
  }
});

router.post("/api/auth/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  connection.query(
    "SELECT * FROM users WHERE email = ?;",
    [email, password],
    (queryErr, queryResult) => {
      if (queryErr) {
        if (queryErr.code === "ECONNREFUSED") {
          res.send({ error: true, message: "Unable to connect to database" });
        } else {
          console.log(queryErr);
          res.send({ error: true, message: "Error" });
        }
        return;
      }
      // if email found
      if (queryResult.length > 0) {
        // unhash password
        bcrypt.compare(
          password,
          queryResult[0].password,
          (err, passwordMatches) => {
            if (passwordMatches) {
              const id = queryResult[0].userId;
              const token = jwt.sign({ id }, secrets.jwtSecret, {
                expiresIn: 1000 * 60 * 60, // 1 hour
              });
              req.session.user = queryResult;
              console.log(req.session.user);
              res.send({ error: false, token: token, result: queryResult[0] });
            } else {
              res.send({ error: true, message: "Incorrect email or password" });
            }
          }
        );
      }
      // if email not found
      else {
        res.send({ error: true, message: "Incorrect email or password" });
      }
    }
  );
});

router.post("/api/auth/logout", (req, res) => {
  res.redirect("http://localhost:3000/goals");
});

/* app.post("/api/food/get", (req, res) => {
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

module.exports = router;

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
      // if query unsuccessful
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
            // if query unsuccessful
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

  // find user
  connection.query(
    "SELECT * FROM users WHERE email = ?;",
    [email, password],
    (queryErr, queryResult) => {
      // if query unsuccessful
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
              /* const id = queryResult[0].userId;
              const token = jwt.sign({ id }, secrets.jwtSecret, {
                expiresIn: 1000 * 60 * 60, // 1 hour
              }); */
              req.session.user = queryResult;
              console.log(req.session.user);
              res.send({
                error: false,
                /* token: token,  */ result: queryResult[0],
              });
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

router.post("/api/get/day", (req, res) => {
  const userId = req.body.userId;
  const date = req.body.date;

  // get dayId
  connection.query(
    "SELECT dayId FROM days WHERE userId = ? AND date = ?;",
    [userId, date],
    (queryErr, queryResult) => {
      // if query unsuccessful
      if (queryErr) {
        if (queryErr.code === "ECONNREFUSED") {
          res.send({ error: true, message: "Unable to connect to database" });
        } else {
          console.log(queryErr);
          res.send({ error: true, message: "Error" });
        }
        return;
      }
      // if day exists, return
      if (queryResult.length > 0) {
        res.send({ error: false, dayId: queryResult[0] });
      }
      // if day does not exist, add new day
      else {
        connection.query(
          "INSERT INTO days(date, userId) VALUES(?,?);",
          [date, userId],
          (queryErr, queryResult) => {
            // if query unsuccessful
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
            // if query successful, get dayId
            connection.query(
              "SELECT dayId FROM days WHERE userId = ? AND date = ?;",
              [userId, date],
              (queryErr, queryResult) => {
                // if query unsuccessful
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
                // if query successful, return dayId
                res.send({ error: false, dayId: queryResult });
              }
            );
          }
        );
      }
    }
  );
});

router.post("/api/get/meal", (req, res) => {
  const dayId = req.body.dayId;
  const meal = req.body.meal;

  // get mealId
  connection.query(
    "SELECT mealId FROM meals WHERE dayId = ? AND mealName = ?;",
    [dayId, meal],
    (queryErr, queryResult) => {
      // if query unsuccessful
      if (queryErr) {
        if (queryErr.code === "ECONNREFUSED") {
          res.send({ error: true, message: "Unable to connect to database" });
        } else {
          console.log(queryErr);
          res.send({ error: true, message: "Error" });
        }
        return;
      }
      // if meal exists, return
      if (queryResult.length > 0) {
        res.send({ error: false, mealId: queryResult[0] });
      }
      // if meal does not exist, add new meal
      else {
        connection.query(
          "INSERT INTO meals(mealName, dayId) VALUES(?,?);",
          [meal, dayId],
          (queryErr, queryResult) => {
            // if query unsuccessful
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
            // if query successful, get mealId
            connection.query(
              "SELECT mealId FROM meals WHERE dayId = ? AND mealName = ?;",
              [dayId, meal],
              (queryErr, queryResult) => {
                // if query unsuccessful
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
                // if query successful, return mealId
                res.send({ error: false, mealId: queryResult[0] });
              }
            );
          }
        );
      }
    }
  );
});

router.post("/api/add/food", (req, res) => {
  const foodName = "temporary food"; //req.body.food;
  const serving = req.body.serving;
  const calories = req.body.calories;
  const carbs = req.body.carbs;
  const protein = req.body.protein;
  const fat = req.body.fat;
  const mealId = req.body.mealId;

  // add food
  connection.query(
    "INSERT INTO food(foodName, serving, calories, carbs, protein, fat, mealId) VALUES(?,?,?,?,?,?,?);",
    [foodName, serving, calories, carbs, protein, fat, mealId],
    (queryErr, queryResult) => {
      // if query unsuccessful
      if (queryErr) {
        if (queryErr.code === "ECONNREFUSED") {
          res.send({ error: true, message: "Unable to connect to database" });
        } else {
          console.log(queryErr);
          res.send({ error: true, message: "Error" });
        }
        return;
      }
      // successful
      if (queryResult.length > 0) {
        res.send({ error: false, message: "food add successful!" });
      }
    }
  );
});

/* router.post("/api/add/food", (req, res) => {
  const foodName = "temporary food"; //req.body.food;
  const serving = req.body.serving;
  const calories = req.body.calories;
  const carbs = req.body.carbs;
  const protein = req.body.protein;
  const fat = req.body.fat;
  const userId = req.body.userId;
  const date = req.body.date;
  const meal = req.body.meal;
  let dayId = 0;
  let mealId = 0;

  // get dayId
  connection.query(
    "SELECT dayId FROM days WHERE userId = ? AND date = ?;",
    [userId, date],
    (queryErr, queryResult) => {
      // if query unsuccessful
      if (queryErr) {
        if (queryErr.code === "ECONNREFUSED") {
          res.send({ error: true, message: "Unable to connect to database" });
        } else {
          console.log(queryErr);
          res.send({ error: true, message: "Error" });
        }
        return;
      }
      // if day exists, set dayid and continue to meal
      if (queryResult.length > 0) {
        dayId = queryResult[0].dayId.dayId;
        return;
      }
      // if day does not exist, add new day
      else {
        connection.query(
          "INSERT INTO days(date, userId) VALUES(?,?);",
          [date, userId],
          (queryErr, queryResult) => {
            // if query unsuccessful
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
            // if query successful, get dayId
            connection.query(
              "SELECT dayId FROM days WHERE userId = ? AND date = ?;",
              [userId, date],
              (queryErr, queryResult) => {
                // if query unsuccessful
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
                // if query successful, set day id and continue to meal
                dayId = queryResult[0].dayId.dayId;
                return;
              }
            );
          }
        );
      }
    }
  );

  // get mealId
  connection.query(
    "SELECT mealId FROM meals WHERE dayId = ? AND mealName = ?;",
    [dayId, meal],
    (queryErr, queryResult) => {
      // if query unsuccessful
      if (queryErr) {
        if (queryErr.code === "ECONNREFUSED") {
          res.send({ error: true, message: "Unable to connect to database" });
        } else {
          console.log(queryErr);
          res.send({ error: true, message: "Error" });
        }
        return;
      }
      // if meal exists, set meal id and continue to food
      if (queryResult.length > 0) {
        mealId = queryResult[0].mealId.mealId;
        return;
      }
      // if meal does not exist, add new meal
      else {
        connection.query(
          "INSERT INTO meals(mealName, dayId) VALUES(?,?);",
          [meal, dayId],
          (queryErr, queryResult) => {
            // if query unsuccessful
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
            // if query successful, get mealId
            connection.query(
              "SELECT mealId FROM meals WHERE dayId = ? AND mealName = ?;",
              [dayId, meal],
              (queryErr, queryResult) => {
                // if query unsuccessful
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
                // if query successful, set meal id and continue to food
                mealId = queryResult[0].mealId.mealId;
                return;
              }
            );
          }
        );
      }
    }
  );

  // add food
  connection.query(
    "INSERT INTO food(foodName, serving, calories, carbs, protein, fat, mealId) VALUES(?,?,?,?,?,?,?);",
    [foodName, serving, calories, carbs, protein, fat, mealId],
    (queryErr, queryResult) => {
      // if query unsuccessful
      if (queryErr) {
        if (queryErr.code === "ECONNREFUSED") {
          res.send({ error: true, message: "Unable to connect to database" });
        } else {
          console.log(queryErr);
          res.send({ error: true, message: "Error" });
        }
        return;
      }
      // successful
      if (queryResult.length > 0) {
        res.send({ error: false, message: "food add successful!" });
      }
    }
  );
}); */

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

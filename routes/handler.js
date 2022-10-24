const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const saltRounds = 10;

const connection = require("../config/database.js");
const secrets = require("../config/secrets.js");
const { query } = require("express");

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

router.post("/api/add/day", (req, res) => {
  const userId = req.body.userId;
  const date = req.body.date;

  connection.query(
    "INSERT INTO days(date, userId) VALUES(?,?);",
    [date, userId],
    async (queryErr, queryResult) => {
      // if query unsuccessful
      if (queryErr) {
        res.status(500).send("Day insert error");
        return;
      }
      // if query successful, get dayId
      connection.query(
        "SELECT dayId FROM days WHERE date = ? AND userId = ?;",
        [date, userId],
        (queryErr, queryResult) => {
          // if query unsuccessful
          if (queryErr) {
            res.status(500).send("Day select error");
            return;
          }
          // if query successful, return dayId
          res.send(queryResult[0]);
        }
      );
    }
  );
});

router.post("/api/add/meal", async (req, res) => {
  const dayId = req.body.dayId;
  const mealName = req.body.mealName;

  connection.query(
    "INSERT INTO meals(mealName, dayId) VALUES(?,?);",
    [mealName, dayId],
    (queryErr, queryResult) => {
      // if query unsuccessful
      if (queryErr) {
        res.status(500).send("Meal insert error");
        return;
      }
      // if query successful, get mealId
      connection.query(
        "SELECT mealId FROM meals WHERE dayId = ? AND mealName = ?;",
        [dayId, mealName],
        (queryErr, queryResult) => {
          // if query unsuccessful
          if (queryErr) {
            res.status(500).send("Meal select error");
            return;
          }
          // if query successful, return mealId
          res.send(queryResult[0]);
        }
      );
    }
  );
});

router.post("/api/add/food", (req, res) => {
  const foodName = req.body.foodName;
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
        res.status(500).send("Food insert error");
        return;
      }
      // successful
      res.end();
    }
  );
});

router.post("/api/get/ids", (req, res) => {
  const userId = req.body.userId;
  const date = req.body.date;

  let dayId = 0;
  let breakfastId = 0;
  let lunchId = 0;
  let dinnerId = 0;

  connection.query(
    "SELECT dayId FROM days WHERE date = ? AND userId = ?",
    [date, userId],
    async (queryErr, queryResult) => {
      if (queryErr) {
        res.status(500).send("Query error");
        return;
      }

      // if date exists, get meals
      if (queryResult.length > 0) {
        dayId = queryResult[0].dayId;

        // breakfast
        breakfastId = await new Promise((resolve, reject) => {
          connection.query(
            "SELECT mealId from meals WHERE mealName = 'Breakfast' AND dayId = ?;",
            [dayId],
            (queryErr, queryResult) => {
              if (queryErr) {
                res.status(500).send("Query error");
                return;
              }

              // if breakfast exists, get mealId
              if (queryResult.length > 0) {
                resolve(queryResult[0].mealId);
              } else {
                resolve(0);
              }
            }
          );
        });

        // lunch
        lunchId = await new Promise((resolve, reject) => {
          connection.query(
            "SELECT mealId from meals WHERE mealName = 'Lunch' AND dayId = ?;",
            [dayId],
            (queryErr, queryResult) => {
              if (queryErr) {
                res.status(404).send("Query error");
                return;
              }

              // if dinner exists, get mealId
              if (queryResult.length > 0) {
                resolve(queryResult[0].mealId);
              } else {
                resolve(0);
              }
            }
          );
        });

        // dinner
        dinnerId = await new Promise((resolve, reject) => {
          connection.query(
            "SELECT mealId from meals WHERE mealName = 'Dinner' AND dayId = ?;",
            [dayId],
            (queryErr, queryResult) => {
              if (queryErr) {
                res.status(404).send("Query error");
                return;
              }

              // if dinner exists, get mealId
              if (queryResult.length > 0) {
                resolve(queryResult[0].mealId);
              } else {
                resolve(0);
              }
            }
          );
        });
      }

      res.send({
        dayId: dayId,
        breakfastId: breakfastId,
        lunchId: lunchId,
        dinnerId: dinnerId,
      });
    }
  );
});

router.post("/api/get/food", async (req, res) => {
  const breakfastId = req.body.breakfastId;
  const lunchId = req.body.lunchId;
  const dinnerId = req.body.dinnerId;

  // breakfast food
  let breakfast = await new Promise((resolve, reject) => {
    connection.query(
      "SELECT foodName, serving, calories, carbs, protein, fat FROM food WHERE mealid = ?;",
      [breakfastId],
      (queryErr, queryResult) => {
        // if query unsuccessful
        if (queryErr) {
          res.status(500).send("Breakfast select error");
          return;
        }
        resolve(queryResult);
      }
    );
  });

  let lunch = await new Promise((resolve, reject) => {
    connection.query(
      "SELECT foodName, serving, calories, carbs, protein, fat FROM food WHERE mealid = ?;",
      [lunchId],
      (queryErr, queryResult) => {
        // if query unsuccessful
        if (queryErr) {
          res.status(500).send("Lunch select error");
          return;
        }
        resolve(queryResult);
      }
    );
  });

  let dinner = await new Promise((resolve, reject) => {
    connection.query(
      "SELECT foodName, serving, calories, carbs, protein, fat FROM food WHERE mealid = ?;",
      [dinnerId],
      (queryErr, queryResult) => {
        // if query unsuccessful
        if (queryErr) {
          res.status(500).send("Dinner select error");
          return;
        }
        resolve(queryResult);
      }
    );
  });

  res.send({
    breakfast: breakfast,
    lunch: lunch,
    dinner: dinner,
  });
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

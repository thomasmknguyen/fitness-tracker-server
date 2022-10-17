require("dotenv/config");

const secrets = {
  cookieSecret: process.env.REACT_APP_COOKIE_SECRET,
  jwtSecret: process.env.REACT_APP_JWT_SECRET,
};

module.exports = secrets;

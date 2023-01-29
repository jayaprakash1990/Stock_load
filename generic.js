const KiteConnect = require("kiteconnect").KiteConnect;

const apiSecretAnother = "j751h7wqpjz8zx993xtf6fzyrcch4jtg";

const kcAnother = new KiteConnect({
  api_key: "q4jcgtius5r3ekz5",
});

const requestURL =
  "https://kite.zerodha.com/connect/login?v=3&api_key=q4jcgtius5r3ekz5";

const generic = {
  kc: kcAnother,
  requestURL: requestURL,
  apiSecret: apiSecretAnother,
};

module.exports = generic;

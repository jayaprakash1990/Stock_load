const KiteConnect = require("kiteconnect").KiteConnect;

const apiSecretAnother = "cotm4lkv3hpluwi3b58yzu0bw0fh5q41";

const kcAnother = new KiteConnect({
  api_key: "ab1p4zkauvkxy4gt",
});

const requestURL =
  "https://kite.zerodha.com/connect/login?v=3&api_key=ab1p4zkauvkxy4gt";

const generic = {
  kc: kcAnother,
  requestURL: requestURL,
  apiSecret: apiSecretAnother,
};

module.exports = generic;

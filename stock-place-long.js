const axios = require("axios");
const qs = require("qs");
const fs = require("fs");
const schedule = require("node-schedule");

exports.stockPlaceBuy = (longJson) => {
  const url = "https://api.kite.trade/orders/regular";
  const orderUrl = "https://api.kite.trade/orders/";
  let config = {
    headers: {
      "X-Kite-Version": "3",
      Authorization: tokenReturn(),
      "Content-Type": "application/x-www-form-urlencoded",
    },
  };
  let orderConfig = {
    headers: {
      "X-Kite-Version": "3",
      Authorization: tokenReturn(),
    },
  };
  // console.log("price " + price);

  let dataJson = {
    tradingsymbol: longJson.symbol,
    order_type: longJson.order,
    exchange: "NSE",
    transaction_type: "BUY",
    quantity: longJson.qty,
    product: "MIS",
    validity: "DAY",
    price: longJson.price,
    trigger_price: longJson.stopLossTrigger,
    // trigger_price: price
  };

  // console.log(
  //   "**************************************************************** ",
  //   dataJson
  // );
  // console.log(targetPercent);
  axios
    .post(url, qs.stringify(dataJson), config)
    .then((result) => {
      /////inside the redis
      console.log("Long success ", longJson.symbol);
    })
    .catch((err) => {
      //   orderCount--;
      console.log(err);
    });
};

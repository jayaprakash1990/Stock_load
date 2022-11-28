const axios = require("axios");
const qs = require("qs");
const fs = require("fs");
const schedule = require("node-schedule");

exports.stockPlaceShort = (shortJson) => {
  const url = "https://api.kite.trade/orders/regular";
  let config = {
    headers: {
      "X-Kite-Version": "3",
      Authorization: tokenReturn(),
      "Content-Type": "application/x-www-form-urlencoded",
    },
  };

  let dataJson = {
    tradingsymbol: shortJson.symbol,
    order_type: shortJson.order,
    exchange: "NSE",
    transaction_type: "SELL",
    quantity: shortJson.qty,
    product: "MIS",
    validity: "DAY",
    price: shortJson.price,
    trigger_price: shortJson.stopLossTrigger,
  };

  axios
    .post(url, qs.stringify(dataJson), config)
    .then((result) => {
      console.log("Short success ", shortJson.symbol);
      // addOrderPlacement(result.data.data.order_id, 'SELL', treatment, 0, symbol);
    })
    .catch((err) => {
      //   orderCount--;
      console.log(err);
    });
};

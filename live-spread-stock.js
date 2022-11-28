const axios = require("axios");
const qs = require("qs");
const fs = require("fs");
const schedule = require("node-schedule");
const { stockPlaceBuy } = require("./stock-place-long");
const { symbols } = require("./symbol-token");
const { stockPlaceShort } = require("./stock-place-short");

// const stockSpreadApiUrl =
//   "https://api.kite.trade/quote?i=NSE:TATAMOTORS&i=NSE:SBIN&i=NSE:TCS&i=NSE:RELIANCE";

const stockSpreadApiUrl =
  "https://api.kite.trade/quote?i=NSE:TATAMOTORS&i=NSE:SBIN";

const capital = 500;
const stockCount = 2;
const bufferAmount = 0.05;
const stopLoss = 0.05;
const targetPlValue = 2500;
const symbolStopLossStatus = {
  TATAMOTORS: false,
  SBIN: false,
  RELIANCE: false,
  TCS: false,
};

exports.liveStocksCheckAndBuy = () => {
  console.log("live spread stock started");

  //  calling live data to fetch current Values
  axios.get(stockSpreadApiUrl, config).then((response) => {
    // console.log(response.data.length);
    let jsonValue = response.data.data;
    console.log(jsonValue);
    const keys = Object.keys(response.data.data);

    keys.forEach((key) => {
      let tmpJson = {};
      let lastPrice = jsonValue[key].last_price;
      let highPrice = jsonValue[key].ohlc.high;
      let lowPrice = jsonValue[key].ohlc.low;
      let avgPrice = (highPrice + lowPrice) / stockCount;
      let orderType = lastPrice > avgPrice ? "long" : "short";
      tmpJson.symbol = symbols[jsonValue[key]["instrument_token"]];
      tmpJson.qty = Math.round(capital / lastPrice);
      tmpJson.order = "LIMIT";
      tmpJson.orderType = orderType;
      if (orderType === "long") {
        let tmpPrice = lastPrice + (lastPrice * bufferAmount) / 100;
        tmpJson.price = roundDownCalcualtion(tmpPrice);
        stockPlaceBuy(tmpJson);
      } else {
        let tmpPrice = lastPrice - (lastPrice * bufferAmount) / 100;
        tmpJson.price = roundUpCalcualtion(tmpPrice);
        stockPlaceShort(tmpJson);
      }
      console.log(tmpJson);
    });

    callTriggerStopLossScheduler();

    //  console.log(response.data);
    console.log("*************************");
  });
};

let stopLossTriggerScheduler;

exports.callTriggerStopLossScheduler = () => {
  const triggerStopLossCount = 0;
  stopLossTriggerScheduler = schedule.scheduleJob(
    "*/5 * * * * *",
    async function () {
      const url = "https://api.kite.trade/orders";

      // console.log('entry ', dataJson);
      try {
        let tmpResult = await axios.get(url, config);
        let results = tmpResult.data.data;
      } catch (err) {
        console.log("Error in retreiving order", err);
      }
    }
  );
};

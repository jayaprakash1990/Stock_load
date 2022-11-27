const express = require("express");
const app = express();
const axios = require("axios");
const mongoose = require("./mongoose-connector");
const moment = require("moment");
const { StockModel, addTick } = require("./stock-model");
const { Stock15Model, add15Tick } = require("./stock-model-15");
const { addStockCsv, fetchStocksByDate } = require("./stock-load-csv");
const { ticksLoad } = require("./ticks-load");
const fs = require("fs");
const generic = require("./generic");

const bodyParser = require("body-parser");

const port = 3001;

// app.use(express.static(publicDir));

app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(function (req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  // Request methods you wish to allow
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, PATCH, DELETE"
  );
  // Request headers you wish to allow
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-Requested-With,content-type"
  );
  // Set to true if you need the website to include cookies in the requests sent
  // to the API (e.g. in case you use sessions)
  res.setHeader("Access-Control-Allow-Credentials", true);
  // Pass to next layer of middleware
  next();
});

process.env.TZ = "Asia/Kolkata";

///////////////////////////Load Ticks

ticksLoad();

global.tokenReturn = () => {
  // const contents = fs.readFileSync('./sessionToken.json', 'utf8');
  const contents = fs.readFileSync("./sessionToken.json", "utf8");
  const jsonValue = JSON.parse(contents);
  let tokenReturnValue =
    "token " + jsonValue.api_key + ":" + jsonValue.access_token;
  return tokenReturnValue;
};

app.get("/getData", function (req, res) {
  const count = 1437;
  const config = {
    headers: {
      Authorization: `enctoken o+CfaluD/bB7V95F/XIQToADaLWcegG1hoiYHpDDzibB1Y9afcCCnFKgvFtxGIkCW6AeN/b6bk/WD4iG79U3AZem5G+SFb/pXfpsIo98gVNZCxRHPxPiAg==`,
    },
  };

  axios
    .get(
      "https://kite.zerodha.com/oms/instruments/historical/884737/5minute?user_id=KG0260&oi=1&from=2022-10-13&to=2022-11-12",
      config
    )
    .then((response) => {
      let result = response.data.data.candles;
      let arr = [];

      for (let i = 0; i < result.length; i++) {
        let tmpString = result[i][0];
        let test = tmpString.substr(0, 16);
        let t1 = test.replaceAll("-", "");
        let t2 = t1.replaceAll("T", "");
        let t3 = t2.replaceAll(":", "");

        let tmpJson = {
          stockId: i + count,
          stockDate: Number(t3),
          stockOpen: result[i][1],
          stockHigh: result[i][2],
          stockLow: result[i][3],
          stockClose: result[i][4],
          stockVolume: result[i][5],
          stockSymbol: "TATAMOTORS",
        };
        arr.push(tmpJson);
      }

      addTick(arr);

      //   result.array.forEach((element) => {
      //     let tmpJson = {
      //       stockDate: element[0],
      //       stockOpen: element[1],
      //       stockHigh: element[2],
      //       stockLow: element[3],
      //       stockClose: element[4],
      //       stockVolume: element[5],
      //     };
      //     arr.push(tmpJson);
      //   });

      res.json({ result: "success" });
    })
    .catch((err) => {
      console.log(err);
      res.json({ success: false });
    });
});

const checkLowReversal = (
  highCurrent1,
  highCurrent2,
  highCurrent3,
  highCurrent4,
  highCurrent5,
  lowCurrent1,
  lowCurrent2,
  lowCurrent3,
  lowCurrent4,
  lowCurrent5,
  openCurrent1,
  openCurrent2,
  openCurrent3,
  openCurrent4,
  openCurrent5,
  closeCurrent1,
  closeCurrent2,
  closeCurrent3,
  closeCurrent4,
  closeCurrent5
) => {
  return (
    // highCurrent5 >= highCurrent4 &&
    highCurrent4 >= highCurrent3 &&
    highCurrent3 >= highCurrent2 &&
    highCurrent2 >= highCurrent1 &&
    // lowCurrent5 >= lowCurrent4 &&
    lowCurrent4 >= lowCurrent3 &&
    lowCurrent3 >= lowCurrent2 &&
    lowCurrent2 >= lowCurrent1 &&
    // openCurrent5 >= closeCurrent5 &&
    openCurrent4 >= closeCurrent4 &&
    openCurrent3 >= closeCurrent3 &&
    openCurrent2 >= closeCurrent2 &&
    openCurrent1 >= closeCurrent1
  );
};

const checkHighReversal = (
  highCurrent1,
  highCurrent2,
  highCurrent3,
  highCurrent4,
  highCurrent5,
  lowCurrent1,
  lowCurrent2,
  lowCurrent3,
  lowCurrent4,
  lowCurrent5,
  openCurrent1,
  openCurrent2,
  openCurrent3,
  openCurrent4,
  openCurrent5,
  closeCurrent1,
  closeCurrent2,
  closeCurrent3,
  closeCurrent4,
  closeCurrent5
) => {
  return (
    // highCurrent5 >= highCurrent4 &&
    highCurrent4 <= highCurrent3 &&
    highCurrent3 <= highCurrent2 &&
    highCurrent2 <= highCurrent1 &&
    // lowCurrent5 >= lowCurrent4 &&
    lowCurrent4 <= lowCurrent3 &&
    lowCurrent3 <= lowCurrent2 &&
    lowCurrent2 <= lowCurrent1 &&
    // openCurrent5 >= closeCurrent5 &&
    openCurrent4 <= closeCurrent4 &&
    openCurrent3 <= closeCurrent3 &&
    openCurrent2 <= closeCurrent2 &&
    openCurrent1 <= closeCurrent1
  );
};

app.get(
  "/testCheckLowReversal/:sybmol/:startDate/:endDate",
  function (req, res) {
    let symbol = req.params.sybmol;
    let startDate = req.params.startDate;
    let endDate = req.params.endDate;
    let arr = [];
    StockModel.find({
      stockSymbol: symbol,
      stockDate: {
        $gte: startDate,
        $lte: endDate,
      },
    })
      .lean()
      .exec(function (err4, results) {
        if (err4) {
          res.json({ result: "error" });
        }
        console.log(results.length);
        if (results.length > 5) {
          for (let i = 5; i < results.length; i++) {
            let highCurrent5 = results[i - 5].stockHigh;
            let highCurrent4 = results[i - 4].stockHigh;
            let highCurrent3 = results[i - 3].stockHigh;
            let highCurrent2 = results[i - 2].stockHigh;
            let highCurrent1 = results[i - 1].stockHigh;
            let highCurrent = results[i].stockHigh;
            let lowCurrent5 = results[i - 5].stockLow;
            let lowCurrent4 = results[i - 4].stockLow;
            let lowCurrent3 = results[i - 3].stockLow;
            let lowCurrent2 = results[i - 2].stockLow;
            let lowCurrent1 = results[i - 1].stockLow;
            let lowCurrent = results[i].stockLow;
            let openCurrent5 = results[i - 5].stockOpen;
            let openCurrent4 = results[i - 4].stockOpen;
            let openCurrent3 = results[i - 3].stockOpen;
            let openCurrent2 = results[i - 2].stockOpen;
            let openCurrent1 = results[i - 1].stockOpen;
            let openCurrent = results[i].stockOpen;
            let closeCurrent5 = results[i - 5].stockClose;
            let closeCurrent4 = results[i - 4].stockClose;
            let closeCurrent3 = results[i - 3].stockClose;
            let closeCurrent2 = results[i - 2].stockClose;
            let closeCurrent1 = results[i - 1].stockClose;
            let closeCurrent = results[i].stockClose;

            if (
              checkLowReversal(
                highCurrent1,
                highCurrent2,
                highCurrent3,
                highCurrent4,
                highCurrent5,
                lowCurrent1,
                lowCurrent2,
                lowCurrent3,
                lowCurrent4,
                lowCurrent5,
                openCurrent1,
                openCurrent2,
                openCurrent3,
                openCurrent4,
                openCurrent5,
                closeCurrent1,
                closeCurrent2,
                closeCurrent3,
                closeCurrent4,
                closeCurrent5
              )
            ) {
              arr.push(results[i - 1]);
            }
          }
          res.json(arr);
        } else {
          res.json({ result: "NO record" });
        }
      });
  }
);

app.post("/checkLowReversal", function (req, res) {
  const target = 0.3;

  const id = Number(req.body.stockId);
  const open = Number(req.body.stockOpen);
  const high = Number(req.body.stockHigh);
  const close = Number(req.body.stockClose);
  const low = Number(req.body.stockLow);
  const volume = Number(req.body.stockVolume);
  const date = req.body.stockDate;
  const symbol = req.body.stockSymbol;
  let breakTime = 0;

  let targetValue = high + high * (0.3 / 100);

  let tempFromDateString = date.toString().substr(0, 8);
  let tempTimeString = date.toString().substr(8, 12);
  let temptoDateString = tempFromDateString + "1500";
  let responseMessage = "No target hit";
  if (Number(tempTimeString) > 1300) {
    res.json({ result: "Time exceed 1 0 clock" });
  } else {
    StockModel.find({
      stockSymbol: symbol,
      stockDate: {
        $gte: Number(tempFromDateString + "0915"),
        $lte: Number(temptoDateString),
      },
    })
      .lean()
      .exec(function (err4, results) {
        if (err4) {
          res.json({ result: "Error in fetching the value" });
        }

        if (results.length > 0) {
          let arrFinal = [];
          let isAdd = false;
          let lowValue = 1000000;
          let isDayLow = false;
          results.forEach((res2) => {
            if (res2.stockDate < Number(date)) {
              lowValue = lowValue <= res2.stockLow ? lowValue : res2.stockLow;
            }
            if (res2.stockDate === Number(date)) {
              isDayLow = res2.stockLow <= lowValue;
            }
          });
          console.log("isDayLow ", isDayLow);

          if (isDayLow) {
            results.forEach((res1) => {
              if (res1.stockDate > Number(date)) {
                if (!isAdd && res1.stockHigh > high) {
                  breakTime = res1.stockDate;
                  responseMessage = " BreakTime " + breakTime;
                  isAdd = true;
                }
                if (isAdd) {
                  arrFinal.push(res1);
                }
              }
            });
          } else {
            responseMessage = "Not a day low";
          }
          let isTargetHit = false;
          console.log(arrFinal.length);
          if (arrFinal.length > 0) {
            arrFinal.forEach((data) => {
              if (!isTargetHit && data.stockHigh > targetValue) {
                responseMessage =
                  "   Break Time : " +
                  breakTime +
                  "     Targe Value Hit : " +
                  data.stockDate;
                isTargetHit = true;
              }
            });
          }
        } else {
          responseMessage = "No results found";
        }
        res.json({ result: responseMessage });
      });
  }
});

////////////////////////////High reversal

app.get(
  "/testCheckHighReversal/:sybmol/:startDate/:endDate",
  function (req, res) {
    let symbol = req.params.sybmol;
    let startDate = req.params.startDate;
    let endDate = req.params.endDate;
    let arr = [];
    StockModel.find({
      stockSymbol: symbol,
      stockDate: {
        $gte: startDate,
        $lte: endDate,
      },
    })
      .lean()
      .exec(function (err4, results) {
        if (err4) {
          res.json({ result: "error" });
        }
        console.log(results.length);
        if (results.length > 5) {
          for (let i = 5; i < results.length; i++) {
            let highCurrent5 = results[i - 5].stockHigh;
            let highCurrent4 = results[i - 4].stockHigh;
            let highCurrent3 = results[i - 3].stockHigh;
            let highCurrent2 = results[i - 2].stockHigh;
            let highCurrent1 = results[i - 1].stockHigh;
            let highCurrent = results[i].stockHigh;
            let lowCurrent5 = results[i - 5].stockLow;
            let lowCurrent4 = results[i - 4].stockLow;
            let lowCurrent3 = results[i - 3].stockLow;
            let lowCurrent2 = results[i - 2].stockLow;
            let lowCurrent1 = results[i - 1].stockLow;
            let lowCurrent = results[i].stockLow;
            let openCurrent5 = results[i - 5].stockOpen;
            let openCurrent4 = results[i - 4].stockOpen;
            let openCurrent3 = results[i - 3].stockOpen;
            let openCurrent2 = results[i - 2].stockOpen;
            let openCurrent1 = results[i - 1].stockOpen;
            let openCurrent = results[i].stockOpen;
            let closeCurrent5 = results[i - 5].stockClose;
            let closeCurrent4 = results[i - 4].stockClose;
            let closeCurrent3 = results[i - 3].stockClose;
            let closeCurrent2 = results[i - 2].stockClose;
            let closeCurrent1 = results[i - 1].stockClose;
            let closeCurrent = results[i].stockClose;

            if (
              checkHighReversal(
                highCurrent1,
                highCurrent2,
                highCurrent3,
                highCurrent4,
                highCurrent5,
                lowCurrent1,
                lowCurrent2,
                lowCurrent3,
                lowCurrent4,
                lowCurrent5,
                openCurrent1,
                openCurrent2,
                openCurrent3,
                openCurrent4,
                openCurrent5,
                closeCurrent1,
                closeCurrent2,
                closeCurrent3,
                closeCurrent4,
                closeCurrent5
              )
            ) {
              arr.push(results[i - 1]);
            }
          }
          res.json(arr);
        } else {
          res.json({ result: "NO record" });
        }
      });
  }
);

//////////////////////////////////////////////////////////////////////////////////////////

app.post("/checkHighReversal", function (req, res) {
  const target = 0.3;

  const id = Number(req.body.stockId);
  const open = Number(req.body.stockOpen);
  const high = Number(req.body.stockHigh);
  const close = Number(req.body.stockClose);
  const low = Number(req.body.stockLow);
  const volume = Number(req.body.stockVolume);
  const date = req.body.stockDate;
  const symbol = req.body.stockSymbol;
  let breakTime = 0;

  let targetValue = low - low * (0.3 / 100);

  let tempFromDateString = date.toString().substr(0, 8);
  let tempTimeString = date.toString().substr(8, 12);
  let temptoDateString = tempFromDateString + "1500";
  let responseMessage = "No target hit";
  if (Number(tempTimeString) > 1300) {
    res.json({ result: "Time exceed 1 0 clock" });
  } else {
    StockModel.find({
      stockSymbol: symbol,
      stockDate: {
        $gte: Number(tempFromDateString + "0915"),
        $lte: Number(temptoDateString),
      },
    })
      .lean()
      .exec(function (err4, results) {
        if (err4) {
          res.json({ result: "Error in fetching the value" });
        }

        if (results.length > 0) {
          let arrFinal = [];
          let isAdd = false;
          let highValue = 0;
          let isDayHigh = false;
          results.forEach((res2) => {
            if (res2.stockDate < Number(date)) {
              highValue =
                highValue >= res2.stockHigh ? highValue : res2.stockHigh;
            }
            if (res2.stockDate === Number(date)) {
              isDayHigh = res2.stockHigh >= highValue;
            }
          });
          console.log("isDayHigh ", isDayHigh);

          if (isDayHigh) {
            results.forEach((res1) => {
              if (res1.stockDate > Number(date)) {
                if (!isAdd && res1.stockLow < low) {
                  breakTime = res1.stockDate;
                  responseMessage = " BreakTime " + breakTime;
                  isAdd = true;
                }
                if (isAdd) {
                  arrFinal.push(res1);
                }
              }
            });
          } else {
            responseMessage = "Not a day High";
          }
          let isTargetHit = false;
          console.log(arrFinal.length);
          if (arrFinal.length > 0) {
            arrFinal.forEach((data) => {
              if (!isTargetHit && data.stockLow < targetValue) {
                responseMessage =
                  "   Break Time : " +
                  breakTime +
                  "     Targe Value Hit : " +
                  data.stockDate;
                isTargetHit = true;
              }
            });
          }
        } else {
          responseMessage = "No results found";
        }
        res.json({ result: responseMessage });
      });
  }
});
///////////////////////////////////////////////////////

app.get("/importCsv", function (req, res) {
  let value = addStockCsv();
  res.json({ result: value });
});
///////////////////////////////////////////////////

app.get("/fetchStocksByDate/:startDate/:endDate", function (req, res) {
  let startDate = Number(req.params.startDate);
  let endDate = Number(req.params.endDate);
  let value = [];
  value = fetchStocksByDate(startDate, endDate, res);
});
/////////////////////////////////////////////////////
app.get("/testCall", function (req, res) {
  StockModel.find(
    {
      stockSymbol: "TATAMOTORS",
    },
    { _id: 0, stockDate: 1 }
  )
    .lean()
    .exec(function (err4, results) {
      if (err4) {
        res.json({ result: "error in fetching data" });
      }
      let arr = [];
      let tmpArr = [];
      results.forEach((result) => {
        let tempDate = result.stockDate.toString();
        let tDate = Number(tempDate.substr(0, 8) + "0915");
        tmpArr.push(tDate);
      });
      let uniq = [...new Set(tmpArr)];
      uniq.forEach((res) => {
        let tmpJson = { label: res, value: res };
        arr.push(tmpJson);
      });
      res.json(arr);
    });
});
/////////////////////////////////////////////////////

app.get("/writeInCsv/:value", function (req, res) {
  let value = req.params.value;
  fs.appendFileSync("testSample.csv", value);
  res.json({ result: "success" });
});
////////////////////////////////////////////////////
app.use("/token/:id", (req, res) => {
  console.log("req.params.tokenValue ", req.params.id);
  let jsonValue = {};
  // delete_stock_count();
  // helper.remove_stock();
  // helper.remove_intra_stock();
  generic.kc
    .generateSession(req.params.id, generic.apiSecret)
    .then(function (response) {
      //  console.log(response);
      fs.writeFileSync("sessionToken.json", JSON.stringify(response));
      // intial_stock_count();
      jsonValue = { refreshStatus: true };

      res.json(jsonValue);
    })
    .catch(function (err) {
      console.log(err);
      jsonValue = { refreshStatus: false };
      res.json(jsonValue);
    });
});
////////////////////////////////////

app.listen(port, () =>
  console.log(`Hello world app listening on port ${port}!`)
);

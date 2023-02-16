const express = require("express");
const app = express();
const axios = require("axios");
const mongoose = require("./mongoose-connector");
const moment = require("moment");
const { StockModel, addTick } = require("./otherTest/stock-model");
const csvToJson = require("convert-csv-to-json");
const { Stock15Model, add15Tick } = require("./otherTest/stock-model-15");
const {
  addStockCsv,
  fetchStocksByDate,
} = require("./otherTest/stock-load-csv");
const {
  ticksLoad,
  liveShortStraddleOptionsTrigger,
  loadOneMinuteBankData,
  loadOneMinuteNiftyData,
} = require("./liveStock/ticks-load");
const fs = require("fs");
const generic = require("./generic");
const { liveStocksCheckAndBuy } = require("./otherTest/live-spread-stock");
const {
  testCheckLowReversal,
  checkLowRev,
  testCheckHighReversl,
  checkHighRev,
} = require("./otherTest/spread-test");
const schedule = require("node-schedule");
const { testManipulation } = require("./otherTest/test-manipulation");

const { fetchVolumDataByStock } = require("./otherTest/fetchTickData");
const {
  addOptionCsv,
  fetchOptionByDate,
  getOptionsDate,
  fetchCurrentNiftyValue,
  addOptionCsvWithDate,
  fetchNiftyPos,
  loadOptionSchemasData,
  loadOptionSchemasDataFromCsv,
} = require("./otherTest/option-load-csv");
const {
  fetchCurrentHistoricNiftyValue,
  fetchHistoricOptionByDate,
  loadHistoricOptionData,
} = require("./otherTest/historical/option-short-historic");

const bodyParser = require("body-parser");
const {
  liveShortStraddleOptions,
  triggerOrderCheck,
  fetchAndTriggerOrderCheck,
  manualTiggerOptionStopLossCheck,
  dayEndOptionStopLossCheck,
  deleteOptionLiveSchema,
  tickSchemaDelete,
} = require("./liveStock/live-options-short");

const {
  addTrailingStopLoss,
  updateTrailingStopLoss,
  findTrailingStopLoss,
} = require("./liveStock/trailing-stop-loss-model");
const { addOptionTick } = require("./otherTest/option-model");

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

global.tokenReturn = () => {
  // const contents = fs.readFileSync('./sessionToken.json', 'utf8');
  const contents = fs.readFileSync("./sessionToken.json", "utf8");
  const jsonValue = JSON.parse(contents);
  let tokenReturnValue =
    "token " + jsonValue.api_key + ":" + jsonValue.access_token;
  return tokenReturnValue;
};

global.config = {
  headers: {
    "X-Kite-Version": "3",
    Authorization: tokenReturn(),
  },
};

global.roundDownCalcualtion = (price) => {
  return Math.floor(price * 20) / 20;
};

global.roundUpCalcualtion = (price) => {
  return Math.ceil(price * 20) / 20;
};

app.get("/getData", function (req, res) {
  const count = 0;
  const config = {
    headers: {
      Authorization: `enctoken yjafGyI42gmlUuSiPgEQd/vZD/+MBXDX0yjvjw+Yzk16/116UdjfAHhAcf3ODNNd0ywkNJ9vpzOotL2mCrstYFZRrK6QvuKx2OZXrx1RbyVE4JxqsYYEwA==`,
    },
  };

  axios
    .get(
      "https://kite.zerodha.com/oms/instruments/historical/738561/minute?user_id=YB9930&oi=1&from=2022-11-29&to=2022-11-30",
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
          stockSymbol: "RELIANCE",
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

app.get(
  "/testCheckLowReversal/:sybmol/:startDate/:endDate",
  function (req, res) {
    testCheckLowReversal(req, res);
  }
);

app.post("/checkLowReversal", function (req, res) {
  checkLowRev(req, res);
});

////////////////////////////High reversal

app.get(
  "/testCheckHighReversal/:sybmol/:startDate/:endDate",
  function (req, res) {
    testCheckHighReversl(req, res);
  }
);

//////////////////////////////////////////////////////////////////////////////////////////

app.post("/checkHighReversal", function (req, res) {
  checkHighRev(req, res);
});
///////////////////////////////////////////////////////

app.get("/importCsv", function (req, res) {
  let value = addOptionCsv();
  res.json({ result: value });
});

app.get("/importCsvDate/:startDate/:endDate", function (req, res) {
  let startDate = Number(req.params.startDate);
  let endDate = Number(req.params.endDate);
  let value = addOptionCsvWithDate(startDate, endDate);
  res.json({ result: value });
});
///////////////////////////////////////////////////

app.get("/fetchStocksByDate/:startDate/:endDate", function (req, res) {
  let startDate = Number(req.params.startDate);
  let endDate = Number(req.params.endDate);
  let value = [];
  value = fetchStocksByDate(startDate, endDate, res);
});
///////////////////////////////////////////////////

app.get(
  "/fetchOptionsByDate/:startDate/:endDate/:ceOption/:peOption",
  function (req, res) {
    let startDate = Number(req.params.startDate);
    let endDate = Number(req.params.endDate);
    let ceOption = req.params.ceOption;
    let peOption = req.params.peOption;

    fetchOptionByDate(startDate, endDate, ceOption, peOption, res);
  }
);
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
  fs.appendFileSync("./otherTest/testSample.csv", value);
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
app.get(
  "/fetchVolumDataByStock/:startDate/:endDate/:token",
  function (req, res) {
    fetchVolumDataByStock(req, res);
  }
);
/////////////////////////////////////////////////////////////////
app.get("/getOptionsDate", (req, res) => {
  getOptionsDate(res);
});
///////////////////////////////////////////////////////////////
app.get("/fetchCurrentNiftyValue/:date", (req, res) => {
  fetchCurrentNiftyValue(req, res);
});
////////////////////////////////////////////////////////
app.get("/fetchNiftyPos/:startDate/:endDate", (req, res) => {
  fetchNiftyPos(req, res);
});
/////////////////////////////////////////////////////////
app.get("/fetchCurrentHistoricNiftyValue/:date", (req, res) => {
  fetchCurrentHistoricNiftyValue(req, res);
});

app.get(
  "/fetchHistoricOptionsByDate/:startDate/:endDate/:ceOption/:peOption",
  function (req, res) {
    let startDate = Number(req.params.startDate);
    let endDate = Number(req.params.endDate);
    let ceOption = req.params.ceOption;
    let peOption = req.params.peOption;

    fetchHistoricOptionByDate(startDate, endDate, ceOption, peOption, res);
  }
);
//////////////////////////////////////////////////////////////

/////////////////////////Nifty live stock to check

ticksLoad();

///////////////////////////////////

app.get("/exportOneMinuteNiftyData", (req, res) => {
  loadOneMinuteNiftyData(req, res);
});

app.get("/exportOneMinuteBankData", (req, res) => {
  loadOneMinuteBankData(req, res);
});

app.get("/loadHistoricOptionData", (req, res) => {
  loadHistoricOptionData();
  res.send("Okay");
});

app.get("/loadOptionSchemasData", (req, res) => {
  loadOptionSchemasData();
  res.send("Okay");
});
app.get("/loadOptionSchemasDataFromCsv", (req, res) => {
  // loadOptionSchemasDataFromCsv();
  loadOptionSchemasDataFromCsvTest();
  res.send("Okay");
});

const loadOptionSchemasDataFromCsvTest = () => {
  console.log(1111111111);
  let fileName = "testOption.csv";
  let json = csvToJson
    .fieldDelimiter(",")
    .getJsonFromCsv("./otherTest/stock-data/" + fileName);
  // console.log(json);
  let finalArr = [];
  json.forEach((e) => {
    let tJson = {
      stockClose: parseFloat(e.stockClose),
      stockDate: parseFloat(e.stockDate),
      stockHigh: parseFloat(e.stockHigh),
      stockId: parseFloat(e.stockId),
      stockLow: parseFloat(e.stockLow),
      stockOpen: parseFloat(e.stockOpen),
      stockSymbol: e.stockSymbol,
    };
    finalArr.push(tJson);
  });

  console.log(finalArr.length);
  addOptionTick(finalArr);
};

// addTrailingStopLoss({ stopLossValue: -1000 });
// updateTrailingStopLoss(-500);

//////////////////////////////////////////////////////
// const triggerSpreadStockBuy = schedule.scheduleJob(
//   "59 19 09 * * *",
//   async function () {
//     liveStocksCheckAndBuy();
//   }
// );
////////////////////////////////////////////////////
// const triggerSpreadStockBuy = schedule.scheduleJob(
//   "*/15 * * * * *",
//   async function () {
//     liveStocksCheckAndBuy();
//   }
// );

// testManipulation();
// callTriggerStopLossScheduler();
// findTrailingStopLoss();
////////////////////////////////////////////
const deleteOptionLiveSchemaScheduler = schedule.scheduleJob(
  "00 02 09 * * *",
  async function () {
    console.log("***************************");
    deleteOptionLiveSchema();
    tickSchemaDelete();
    updateTrailingStopLoss(-1000);
  }
);

/////////////////////////////////////////////////
const triggerShortStraddle = schedule.scheduleJob(
  "59 15 09 * * *",
  async function () {
    let url = "https://api.kite.trade/quote?i=NSE:NIFTY%2050";
    axios
      .get(url, config)
      .then((response) => {
        let niftyValue = response.data.data["NSE:NIFTY 50"].last_price;
        liveShortStraddleOptions(niftyValue);
      })
      .catch((err) => console.log(err));
  }
);
//////////////////////////////////////////////////

const fetchAndTriggerOrderCheckScheduler = schedule.scheduleJob(
  "50 16 09 * * *",
  async function () {
    fetchAndTriggerOrderCheck();
  }
);

/////////////////////////////////////////////

const dayEndOptionStopLossScheduler = schedule.scheduleJob(
  "02 10 15 * * *",
  async function () {
    dayEndOptionStopLossCheck();
  }
);

////Manual Tigger option stop loss - >  Manually need to uncomment for check order stop loss alternative for fetchAndTriggerOrderCheck

// manualTiggerOptionStopLossCheck();

///////////////////////////////////////////

////////////////////////Manually exit both the option at the same time

// dayEndOptionStopLossCheck();

////////////////////////////////////////

////////////////////////////////////////////////

app.listen(port, () =>
  console.log(`Hello world app listening on port ${port}!`)
);

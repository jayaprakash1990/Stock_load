const KiteTicker = require("kiteconnect").KiteTicker;
const generic = require("../generic");
const { TickModel, addTick, TickSchema } = require("./model");
const sessionToken = require("../sessionToken.json");
const { niftyFiftyItems, optionsToken } = require("../otherTest/nifty-array");
const {
  instrumentTokens,
  optionsTokenSymbols,
  optionNiftyTokens,
  optionsBankTokens,
} = require("./option-array");
const { liveShortStraddleOptions } = require("./live-options-short");
const {
  DataOptionNiftyModel,
  addDataOptionNiftyTicks,
} = require("./data-option-nifty-model");
const {
  HistoricalModel,
  addHistoricalTick,
} = require("../otherTest/historical/historical.model");
const ObjectsToCsv = require("objects-to-csv");

let ticker;
let optionStockTokens = niftyFiftyItems.concat(optionsToken);

global.niftyValue = 0;

exports.ticksLoad = () => {
  ticker = new KiteTicker({
    api_key: "q4jcgtius5r3ekz5",
    access_token: sessionToken.access_token,
  });

  ticker.autoReconnect(true, 10, 5);
  ticker.connect();
  ticker.on("ticks", onTicks);
  ticker.on("connect", subscribe);

  ticker.on("noreconnect", function () {
    console.log("noreconnect");
  });
  addHistoricalTick;
  ticker.on("reconnecting", function (reconnect_interval, reconnections) {
    console.log(
      "Reconnecting: attempt - ",
      reconnections,
      " innterval - ",
      reconnect_interval
    );
  });
};

function onTicks(ticks) {
  let arr = [];
  if (ticks[0].exchange_timestamp && ticks[0].exchange_timestamp !== null) {
    ticks.forEach((element) => {
      if (element.exchange_timestamp) {
        let t1 = new Date(element.exchange_timestamp);
        let t2 = element.exchange_timestamp.toString().split(" ")[4].split(":");
        let tmpDateStamp =
          t1.getFullYear().toString() +
          t1.getMonth().toString() +
          1 +
          t1.getDate().toString();
        let tmpTimeStamp = t2[0] + t2[1] + t2[2];
        let tmpDateTimeStamp = tmpDateStamp + tmpTimeStamp;
        let token = element.instrument_token;

        let tmpJson = {
          instrument_token: element.instrument_token,
          last_price: element.last_price,
          timeStamp: tmpDateTimeStamp,
          symbol:
            optionsTokenSymbols[token].type +
            optionsTokenSymbols[token].symbol.substr(
              optionsTokenSymbols[token].symbol.length - 7
            ),
          exchange_timestamp: element.exchange_timestamp,
        };
        arr.push(tmpJson);
      }
    });
    addTick(arr);
  }

  if (ticks[0]["instrument_token"] === 256265) {
    niftyValue = ticks[0].last_price;
  }
}

function subscribe() {
  // const items = [ 884737, 895745, 2889473, 408065, 1346049, 794369, 738561 ];
  ticker.subscribe(instrumentTokens);
  ticker.setMode(ticker.modeFull, instrumentTokens);
}

exports.liveShortStraddleOptionsTrigger = () => {
  console.log(niftyValue);
  liveShortStraddleOptions(niftyValue);
};

/////To export 1 minute data need use this method
function removeDuplicates(myArr, token) {
  let jsonTmp = {};
  let resultArr = [];
  myArr.forEach((element) => {
    let t1 = new Date(element.exchange_timestamp);
    let t2 = element.exchange_timestamp.toString().split(" ")[4].split(":");
    let tmpDateStamp =
      t1.getFullYear().toString() +
      t1.getMonth().toString() +
      1 +
      t1.getDate().toString();
    let tmpTimeStamp = t2[0] + t2[1] + t2[2];
    let tmpDateTimeStamp = tmpDateStamp + tmpTimeStamp;
    let tmpOneMinDateTimeStamp = parseInt(tmpDateStamp + t2[0] + t2[1]);
    if (!(tmpOneMinDateTimeStamp in jsonTmp)) {
      jsonTmp[tmpOneMinDateTimeStamp] = [element.last_price];
    } else {
      jsonTmp[tmpOneMinDateTimeStamp] = [
        ...jsonTmp[tmpOneMinDateTimeStamp],
        element.last_price,
      ];
    }
  });
  for (let element in jsonTmp) {
    let tmpArr = jsonTmp[element];
    let stockOpen = tmpArr[0];
    let stockClose = tmpArr[tmpArr.length - 1];
    let stockHigh = Math.max(...tmpArr);
    let stockLow = Math.min(...tmpArr);
    let stockDate = parseInt(element);
    let stockId = token;
    let stockSymbol =
      optionsTokenSymbols[token].type +
      optionsTokenSymbols[token].symbol.substr(
        optionsTokenSymbols[token].symbol.length - 7
      );
    let tJson = {
      stockOpen,
      stockClose,
      stockHigh,
      stockClose,
      stockDate,
      stockLow,
      stockSymbol,
      stockId,
    };
    resultArr.push(tJson);
  }
  console.log(resultArr);
}
////////////////////////////////////////

const createOneSecondData = (myArr) => {
  let jsonTmp = {};
  let resultArr = [];
  myArr.forEach((element) => {
    let t1 = new Date(element.exchange_timestamp);
    let t2 = element.exchange_timestamp.toString().split(" ")[4].split(":");

    t1.getFullYear().toString() +
      t1.getMonth().toString() +
      1 +
      t1.getDate().toString();
    let tmpTimeStamp = t2[0] + t2[1] + t2[2];
    let tmpDateTimeStamp = tmpDateStamp + tmpTimeStamp;
    let token = element.instrument_token;
    let tJson = {
      timestamp: parseInt(tmpDateTimeStamp),
      last_price: element.last_price,
      symbol:
        optionsTokenSymbols[token].type +
        optionsTokenSymbols[token].symbol.substr(
          optionsTokenSymbols[token].symbol.length - 7
        ),
      token,
    };
    resultArr.push(tJson);
    new ObjectsToCsv([tJson]).toDisk("./test.csv", { append: true });
  });

  console.log("Inserting array done ", resultArr.length);
};

/////////////////////////////////////////

exports.loadOneMinuteNiftyData = (req, res) => {
  let d = new Date();
  d.setDate(d.getDate() - 3); //remove in live

  let startDateArray = d.toString().split(" ");
  let endDateArray = d.toString().split(" ");

  startDateArray[4] = "09:15:00";
  endDateArray[4] = "15:20:59";

  let e = startDateArray.join(" ");
  let f = endDateArray.join(" ");
  console.log(e, f);
  let token = 10841346;
  TickModel.find({
    instrument_token: { $in: optionNiftyTokens },
    // instrument_token: token,
    exchange_timestamp: { $gte: e, $lte: f },
  })
    .sort({ exchange_timestamp: 1 })
    .lean()
    .exec(function (err4, res) {
      if (err4) {
        console.log(
          "Problem in fetching entry data from database final data after enter"
        );
      }
      console.log(res.length);
      createOneSecondData(res);
    });
  res.send("Nifty OKay");
};

exports.loadOneMinuteBankData = (req, res) => {
  res.send("Bank OKay");
};

const mongoose = require("./mongoose-connector");
const { OptionModel, addOptionTick } = require("./option-model");
const csvToJson = require("convert-csv-to-json");

exports.addOptionCsv = () => {
  const count = 0;
  let fileName =
    "28_OCT_03_NOV_WEEKLY_expiry_data_VEGE_NF_AND_BNF_Options_Vege.csv";
  let json = csvToJson
    .fieldDelimiter(",")
    .getJsonFromCsv("./stock-data/" + fileName);

  let finalArr = [];
  for (let i = 0; i < json.length; i++) {
    let isAddValue = false;

    let tickerValue = json[i].Ticker;

    if (tickerValue.length === 5 && tickerValue === "NIFTY") {
      isAddValue = true;
    } else if (tickerValue.substr(0, 7) === "NIFTYWK") {
      isAddValue = true;
    }

    if (isAddValue) {
      let tmpString = json[i]["Date/Time"];
      let t1Space = tmpString.split(" ");
      let t2Hyphen = t1Space[0].split("-");
      let t3Colon = t1Space[1].split(":");
      let t3 =
        t2Hyphen[2] + t2Hyphen[1] + t2Hyphen[0] + t3Colon[0] + t3Colon[1];

      let tmpJson = {
        stockId: i + count,
        stockOpen: json[i].Open,
        stockHigh: json[i].High,
        stockClose: json[i].Close,
        stockLow: json[i].Low,
        stockVolume: json[i].Volume,
        stockDate: parseInt(t3),
        stockSymbol: json[i].Ticker,
        stockOi: json[i].OpenInterest,
      };
      finalArr.push(tmpJson);
    }
  }

  addOptionTick(finalArr);
  return "Success ";
};

exports.addOptionCsvWithDate = (startDate, endDate) => {
  const count = 0;
  let fileName = "NOVEMBER-2022-MONTHLY-Expiry-data _Vege.csv";
  let json = csvToJson
    .fieldDelimiter(",")
    .getJsonFromCsv("./stock-data/" + fileName);

  let finalArr = [];
  for (let i = 0; i < json.length; i++) {
    let isAddValue = false;

    let tickerValue = json[i].Ticker;

    // // if (tickerValue.length === 5 && tickerValue === "NIFTY") {
    //   if (tickerValue.length === 5 ) {
    //   isAddValue = true;
    //   // } else if (tickerValue.substr(0, 7) === "NIFTYWK") {
    // } else
    if (tickerValue.substr(0, 5) === "NIFTY" || tickerValue === "NIFTY") {
      isAddValue = true;
    }

    if (isAddValue) {
      let tmpString = json[i]["Date/Time"];
      let t1Space = tmpString.split(" ");
      let t2Hyphen = t1Space[0].split("-");
      let t3Colon = t1Space[1].split(":");
      let t3 =
        t2Hyphen[2] + t2Hyphen[1] + t2Hyphen[0] + t3Colon[0] + t3Colon[1];
      let tmpTicker = tickerValue.substr(0, 5) + "WK" + tickerValue.substr(5);

      let tmpDateValue = parseInt(t3);
      if (tmpDateValue >= startDate && tmpDateValue <= endDate) {
        let tmpJson = {
          stockId: i + count,
          stockOpen: json[i].Open,
          stockHigh: json[i].High,
          stockClose: json[i].Close,
          stockLow: json[i].Low,
          stockVolume: json[i].Volume,
          stockDate: parseInt(t3),
          stockSymbol: tickerValue === "NIFTY" ? tickerValue : tmpTicker,
          stockOi: json[i].OpenInterest,
        };
        finalArr.push(tmpJson);
      }
    }
  }

  addOptionTick(finalArr);
  return "Success ";
};

exports.fetchOptionByDate = (startDate, endDate, ceOption, peOption, res) => {
  // console.log(startDate, endDate, ceOption, peOption, res);
  let finalArray = [];
  OptionModel.find({
    stockDate: {
      $gte: startDate,
      $lte: endDate,
    },
    stockSymbol: { $in: [ceOption, peOption] },
  })
    .sort({ stockDate: 1 })
    .lean()
    .exec(function (err4, results) {
      if (err4) {
        res.json(err4);
      }

      let keyValue = startDate;
      let finalJson = {};
      let tmpJson = {};
      for (let i = 0; i < results.length - 1; i++) {
        let refKeyValue = Number(results[i].stockDate);
        if (keyValue !== refKeyValue) {
          finalJson[keyValue] = { ...tmpJson };
          keyValue = refKeyValue;
          tmpJson = {};
        }
        tmpJson[results[i].stockSymbol] = { ...results[i] };
      }

      res.json(finalJson);
    });
};

exports.getOptionsDate = (res) => {
  OptionModel.find()
    .distinct("stockDate")
    .lean()
    .exec(function (err4, results) {
      if (err4) {
        res.json(err4);
      }
      let finalArr = [];
      results.forEach((res) => {
        let tmpValue = parseInt(res / 10000);
        finalArr.push(tmpValue);
      });

      res.json([...new Set(finalArr)]);
    });
};

exports.fetchCurrentNiftyValue = (req, res) => {
  let startDate = req.params.date;
  OptionModel.findOne({ stockSymbol: "NIFTY", stockDate: startDate })
    .lean()
    .exec(function (err4, result) {
      if (err4) {
        res.json(err4);
      }

      res.json(result);
    });
};

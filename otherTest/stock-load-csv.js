const mongoose = require("../mongoose-connector");
const { StockModel, addTick } = require("./stock-model");
const csvToJson = require("convert-csv-to-json");

exports.addStockCsv = () => {
  const count = 1;
  const symbol = "TCS";
  let json = csvToJson
    .fieldDelimiter(",")
    .getJsonFromCsv("./stock-data/TCS.csv");
  let finalArr = [];
  for (let i = 0; i < json.length; i++) {
    let tmpString = json[i].date;
    let test = tmpString.substr(0, 16);
    let t1 = test.replaceAll("-", "");
    let t2 = t1.replaceAll(" ", "");
    let t3 = t2.replaceAll(":", "");
    let tmpJson = {
      stockId: i + count,
      stockOpen: json[i].open,
      stockHigh: json[i].high,
      stockClose: json[i].close,
      stockLow: json[i].low,
      stockVolume: json[i].volume,
      stockDate: Number(t3),
      stockSymbol: symbol,
    };
    finalArr.push(tmpJson);
  }

  addTick(finalArr);
  return "Success " + symbol;
};

exports.fetchStocksByDate = (startDate, endDate, res) => {
  console.log(startDate, endDate);
  let finalArray = [];
  StockModel.find({
    stockDate: {
      $gte: startDate,
      $lte: endDate,
    },
  })
    .sort({ stockDate: 1 })
    .lean()
    .exec(function (err4, results) {
      if (err4) {
        res.json(finalArray);
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

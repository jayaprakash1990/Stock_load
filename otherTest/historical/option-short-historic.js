const { HistoricalModel, addHistoricalTick } = require("./historical.model");

exports.fetchCurrentHistoricNiftyValue = (req, res) => {
  let startDate = parseInt(req.params.date);
  console.log("fetchCurrentHistoricNiftyValue  ", startDate);
  // startDate = startDate - 1;

  HistoricalModel.findOne({ symbol: "NIFTYTY", timeStamp: startDate })
    .lean()
    .exec(function (err4, result) {
      if (err4) {
        res.json(err4);
      }
      res.json(result);
    });
};

exports.fetchHistoricOptionByDate = (
  startDate,
  endDate,
  ceOption,
  peOption,
  res
) => {
  // console.log(startDate, endDate, ceOption, peOption, res);
  let finalArray = [];
  HistoricalModel.find({
    timeStamp: {
      $gte: startDate,
      $lte: endDate,
    },
    symbol: { $in: [ceOption, peOption] },
  })
    .sort({ timeStamp: 1 })
    .lean()
    .exec(function (err4, results) {
      if (err4) {
        res.json(err4);
      }

      let keyValue = startDate;
      let finalJson = {};
      let tmpJson = {};
      for (let i = 0; i < results.length; i++) {
        let refKeyValue = Number(results[i].timeStamp);
        if (keyValue !== refKeyValue) {
          finalJson[keyValue] = { ...tmpJson };
          keyValue = refKeyValue;
          tmpJson = {};
        }
        tmpJson[results[i].symbol] = { ...results[i] };
      }

      res.json(finalJson);
    });
};

exports.loadHistoricOptionData = () => {
  HistoricalModel.find()
    .lean()
    .exec(function (err4, results) {
      if (err4) {
        res.json(err4);
      }

      let arr = [];
      results.forEach((e) => {
        let tJson = {
          instrument_token: parseFloat(e.instrument_token),
          last_price: parseFloat(e.last_price),
          timeStamp: parseFloat(e.timeStamp),
          symbol: e.symbol,
          exchange_timestamp: e.exchange_timestamp,
        };
        arr.push(tJson);
      });
      HistoricalModel.deleteMany({}).exec(function (err1, res1) {
        if (err1) {
          console.log("Error while deleting Historical Model");
        }
        addHistoricalTick(arr);
      });
    });
};

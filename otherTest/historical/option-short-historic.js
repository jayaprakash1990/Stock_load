const { HistoricalModel } = require("./historical.model");

exports.fetchCurrentHistoricNiftyValue = (req, res) => {
  let startDate = parseInt(req.params.date);
  startDate = startDate - 1;

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

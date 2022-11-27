const { StockModel } = require("./stock-model");
const { TickModel } = require("./model");

exports.fetchVolumDataByStock = (req, res) => {
  const startDate = req.params.startDate;
  const endDate = req.params.endDate;
  const token = req.params.token;
  console.log(startDate, endDate, token);
  TickModel.find({
    instrument_token: token,
  })
    .sort({ _id: 1 })
    .lean()
    .exec(function (err4, results) {
      if (err4) {
        res.json({ result: "error in fetching data" });
      }
      console.log(results.length);
      res.json(results);
    });
};

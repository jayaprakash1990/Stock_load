const mongoose = require("../mongoose-connector");

const Schema = mongoose.Schema;

let TrailingStopLossSchema = new Schema({
  stopLossValue: { type: Number },
});

exports.TrailingStopLossSchema = TrailingStopLossSchema;

let TrailingStopLossModel = mongoose.model(
  "TrailingStopLossSchema",
  TrailingStopLossSchema
);

const addTrailingStopLoss = (ticks) => {
  return new Promise((resolve, reject) => {
    // console.log('addTicks');
    TrailingStopLossModel.insertMany(ticks, (err, res) => {
      err ? reject(err) : resolve(res);
    });
  });
};

const updateTrailingStopLoss = (value) => {
  TrailingStopLossModel.updateMany(
    {},
    { stopLossValue: value },
    { multi: true }
  ).exec(function (err4, re1) {
    if (err4) {
      console.log("Problem in updating stop loss");
    }
  });
};

const findTrailingStopLoss = () => {
  TrailingStopLossModel.find().exec(function (err4, results) {
    if (err4) {
      res.json(err4);
      return -1000;
    }
    // console.log(results[0].stopLossValue);
    return results[0].stopLossValue;
  });
};

module.exports = {
  TrailingStopLossModel,
  addTrailingStopLoss,
  updateTrailingStopLoss,
  findTrailingStopLoss,
};

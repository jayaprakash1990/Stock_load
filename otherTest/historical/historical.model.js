const mongoose = require("../../mongoose-connector");

const Schema = mongoose.Schema;

let HistoricalSchema = new Schema({
  instrument_token: { type: Number },
  last_price: { type: Number },
  timeStamp: { type: Number },
  symbol: { type: String },
  exchange_timestamp: { type: String },
});

exports.HistoricalSchema = HistoricalSchema;

let HistoricalModel = mongoose.model("HistoricalSchema", HistoricalSchema);

const addHistoricalTick = (ticks) => {
  return new Promise((resolve, reject) => {
    // console.log('addTicks');
    HistoricalModel.insertMany(ticks, (err, res) => {
      if (err) {
        reject(err);
      } else {
        resolve(res);
      }
    });
  });
};

module.exports = {
  HistoricalModel: HistoricalModel,
  addHistoricalTick: addHistoricalTick,
};

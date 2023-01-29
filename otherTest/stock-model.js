const mongoose = require("../mongoose-connector");

const Schema = mongoose.Schema;

let StockSchema = new Schema({
  stockId: { type: Number },
  stockOpen: { type: Number },
  stockHigh: { type: Number },
  stockClose: { type: Number },
  stockLow: { type: Number },
  stockVolume: { type: Number },
  stockDate: { type: Number },
  stockSymbol: { type: String },
});

StockSchema.index(
  { stockDate: 1, stockOpen: 1, stockHigh: 1, stockClose: 1, stockLow: 1 },
  { unique: true }
);

exports.StockSchema = StockSchema;
let StockModel = mongoose.model("StockSchema", StockSchema);

const addTick = (ticks) => {
  return new Promise((resolve, reject) => {
    // console.log('addTicks');
    StockModel.insertMany(ticks, (err, res) => {
      err ? reject(err) : resolve(res);
    });
  });
};

module.exports = {
  StockModel: StockModel,
  addTick: addTick,
};

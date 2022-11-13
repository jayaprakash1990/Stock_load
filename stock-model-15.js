const mongoose = require("./mongoose-connector");

const Schema = mongoose.Schema;

let Stock15Schema = new Schema({
  stockId: { type: Number },
  stockOpen: { type: Number },
  stockHigh: { type: Number },
  stockClose: { type: Number },
  stockLow: { type: Number },
  stockVolume: { type: Number },
  stockDate: { type: Number },
  stockSymbol: { type: String },
});

Stock15Schema.index(
  { stockDate: 1, stockOpen: 1, stockHigh: 1, stockClose: 1, stockLow: 1 },
  { unique: true }
);

exports.Stock15Schema = Stock15Schema;
let Stock15Model = mongoose.model("Stock15Schema", Stock15Schema);

const add15Tick = (ticks) => {
  return new Promise((resolve, reject) => {
    // console.log('addTicks');
    Stock15Model.insertMany(ticks, (err, res) => {
      err ? reject(err) : resolve(res);
    });
  });
};

module.exports = {
  Stock15Model: Stock15Model,
  add15Tick: add15Tick,
};

const mongoose = require("../mongoose-connector");

const Schema = mongoose.Schema;

let TickSchema = new Schema(
  {
    instrument_token: { type: Number },
    last_price: { type: Number },
    volume: { type: Number },
    last_trade_time: { type: String },
    exchange_timestamp: { type: String },
  },
  {
    timestamps: true,
  }
);

exports.TickSchema = TickSchema;
let TickModel = mongoose.model("TickSchema", TickSchema);

const addTick = (ticks) => {
  return new Promise((resolve, reject) => {
    // console.log('addTicks');
    TickModel.insertMany(ticks, (err, res) => {
      err ? reject(err) : resolve(res);
    });
  });
};

module.exports = {
  TickModel: TickModel,
  addTick: addTick,
};

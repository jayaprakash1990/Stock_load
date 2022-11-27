const mongoose = require("./mongoose-connector");

const Schema = mongoose.Schema;

let TickSchema = new Schema(
  {
    tradable: { type: Boolean },
    mode: { type: String },
    instrument_token: { type: Number },
    last_price: { type: Number },
    last_quantity: { type: Number },
    average_price: { type: Number },
    volume: { type: Number },
    buy_quantity: { type: Number },
    sell_quantity: { type: Number },
    ohlc: {
      open: {
        type: Number,
      },
      high: {
        type: Number,
      },
      low: {
        type: Number,
      },
      close: {
        type: Number,
      },
    },
    change: { type: Number },
    last_trade_time: { type: String },
    timestamp: { type: String },
    oi: { type: Number },
    oi_day_high: { type: Number },
    oi_day_low: { type: Number },
    depth: {
      buy: [
        {
          price: {
            type: Number,
          },
          quantity: {
            type: Number,
          },
          orders: {
            type: Number,
          },
        },
      ],
      sell: [
        {
          price: {
            type: Number,
          },
          quantity: {
            type: Number,
          },
          orders: {
            type: Number,
          },
        },
      ],
    },
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

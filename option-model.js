const mongoose = require("./mongoose-connector");

const Schema = mongoose.Schema;

let OptionSchema = new Schema({
  stockId: { type: Number },
  stockOpen: { type: Number },
  stockHigh: { type: Number },
  stockClose: { type: Number },
  stockLow: { type: Number },
  stockVolume: { type: Number },
  stockDate: { type: Number },
  stockSymbol: { type: String },
  stockOi: { type: Number },
});

OptionSchema.index(
  {
    stockDate: 1,
    stockOpen: 1,
    stockHigh: 1,
    stockClose: 1,
    stockLow: 1,
    stockSymbol: 1,
  },
  { unique: true }
);

exports.OptionSchema = OptionSchema;
let OptionModel = mongoose.model("OptionSchema", OptionSchema);

const addOptionTick = (ticks) => {
  return new Promise((resolve, reject) => {
    // console.log('addTicks');
    OptionModel.insertMany(ticks, (err, res) => {
      err ? reject(err) : resolve(res);
    });
  });
};

module.exports = {
  OptionModel: OptionModel,
  addOptionTick: addOptionTick,
};

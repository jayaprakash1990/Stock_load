const mongoose = require("../mongoose-connector");

const Schema = mongoose.Schema;

let OptionLiveSchema = new Schema({
  label: { type: String },
  stopLoss: { type: Number },
  closeValue: { type: Number },
  bufferEntry: { type: Number },
  sellPrice: { type: Number },
  stopLossHit: { type: Boolean },
});

OptionLiveSchema.index({ label: 1, closeValue: 1 }, { unique: true });

let OptionLiveModel = mongoose.model("OptionLiveSchema", OptionLiveSchema);

const addValue = (ticks) => {
  return new Promise((resolve, reject) => {
    // console.log('addTicks');
    OptionLiveModel.insertMany(ticks, (err, res) => {
      err ? reject(err) : resolve(res);
    });
  });
};

module.exports = {
  OptionLiveModel: OptionLiveModel,
  addValue: addValue,
};

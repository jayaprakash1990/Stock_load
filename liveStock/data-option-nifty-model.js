const mongoose = require("../mongoose-connector");

const Schema = mongoose.Schema;

let DataOptionNiftySchema = new Schema({
  stockId: { type: Number },
  stockOpen: { type: Number },
  stockHigh: { type: Number },
  stockClose: { type: Number },
  stockLow: { type: Number },
  stockDate: { type: Number },
  stockSymbol: { type: String },
});

DataOptionNiftySchema.index(
  { stockDate: 1, stockOpen: 1, stockHigh: 1, stockClose: 1, stockLow: 1 },
  { unique: true }
);

exports.DataOptionNiftySchema = DataOptionNiftySchema;
let DataOptionNiftyModel = mongoose.model(
  "DataOptionNiftySchema",
  DataOptionNiftySchema
);

const addDataOptionNiftyTicks = (ticks) => {
  return new Promise((resolve, reject) => {
    // console.log('addTicks');
    DataOptionNiftyModel.insertMany(ticks, (err, res) => {
      err ? reject(err) : resolve(res);
    });
  });
};

module.exports = {
  DataOptionNiftyModel: DataOptionNiftyModel,
  addDataOptionNiftyTicks: addDataOptionNiftyTicks,
};

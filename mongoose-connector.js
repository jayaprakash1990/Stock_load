const mongoose = require("mongoose");

mongoose.Promise = global.Promise;
mongoose.connect("mongodb://127.0.0.1:27017/stock", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
// mongoose.connect('mongodb://54.90.41.199:27017/trade-predictor-database', {
// 	useNewUrlParser: true,
// 	useCreateIndex: true,
// 	useUnifiedTopology: true
// });
// mongoose.set("useFindAndModify", false);

mongoose.connection
  .once("open", function () {
    console.log("Connected !!!");
  })
  .on("error", function (error) {
    console.log("Connection error: " + error);
  });

module.exports = mongoose;

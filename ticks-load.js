const KiteTicker = require("kiteconnect").KiteTicker;
const generic = require("./generic");
const { TickModel, addTick, TickSchema } = require("./model");
const sessionToken = require("./sessionToken.json");
const { niftyFiftyItems, optionsToken } = require("./nifty-array");
const {
  instrumentTokens,
  optionsTokenSymbols,
  optionNiftyTokens,
  optionsBankTokens,
} = require("./option-array");
const { liveShortStraddleOptions } = require("./live-options-short");

let ticker;
let optionStockTokens = niftyFiftyItems.concat(optionsToken);

global.niftyValue = 0;

exports.ticksLoad = () => {
  ticker = new KiteTicker({
    api_key: "ab1p4zkauvkxy4gt",
    access_token: sessionToken.access_token,
  });

  ticker.autoReconnect(true, 10, 5);
  ticker.connect();
  ticker.on("ticks", onTicks);
  ticker.on("connect", subscribe);

  ticker.on("noreconnect", function () {
    console.log("noreconnect");
  });

  ticker.on("reconnecting", function (reconnect_interval, reconnections) {
    console.log(
      "Reconnecting: attempt - ",
      reconnections,
      " innterval - ",
      reconnect_interval
    );
  });
};

function onTicks(ticks) {
  addTick(ticks);

  if (ticks[0]["instrument_token"] === 256265) {
    niftyValue = ticks[0].last_price;
  }
}

function subscribe() {
  // const items = [ 884737, 895745, 2889473, 408065, 1346049, 794369, 738561 ];
  ticker.subscribe(instrumentTokens);
  ticker.setMode(ticker.modeFull, instrumentTokens);
}

exports.liveShortStraddleOptionsTrigger = () => {
  console.log(niftyValue);
  liveShortStraddleOptions(niftyValue);
};

exports.loadOneMinuteNiftyData = (req, res) => {
  let d = new Date();
  d.setDate(d.getDate()); //remove in live

  let startDateArray = d.toString().split(" ");
  let endDateArray = d.toString().split(" ");

  startDateArray[4] = "09:15:00";
  endDateArray[4] = "15:20:00";

  let e = startDateArray.join(" ");
  let f = endDateArray.join(" ");
  console.log(e, f);

  TickModel.find({
    // instrument_token: $in[optionNiftyTokens],
    instrument_token: 256265,
    // last_trade_time: { $gte: e, $lte: f },
  })
    .sort({ instrument_token: 1, last_trade_time: 1 })
    .exec(function (err4, res) {
      if (err4) {
        console.log(
          "Problem in fetching entry data from database final data after enter"
        );
      }
      console.log(res);
    });
  res.send("Nifty OKay");
};

exports.loadOneMinuteBankData = (req, res) => {
  res.send("Bank OKay");
};

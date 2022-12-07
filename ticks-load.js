const KiteTicker = require("kiteconnect").KiteTicker;
const generic = require("./generic");
const { TickModel, addTick, TickSchema } = require("./model");
const sessionToken = require("./sessionToken.json");
const { niftyFiftyItems, optionsToken } = require("./nifty-array");

let ticker;
let optionStockTokens = niftyFiftyItems.concat(optionsToken);

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
}

function subscribe() {
  // const items = [ 884737, 895745, 2889473, 408065, 1346049, 794369, 738561 ];
  ticker.subscribe(optionsToken);
  ticker.setMode(ticker.modeFull, optionsToken);
}

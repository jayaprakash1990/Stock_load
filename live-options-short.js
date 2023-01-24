const axios = require("axios");
const fs = require("fs");
const { addValue, OptionLiveModel } = require("./option-live-model");
const { stockPlaceShort } = require("./stock-place-short");
const schedule = require("node-schedule");
const optionLiveModel = require("./option-live-model");
const { off } = require("process");
const { stockPlaceBuy } = require("./stock-place-long");

const symbolPrefix = "NIFTY23JAN";
const bufferEntry = 0.75;
const stopLossBuffer = 0.5;
const stopLoss = 40;
const qty = 50;
const twoPositionExitValue = 700;

let shortOptionEntry = {
  ceOption: { stopLoss, stopLossHit: false, qty },
  peOption: { stopLoss, stopLossHit: false, qty },
};

const tokenReturn = () => {
  // const contents = fs.readFileSync('./sessionToken.json', 'utf8');
  const contents = fs.readFileSync("./sessionToken.json", "utf8");
  const jsonValue = JSON.parse(contents);
  let tokenReturnValue =
    "token " + jsonValue.api_key + ":" + jsonValue.access_token;
  return tokenReturnValue;
};

let headerConfig = {
  headers: {
    "X-Kite-Version": "3",
    Authorization: tokenReturn(),
  },
};

const roundDownCalcualtion = (price) => {
  return Math.floor(price * 20) / 20;
};

const roundUpCalcualtion = (price) => {
  return Math.ceil(price * 20) / 20;
};

/////////This function to place the entry order for straddle or strangle

exports.liveShortStraddleOptions = (niftyValue) => {
  let roundOffNiftyValue = Math.round(niftyValue / 50) * 50;
  let ce = symbolPrefix + roundOffNiftyValue + "CE";
  let pe = symbolPrefix + roundOffNiftyValue + "PE";
  let url = "https://api.kite.trade/quote?i=NFO:" + ce + "&i=NFO:" + pe;
  axios
    .get(url, headerConfig)
    .then((response) => {
      let ceCloseValue = response.data.data["NFO:" + ce].last_price;
      let peCloseValue = response.data.data["NFO:" + pe].last_price;
      let ceBufferEntryValue = roundDownCalcualtion(
        ceCloseValue - (ceCloseValue * bufferEntry) / 100
      );
      let peBufferEntryValue = roundDownCalcualtion(
        peCloseValue - (peCloseValue * bufferEntry) / 100
      );

      console.log(response.data.data);
      shortOptionEntry.ceOption["label"] = ce;
      shortOptionEntry.ceOption["closeValue"] = ceCloseValue;
      shortOptionEntry.ceOption["bufferEntry"] = ceBufferEntryValue;
      shortOptionEntry.peOption["label"] = pe;
      shortOptionEntry.peOption["closeValue"] = peCloseValue;
      shortOptionEntry.peOption["bufferEntry"] = peBufferEntryValue;
      let arr = [];
      arr.push(shortOptionEntry.ceOption);
      arr.push(shortOptionEntry.peOption);
      let ceShort = {
        symbol: ce,
        order: "LIMIT",
        qty,
        price: ceBufferEntryValue,
      };
      let peShort = {
        symbol: pe,
        order: "LIMIT",
        qty,
        price: peBufferEntryValue,
      };
      stockPlaceShort(ceShort);
      stockPlaceShort(peShort);
      addValue(arr);
    })
    .catch((err) => console.log(err));

  ////////////////////
};

/////////This function calls from scheduler to check the order and scheduler will trigger to check stop loss

exports.fetchAndTriggerOrderCheck = () => {
  OptionLiveModel.find({})
    .sort({ label: 1 })
    .exec(function (err4, results) {
      if (err4) {
        console.log("Problem in fetching entry data from database");
      }
      if (results.length === 2) {
        let arr = [];
        results.forEach((result) => arr.push(result.label));
        arr.sort();
        triggerOrderCheck(arr);
      }
    });
};

let optionOrderCheckScheduler;

//////////////////////////to check the order and fetch all the details

const triggerOrderCheck = (labelArr) => {
  optionOrderCheckScheduler = schedule.scheduleJob(
    "*/5 * * * * *",
    async function () {
      const url = "https://api.kite.trade/orders";
      // console.log('entry ', dataJson);
      console.log("###############optionOrderCheckScheduler###############");
      try {
        let tmpResult = await axios.get(url, headerConfig);
        let results = tmpResult.data.data;
        if (
          labelArr.includes(results[0].tradingsymbol) &&
          results[0].status === "COMPLETE" &&
          labelArr.includes(results[0].tradingsymbol) &&
          results[0].status === "COMPLETE"
        ) {
          let ceAveragePrice = results.filter(
            (e) => e.tradingsymbol === labelArr[0]
          )[0].average_price;
          let peAveragePrice = results.filter(
            (e) => e.tradingsymbol === labelArr[1]
          )[0].average_price;

          await OptionLiveModel.findOneAndUpdate(
            { label: labelArr[0] },
            { sellPrice: ceAveragePrice }
          );
          await OptionLiveModel.findOneAndUpdate(
            { label: labelArr[1] },
            { sellPrice: peAveragePrice }
          );
          OptionLiveModel.find({})
            .sort({ label: 1 })
            .exec(function (err4, results) {
              if (err4) {
                console.log(
                  "Problem in fetching entry data from database final data after enter"
                );
              }

              let jsonResult = {};
              results.forEach((e) => {
                jsonResult[e.label] = e;
              });
              let ceLabel = results[0].label;
              let peLabel = results[1].label;
              if (
                !jsonResult[ceLabel].stopLossHit ||
                !jsonResult[peLabel].stopLossHit
              ) {
                OptionStopLossOrderTrigger(
                  { ...jsonResult },
                  results[0].label,
                  results[1].label
                );
              }
              if (
                !jsonResult[ceLabel].stopLossHit &&
                !jsonResult[peLabel].stopLossHit
              ) {
                twoPositionExit({ ...jsonResult }, ceLabel, peLabel);
              }
              if (optionOrderCheckScheduler) {
                optionOrderCheckScheduler.cancel();
              }
            });
        }
      } catch (e) {
        console.log("Error in retreiving order details");
      }
    }
  );
};

/////////This function calls manually to check the order and scheduler will trigger to check stop loss

exports.manualTiggerOptionStopLossCheck = () => {
  OptionLiveModel.find({})
    .sort({ label: 1 })
    .exec(function (err4, results) {
      if (err4) {
        console.log(
          "Problem in fetching entry data from database final data after enter"
        );
      }

      let jsonResult = {};
      let ceLabel = results[0].label;
      let peLabel = results[1].label;
      results.forEach((e) => {
        jsonResult[e.label] = e;
      });
      if (
        !jsonResult[ceLabel].stopLossHit ||
        !jsonResult[peLabel].stopLossHit
      ) {
        OptionStopLossOrderTrigger({ ...jsonResult }, ceLabel, peLabel);
      }

      if (
        !jsonResult[ceLabel].stopLossHit &&
        !jsonResult[peLabel].stopLossHit
      ) {
        twoPositionExit({ ...jsonResult }, ceLabel, peLabel);
      }
      if (optionOrderCheckScheduler) {
        optionOrderCheckScheduler.cancel();
      }
    });
};

let twoPositionExitScheduler;

/////////This function check the scheduler to exit the position if nothing hits stop loss

const twoPositionExit = (jResults, ceEntry, peEntry) => {
  console.log("#####Two Position Exit Scheduler###");
  let jsonResults = { ...jResults };
  let ceEntryPrice = jsonResults[ceEntry].sellPrice;
  let peEntryPrice = jsonResults[peEntry].sellPrice;
  twoPositionExitScheduler = schedule.scheduleJob(
    "*/3 * * * * *",
    async function () {
      let url =
        "https://api.kite.trade/quote?i=NFO:" +
        ceEntry +
        "&i=NFO:" +
        peEntry +
        "&i=NSE:NIFTY%2050";

      axios
        .get(url, headerConfig)
        .then((response) => {
          let results = response.data.data;

          let ceLastPrice = results["NFO:" + ceEntry].last_price;
          let peLastPrice = results["NFO:" + peEntry].last_price;
          let nifyLastPrice = results["NSE:NIFTY 50"].last_price;
          let ceCalculate = (ceEntryPrice - ceLastPrice) * qty;
          let peCalculate = (peEntryPrice - peLastPrice) * qty;
          let sum = ceCalculate + peCalculate;
          console.log(parseInt(sum), twoPositionExitValue);
          if (sum > twoPositionExitValue) {
            console.log("Day Exitttttttttttt");
            if (OptionStopLossScheduler) {
              OptionStopLossScheduler.cancel();
            }
            dayExitFunction();
            if (twoPositionExitScheduler) {
              twoPositionExitScheduler.cancel();
            }
          }
        })
        .catch((err) => {
          console.log("Error in fetching the live 1 min CE and PE data");
        });
    }
  );
};

let OptionStopLossScheduler;

//////////////////////////Scheduler to check trigger stop loss

const OptionStopLossOrderTrigger = (jResults, ceEntry, peEntry) => {
  console.log("#####OptionStopLossOrderTrigger###");
  console.log(jResults, ceEntry, peEntry);
  let jsonResults = { ...jResults };
  let tceStopLoss = jsonResults[ceEntry].stopLoss;
  let tSellPrice = jsonResults[ceEntry].bufferEntry;
  let tpeStopLoss = jsonResults[peEntry].stopLoss;
  let pSellPrice = jsonResults[peEntry].bufferEntry;
  let ceStopLoss = tSellPrice + (tSellPrice * tceStopLoss) / 100;
  let peStopLoss = pSellPrice + (pSellPrice * tpeStopLoss) / 100;
  let slHitOption = {
    ce: {
      slHit: jsonResults[ceEntry].stopLossHit,
      // slValue: jsonResults[peEntry].stopLossHit ? tSellPrice : ceStopLoss,
      slValue: ceStopLoss,
    },
    pe: {
      slHit: jsonResults[peEntry].stopLossHit,
      // slValue: jsonResults[ceEntry].stopLossHit ? pSellPrice : peStopLoss,
      slValue: peStopLoss,
    },
  };
  OptionStopLossScheduler = schedule.scheduleJob(
    // "*/20 * * * * *",
    "59 * * * * *",
    async function () {
      let url =
        "https://api.kite.trade/quote?i=NFO:" +
        ceEntry +
        "&i=NFO:" +
        peEntry +
        "&i=NSE:NIFTY%2050";

      axios
        .get(url, headerConfig)
        .then((response) => {
          let results = response.data.data;

          let ceLastPrice = results["NFO:" + ceEntry].last_price;
          let peLastPrice = results["NFO:" + peEntry].last_price;
          let nifyLastPrice = results["NSE:NIFTY 50"].last_price;
          let ceFinalLastPrice = roundUpCalcualtion(
            ceLastPrice - (ceLastPrice * stopLossBuffer) / 100
          );
          let peFinalLastPrice = roundUpCalcualtion(
            peLastPrice - (peLastPrice * stopLossBuffer) / 100
          );

          if (ceLastPrice > slHitOption.ce.slValue && !slHitOption.ce.slHit) {
            console.log("inside ce stop loss check ", ceEntry);
            console.log("ce stop loss hit");
            if (twoPositionExitScheduler) {
              twoPositionExitScheduler.cancel();
            }
            slHitOption.ce.slHit = true;
            // slHitOption.pe.slValue = pSellPrice;
            //Buy
            let bbJson = {
              symbol: ceEntry,
              order: "MARKET",
              qty,
              price: ceFinalLastPrice,
            };
            stockPlaceBuy(bbJson);
            OptionLiveModel.findOneAndUpdate(
              { label: ceEntry },
              { stopLossHit: true }
            ).exec(function (err4, re1) {
              if (err4) {
                console.log("Problem in updating stop loss");
              }
            });
          }

          if (peLastPrice > slHitOption.pe.slValue && !slHitOption.pe.slHit) {
            console.log("inside pe stop loss check");
            console.log("peStopLossHit");
            if (twoPositionExitScheduler) {
              twoPositionExitScheduler.cancel();
            }
            slHitOption.pe.slHit = true;
            // slHitOption.ce.slValue = tSellPrice;
            //Buy
            let bbJson = {
              symbol: peEntry,
              order: "MARKET",
              qty,
              price: peFinalLastPrice,
            };
            stockPlaceBuy(bbJson);
            OptionLiveModel.findOneAndUpdate(
              { label: peEntry },
              { stopLossHit: true }
            ).exec(function (err4, re2) {
              if (err4) {
                console.log("Problem in updating stop loss");
              }
            });
          }

          if (slHitOption.ce.slHit && slHitOption.pe.slHit) {
            OptionStopLossScheduler.cancel();
          }
          console.log("***************************************************");
          console.log("                                                     ");
          console.log(
            "Time : " +
              new Date().getHours() +
              ":" +
              new Date().getMinutes() +
              ":" +
              new Date().getSeconds()
          );
          console.log("Nifty : " + nifyLastPrice);
          console.log("CE : " + ceLastPrice);
          console.log("PE : " + peLastPrice);
          console.log(slHitOption);
          console.log(
            "############################################################"
          );
          console.log("                                                 ");
        })
        .catch((err) => {
          console.log("Error in fetching the live 1 min CE and PE data");
        });
    }
  );
};

////////////////////////////Function to exit the position -  final call

const dayExitFunction = () => {
  console.log("Day end option trigger");
  if (OptionStopLossScheduler) {
    OptionStopLossScheduler.cancel();
  }
  if (twoPositionExitScheduler) {
    twoPositionExitScheduler.cancel();
  }
  OptionLiveModel.find({})
    .sort({ label: 1 })
    .exec(function (err4, res) {
      if (err4) {
        console.log(
          "Problem in fetching entry data from database final data after enter"
        );
      }

      console.log(res);
      let url =
        "https://api.kite.trade/quote?i=NFO:" +
        res[0].label +
        "&i=NFO:" +
        res[1].label;

      axios.get(url, headerConfig).then((response) => {
        let results = response.data.data;

        let ceLastPrice = results["NFO:" + res[0].label].last_price;
        let peLastPrice = results["NFO:" + res[1].label].last_price;
        let ceFinalLastPrice = roundUpCalcualtion(
          ceLastPrice + (ceLastPrice * 0.1) / 100
        );
        let peFinalLastPrice = roundUpCalcualtion(
          peLastPrice + (peLastPrice * 0.1) / 100
        );
        let ceJson = {
          symbol: res[0].label,
          order: "MARKET",
          qty,
          price: ceFinalLastPrice,
        };
        if (!res[0].stopLossHit) {
          stockPlaceBuy(ceJson);
        }
        let peJson = {
          symbol: res[1].label,
          order: "MARKET",
          qty,
          price: peFinalLastPrice,
        };
        if (!res[1].stopLossHit) {
          stockPlaceBuy(peJson);
        }
        updateStopLossHit();
      });
    });
};

//////////////////////////updating stop loss  to true if all the position got exit

const updateStopLossHit = () => {
  OptionLiveModel.updateMany({}, { stopLossHit: true }, { multi: true }).exec(
    function (err4, re1) {
      if (err4) {
        console.log("Problem in updating stop loss");
      }
    }
  );
};

//////Day end position close call from scheduler
exports.dayEndOptionStopLossCheck = () => {
  dayExitFunction();
};

exports.deleteOptionLiveSchema = () => {
  OptionLiveModel.find({}).exec(function (err4, res) {
    if (err4) {
      console.log(
        "Problem in fetching entry data from database final data after enter"
      );
    }
    if (res.length > 0) {
      OptionLiveModel.deleteMany({}).exec(function (err, res1) {});
    }
  });
};

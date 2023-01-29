const mongoose = require("../mongoose-connector");
const moment = require("moment");

const checkLowReversal = (
  highCurrent1,
  highCurrent2,
  highCurrent3,
  highCurrent4,
  highCurrent5,
  lowCurrent1,
  lowCurrent2,
  lowCurrent3,
  lowCurrent4,
  lowCurrent5,
  openCurrent1,
  openCurrent2,
  openCurrent3,
  openCurrent4,
  openCurrent5,
  closeCurrent1,
  closeCurrent2,
  closeCurrent3,
  closeCurrent4,
  closeCurrent5
) => {
  return (
    // highCurrent5 >= highCurrent4 &&
    highCurrent4 >= highCurrent3 &&
    highCurrent3 >= highCurrent2 &&
    highCurrent2 >= highCurrent1 &&
    // lowCurrent5 >= lowCurrent4 &&
    lowCurrent4 >= lowCurrent3 &&
    lowCurrent3 >= lowCurrent2 &&
    lowCurrent2 >= lowCurrent1 &&
    // openCurrent5 >= closeCurrent5 &&
    openCurrent4 >= closeCurrent4 &&
    openCurrent3 >= closeCurrent3 &&
    openCurrent2 >= closeCurrent2 &&
    openCurrent1 >= closeCurrent1
  );
};

const checkHighReversal = (
  highCurrent1,
  highCurrent2,
  highCurrent3,
  highCurrent4,
  highCurrent5,
  lowCurrent1,
  lowCurrent2,
  lowCurrent3,
  lowCurrent4,
  lowCurrent5,
  openCurrent1,
  openCurrent2,
  openCurrent3,
  openCurrent4,
  openCurrent5,
  closeCurrent1,
  closeCurrent2,
  closeCurrent3,
  closeCurrent4,
  closeCurrent5
) => {
  return (
    // highCurrent5 >= highCurrent4 &&
    highCurrent4 <= highCurrent3 &&
    highCurrent3 <= highCurrent2 &&
    highCurrent2 <= highCurrent1 &&
    // lowCurrent5 >= lowCurrent4 &&
    lowCurrent4 <= lowCurrent3 &&
    lowCurrent3 <= lowCurrent2 &&
    lowCurrent2 <= lowCurrent1 &&
    // openCurrent5 >= closeCurrent5 &&
    openCurrent4 <= closeCurrent4 &&
    openCurrent3 <= closeCurrent3 &&
    openCurrent2 <= closeCurrent2 &&
    openCurrent1 <= closeCurrent1
  );
};

exports.testCheckLowReversal = (req, res) => {
  let symbol = req.params.sybmol;
  let startDate = req.params.startDate;
  let endDate = req.params.endDate;
  let arr = [];
  StockModel.find({
    stockSymbol: symbol,
    stockDate: {
      $gte: startDate,
      $lte: endDate,
    },
  })
    .lean()
    .exec(function (err4, results) {
      if (err4) {
        res.json({ result: "error" });
      }
      console.log(results.length);
      if (results.length > 5) {
        for (let i = 5; i < results.length; i++) {
          let highCurrent5 = results[i - 5].stockHigh;
          let highCurrent4 = results[i - 4].stockHigh;
          let highCurrent3 = results[i - 3].stockHigh;
          let highCurrent2 = results[i - 2].stockHigh;
          let highCurrent1 = results[i - 1].stockHigh;
          let highCurrent = results[i].stockHigh;
          let lowCurrent5 = results[i - 5].stockLow;
          let lowCurrent4 = results[i - 4].stockLow;
          let lowCurrent3 = results[i - 3].stockLow;
          let lowCurrent2 = results[i - 2].stockLow;
          let lowCurrent1 = results[i - 1].stockLow;
          let lowCurrent = results[i].stockLow;
          let openCurrent5 = results[i - 5].stockOpen;
          let openCurrent4 = results[i - 4].stockOpen;
          let openCurrent3 = results[i - 3].stockOpen;
          let openCurrent2 = results[i - 2].stockOpen;
          let openCurrent1 = results[i - 1].stockOpen;
          let openCurrent = results[i].stockOpen;
          let closeCurrent5 = results[i - 5].stockClose;
          let closeCurrent4 = results[i - 4].stockClose;
          let closeCurrent3 = results[i - 3].stockClose;
          let closeCurrent2 = results[i - 2].stockClose;
          let closeCurrent1 = results[i - 1].stockClose;
          let closeCurrent = results[i].stockClose;

          if (
            checkLowReversal(
              highCurrent1,
              highCurrent2,
              highCurrent3,
              highCurrent4,
              highCurrent5,
              lowCurrent1,
              lowCurrent2,
              lowCurrent3,
              lowCurrent4,
              lowCurrent5,
              openCurrent1,
              openCurrent2,
              openCurrent3,
              openCurrent4,
              openCurrent5,
              closeCurrent1,
              closeCurrent2,
              closeCurrent3,
              closeCurrent4,
              closeCurrent5
            )
          ) {
            arr.push(results[i - 1]);
          }
        }
        res.json(arr);
      } else {
        res.json({ result: "NO record" });
      }
    });
};

exports.checkLowRev = (req, res) => {
  const target = 0.3;

  const id = Number(req.body.stockId);
  const open = Number(req.body.stockOpen);
  const high = Number(req.body.stockHigh);
  const close = Number(req.body.stockClose);
  const low = Number(req.body.stockLow);
  const volume = Number(req.body.stockVolume);
  const date = req.body.stockDate;
  const symbol = req.body.stockSymbol;
  let breakTime = 0;

  let targetValue = high + high * (0.3 / 100);

  let tempFromDateString = date.toString().substr(0, 8);
  let tempTimeString = date.toString().substr(8, 12);
  let temptoDateString = tempFromDateString + "1500";
  let responseMessage = "No target hit";
  if (Number(tempTimeString) > 1300) {
    res.json({ result: "Time exceed 1 0 clock" });
  } else {
    StockModel.find({
      stockSymbol: symbol,
      stockDate: {
        $gte: Number(tempFromDateString + "0915"),
        $lte: Number(temptoDateString),
      },
    })
      .lean()
      .exec(function (err4, results) {
        if (err4) {
          res.json({ result: "Error in fetching the value" });
        }

        if (results.length > 0) {
          let arrFinal = [];
          let isAdd = false;
          let lowValue = 1000000;
          let isDayLow = false;
          results.forEach((res2) => {
            if (res2.stockDate < Number(date)) {
              lowValue = lowValue <= res2.stockLow ? lowValue : res2.stockLow;
            }
            if (res2.stockDate === Number(date)) {
              isDayLow = res2.stockLow <= lowValue;
            }
          });
          console.log("isDayLow ", isDayLow);

          if (isDayLow) {
            results.forEach((res1) => {
              if (res1.stockDate > Number(date)) {
                if (!isAdd && res1.stockHigh > high) {
                  breakTime = res1.stockDate;
                  responseMessage = " BreakTime " + breakTime;
                  isAdd = true;
                }
                if (isAdd) {
                  arrFinal.push(res1);
                }
              }
            });
          } else {
            responseMessage = "Not a day low";
          }
          let isTargetHit = false;
          console.log(arrFinal.length);
          if (arrFinal.length > 0) {
            arrFinal.forEach((data) => {
              if (!isTargetHit && data.stockHigh > targetValue) {
                responseMessage =
                  "   Break Time : " +
                  breakTime +
                  "     Targe Value Hit : " +
                  data.stockDate;
                isTargetHit = true;
              }
            });
          }
        } else {
          responseMessage = "No results found";
        }
        res.json({ result: responseMessage });
      });
  }
};

exports.testCheckHighReversl = (req, res) => {
  let symbol = req.params.sybmol;
  let startDate = req.params.startDate;
  let endDate = req.params.endDate;
  let arr = [];
  StockModel.find({
    stockSymbol: symbol,
    stockDate: {
      $gte: startDate,
      $lte: endDate,
    },
  })
    .lean()
    .exec(function (err4, results) {
      if (err4) {
        res.json({ result: "error" });
      }
      console.log(results.length);
      if (results.length > 5) {
        for (let i = 5; i < results.length; i++) {
          let highCurrent5 = results[i - 5].stockHigh;
          let highCurrent4 = results[i - 4].stockHigh;
          let highCurrent3 = results[i - 3].stockHigh;
          let highCurrent2 = results[i - 2].stockHigh;
          let highCurrent1 = results[i - 1].stockHigh;
          let highCurrent = results[i].stockHigh;
          let lowCurrent5 = results[i - 5].stockLow;
          let lowCurrent4 = results[i - 4].stockLow;
          let lowCurrent3 = results[i - 3].stockLow;
          let lowCurrent2 = results[i - 2].stockLow;
          let lowCurrent1 = results[i - 1].stockLow;
          let lowCurrent = results[i].stockLow;
          let openCurrent5 = results[i - 5].stockOpen;
          let openCurrent4 = results[i - 4].stockOpen;
          let openCurrent3 = results[i - 3].stockOpen;
          let openCurrent2 = results[i - 2].stockOpen;
          let openCurrent1 = results[i - 1].stockOpen;
          let openCurrent = results[i].stockOpen;
          let closeCurrent5 = results[i - 5].stockClose;
          let closeCurrent4 = results[i - 4].stockClose;
          let closeCurrent3 = results[i - 3].stockClose;
          let closeCurrent2 = results[i - 2].stockClose;
          let closeCurrent1 = results[i - 1].stockClose;
          let closeCurrent = results[i].stockClose;

          if (
            checkHighReversal(
              highCurrent1,
              highCurrent2,
              highCurrent3,
              highCurrent4,
              highCurrent5,
              lowCurrent1,
              lowCurrent2,
              lowCurrent3,
              lowCurrent4,
              lowCurrent5,
              openCurrent1,
              openCurrent2,
              openCurrent3,
              openCurrent4,
              openCurrent5,
              closeCurrent1,
              closeCurrent2,
              closeCurrent3,
              closeCurrent4,
              closeCurrent5
            )
          ) {
            arr.push(results[i - 1]);
          }
        }
        res.json(arr);
      } else {
        res.json({ result: "NO record" });
      }
    });
};

exports.checkHighRev = (req, res) => {
  const target = 0.3;

  const id = Number(req.body.stockId);
  const open = Number(req.body.stockOpen);
  const high = Number(req.body.stockHigh);
  const close = Number(req.body.stockClose);
  const low = Number(req.body.stockLow);
  const volume = Number(req.body.stockVolume);
  const date = req.body.stockDate;
  const symbol = req.body.stockSymbol;
  let breakTime = 0;

  let targetValue = low - low * (0.3 / 100);

  let tempFromDateString = date.toString().substr(0, 8);
  let tempTimeString = date.toString().substr(8, 12);
  let temptoDateString = tempFromDateString + "1500";
  let responseMessage = "No target hit";
  if (Number(tempTimeString) > 1300) {
    res.json({ result: "Time exceed 1 0 clock" });
  } else {
    StockModel.find({
      stockSymbol: symbol,
      stockDate: {
        $gte: Number(tempFromDateString + "0915"),
        $lte: Number(temptoDateString),
      },
    })
      .lean()
      .exec(function (err4, results) {
        if (err4) {
          res.json({ result: "Error in fetching the value" });
        }

        if (results.length > 0) {
          let arrFinal = [];
          let isAdd = false;
          let highValue = 0;
          let isDayHigh = false;
          results.forEach((res2) => {
            if (res2.stockDate < Number(date)) {
              highValue =
                highValue >= res2.stockHigh ? highValue : res2.stockHigh;
            }
            if (res2.stockDate === Number(date)) {
              isDayHigh = res2.stockHigh >= highValue;
            }
          });
          console.log("isDayHigh ", isDayHigh);

          if (isDayHigh) {
            results.forEach((res1) => {
              if (res1.stockDate > Number(date)) {
                if (!isAdd && res1.stockLow < low) {
                  breakTime = res1.stockDate;
                  responseMessage = " BreakTime " + breakTime;
                  isAdd = true;
                }
                if (isAdd) {
                  arrFinal.push(res1);
                }
              }
            });
          } else {
            responseMessage = "Not a day High";
          }
          let isTargetHit = false;
          console.log(arrFinal.length);
          if (arrFinal.length > 0) {
            arrFinal.forEach((data) => {
              if (!isTargetHit && data.stockLow < targetValue) {
                responseMessage =
                  "   Break Time : " +
                  breakTime +
                  "     Targe Value Hit : " +
                  data.stockDate;
                isTargetHit = true;
              }
            });
          }
        } else {
          responseMessage = "No results found";
        }
        res.json({ result: responseMessage });
      });
  }
};

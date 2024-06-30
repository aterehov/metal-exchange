import log from "./middleware/log";
import { subDays } from "date-fns";

var convert = require("xml-js");

const express = require("express");
const bodyParser = require("body-parser");

const app = express();
const port = 3000;

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

const router = express.Router();

const get = async (req, res, next) => {
  const id = Number(req.params.id);
  console.log(req.query.url);

  let d = new Date();
  let j;
  while (!j || !j["Metall"] || !j["Metall"]["Record"]) {
    let day = d.getDate().toString();
    if (day.length == 1) {
      day = "0" + day;
    }

    let month = (d.getMonth() + 1).toString();
    if (month.length == 1) {
      month = "0" + month;
    }

    let year = d.getFullYear().toString();

    const data = await (
      await fetch(
        "https://www.cbr.ru/scripts/xml_metall.asp?date_req1=" +
          day +
          "/" +
          month +
          "/" +
          year +
          "&date_req2=" +
          day +
          "/" +
          month +
          "/" +
          year
      )
    ).text();
    console.log(data);

    j = convert.xml2js(data, { compact: true, spaces: 4 });
    console.log(j);
    d = subDays(d, 1);
  }

  let pb = Number(
    j["Metall"]["Record"][id - 1]["Buy"]["_text"].replace(",", ".")
  );
  let ps = Number(
    j["Metall"]["Record"][id - 1]["Sell"]["_text"].replace(",", ".")
  );

  res.json({ BUY: pb, SELL: ps });
};

const controller = {
  get: get,
};

router.get("/metals/:id", controller.get);

app.use("/", log);
app.use("/api", router);

app.listen(port, async () => {
  console.log("Server running on port " + port);
});

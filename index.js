require("dotenv").config();
const express = require("express");
const cors = require('cors');
const mongoose = require("mongoose");

const port = process.env.PORT || 3333;
const dbConection = process.env.MONGODB_CONECTION; 
 
const app = express();

app.use(
    express.urlencoded({
        extended: true,
    }),
);

app.use(cors());
app.use(express.json());

const productDataSchema = new mongoose.Schema({
    title: String,
    price: String,
    img: String,
    store: String,
    logo: String,
    link: String,
    weight: Number,
    category: String,
    group: String,
    filtA: String,
    filtB: String,
    filtC: String,
});

let Products = mongoose.model('Products', productDataSchema);

const graphicsDataSchema = new mongoose.Schema({
    group: String,
    months: Array,
});

let Graphics = mongoose.model('Graphics', graphicsDataSchema);

app.post('/grafico', async (req, res) => {
    const { groupName } = req.body;

    const monthPriceList = await Graphics.aggregate(
        [
            { $match: { group: groupName } },
            { $sample: { size: 1 } }
        ]
    );

  //  console.log(monthPriceList);

   if (monthPriceList.length > 0) {
     sendTheResponse(monthPriceList[0].months);
   } else {
    sendTheResponse([]);
   };
    
    function sendTheResponse(priceList) {
        try {
            res.status(200).json(priceList);
        } catch (error) {
            res.status(500).json({ error: error });
        };
    };
});

app.post('/alerta', async (req, res) => {
    const { theAlertlist } = req.body;

    // console.log("theAlertlist",  theAlertlist);
 
    let newArrmy = []; 

    for (let i = 0; i < theAlertlist.length; i++) {

        let getWord = theAlertlist[i].word;

      //  console.log(getWord);

        let regexWord = new RegExp(getWord, 'i');

        const searchList = await Products.find(
            { 'title': regexWord }
        );

        // console.log("searchList", searchList);

        let notDotV = theAlertlist[i].valuation.includes(".") ? theAlertlist[i].valuation.replace(".", "") : theAlertlist[i].valuation;

        let toFloatV = parseFloat(notDotV).toLocaleString("en-US", {style:"currency", currency:"USD"});
       // console.log(toFloatV);
        
        let getFormatV = toFloatV.includes("$") ?  toFloatV.replace("$", "") : toFloatV;


        const caseEqual = searchList.filter((ite) => {
          let notDot = ite.price.includes(".") ? ite.price.replace(".", "") : ite.price;

          let toFloat = parseFloat(notDot).toLocaleString("en-US", {style:"currency", currency:"USD"});
        
          let getFormat = toFloat.includes("$") ?  toFloat.replace("$", "") : toFloat;

         // console.log(getFormatV);
         // console.log(getFormat);

            if (getFormat === getFormatV) {
                return ite;
            } else {
                return null;
            }; 
        });

      //  console.log("caseEqual", caseEqual);

        if (caseEqual.length > 0) {
            // console.log("entrou existe igual ...")
            let caseObj = {
                num: theAlertlist[i].id,
                caseId: caseEqual[0]._id
            };

            // console.log("caseObj", caseObj);
    
            newArrmy.push(caseObj);
        };
    };

    // console.log("newArrmy: ", newArrmy);

    sendTheResponse(newArrmy);

    function sendTheResponse(alertList) {
        try {
            // console.log("alertList: ", alertList)
            res.status(200).json(alertList);
        } catch (error) {
            res.status(500).json({ error: error });
        };
    };
});

app.post('/produto/outros', async (req, res) => {
    const { theWord, thePrice, catName } = req.body;

    // console.log("theWord ", theWord, "thePrice ", thePrice, "catName ", catName);
      
    let notDotPrice = thePrice.includes(".") ? thePrice.replace(".", "") : thePrice;

    let notVirgPrice = notDotPrice.includes(",") ? notDotPrice.replace(",", ".") : notDotPrice;

    let notVirgFloat = parseFloat(notVirgPrice);

    let realPrice = notVirgFloat * 0.8;

    // console.log("valores: ", theWord, realPrice)

    let regexWord = new RegExp(theWord, 'i');

    const searchList = await Products.find(
      { 'title': regexWord }
    );

    // console.log("searchList: ", searchList)

    if (searchList.length >= 4) {
      let formTheWord = theWord.toLowerCase();

      let list = searchList.filter((ite) => { 
        let notDot = ite.price.includes(".") ? ite.price.replace(".", "") : ite.price;

        let notVirg = notDot.includes(",") ? notDot.replace(",", ".") : notDot;

        let realPriceIte = parseFloat(notVirg)

        // console.log("real: ", realPriceIte)

        // console.log("notVirgPrice: ", notVirgPrice)

        // console.log("neste caso: ", realPriceIte === notVirgFloat)

        if (ite.title.toLowerCase().includes(formTheWord) && realPriceIte === notVirgFloat) {
            return null;
        } else {
            if (realPriceIte >= realPrice) {
                return ite;
            };
        };
      });

        if (list.length >= 4) {
            const forPrice = list.sort((a, b) => {

                let notDot = a.price.includes(".") ? a.price.replace(".", "") : a.price;

                let notVirg = notDot.includes(",") ? notDot.replace(",", ".") : notDot;

                let notDotB = b.price.includes(".") ? b.price.replace(".", "") : b.price;

                let notVirgB = notDotB.includes(",") ? notDotB.replace(",", ".") : notDotB;

                if (parseFloat(notVirg) < parseFloat(notVirgB)) {
                    return -1;
                } else {
                    return true;
                };

            });

            let justFour = [];

            justFour.push(forPrice[0]);
            justFour.push(forPrice[1]);
            justFour.push(forPrice[2]);
            justFour.push(forPrice[3]);

            sendTheResponse(justFour);
        } else {
            errorCase();
        };
    } else {
        errorCase();
    };

    async function errorCase() {
        // console.log("busca por categoria ...")
        const categoryList = await Products.aggregate(
            [
                { $match: { category: catName } },
                { $sample: { size: 5 } }
            ]
        );

        // console.log("categoryList: ", categoryList);

        let formTheWord = theWord.toLowerCase();

        let list = categoryList.filter((ite) => { 
            let notDot = ite.price.includes(".") ? ite.price.replace(".", "") : ite.price;
    
            let notVirg = notDot.includes(",") ? notDot.replace(",", ".") : notDot;
    
            let realPriceIte = parseFloat(notVirg)
    
            // console.log("real: ", realPriceIte)
    
            // console.log("notVirgPrice: ", notVirgPrice)
    
            // console.log("neste caso: ", realPriceIte === notVirgFloat)
    
            if (ite.title.toLowerCase().includes(formTheWord) && realPriceIte === notVirgFloat) {
                return null;
            } else {
                return ite;
            };
        });

        // console.log("como fuco a list :", list)

        if (list.length === 4) {
            // console.log("tve igual ...")
            sendTheResponse(list);
        } else {
            // console.log("somente diferentes === ...")
            let justFour = [];
            justFour.push(list[0]);
            justFour.push(list[1]);
            justFour.push(list[2]);
            justFour.push(list[3]);

            sendTheResponse(justFour);
        };   
    };

    // console.log("newArrmy: ", newArrmy);

    function sendTheResponse(otrostList) {
        try {
            // console.log("alertList: ", otrostList)
            res.status(200).json(otrostList);
        } catch (error) {
            res.status(500).json({ error: error });
        };
    };
});

app.post('/produto/:id', async (req, res) => {
    // console.log("no produto");

    const { id } = req.params;

    const product = await Products.findOne({ _id: id });

    try {
        res.status(201).json(product);
    } catch (error) {
        res.status(400).json({ error: error });
    };
});
 
app.post('/historico', async (req, res) => {
    const { hisList } = req.body;
    let getHis = [];

    if (hisList) {
        if (hisList.length > 0) {
            for (let i=0; i < hisList.length; i++) {
              const product = await Products.findOne({ _id: hisList[i] });
      
              if (product !== null) {
                getHis.push(product);
              };
            };
       
            sendTheResponse(getHis);
          } else {
            sendTheResponse(getHis);
          };
    } else {
        sendTheResponse(getHis);
    };

    function sendTheResponse(historicList) {
      try {
        res.status(200).json(historicList);
      } catch (error) {
        res.status(500).json({ error: error });
      };
    };
});

app.post('/sugestoes', async (req, res) => {
    const { searchNames } = req.body;

    let catNames = [];

    if (searchNames.length > 0) {
        for (var r = 0; r < searchNames.length; r++) {

            let searchWord = new RegExp(searchNames[r], 'i');

            const catFromSearchWord = await Products.findOne(
                { 'title': searchWord }
            );

            if (catFromSearchWord) {
                catNames.push(catFromSearchWord.category);
            };

        };
    };

    if (catNames.length === 0 || catNames.length > 3) {

        const suggestionsList = await Products.aggregate(
            [
                { $sample: { size: 9 } }
            ]
        );

        sendTheResponse(suggestionsList);
    } else if (catNames.length > 0 && catNames.length < 4) {

        let catList = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l"];

        let getAleatoryCat = [];

        while (getAleatoryCat.length < 3) {
            const randomIndex = Math.floor(Math.random() * catList.length);
            const randomItem = catList[randomIndex];

            if (!getAleatoryCat.includes(randomItem)) {
                getAleatoryCat.push(randomItem);
            };
        };

        let mergeCat = [...catNames, ...getAleatoryCat];

        const getJustDef = [...new Set(mergeCat)];

        getCat(getJustDef);

    };

    async function getCat(suggestions) {
        let getDone = [];

        for (var t = 0; t < 3; t++) {
            const suggestionsList = await Products.aggregate(
                [
                    { $match: { category: suggestions[t] } },
                    { $sample: { size: 3 } }
                ]
            );

            for (var c = 0; c < 3; c++) {
                getDone.push(suggestionsList[c]);
            };
        };

        sendTheResponse(getDone);
    };

    function sendTheResponse(suggestionsList) {
        try {
            res.status(200).json(suggestionsList);
        } catch (error) {
            res.status(500).json({ error: error });
        };
    };
});
  
app.get('/ranking', async (req, res) => {
    const rankingList = await Products.find(
        { 'weight': { $gt: 0 } }
    )
        .sort({ 'weight': -1 })
        .limit(4);

    try {
        res.status(200).json(rankingList);
    } catch (error) {
        res.status(500).json({ error: error });
    };
});

app.get('/ofertas', async (req, res) => {
    const offList = await Products.aggregate(
        [
            { $sample: { size: 12 } }
        ]
    );

    try {
        res.status(200).json(offList);
    } catch (error) {
        res.status(500).json({ error: error });
    };
});

app.post('/categoria', async (req, res) => {
    const { catName } = req.body;

    const categoryList = await Products.aggregate(
        [
            { $match: { category: catName } },
            { $sample: { size: 12 } }
        ]
    );

    try {
        res.status(200).json(categoryList);
    } catch (error) {
        res.status(500).json({ error: error });
    };
});

app.post('/search', async (req, res) => {
    const { FiltCOfReq, word } = req.body;

    if (FiltCOfReq !== "" && word === "") {
        const searchList = await Products.find(
            { 'filtC': FiltCOfReq }
        );

        sendTheResponse(searchList);
    } else {
        let regexWord = new RegExp(word, 'i');

        const searchList = await Products.find(
            { 'title': regexWord }
        );

        sendTheResponse(searchList);
    };

    function sendTheResponse(searchList) {
        try {
            res.status(200).json(searchList);
        } catch (error) {
            res.status(500).json({ error: error });
        };
    };
});

app.post('/:id', async (req, res) => {
    const { id } = req.params;
    const product = await Products.findOne({ _id: id });

    if (product.weight >= 0) {
        let mos = product.weight;
        product.weight = mos + 1;
    };

    try {
        await product.save();
        res.status(201).json(product);
    } catch (error) {
        res.status(400).json({ error: error });
    };
});

mongoose
  .connect(
    dbConection,
    { useNewUrlParser: true, useUnifiedTopology: true }
  )
  .then(() => {
    console.log('conectou ao mongoDB com sucesso');
    app.listen(port); 
  })
  .catch((err) => console.log(err));
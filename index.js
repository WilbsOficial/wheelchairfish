require("dotenv").config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const port = process.env.PORT || 3333;
const dbConection = process.env.MONGODB_CONECTION; 

const app = express();

mongoose
  .connect(
    dbConection,
    { useNewUrlParser: true, useUnifiedTopology: true }
)
.then(()=> {
  console.log('conectou ao mongoDB');
  app.listen(port); 
})
.catch((err) => console.log(err));

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
  filtA: String,
  filtB: String,
  filtC: String,
});

let Products = mongoose.model('Products', productDataSchema); 

app.post('/sugestoes', async (req, res) => {
  const { searchNames } = req.body; 

  let catNames = [];

  if (searchNames.length > 0) {
    for (var r = 0; r < searchNames.length; r++) {

      let searchWord = new RegExp(searchNames[r],'i');
  
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
      res.status(500).json({error: error});
    };
  };
});

app.get('/ranking', async (req, res) => {
  const rankingList = await Products.find(
    { 'weight': { $gt: 0 } }
  )
  .sort( { 'weight': -1 } )
  .limit( 4 );
  
  try {
    res.status(200).json(rankingList);
  } catch (error) {
    res.status(500).json({error: error});
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
    res.status(500).json({error: error});
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
    res.status(500).json({error: error});
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
    let regexWord = new RegExp(word,'i');

    const searchList = await Products.find(
      { 'title': regexWord }
    );

    sendTheResponse(searchList);
  };
  
  function sendTheResponse(searchList) {
    try {
      res.status(200).json(searchList);
    } catch (error) {
      res.status(500).json({error: error});
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
    res.status(400).json({error: error});
  };
});
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

app.get('/', async (req, res) => {
  const productsList = await Products.find();
  
  try {
    res.status(200).json(productsList);
  } catch (error) {
    res.status(500).json({error: error});
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
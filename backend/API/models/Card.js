const mongoose = require('mongoose');

const cardSchema = new mongoose.Schema({
  name: { type: String, required: true },
  image: { type: String, required: true },
  rarity: { type: String },
  price: { type: Number, required: true, default: 0 },
  countInStock: { type: Number, required: true, default: 0 },
  description: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Card', cardSchema);
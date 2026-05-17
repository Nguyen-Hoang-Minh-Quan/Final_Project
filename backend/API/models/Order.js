const mongoose = require('mongoose');

const orderSchema = mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    orderItems: [
      {
        name: { type: String, required: true },
        qty: { type: Number, required: true },
        image: { type: String, required: true },
        price: { type: Number, required: true },
        product: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Card' },
      },
    ],
    address: { type: String, required: true },
    city: { type: String, required: true },
    phone: { type: String, required: true },
    paymentMethod: { 
      type: String, 
      required: true, 
      enum: ['Momo', 'ZaloPay', 'Ngân hàng', 'COD'],
      default: 'COD' 
    },
    totalPrice: { type: Number, required: true, default: 0.0 },
    isPaid: { type: Boolean, required: true, default: false },
    status: {
        type: String,
        required: true,
        default: 'Chờ xử lý',
        enum: ['Chờ xử lý', 'Đang giao', 'Đã giao', 'Đã hủy']
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();

app.use(express.json());
app.use(cors());

const path = require('path');
app.use(express.static(path.join(__dirname)));

// ডাটাবেস কানেকশন - এখানে একটি অপশন যোগ করেছি যাতে কানেকশন দ্রুত হয়
mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 })
.then(() => console.log('✅ Database Connected!'))
.catch(err => console.error('❌ DB Error:', err));

// এই লাইনটি খুঁজে বের করো এবং এভাবে পরিবর্তন করো:
// কোডের ১৯ নম্বর লাইনটি এভাবে লিখুন
const Product = mongoose.model('Product', new mongoose.Schema({
    name: String,
    price: Number,
    category: String,
    image: String
}), 'products'); // এখানে শেষ প্যারামিটারে 'products' লিখে দাও

app.post('/add-product', async (req, res) => {
    try {
        console.log("📥 Data Received:", req.body);
        const newProduct = new Product({
            name: req.body.name,
            price: Number(req.body.price),
            category: req.body.category,
            image: req.body.image
        });
        await newProduct.save();
        res.status(200).json({ message: 'Success' });
    } catch (err) {
        console.error("❌ Save Error:", err);
        res.status(500).json({ error: err.message });
    }
});

app.get('/get-products', async (req, res) => {
    try {
        const products = await Product.find();
        res.status(200).json(products);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/delete-product/:id', async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(3000, () => console.log('🚀 Server running on port 3000'));
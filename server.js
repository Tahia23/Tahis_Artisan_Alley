const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

app.use(express.static(path.join(__dirname)));

// ডাটাবেস কানেকশন
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    console.error('❌ Error: MONGO_URI is missing in Environment Variables!');
} else {
    mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 })
    .then(() => console.log('✅ Database Connected!'))
    .catch(err => console.error('❌ DB Error:', err));
}

// ---------------- Schemas & Models ----------------

// ১. প্রোডাক্ট মডেল
const Product = mongoose.model('Product', new mongoose.Schema({
    name: String,
    price: Number,
    category: String,
    image: String
}), 'products');

// ২. অর্ডার মডেল
const Order = mongoose.model('Order', new mongoose.Schema({
    name: String,
    phone: String,
    address: String,
    items: Array,
    total: String,
    date: { type: Date, default: Date.now }
}), 'orders');

// ৩. ইউজার মডেল (Sign Up/Sign In-এর জন্য)
const User = mongoose.model('User', new mongoose.Schema({
    name: String,
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
}), 'users');

// ---------------- Auth Routes (Sign Up & Sign In) ----------------

// Registration / Sign Up Route
app.post('/signup', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!email || !password) {
            return res.status(400).send('<h1>Email and Password are required! <a href="/">Go Back</a></h1>');
        }

        // চেক করা ইমেইল আগে থেকেই আছে কিনা
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).send('<h1>Email already registered! <a href="/">Go Back</a></h1>');
        }

        // নতুন ইউজার ডাটাবেসে সেভ করা
        const newUser = new User({ name, email, password });
        await newUser.save();
        
        console.log("👤 New User Registered:", email);
        res.redirect('/?signup=success');
    } catch (err) {
        console.error("❌ Sign Up Error:", err);
        res.status(500).send("Registration Failed: " + err.message);
    }
});

// Login / Sign In Route
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // ডাটাবেসে ইউজার আছে কিনা সার্চ করা
        const user = await User.findOne({ email, password });

        if (user) {
            console.log("🔑 User Logged In:", email);
            res.redirect('/?login=success');
        } else {
            res.status(401).send('<h1>Invalid Email or Password! <a href="/">Try Again</a></h1>');
        }
    } catch (err) {
        console.error("❌ Login Error:", err);
        res.status(500).send("Login Failed: " + err.message);
    }
});

// ---------------- Product Routes ----------------

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

// ---------------- Order Routes ----------------

app.post('/place-order', async (req, res) => {
    try {
        const newOrder = new Order(req.body);
        await newOrder.save();
        console.log("📦 New Order Received:", req.body);
        res.status(200).json({ message: 'Order Placed!' });
    } catch (err) {
        console.error("❌ Order Error:", err);
        res.status(500).json({ error: err.message });
    }
});

// ---------------- Page Routes ----------------

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'admin.html'));
});

// Server Listening (Render-এর জন্য Dynamic PORT)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
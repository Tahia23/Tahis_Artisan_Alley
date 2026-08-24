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

// ২. অর্ডার মডেল (অর্ডার স্ট্যাটাস এবং ইমেইল যুক্ত করা হয়েছে)
const Order = mongoose.model('Order', new mongoose.Schema({
    name: String,
    phone: String,
    address: String,
    items: Array,
    total: String,
    email: String, // কাস্টমারের ইমেইল
    status: { type: String, default: 'Pending' }, // Pending, Accepted, Rejected
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
            return res.status(400).send('<h1>Email already registered! Please <a href="/">Sign In</a></h1>');
        }

        // নতুন ইউজার ডাটাবেসে সেভ করা
        const newUser = new User({ name, email, password });
        await newUser.save();
        
        console.log("👤 New User Registered:", email);
        // আসল ইমেইল ব্যাকএন্ড থেকে ফ্রন্টএন্ডে পাঠানো হচ্ছে
        res.redirect(`/?signup=success&email=${encodeURIComponent(email)}`);
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
            // আসল ইমেইল ব্যাকএন্ড থেকে ফ্রন্টএন্ডে পাঠানো হচ্ছে
            res.redirect(`/?login=success&email=${encodeURIComponent(email)}`);
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

// ৪. প্রোডাক্ট এডিট/আপডেট করার নতুন Route (নূতন যোগ করা হয়েছে)
app.put('/edit-product/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updatedProduct = await Product.findByIdAndUpdate(
            id,
            {
                name: req.body.name,
                price: Number(req.body.price),
                category: req.body.category,
                image: req.body.image
            },
            { new: true }
        );

        if (!updatedProduct) {
            return res.status(404).json({ error: 'Product not found' });
        }

        console.log("✏️ Product Updated:", updatedProduct.name);
        res.status(200).json({ message: 'Updated Successfully', product: updatedProduct });
    } catch (err) {
        console.error("❌ Update Error:", err);
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

// ১. অ্যাডমিনের জন্য সব অর্ডার নিয়ে আসার Route (নতুন যোগ করা হয়েছে)
app.get('/get-orders', async (req, res) => {
    try {
        const orders = await Order.find().sort({ date: -1 });
        res.status(200).json(orders);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ২. নির্দিষ্ট কাস্টমারের ইমেইল অনুযায়ী তার অর্ডার নিয়ে আসার Route (নতুন যোগ করা হয়েছে)
app.get('/get-user-orders/:email', async (req, res) => {
    try {
        const orders = await Order.find({ email: req.params.email }).sort({ date: -1 });
        res.status(200).json(orders);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ৩. অ্যাডমিন দ্বারা অর্ডার Accept / Reject করার Route (নতুন যোগ করা হয়েছে)
app.put('/update-order-status/:id', async (req, res) => {
    try {
        const { status } = req.body;
        const updatedOrder = await Order.findByIdAndUpdate(
            req.params.id,
            { status: status },
            { new: true }
        );
        res.status(200).json({ message: `Order ${status}`, order: updatedOrder });
    } catch (err) {
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
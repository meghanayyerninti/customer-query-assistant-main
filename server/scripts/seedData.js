require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/user.model');
const Product = require('../models/product.model');

const products = [
  {
    name: 'Smartphone X',
    description: 'High-end smartphone with advanced camera and long battery life.',
    price: 82270,
    category: 'Electronics',
    inStock: true,
    stockQuantity: 50,
    sku: 'PHONE-X-001',
    imageUrl: 'https://www.google.com/imgres?q=Smartphone%20X&imgurl=https%3A%2F%2Fbuy.cashforphone.in%2Fcdn%2Fshop%2Ffiles%2FApple-iPhone-XS-Max-White-3_41cd85b7-7dda-4f56-be79-f130a2d96c0e.jpg%3Fv%3D1718537789%26width%3D1445&imgrefurl=https%3A%2F%2Fbuy.cashforphone.in%2Fproducts%2Fapple-iphone-x-white&docid=pupqzoOTUEwe-M&tbnid=_G8_fL77pNDYOM&vet=12ahUKEwiWnJCfpsuMAxUPzTgGHYSgO6cQM3oFCIUBEAA..i&w=1080&h=1080&hcb=2&ved=2ahUKEwiWnJCfpsuMAxUPzTgGHYSgO6cQM3oFCIUBEAA'
  },
  {
    name: 'Wireless Headphones',
    description: 'Premium noise-canceling wireless headphones with 30-hour battery life.',
    price: 20567,
    category: 'Audio',
    inStock: true,
    stockQuantity: 100,
    sku: 'AUDIO-HP-002',
    imageUrl: 'https://www.google.com/imgres?q=Wireless%20Headphones&imgurl=https%3A%2F%2Fstore.storeimages.cdn-apple.com%2F4668%2Fas-images.apple.com%2Fis%2FMQTQ3%3Fwid%3D1144%26hei%3D1144%26fmt%3Djpeg%26qlt%3D90%26.v%3D1741643688229&imgrefurl=https%3A%2F%2Fwww.apple.com%2Fin%2Fshop%2Fproduct%2FMQTQ3AE%2FA%2Fbeats-studio-pro-wireless-headphones-navy&docid=h3KK_T1NV6pmaM&tbnid=kBgz97xI8hTssM&vet=12ahUKEwjoubW0p8uMAxUCh68BHcLJDMkQM3oECGoQAA..i&w=1144&h=1144&hcb=2&ved=2ahUKEwjoubW0p8uMAxUCh68BHcLJDMkQM3oECGoQAA'
  },
  {
    name: 'Smart Watch',
    description: 'Track your fitness, receive notifications, and more with this smart watch.',
    price: 28793,
    category: 'Wearables',
    inStock: true,
    stockQuantity: 75,
    sku: 'WATCH-SW-003',
    imageUrl: 'https://www.google.com/imgres?q=Smart%20Watch&imgurl=https%3A%2F%2Fwww.thestylesalad.in%2Fcdn%2Fshop%2Ffiles%2FSnapUpStyleSaladCreativesVision3.webp%3Fv%3D1716977743&imgrefurl=https%3A%2F%2Fwww.thestylesalad.in%2Fproducts%2Fvision-smartwatch&docid=xZWxJWnXJJY48M&tbnid=lFWCVQc-YylzFM&vet=12ahUKEwiWirHep8uMAxVUZ_UHHSKvGeYQM3oECCEQAA..i&w=2048&h=2048&hcb=2&ved=2ahUKEwiWirHep8uMAxVUZ_UHHSKvGeYQM3oECCEQAA'
  },
  {
    name: 'Laptop Pro',
    description: 'Powerful laptop for professionals with high-performance specs.',
    price: 123404,
    category: 'Computers',
    inStock: true,
    stockQuantity: 25,
    sku: 'COMP-LP-004',
    imageUrl: 'https://www.google.com/imgres?q=Laptop%20Pro&imgurl=https%3A%2F%2Fm.media-amazon.com%2Fimages%2FI%2F61Iyy%2B2damL.jpg&imgrefurl=https%3A%2F%2Fwww.amazon.in%2FChuwi-HeroBook-Pro-Windows-Celeron%2Fdp%2FB08316YSKH&docid=yqcTHSD7OzfDdM&tbnid=hhoLBXUcU-Kq4M&vet=12ahUKEwjHrs_0p8uMAxWqdPUHHQyTM38QM3oECBkQAA..i&w=1500&h=1283&hcb=2&ved=2ahUKEwjHrs_0p8uMAxWqdPUHHQyTM38QM3oECBkQAA'
  },
  {
    name: 'Gaming Console',
    description: 'Next-generation gaming console with 4K graphics and fast load times.',
    price: 41134,
    category: 'Gaming',
    inStock: false,
    stockQuantity: 0,
    sku: 'GAME-C-005',
    imageUrl: 'https://www.google.com/imgres?q=Gaming%20Console&imgurl=https%3A%2F%2Fmedia-ik.croma.com%2Fprod%2Fhttps%3A%2F%2Fmedia.croma.com%2Fimage%2Fupload%2Fv1712137796%2FCroma%2520Assets%2FGaming%2FGaming%2520Consoles%2FImages%2F305985_ilpfe3.png%3Ftr%3Dw-400&imgrefurl=https%3A%2F%2Fwww.croma.com%2Fgaming%2Fgaming-consoles%2Fc%2F63&docid=yzgIIRZGgnVWKM&tbnid=jULZw9uJkxgdEM&vet=12ahUKEwirh-ChqMuMAxUWla8BHaMAIMcQM3oECB0QAA..i&w=400&h=400&hcb=2&ved=2ahUKEwirh-ChqMuMAxUWla8BHaMAIMcQM3oECB0QAA'
  }
];

// Admin user
const admin = {
  username: 'Meghana',
  email: 'meghanayerninti08@gmail.com',
  password: 'Meghana@123',
  role: 'admin'
};

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    try {
      // Clear existing data
      await Product.deleteMany({});
      await User.deleteMany({ username: admin.username });
      
      // Insert products
      await Product.insertMany(products);
      console.log(`${products.length} products inserted`);
      
      // Create admin user
      const adminUser = new User(admin);
      await adminUser.save();
      console.log('Admin user created');
      
      console.log('Seed data inserted successfully');
    } catch (error) {
      console.error('Error seeding data:', error);
    } finally {
      // Close the connection
      mongoose.connection.close();
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
  });
require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('../models/order.model');
const Policy = require('../models/policy.model');
const User = require('../models/user.model');
const { formatCurrency } = require('../../client/src/utils/currency');

// Sample store policies
const policies = [
  {
    type: 'return',
    title: 'Return Policy',
    content: `Our return policy allows you to return items within 30 days of delivery for a full refund.

Return shipping costs are the responsibility of the customer unless the item was received damaged or incorrect.

For damaged or defective items, we will cover return shipping costs.

Please contact our customer service team to initiate a return.`
  },
  {
    type: 'refund',
    title: 'Refund Policy',
    content: `Refunds are processed within 5-7 business days after receiving returned items.
    Refunds will be issued to the original payment method used for the purchase.
    Shipping charges are non-refundable unless the return is due to our error.
    For damaged or defective items, we will cover return shipping costs.`
  },
  {
    type: 'shipping',
    title: 'Shipping Policy',
    content: `We offer standard and express shipping options.

Standard shipping: 3-5 business days
Express shipping: 1-2 business days

Free shipping on orders over ${formatCurrency(4000)}

International shipping is available to select countries. Rates and delivery times vary by location.`
  },
  {
    type: 'privacy',
    title: 'Privacy Policy',
    content: `We collect and process your personal data in accordance with our privacy policy.
    Your data is used to process orders, provide customer support, and improve our services.
    We never share your personal information with third parties without your consent.
    You can request your data to be deleted at any time.`
  }
];

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    try {
      // Clear existing data
      await Policy.deleteMany({});
      await Order.deleteMany({});
      
      // Insert policies
      await Policy.insertMany(policies);
      console.log(`${policies.length} policies inserted`);
      
      // Find admin user to use as reference
      const adminUser = await User.findOne({ role: 'admin' });
      
      if (adminUser) {
        // Sample orders with proper user reference
        const orders = [
          {
            orderNumber: 'ORD-001',
            userId: adminUser._id,
            items: [
              {
                productId: 'PHONE-X-001',
                quantity: 1,
                price: 82270
              }
            ],
            totalAmount: 82270,
            status: 'delivered',
            shippingAddress: {
              street: '42 MG Road',
              city: 'Bangalore',
              state: 'Karnataka',
              zipCode: '560001',
              country: 'India'
            },
            createdAt: new Date('2024-03-01'),
            updatedAt: new Date('2024-03-03')
          },
          {
            orderNumber: 'ORD-002',
            userId: adminUser._id,
            items: [
              {
                productId: 'AUDIO-HP-002',
                quantity: 1,
                price: 20567
              }
            ],
            totalAmount: 20567,
            status: 'processing',
            shippingAddress: {
              street: '15 Park Street',
              city: 'Mumbai',
              state: 'Maharashtra',
              zipCode: '400001',
              country: 'India'
            },
            createdAt: new Date('2024-04-01'),
            updatedAt: new Date('2024-04-01')
          },
          {
            orderNumber: 'ORD-003',
            userId: adminUser._id,
            items: [
              {
                productId: 'WATCH-SW-003',
                quantity: 1,
                price: 28793
              }
            ],
            totalAmount: 28793,
            status: 'shipped',
            shippingAddress: {
              street: '7 Connaught Place',
              city: 'New Delhi',
              state: 'Delhi',
              zipCode: '110001',
              country: 'India'
            },
            createdAt: new Date('2024-04-05'),
            updatedAt: new Date('2024-04-06')
          }
        ];

        // Insert orders
        await Order.insertMany(orders);
        console.log(`${orders.length} orders inserted`);
      } else {
        console.log('No admin user found. Skipping order creation.');
      }
      
      console.log('Additional seed data inserted successfully');
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
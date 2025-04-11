// server/controllers/chat.controller.js
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Chat = require('../models/chat.model');
const Product = require('../models/product.model');
const dotenv = require('dotenv');
const Order = require('../models/order.model');
const mongoose = require('mongoose');
const Message = require('../models/message.model');
const { formatCurrency } = require('../../client/src/utils/currency');

// Load environment variables
dotenv.config();

// Rate limiting configuration - more balanced approach
const RATE_LIMIT_WINDOW = 30000; // 30 seconds in milliseconds
const MAX_REQUESTS_PER_WINDOW = 3; // 3 requests per 30 seconds
const RETRY_ATTEMPTS = 3; // Reduced retry attempts
const RETRY_DELAY = 2000; // 2 seconds base delay

// Global rate limiting state
const globalRequestCounts = {
  count: 0,
  lastReset: Date.now()
};

// Rate limiting middleware with global tracking
const checkRateLimit = async (userId) => {
  const now = Date.now();
  
  // Reset global counter if window has passed
  if (now - globalRequestCounts.lastReset > RATE_LIMIT_WINDOW) {
    globalRequestCounts.count = 0;
    globalRequestCounts.lastReset = now;
  }
  
  // Check global rate limit
  if (globalRequestCounts.count >= MAX_REQUESTS_PER_WINDOW) {
    const timeToWait = RATE_LIMIT_WINDOW - (now - globalRequestCounts.lastReset);
    throw new Error(`Rate limit exceeded. Please try again in ${Math.ceil(timeToWait / 1000)} seconds.`);
  }
  
  // Increment global counter
  globalRequestCounts.count++;
  
  // Log rate limit status
  console.log(`Rate limit status: ${globalRequestCounts.count}/${MAX_REQUESTS_PER_WINDOW} requests in current window`);
};

// Retry mechanism with exponential backoff and jitter
const retryWithBackoff = async (fn, maxAttempts = RETRY_ATTEMPTS) => {
  let attempt = 0;
  let lastError;
  
  while (attempt < maxAttempts) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      attempt++;
      
      console.error(`Attempt ${attempt}/${maxAttempts} failed:`, error.message);
      
        // Add jitter to prevent thundering herd
        const jitter = Math.random() * 500;
        const delay = (RETRY_DELAY * Math.pow(1.5, attempt - 1)) + jitter;
      console.log(`Error occurred, retrying in ${Math.round(delay)}ms (attempt ${attempt}/${maxAttempts})`);
        await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  console.error(`All ${maxAttempts} attempts failed. Last error:`, lastError);
  throw lastError;
};

// Enhanced NLP patterns for better query understanding
const QUERY_PATTERNS = {
  orderStatus: {
    patterns: [
      /(?:what'?s|what is|check|tell me|show me|get|find|look up|status of|tracking for|track|where is).*?(?:order|ord)[-]?\d+/i,
      /(?:order|ord)[-]?\d+/i,
      /status.*?(?:order|ord)[-]?\d+/i,
      /track.*?(?:order|ord)[-]?\d+/i
    ],
    category: 'order_status'
  },
  myOrders: {
    patterns: [
      /(?:show|list|get|find|what are|tell me about).*?(?:my orders|all my orders)/i,
      /my order history/i,
      /(?:orders|order history)(?:\s|$)/i
    ],
    category: 'my_orders'
  },
  productRecommendation: {
    patterns: [
      /(?:recommend|suggest|what should i buy|what would you recommend|what do you recommend|what would you suggest|what do you suggest).*?(?:for|to|as|when|if|that|which|who|where|why|how)/i,
      /(?:can you recommend|can you suggest|could you recommend|could you suggest).*?(?:for|to|as|when|if|that|which|who|where|why|how)/i,
      /(?:looking for|searching for|need help finding|need help choosing|need help selecting|need help picking|need help deciding).*?(?:for|to|as|when|if|that|which|who|where|why|how)/i,
      /(?:best|top|popular|trending|featured|recommended|suggested).*?(?:products|items|gifts|presents|ideas)/i,
      /(?:what|which).*?(?:products|items|gifts|presents|ideas).*?(?:for|to|as|when|if|that|which|who|where|why|how)/i
    ],
    category: 'product_recommendation'
  },
  productInfo: {
    patterns: [
      /(?:what|tell me|show|get|find|look up|info|details|about).*?(?:product|item).*?(?:price|cost|stock|available|in stock)/i,
      /(?:how much|price|cost).*?(?:product|item)/i,
      /(?:is|are).*?(?:product|item).*?(?:available|in stock)/i,
      /what.*?(?:products|items).*?(?:available|in stock|do you have)/i,
      /show.*?(?:products|items)/i,
      /list.*?(?:products|items)/i,
      /what.*?(?:products|items).*?(?:do you have|are there)/i,
      /what.*?(?:products|items).*?(?:available)/i,
      /what.*?(?:products|items)/i,
      /tell me about.*?(?:product|item)/i,
      /about.*?(?:product|item)/i,
      /tell me about.*?([\w-]+)/i,
      /about.*?([\w-]+)/i,
      /(?:what'?s|what is|how much is).*?(?:the price of|price of|cost of)\s+([\w-]+)/i,
      /(?:price|cost).*?([\w-]+)/i
    ],
    category: 'product'
  },
  returnPolicy: {
    patterns: [
      /(?:what|tell me|show|get|find|look up|info|details|about).*?(?:return|refund|exchange)/i,
      /(?:how|what).*?(?:return|refund|exchange)/i,
      /(?:return|refund|exchange).*?(?:policy|process|procedure)/i,
      /(?:can i|how can i).*?(?:return|refund|exchange)/i,
      /(?:what'?s|what is).*?(?:your return policy|return policy)/i
    ],
    category: 'return'
  },
  shipping: {
    patterns: [
      /(?:what|tell me|show|get|find|look up|info|details|about).*?(?:shipping|delivery|ship)/i,
      /(?:how long|when).*?(?:ship|deliver|arrive)/i,
      /(?:shipping|delivery).*?(?:cost|price|fee)/i,
      /(?:free shipping|shipping cost|delivery cost)/i,
      /(?:how much|what'?s the cost).*?(?:for shipping|to ship)/i,
      /(?:do you|can you).*?(?:ship|deliver).*?(?:internationally|overseas|abroad)/i,
      /(?:international|overseas|abroad).*?(?:shipping|delivery)/i
    ],
    category: 'shipping'
  },
  stockInfo: {
    patterns: [
      /(?:how many|quantity|stock|available|in stock).*?(?:units|items|products|left|remaining)/i,
      /(?:is|are).*?(?:product|item).*?(?:in stock|available)/i,
      /(?:stock|availability|quantity).*?(?:status|check|lookup)/i,
      /(?:what|how much).*?(?:stock|quantity|available).*?(?:left|remaining)/i,
      /(?:check|verify|look up).*?(?:stock|availability)/i,
      /(?:is|are).*?(?:there).*?(?:any|enough).*?(?:left|remaining|available)/i,
      /(?:stock|inventory).*?(?:status|level|check)/i,
      /(?:how many).*?(?:can|do).*?(?:i|you).*?(?:have|get|order)/i,
      /(?:stock|availability).*?(?:of|for).*?([\w-]+)/i,
      /(?:how many).*?([\w-]+).*?(?:in stock|available)/i,
      /(?:is|are).*?([\w-]+).*?(?:in stock|available)/i,
      /(?:what'?s|what is).*?(?:the stock status of|stock status of|stock of)\s+([\w-]+)/i,
      /(?:stock status|availability).*?(?:of|for)\s+([\w-]+)/i,
      /(?:what'?s|what is).*?(?:the stock status of)\s+([\w-]+)/i,
      /(?:stock status of)\s+([\w-]+)/i
    ],
    category: 'stock'
  },
  policy: {
    patterns: [
      /(?:what|tell me|show|get|find|look up|info|details|about).*?(?:policy|policies|rules|terms|conditions)/i,
      /(?:what|which).*?(?:policy|policies|rules|terms|conditions).*?(?:do you have|are there)/i,
      /(?:policy|policies|rules|terms|conditions).*?(?:information|details|about)/i,
      /(?:what|which).*?(?:policy|policies|rules|terms|conditions)/i,
      /(?:tell me|what|show|get|info|details|about).*?(?:return|refund|shipping|privacy|warranty).*?(?:policy|policies)/i
    ],
    category: 'policy'
  },
  account: {
    patterns: [
      /(?:how|what).*?(?:create|make|start|set up|register).*?(?:account|profile)/i,
      /(?:can i|how can i).*?(?:create|make|start|set up|register).*?(?:account|profile)/i,
      /(?:what|how).*?(?:login|sign in|log in)/i,
      /(?:forgot|lost|reset).*?(?:password|login|account)/i,
      /(?:change|update|modify).*?(?:password|email|profile|account)/i,
      /(?:delete|remove|close).*?(?:account|profile)/i
    ],
    category: 'account'
  },
  payment: {
    patterns: [
      /(?:what|which).*?(?:payment|pay).*?(?:methods|options|ways)/i,
      /(?:how|what).*?(?:pay|payment)/i,
      /(?:credit card|debit card|paypal|cash|check)/i,
      /(?:secure|safe|protected).*?(?:payment|transaction)/i,
      /(?:payment|transaction).*?(?:failed|error|problem)/i
    ],
    category: 'payment'
  },
  technical: {
    patterns: [
      /(?:how|what).*?(?:install|setup|configure|connect|pair|sync)/i,
      /(?:troubleshoot|fix|repair|solve|resolve).*?(?:problem|issue|error)/i,
      /(?:not working|broken|malfunction|error|issue)/i,
      /(?:compatible|compatibility|work with)/i,
      /(?:update|upgrade|firmware|software)/i
    ],
    category: 'technical'
  },
  general: {
    patterns: [
      /(?:what|who|where|when|why|how).*?(?:company|business|store|shop)/i,
      /(?:contact|reach|get in touch|support|help)/i,
      /(?:hours|open|closed|business hours)/i,
      /(?:location|address|store location)/i,
      /(?:about|tell me about).*?(?:company|business|store)/i
    ],
    category: 'general'
  },
  product_availability: {
    clothing: "I apologize, but we don't sell clothing items like dresses, shirts, or pants. Our store specializes in tech products and smart home devices. Here are some of our available products:\n\n- Smartphone X (₹82,270.00): High-end smartphone with advanced camera and long battery life\n- Wireless Headphones (₹20,567.00): Premium noise-canceling wireless headphones with 30-hour battery life\n- Smart Watch (₹28,793.00): Track your fitness, receive notifications, and more with this smart watch\n- Laptop Pro (₹1,23,404.00): Powerful laptop for professionals with high-performance specs\n\nWould you like more details about any of these products?",
    default: "Here are the product categories we currently offer:\n\n- Electronics: Smartphones, laptops, tablets\n- Audio: Headphones, speakers, microphones\n- Wearables: Smart watches, fitness trackers\n- Computers: Laptops, desktops, accessories\n- Gaming: Consoles, controllers, accessories\n\nWould you like to see specific products in any of these categories?"
  }
};

const RESPONSE_TEMPLATES = {
  order_status: {
    found: "Order #{orderNumber} is currently {status}. {additionalInfo}",
    not_found: "I couldn't find order #{orderNumber}. Please check the order number and try again.",
    error: "I'm having trouble checking the order status right now. Please try again in a few moments."
  },
  my_orders: {
    found: "Here are your orders:\n{orders}\n\nTo check the status of a specific order, just ask me about the order number.",
    not_found: "You don't have any orders yet. Would you like to browse our products?",
    error: "I'm having trouble retrieving your orders right now. Please try again in a few moments."
  },
  product_recommendation: {
    success: "Based on your request, here are some recommendations:\n{recommendations}\n\nWould you like more specific recommendations or information about any of these products?",
    error: "I'm having trouble generating recommendations right now. Please try again in a few moments.",
    unavailable: "I apologize, but we don't currently carry {category} products. However, I can recommend some alternative products from our catalog. Would you like to see some options?"
  },
  product: {
    found: "Here's what I found about {product}:\n{details}\n\nWould you like to know anything specific about this product?",
    not_found: "I couldn't find information about {product}. Would you like to see our available products?",
    error: "I'm having trouble retrieving product information right now. Please try again in a few moments."
  },
  return: {
    success: "Our return policy includes:\n{policy}\n\nWould you like to know more about any specific aspect of our return policy?",
    error: "I'm having trouble retrieving our return policy right now. Please try again in a few moments."
  },
  shipping: {
    success: `Here's our shipping information:\n- Standard shipping: 3-5 business days\n- Express shipping: 1-2 business days\n- Free shipping on orders over ${formatCurrency(50)}\n- International shipping available to select countries\n- Tracking number provided via email once order is shipped\n\nWould you like to know more about shipping to your specific country?`,
    international: "Yes, we offer international shipping to select countries! Here are the details:\n- International shipping rates vary by country and order weight\n- Delivery times typically range from 5-14 business days\n- Customs duties and taxes may apply\n- Tracking number provided via email\n\nWould you like to know if we ship to your specific country?",
    error: "I'm having trouble retrieving our shipping information right now. Please try again in a few moments."
  },
  stock: {
    found: "The current stock status for {product} is: {status}\n{additionalInfo}",
    not_found: "I couldn't find stock information for {product}. Would you like to see our available products?",
    error: "I'm having trouble checking stock information right now. Please try again in a few moments."
  },
  policy: {
    success: "Here's our {policyType} policy:\n{policy}\n\nWould you like to know more about any specific aspect of this policy?",
    error: "I'm having trouble retrieving our policy information right now. Please try again in a few moments."
  },
  account: {
    create: "To create an account:\n1. Click the 'Sign Up' button\n2. Fill in your details\n3. Verify your email\n\nWould you like more specific instructions?",
    login: "To log in:\n1. Click the 'Login' button\n2. Enter your email and password\n3. Click 'Sign In'\n\nNeed help with your password?",
    password_reset: "To reset your password:\n1. Click 'Forgot Password'\n2. Enter your email\n3. Follow the instructions in the email\n\nWould you like me to guide you through this process?",
    update: "To update your account:\n1. Log in to your account\n2. Go to 'Account Settings'\n3. Make your changes\n4. Click 'Save'\n\nWhat would you like to update?",
    delete: "To delete your account:\n1. Log in to your account\n2. Go to 'Account Settings'\n3. Scroll to 'Delete Account'\n4. Follow the confirmation steps\n\nPlease note this action cannot be undone.",
    error: "I'm having trouble with account-related information right now. Please try again in a few moments."
  },
  payment: {
    methods: "We accept the following payment methods:\n{methods}\n\nWould you like more information about any specific payment method?",
    security: "Our payment system is secure and encrypted. We use {security} to protect your information.\n\nWould you like to know more about our security measures?",
    error: "I'm having trouble retrieving payment information right now. Please try again in a few moments."
  },
  technical: {
    setup: "To set up your {product}:\n{instructions}\n\nWould you like more detailed instructions for any step?",
    troubleshoot: "Let's troubleshoot your {issue}:\n{steps}\n\nWould you like me to guide you through these steps?",
    compatibility: "The {product} is compatible with:\n{compatible}\n\nWould you like more specific compatibility information?",
    error: "I'm having trouble with technical information right now. Please try again in a few moments."
  },
  general: {
    company: "Our company information:\n{info}\n\nWould you like to know more about any specific aspect?",
    contact: "You can reach us through:\n{contact}\n\nWhat's the best way to contact you?",
    hours: "Our business hours are:\n{hours}\n\nWould you like to know about special holiday hours?",
    location: "We are located at:\n{location}\n\nWould you like directions or parking information?",
    error: "I'm having trouble retrieving general information right now. Please try again in a few moments."
  },
  greeting: {
    morning: "Good morning! Welcome to our tech store. How can I assist you today?",
    afternoon: "Good afternoon! Welcome to our tech store. How can I assist you today?",
    evening: "Good evening! Welcome to our tech store. How can I assist you today?",
    night: "Hello! Welcome to our tech store. How can I assist you today?",
    default: "Hello! Welcome to our tech store. How can I assist you today?"
  },
  thank_you: {
    default: "You're welcome! Is there anything else I can help you with?",
    order: "You're welcome! Your order is being processed. You'll receive a confirmation email shortly.",
    return: "You're welcome! Let me know if you need any help with the return process.",
    product: "You're welcome! Feel free to ask if you need more information about our products."
  },
  default: "I'm not sure I understand. Could you please rephrase your question? You can ask me about:\n- Products and recommendations\n- Order status and history\n- Shipping and returns\n- Account management\n- Payment methods\n- Technical support\n- Company information",
  product_availability: {
    clothing: "I apologize, but we don't sell clothing items like dresses, shirts, or pants. Our store specializes in tech products and smart home devices. Here are some of our available products:\n\n- Smartphone X (₹82,270.00): High-end smartphone with advanced camera and long battery life\n- Wireless Headphones (₹20,567.00): Premium noise-canceling wireless headphones with 30-hour battery life\n- Smart Watch (₹28,793.00): Track your fitness, receive notifications, and more with this smart watch\n- Laptop Pro (₹1,23,404.00): Powerful laptop for professionals with high-performance specs\n\nWould you like more details about any of these products?",
    default: "Here are the product categories we currently offer:\n\n- Electronics: Smartphones, laptops, tablets\n- Audio: Headphones, speakers, microphones\n- Wearables: Smart watches, fitness trackers\n- Computers: Laptops, desktops, accessories\n- Gaming: Consoles, controllers, accessories\n\nWould you like to see specific products in any of these categories?"
  }
};

// Helper function to determine query type using enhanced NLP
const determineQueryType = async (message) => {
  try {
    // First, check for order status queries
    const orderStatusPattern = /(?:what'?s|what is|check|tell me|show me|get|find|look up|status of|tracking for|track|where is).*?(?:order|ord)[-]?\d+/i;
    const orderNumberMatch = message.match(/(?:order|ord)[-]?\d+/i);
    
    if (orderStatusPattern.test(message) && orderNumberMatch) {
      const orderNumber = orderNumberMatch[0].toUpperCase();
      return {
        type: 'order_status',
        category: 'order_status',
        orderNumber: orderNumber,
        useAI: false
      };
    }

    // Check for order history queries
    const orderHistoryPattern = /(?:show|list|get|find|what are|tell me about|my).*?(?:orders|order history)/i;
    if (orderHistoryPattern.test(message)) {
      return {
        type: 'my_orders',
        category: 'my_orders',
        useAI: false
      };
    }

    // Check for product availability queries
    const availabilityPatterns = [
      /(?:what|which|show|list|get|find|tell me about).*?(?:products|items).*?(?:available|do you have|do you sell|do you carry|do you stock)/i,
      /(?:what|which).*?(?:products|items).*?(?:do you have|are there)/i,
      /(?:what|which).*?(?:products|items).*?(?:available)/i,
      /(?:what|which).*?(?:products|items)/i,
      /(?:show|list).*?(?:products|items)/i,
      /(?:do you have|do you sell|do you carry|do you stock).*?(?:any|some).*?(?:products|items)/i,
      /(?:what products|what items)/i,
      /(?:show me|list me).*?(?:products|items)/i
    ];

    for (const pattern of availabilityPatterns) {
      if (pattern.test(message.toLowerCase())) {
        return {
          type: 'product_availability',
          category: 'product_availability',
          useAI: false
        };
      }
    }

    // Check for product queries
    const productPattern = /(?:what|tell me|show|get|find|look up|info|details|about).*?(?:product|item).*?(?:price|cost|stock|available|in stock)/i;
    const productNameMatch = message.match(/(?:product|item)\s+([\w-]+)/i);
    
    if (productPattern.test(message) && productNameMatch) {
      const productName = productNameMatch[1];
      return {
        type: 'product',
        category: 'product',
        productName: productName,
        useAI: false
      };
    }

    // Check for stock queries
    const stockPattern = /(?:how many|quantity|stock|available|in stock).*?(?:units|items|products|left|remaining)/i;
    const stockProductMatch = message.match(/(?:stock|availability).*?(?:of|for)\s+([\w-]+)/i);
    
    if (stockPattern.test(message) && stockProductMatch) {
      const productName = stockProductMatch[1];
      return {
        type: 'stock',
        category: 'stock',
        productName: productName,
        useAI: false
      };
    }

    // Check for policy queries
    const policyPattern = /(?:what|tell me|show|get|find|look up|info|details|about).*?(?:policy|policies|rules|terms|conditions)/i;
    const policyTypeMatch = message.match(/(?:return|refund|shipping|privacy|warranty).*?(?:policy|policies)/i);
    
    if (policyPattern.test(message)) {
      const policyType = policyTypeMatch ? policyTypeMatch[0].toLowerCase().split(' ')[0] : 'general';
      console.log('Policy type extracted:', policyType);
      return {
        type: 'policy',
        category: 'policy',
        policyType: policyType,
        useAI: false
      };
    }

    // Check for simple greetings
    const greetingPatterns = [
      /^hi\b/i,
      /^hello\b/i,
      /^hey\b/i,
      /^good\s+(morning|afternoon|evening|night)\b/i,
      /^greetings\b/i,
      /^howdy\b/i,
      /^hi there\b/i,
      /^hello there\b/i
    ];
    
    for (const pattern of greetingPatterns) {
      if (pattern.test(message.toLowerCase())) {
        return { type: 'greeting', category: 'greeting', useAI: false };
      }
    }
    
    // If no specific type is matched, use AI for general queries
    return { type: 'general', category: 'default', useAI: true };
  } catch (error) {
    console.error('Error in query classification:', error);
    return { type: 'general', category: 'default', useAI: true };
  }
};

// Helper function to format order details
const formatOrderDetails = (order) => {
  // Format items with the correct structure
  const items = order.items.map(item => {
    // Get product name from productId if available
    const productName = item.name || item.productId || 'Unnamed Product';
    return `- ${productName} (Qty: ${item.quantity}, Price: ${formatCurrency(item.price)})`;
  }).join('\n');
  
  // Format shipping address with fallbacks
  const shippingAddress = order.shippingAddress ? 
    `${order.shippingAddress.street || 'No street'}\n${order.shippingAddress.city || 'No city'}, ${order.shippingAddress.state || 'No state'} ${order.shippingAddress.zipCode || 'No zip'}\n${order.shippingAddress.country || 'No country'}` :
    'No shipping address available';
  
  // Format dates using the stored date format
  const orderDate = order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A';
  const estimatedShipping = order.updatedAt ? new Date(order.updatedAt).toLocaleDateString() : 'N/A';
  
  return {
    orderNumber: order.orderNumber || 'Unknown',
    status: (order.status || 'unknown').toUpperCase(),
    orderDate: orderDate,
    estimatedShipping: estimatedShipping,
    totalAmount: formatCurrency(order.totalAmount || 0),
    items: items || 'No items found',
    shippingAddress: shippingAddress
  };
};

// Helper function to format response using template
const formatResponse = (template, context) => {
  let response = template;
  for (const [key, value] of Object.entries(context)) {
    response = response.replace(new RegExp(`{${key}}`, 'g'), value);
  }
  return response;
};

// Helper function to get a contextual response
const getContextualResponse = (category, subcategory = 'default', context = {}) => {
  const templates = RESPONSE_TEMPLATES[category];
  if (!templates) {
    return RESPONSE_TEMPLATES.default;
  }

  const template = templates[subcategory] || templates.default;
  if (!template) {
    return RESPONSE_TEMPLATES.default;
  }

  return formatResponse(template, context);
};

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY.trim(), {
  apiVersion: 'v1'
});

// Helper function to format product info for the AI
const formatProductInfo = (products) => {
  if (!products || products.length === 0) return '';
  
  return products.map(p => 
    `Product: ${p.name}\nSKU: ${p.sku}\nPrice: ${formatCurrency(p.price)}\nCategory: ${p.category}\nIn Stock: ${p.inStock ? 'Yes' : 'No'}\nStock Quantity: ${p.stockQuantity}\nDescription: ${p.description}`
  ).join('\n\n');
};

// Update the listUserOrders function
const listUserOrders = async (userId) => {
  try {
    console.log('Listing orders for user:', userId);
    
    // Find all orders for this user
    const orders = await Order.find({ userId }).sort({ createdAt: -1 });
    console.log(`Found ${orders.length} orders for user ${userId}`);
    
    if (orders.length === 0) {
      return "You don't have any orders yet. Would you like to browse our products?";
    }
    
    // Format only the order numbers in a simple list
    const orderList = orders.map(order => order.orderNumber).join('\n');
    
    // Create a simple response string with just the order numbers
    const response = `Here are your order numbers:\n\n${orderList}\n\nTo check details of a specific order, just ask about the order number (e.g., "What's the status of order ORD-001?").`;
    
    console.log('Order list response:', response);
    return response;
  } catch (error) {
    console.error('Error listing user orders:', error);
    return "Sorry, I couldn't retrieve your orders at this time. Please try again later.";
  }
};

// Add this function at the top of the file, after the imports
const checkDatabaseConnection = async () => {
  try {
    // Check if we can connect to the database
    const dbStatus = await mongoose.connection.readyState;
    console.log('Database connection status:', dbStatus);
    
    // Check if there are any products in the collection
    const productCount = await Product.countDocuments();
    console.log('Total products in database:', productCount);
    
    // Get a sample product if available
    if (productCount > 0) {
      const sampleProduct = await Product.findOne();
      console.log('Sample product:', sampleProduct);
    }
    
    return {
      connected: dbStatus === 1,
      productCount
    };
  } catch (error) {
    console.error('Error checking database connection:', error);
    return {
      connected: false,
      error: error.message
    };
  }
};

// Add this function after the checkDatabaseConnection function
const testProductQuery = async () => {
  try {
    console.log('Testing product query...');
    
    // Try to find all products
    const products = await Product.find({});
    console.log(`Found ${products.length} products`);
    
    // Log each product
    products.forEach((product, index) => {
      console.log(`Product ${index + 1}:`, {
        name: product.name,
        sku: product.sku,
        price: product.price,
        category: product.category,
        inStock: product.inStock,
        stockQuantity: product.stockQuantity
      });
    });
    
    return products;
  } catch (error) {
    console.error('Error testing product query:', error);
    return [];
  }
};

// Helper function to save a message to a chat
const saveMessageToChat = async (userId, userMessage, botResponse) => {
  try {
    // Find the most recent chat for this user
    let chat = await Chat.findOne({ user: userId })
      .sort({ updatedAt: -1 });
    
    // If no chat exists, create a new one
      if (!chat) {
        chat = new Chat({
          user: userId,
        title: 'New Conversation',
        messages: []
      });
    }

    // Add user message
    chat.messages.push({
      type: 'user',
      message: userMessage,
      userId: userId,
      timestamp: new Date()
    });

    // Add bot response
    chat.messages.push({
      type: 'bot',
      message: botResponse,
      userId: userId,
      timestamp: new Date()
    });
    
    // Update chat timestamp
    chat.updatedAt = new Date();
    
    // Save the chat
    await chat.save();
    console.log('Chat saved successfully with both messages');
    
    return chat;
  } catch (error) {
    console.error('Error saving message to chat:', error);
    throw error;
  }
};

// Helper function to safely emit messages
const safeEmit = (socketId, event, data) => {
  try {
    if (global.io) {
      global.io.to(socketId).emit(event, data);
            } else {
      console.warn('Socket.io not initialized, message not sent');
    }
  } catch (error) {
    console.warn('Failed to emit message:', error.message);
  }
};

const PRODUCT_CATALOG = {
  home_decor: [
    {
      name: "Smart LED Strip Lights",
      description: "16 million colors, voice control, app control, perfect for ambient lighting",
      price: 49.99,
      category: "Home Decor"
    },
    {
      name: "Smart Picture Frame",
      description: "Digital frame that displays your photos with smart features",
      price: 129.99,
      category: "Home Decor"
    },
    {
      name: "Smart Plant Pot",
      description: "Self-watering pot with LED grow lights and plant monitoring",
      price: 79.99,
      category: "Home Decor"
    }
  ],
  tech: [
    {
      name: "Smartphone X",
      description: "Latest model with advanced features, high-resolution camera, and long battery life",
      price: 899.99,
      category: "Electronics"
    },
    {
      name: "Wireless Headphones",
      description: "Premium noise-cancelling headphones with 30-hour battery life",
      price: 249.99,
      category: "Electronics"
    },
    {
      name: "Smart Watch",
      description: "Fitness and health tracking with heart rate monitor and GPS",
      price: 299.99,
      category: "Electronics"
    }
  ]
};

// Define the sendMessage function
const sendMessage = async (req, res) => {
  try {
    const { message, chatId } = req.body;
    const userId = req.user.id;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Rate limit check
    try {
      await checkRateLimit(userId);
    } catch (error) {
      return res.status(429).json({ error: error.message });
    }

    // Create or get chat
    let chat;
    if (chatId) {
      chat = await Chat.findOne({ _id: chatId, userId });
      if (!chat) {
        return res.status(404).json({ error: 'Chat not found' });
      }
    } else {
      chat = new Chat({ 
        userId,
        title: 'New Conversation',
        messages: []
      });
      await chat.save();
    }

    // Save user message to chat
    const userMessage = {
      type: 'user',
      message: message,
      userId: userId,
      timestamp: new Date()
    };
    chat.messages.push(userMessage);

    // Determine query type and get response
    const queryType = await determineQueryType(message);
    console.log('Query type:', queryType);
    let response;

    if (queryType.type === 'order_status' && queryType.orderNumber) {
      response = await handleOrderStatus(queryType.orderNumber);
    } else if (queryType.type === 'my_orders') {
      response = await listUserOrders(userId);
    } else if (queryType.type === 'product_availability') {
      response = await handleProductAvailability();
    } else if (queryType.type === 'product' && queryType.productName) {
      response = await handleProductQuery(queryType.productName);
    } else if (queryType.type === 'stock' && queryType.productName) {
      response = await handleStockQuery(queryType.productName);
    } else if (queryType.type === 'policy') {
      console.log('Handling policy query with type:', queryType.policyType);
      response = await handlePolicyQuery(queryType.policyType);
    } else {
      // Get chat history for context
      const history = chat.messages.map(msg => ({
        role: msg.type === 'user' ? 'user' : 'model',
        parts: [{ text: msg.message }]
      }));

      // Generate response using Gemini
      const generateResponse = async () => {
        const model = genAI.getGenerativeModel({ 
          model: "gemini-2.0-flash",
          generationConfig: {
            maxOutputTokens: 1000,
            temperature: 0.7,
          }
        });
        const geminiChat = model.startChat({
          history: history.slice(-10) // Keep last 10 messages for context
        });

        const result = await geminiChat.sendMessage(message);
        return result.response.text();
      };

      response = await retryWithBackoff(generateResponse);
    }

    // Save bot response to chat
    const botMessage = {
      type: 'bot',
      message: response,
      userId: userId,
      timestamp: new Date()
    };
    chat.messages.push(botMessage);

    // Update chat
    chat.lastMessage = response;
    chat.updatedAt = new Date();
    await chat.save();

    // Send response
    res.json({
      chat: {
        _id: chat._id,
        messages: chat.messages,
        updatedAt: chat.updatedAt
      },
      message: response
    });

  } catch (error) {
    console.error('Error in sendMessage:', error);
    res.status(500).json({ error: 'Failed to process message' });
  }
};

// Get all chats for a user
const getChats = async (req, res) => {
  try {
    const userId = req.user.id;
    const chats = await Chat.find({ userId }).sort({ updatedAt: -1 });
    return res.json(chats);
  } catch (error) {
    console.error('Error getting chats:', error);
    return res.status(500).json({ message: 'An error occurred while getting chats', error: error.message });
  }
};

// Get a specific chat by ID
const getChatById = async (req, res) => {
  try {
    const userId = req.user.id;
    const chatId = req.params.chatId;
    
    if (!mongoose.Types.ObjectId.isValid(chatId)) {
      return res.status(400).json({ message: 'Invalid chat ID' });
    }
    
    const chat = await Chat.findOne({ _id: chatId, userId });
    
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    
    return res.json(chat);
  } catch (error) {
    console.error('Error getting chat by ID:', error);
    return res.status(500).json({ message: 'An error occurred while getting the chat', error: error.message });
  }
};

// Delete a chat
const deleteChat = async (req, res) => {
  try {
    const userId = req.user.id;
    const chatId = req.params.chatId;
    
    if (!mongoose.Types.ObjectId.isValid(chatId)) {
      return res.status(400).json({ message: 'Invalid chat ID' });
    }
    
    const chat = await Chat.findOneAndDelete({ _id: chatId, userId });
    
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    
    return res.json({ message: 'Chat deleted successfully' });
  } catch (error) {
    console.error('Error deleting chat:', error);
    return res.status(500).json({ message: 'An error occurred while deleting the chat', error: error.message });
  }
};

// Export all functions
module.exports = {
  sendMessage,
  getChats,
  getChatById,
  deleteChat
};

const handleOrderStatus = async (orderNumber) => {
  try {
    console.log('Checking order status for:', orderNumber);
    
    // Find the order in the database
    const order = await Order.findOne({ orderNumber: orderNumber.toUpperCase() });
    
    if (!order) {
      return "I couldn't find order " + orderNumber + ". Please check the order number and try again.";
    }
    
    // Format the order details
    const formattedOrder = {
      orderNumber: order.orderNumber,
      status: order.status || 'Processing',
      orderDate: order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A',
      estimatedShipping: order.estimatedShippingDate ? new Date(order.estimatedShippingDate).toLocaleDateString() : 'N/A',
      totalAmount: formatCurrency(order.totalAmount || 0),
      items: order.items.map(item => `- ${item.name} (Qty: ${item.quantity}, Price: ${formatCurrency(item.price)})`).join('\n'),
      shippingAddress: order.shippingAddress ? 
        `${order.shippingAddress.street}\n${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}\n${order.shippingAddress.country}` : 
        'No shipping address available'
    };
    
    // Create a detailed response
    const response = `Order ${formattedOrder.orderNumber} Details:\n\n` +
      `Status: ${formattedOrder.status}\n` +
      `Order Date: ${formattedOrder.orderDate}\n` +
      `Estimated Shipping: ${formattedOrder.estimatedShipping}\n` +
      `Total Amount: ${formattedOrder.totalAmount}\n\n` +
      `Items:\n${formattedOrder.items}\n\n` +
      `Shipping Address:\n${formattedOrder.shippingAddress}\n\n` +
      `Would you like to know anything specific about this order?`;
    
    return response;
  } catch (error) {
    console.error('Error checking order status:', error);
    return "I'm having trouble checking the order status right now. Please try again in a few moments.";
  }
};

const handleProductQuery = async (productName) => {
  try {
    console.log('Checking product info for:', productName);
    
    // Find the product in the database
    const product = await Product.findOne({ 
      name: { $regex: new RegExp(productName, 'i') }
    });
    
    if (!product) {
      return "I couldn't find information about " + productName + ". Please check the product name and try again.";
    }
    
    // Format the product details
    const formattedProduct = {
      name: product.name,
      price: formatCurrency(product.price),
      category: product.category,
      inStock: product.inStock ? 'Yes' : 'No',
      stockQuantity: product.stockQuantity || 0,
      description: product.description || 'No description available'
    };
    
    // Create a detailed response
    const response = `Product: ${formattedProduct.name}\n\n` +
      `Price: ${formattedProduct.price}\n` +
      `Category: ${formattedProduct.category}\n` +
      `In Stock: ${formattedProduct.inStock}\n` +
      `Available Quantity: ${formattedProduct.stockQuantity}\n` +
      `Description: ${formattedProduct.description}\n\n` +
      `Would you like to know anything specific about this product?`;
    
    return response;
  } catch (error) {
    console.error('Error checking product info:', error);
    return "I'm having trouble retrieving product information right now. Please try again in a few moments.";
  }
};

const handleStockQuery = async (productName) => {
  try {
    console.log('Checking stock for:', productName);
    
    // Find the product in the database
    const product = await Product.findOne({ 
      name: { $regex: new RegExp(productName, 'i') }
    });
    
    if (!product) {
      return "I couldn't find information about " + productName + ". Please check the product name and try again.";
    }
    
    // Format the stock information
    const stockInfo = {
      name: product.name,
      inStock: product.inStock ? 'Yes' : 'No',
      quantity: product.stockQuantity || 0,
      status: product.inStock ? 
        `We have ${product.stockQuantity} units in stock` : 
        'This product is currently out of stock'
    };
    
    // Create a detailed response
    const response = `Stock Status for ${stockInfo.name}:\n\n` +
      `In Stock: ${stockInfo.inStock}\n` +
      `Available Quantity: ${stockInfo.quantity}\n` +
      `Status: ${stockInfo.status}\n\n` +
      `Would you like to know anything else about this product?`;
    
    return response;
  } catch (error) {
    console.error('Error checking stock:', error);
    return "I'm having trouble checking stock information right now. Please try again in a few moments.";
  }
};

const handleProductAvailability = async () => {
  try {
    console.log('Listing available products...');
    
    // Find all products in the database
    const products = await Product.find({ inStock: true }).sort({ category: 1, name: 1 });
    console.log('Found products:', products);
    
    if (products.length === 0) {
      console.log('No products found in database');
      return "I'm sorry, but we don't have any products in stock at the moment. Please check back later.";
    }
    
    // Group products by category
    const productsByCategory = products.reduce((acc, product) => {
      if (!acc[product.category]) {
        acc[product.category] = [];
      }
      acc[product.category].push(product);
      return acc;
    }, {});
    
    // Format the response
    let response = "Here are our available products by category:\n\n";
    
    for (const [category, categoryProducts] of Object.entries(productsByCategory)) {
      response += `${category}:\n`;
      categoryProducts.forEach(product => {
        response += `- ${product.name} (${formatCurrency(product.price)})\n`;
        response += `  Stock: ${product.stockQuantity} units available\n`;
        if (product.description) {
          response += `  ${product.description}\n`;
        }
      });
      response += "\n";
    }
    
    response += "Would you like more details about any specific product? Just ask about the product name!";
    
    return response;
  } catch (error) {
    console.error('Error listing available products:', error);
    return "I'm having trouble retrieving our product catalog right now. Please try again in a few moments.";
  }
};

const handlePolicyQuery = async (policyType) => {
  try {
    console.log(`Checking ${policyType} policy...`);
    
    // Query the database for the policy
    const policy = await Policy.findOne({ type: policyType });
    console.log('Found policy:', policy);
    
    if (!policy) {
      return `I'm sorry, but I couldn't find our ${policyType} policy information. Please try again later.`;
    }
    
    // Format the response
    let response = `${policy.title}:\n\n`;
    response += policy.content;
    
    return response;
  } catch (error) {
    console.error('Error retrieving policy:', error);
    return "I'm having trouble retrieving the policy information right now. Please try again in a few moments.";
  }
};

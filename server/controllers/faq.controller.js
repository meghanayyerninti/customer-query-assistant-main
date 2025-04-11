const FAQ = require('../models/faq.model');
const OpenAI = require('openai');

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Get all FAQs
const getAllFAQs = async (req, res) => {
  try {
    const faqs = await FAQ.find();
    res.status(200).json({ faqs });
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to fetch FAQs', 
      error: error.message 
    });
  }
};

// Get FAQ by ID
const getFAQById = async (req, res) => {
  try {
    const { faqId } = req.params;
    const faq = await FAQ.findById(faqId);
    
    if (!faq) {
      return res.status(404).json({ message: 'FAQ not found' });
    }
    
    res.status(200).json({ faq });
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to fetch FAQ', 
      error: error.message 
    });
  }
};

// Create new FAQ
const createFAQ = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }

    const { question, answer, category, keywords } = req.body;
    
    const faq = new FAQ({
      question,
      answer,
      category,
      keywords
    });
    
    await faq.save();
    
    res.status(201).json({
      message: 'FAQ created successfully',
      faq
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to create FAQ', 
      error: error.message 
    });
  }
};

// Update FAQ
const updateFAQ = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }

    const { faqId } = req.params;
    const updates = req.body;
    
    // Remove any attempt to update immutable fields
    delete updates._id;
    delete updates.createdAt;
    
    // Update with validation
    const faq = await FAQ.findByIdAndUpdate(
      faqId,
      updates,
      { new: true, runValidators: true }
    );
    
    if (!faq) {
      return res.status(404).json({ message: 'FAQ not found' });
    }
    
    res.status(200).json({
      message: 'FAQ updated successfully',
      faq
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to update FAQ', 
      error: error.message 
    });
  }
};

// Delete FAQ
const deleteFAQ = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }

    const { faqId } = req.params;
    
    const faq = await FAQ.findByIdAndDelete(faqId);
    
    if (!faq) {
      return res.status(404).json({ message: 'FAQ not found' });
    }
    
    res.status(200).json({ message: 'FAQ deleted successfully' });
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to delete FAQ', 
      error: error.message 
    });
  }
};

// AI-enhanced FAQ search
const searchFAQs = async (req, res) => {
  try {
    const { query } = req.body;
    
    // First, try to find exact matches in the database
    const faqs = await FAQ.find({
      $or: [
        { question: { $regex: query, $options: 'i' } },
        { answer: { $regex: query, $options: 'i' } },
        { keywords: { $in: [new RegExp(query, 'i')] } }
      ]
    });
    
    // If we have exact matches, return them
    if (faqs.length > 0) {
      return res.status(200).json({
        message: 'Found matching FAQs',
        faqs,
        source: 'database'
      });
    }
    
    // If no exact matches, use OpenAI to generate a response
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful FAQ chatbot assistant. Provide clear and concise answers to user questions."
        },
        {
          role: "user",
          content: query
        }
      ],
      temperature: 0.7,
      max_tokens: 150
    });
    
    // Create a new FAQ entry with the AI-generated answer
    const aiAnswer = completion.choices[0].message.content;
    
    // Optionally save the AI-generated FAQ
    const newFAQ = new FAQ({
      question: query,
      answer: aiAnswer,
      category: 'AI Generated',
      keywords: [query.toLowerCase()]
    });
    
    await newFAQ.save();
    
    res.status(200).json({
      message: 'AI-generated response',
      faqs: [newFAQ],
      source: 'ai'
    });
  } catch (error) {
    console.error('FAQ search error:', error);
    res.status(500).json({
      message: 'Failed to search FAQs',
      error: error.message
    });
  }
};

module.exports = {
  getAllFAQs,
  getFAQById,
  createFAQ,
  updateFAQ,
  deleteFAQ,
  searchFAQs
}; 
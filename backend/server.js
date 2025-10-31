const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bookit', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.error('MongoDB connection error:', err));

// MongoDB Schemas
const experienceSchema = new mongoose.Schema({
  title: { type: String, required: true },
  location: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  imageUrl: { type: String, required: true },
  about: String,
  createdAt: { type: Date, default: Date.now }
});

const slotSchema = new mongoose.Schema({
  experienceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Experience', required: true },
  date: { type: Date, required: true },
  time: { type: String, required: true },
  totalSpots: { type: Number, default: 10 },
  availableSpots: { type: Number, default: 10 },
  createdAt: { type: Date, default: Date.now }
});

const bookingSchema = new mongoose.Schema({
  experienceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Experience', required: true },
  slotId: { type: mongoose.Schema.Types.ObjectId, ref: 'Slot', required: true },
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  quantity: { type: Number, default: 1 },
  subtotal: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  taxes: { type: Number, required: true },
  total: { type: Number, required: true },
  bookingReference: { type: String, unique: true, required: true },
  promoCode: String,
  status: { type: String, default: 'confirmed' },
  createdAt: { type: Date, default: Date.now }
});

const promoCodeSchema = new mongoose.Schema({
  code: { type: String, unique: true, required: true },
  discountType: { type: String, enum: ['percentage', 'fixed'], required: true },
  discountValue: { type: Number, required: true },
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

// Models
const Experience = mongoose.model('Experience', experienceSchema);
const Slot = mongoose.model('Slot', slotSchema);
const Booking = mongoose.model('Booking', bookingSchema);
const PromoCode = mongoose.model('PromoCode', promoCodeSchema);

// GET /experiences - Get all experiences
app.get('/api/experiences', async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};

    if (search) {
      query = {
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { location: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ]
      };
    }

    const experiences = await Experience.find(query).sort({ _id: 1 });
    res.json(experiences);
  } catch (error) {
    console.error('Error fetching experiences:', error);
    res.status(500).json({ error: 'Failed to fetch experiences' });
  }
});

// GET /experiences/:id - Get single experience with slots
app.get('/api/experiences/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const experience = await Experience.findById(id);
    if (!experience) {
      return res.status(404).json({ error: 'Experience not found' });
    }

    // Get slots for next 7 days
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

    const slots = await Slot.find({
      experienceId: id,
      date: { $gte: today, $lte: nextWeek }
    }).sort({ date: 1, time: 1 });

    const experienceData = experience.toObject();
    experienceData.slots = slots;

    res.json(experienceData);
  } catch (error) {
    console.error('Error fetching experience:', error);
    res.status(500).json({ error: 'Failed to fetch experience details' });
  }
});

// POST /bookings - Create a booking
app.post('/api/bookings', async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { experienceId, slotId, fullName, email, promoCode, quantity = 1 } = req.body;

    // Validate required fields
    if (!experienceId || !slotId || !fullName || !email) {
      await session.abortTransaction();
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check slot availability
    const slot = await Slot.findById(slotId).session(session);
    if (!slot) {
      await session.abortTransaction();
      return res.status(404).json({ error: 'Slot not found' });
    }

    if (slot.availableSpots < quantity) {
      await session.abortTransaction();
      return res.status(400).json({ error: 'Not enough spots available' });
    }

    // Get experience price
    const experience = await Experience.findById(experienceId).session(session);
    if (!experience) {
      await session.abortTransaction();
      return res.status(404).json({ error: 'Experience not found' });
    }

    const basePrice = experience.price;
    let subtotal = basePrice * quantity;
    let discount = 0;

    // Apply promo code if provided
    if (promoCode) {
      const promo = await PromoCode.findOne({ 
        code: promoCode.toUpperCase(), 
        active: true 
      }).session(session);

      if (promo) {
        if (promo.discountType === 'percentage') {
          discount = Math.round((subtotal * promo.discountValue) / 100);
        } else if (promo.discountType === 'fixed') {
          discount = promo.discountValue;
        }
      }
    }

    const taxes = Math.round((subtotal - discount) * 0.10); // 10% tax
    const total = subtotal - discount + taxes;

    // Generate booking reference
    const bookingRef = 'HUF' + Math.random().toString(36).substr(2, 5).toUpperCase();

    // Create booking
    const booking = new Booking({
      experienceId,
      slotId,
      fullName,
      email,
      quantity,
      subtotal,
      discount,
      taxes,
      total,
      bookingReference: bookingRef,
      promoCode: promoCode || null
    });

    await booking.save({ session });

    // Update slot availability
    slot.availableSpots -= quantity;
    await slot.save({ session });

    await session.commitTransaction();

    res.status(201).json({
      success: true,
      booking,
      message: 'Booking created successfully'
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Error creating booking:', error);
    res.status(500).json({ error: 'Failed to create booking' });
  } finally {
    session.endSession();
  }
});

// POST /promo/validate - Validate promo code
app.post('/api/promo/validate', async (req, res) => {
  try {
    const { code, amount } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Promo code is required' });
    }

    const promo = await PromoCode.findOne({ 
      code: code.toUpperCase(), 
      active: true 
    });

    if (!promo) {
      return res.status(404).json({ 
        valid: false, 
        error: 'Invalid or expired promo code' 
      });
    }

    let discountAmount = 0;

    if (promo.discountType === 'percentage') {
      discountAmount = Math.round((amount * promo.discountValue) / 100);
    } else if (promo.discountType === 'fixed') {
      discountAmount = promo.discountValue;
    }

    res.json({
      valid: true,
      code: promo.code,
      discountType: promo.discountType,
      discountValue: promo.discountValue,
      discountAmount
    });

  } catch (error) {
    console.error('Error validating promo code:', error);
    res.status(500).json({ error: 'Failed to validate promo code' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'BookIt API is running' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Export models for seeding
module.exports = { Experience, Slot, PromoCode, Booking };
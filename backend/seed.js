const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bookit', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Schemas
const experienceSchema = new mongoose.Schema({
  title: String,
  location: String,
  description: String,
  price: Number,
  imageUrl: String,
  about: String,
  createdAt: { type: Date, default: Date.now }
});

const slotSchema = new mongoose.Schema({
  experienceId: mongoose.Schema.Types.ObjectId,
  date: Date,
  time: String,
  totalSpots: { type: Number, default: 10 },
  availableSpots: { type: Number, default: 10 },
  createdAt: { type: Date, default: Date.now }
});

const promoCodeSchema = new mongoose.Schema({
  code: String,
  discountType: String,
  discountValue: Number,
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

const Experience = mongoose.model('Experience', experienceSchema);
const Slot = mongoose.model('Slot', slotSchema);
const PromoCode = mongoose.model('PromoCode', promoCodeSchema);

async function seedDatabase() {
  try {
    console.log('Clearing existing data...');
    await Experience.deleteMany({});
    await Slot.deleteMany({});
    await PromoCode.deleteMany({});

    console.log('Seeding experiences...');
    const experiences = await Experience.insertMany([
      {
        title: 'Kayaking',
        location: 'Udupi',
        description: 'Curated small-group experience. Certified guide. Safety first with gear included.',
        price: 999,
        imageUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&auto=format&fit=crop',
        about: 'Scenic routes, trained guides, and safety briefing. Helmet and Life jackets along with an expert will accompany in kayaking. Wellness age 10.'
      },
      {
        title: 'Nandi Hills Sunrise',
        location: 'Bangalore',
        description: 'Curated small-group experience. Certified guide. Safety first with gear included.',
        price: 899,
        imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&auto=format&fit=crop',
        about: 'Early morning trek to witness breathtaking sunrise views from Nandi Hills.'
      },
      {
        title: 'Coffee Trail',
        location: 'Coorg',
        description: 'Curated small-group experience. Certified guide. Safety first with gear included.',
        price: 1299,
        imageUrl: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=800&auto=format&fit=crop',
        about: 'Explore coffee plantations and learn about coffee making process.'
      },
      {
        title: 'Kayaking',
        location: 'Udupi, Karnataka',
        description: 'Curated small-group experience. Certified guide. Safety first with gear included.',
        price: 999,
        imageUrl: 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=800&auto=format&fit=crop',
        about: 'Paddle through serene backwaters with expert guidance and safety equipment.'
      },
      {
        title: 'Boat Cruise',
        location: 'Gundlupet',
        description: 'Curated small-group experience. Certified guide. Safety first with gear included.',
        price: 999,
        imageUrl: 'https://images.unsplash.com/photo-1544551763-77ef2d0cfc6c?w=800&auto=format&fit=crop',
        about: 'Relaxing boat ride with scenic views and wildlife spotting opportunities.'
      },
      {
        title: 'Bunjee Jumping',
        location: 'Mysore',
        description: 'Curated small-group experience. Certified guide. Safety first with gear included.',
        price: 999,
        imageUrl: 'https://images.unsplash.com/photo-1534367507873-d2d7e24c797f?w=800&auto=format&fit=crop',
        about: 'Thrilling bungee jumping experience with professional safety measures.'
      },
      {
        title: 'Coffee Trail',
        location: 'Coorg',
        description: 'Curated small-group experience. Certified guide. Safety first with gear included.',
        price: 1299,
        imageUrl: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=800&auto=format&fit=crop',
        about: 'Discover the art of coffee cultivation in lush plantations.'
      }
    ]);

    console.log(`Inserted ${experiences.length} experiences`);

    // Create slots for each experience (next 7 days)
    console.log('Seeding slots...');
    const slots = [];
    const times = ['07:00 am - 1pm', '9:00 am - 1 pm', '11:00 am - 3 pm', '1:00 pm -later'];

    for (const experience of experiences) {
      for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i);
        date.setHours(0, 0, 0, 0);

        for (const time of times) {
          slots.push({
            experienceId: experience._id,
            date,
            time,
            totalSpots: 10,
            availableSpots: Math.floor(Math.random() * 5) + 6 // 6-10 spots available
          });
        }
      }
    }

    await Slot.insertMany(slots);
    console.log(`Inserted ${slots.length} slots`);

    // Seed promo codes
    console.log('Seeding promo codes...');
    await PromoCode.insertMany([
      {
        code: 'SAVE10',
        discountType: 'percentage',
        discountValue: 10,
        active: true
      },
      {
        code: 'FLAT100',
        discountType: 'fixed',
        discountValue: 100,
        active: true
      },
      {
        code: 'WELCOME20',
        discountType: 'percentage',
        discountValue: 20,
        active: true
      }
    ]);

    console.log('✅ Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
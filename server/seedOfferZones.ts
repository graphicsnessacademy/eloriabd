import 'dotenv/config';
import mongoose from 'mongoose';
import SiteConfig from './models/SiteConfig';

const MONGODB_URI = process.env.MONGODB_URI!;

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  let config = await SiteConfig.findOne();
  if (!config) {
    config = new SiteConfig({});
    console.log('Creating new SiteConfig...');
  }

  // Seed demo offer zones
  config.offerZones = {
    hero: [
      {
        isActive: true,
        promoBadge: 'New Collection 2026',
        yearLabel: '2026',
        mainTitle: 'Elegance\nRedefined',
        bgImage: 'https://images.unsplash.com/photo-1701252068382-fbe79b926cdc?q=80&w=1600&auto=format&fit=crop',
        startDate: undefined,
        endDate: undefined,
      },
      {
        isActive: true,
        promoBadge: 'Up to 65% Off',
        yearLabel: '2026',
        mainTitle: 'Royal\nCollection',
        bgImage: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=1600&auto=format&fit=crop',
        startDate: undefined,
        endDate: undefined,
      },
    ],
    countdown: {
      isActive: true,
      offerName: 'FLASH SALE',
      description: 'Grab these exclusive deals before they are gone! Limited time offer.',
      bgImage: '',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    },
    popup: {
      isActive: true,
      image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=800&auto=format&fit=crop',
      title: 'Special Offer — 30% Off!',
      targetUrl: '/shop',
      delay: 3,
    },
  };

  config.markModified('offerZones');
  await config.save();

  console.log('✅ Demo offer zones seeded successfully!');
  console.log('  Hero slides: 2 active slides');
  console.log('  Countdown: LIVE — expires in 7 days');
  console.log('  Popup: LIVE — 3s delay');
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Seed error:', err);
  process.exit(1);
});

import mongoose, { Document, Schema } from 'mongoose';

// Interface for a single Hero Slide
interface IHeroSlide {
  isActive: boolean;
  promoBadge: string;
  yearLabel: string;
  mainTitle: string;
  bgImage: string;
  startDate?: Date;
  endDate?: Date;
}

export interface ISiteConfig extends Document {
  announcementBar: {
    text: string;
    color: string;
    isActive: boolean;
  };
  freeShippingThreshold: number;
  returnPolicyDays: number;
  storeName: string;
  storePhone: string;
  storeEmail: string;
  socialLinks: {
    instagram: string;
    facebook: string;
    whatsapp: string;
  };
  defaultMeta: {
    title: string;
    description: string;
    ogImage: string;
  };
  offerZones: {
    // CHANGED: hero is now an array of slides
    hero: IHeroSlide[];
    countdown: {
      isActive: boolean;
      offerName: string;
      description: string;
      bgImage: string;
      expiresAt?: Date;
    };
    popup: {
      isActive: boolean;
      image: string;
      title: string;
      targetUrl: string;
      delay: number;
    };
  };
}

const SiteConfigSchema: Schema = new Schema({
  announcementBar: {
    text: { type: String, default: 'Welcome to Eloria BD!' },
    color: { type: String, default: '#534AB7' },
    isActive: { type: Boolean, default: true },
  },
  freeShippingThreshold: { type: Number, default: 5000 },
  returnPolicyDays: { type: Number, default: 7 },
  storeName: { type: String, default: 'Eloria BD' },
  storePhone: { type: String, default: '+8801700000000' },
  storeEmail: { type: String, default: 'support@eloriabd.com' },
  socialLinks: {
    instagram: { type: String, default: 'https://instagram.com/' },
    facebook: { type: String, default: 'https://facebook.com/' },
    whatsapp: { type: String, default: '+8801700000000' },
  },
  defaultMeta: {
    title: { type: String, default: 'Eloria BD - Royal Floral' },
    description: { type: String, default: 'The premium online fashion destination.' },
    ogImage: { type: String, default: '' },
  },
  offerZones: {
    // FIXED: Definition for multiple hero slides
   hero: {
  type: [{
    isActive: { type: Boolean, default: false },
    promoBadge: { type: String, default: 'New Collection' },
    yearLabel: { type: String, default: '2026' },
    mainTitle: { type: String, default: 'Elegance Redefined' },
    bgImage: { type: String, default: '' },
    startDate: { type: Date },
    endDate: { type: Date }
  }],
  default: [] 
},
    countdown: {
      isActive: { type: Boolean, default: false },
      offerName: { type: String, default: 'Flash Sale' },
      description: { type: String, default: 'Grab these deals before they are gone!' },
      bgImage: { type: String, default: '' },
      expiresAt: { type: Date }
    },
    popup: {
      isActive: { type: Boolean, default: false },
      image: { type: String, default: '' },
      title: { type: String, default: 'Special Offer' },
      targetUrl: { type: String, default: '/shop' },
      delay: { type: Number, default: 3 }
    }
  }
}, { timestamps: true });

export default mongoose.models.SiteConfig || mongoose.model<ISiteConfig>('SiteConfig', SiteConfigSchema);
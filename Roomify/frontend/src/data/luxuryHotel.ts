import {
  Bath,
  BedDouble,
  BriefcaseBusiness,
  Coffee,
  Crown,
  Dumbbell,
  Flower2,
  Heart,
  Martini,
  Sparkles,
  Utensils,
  Waves,
  Wifi
} from 'lucide-react';

export interface LuxuryRoom {
  id: string;
  room_id?: number;
  room_number?: string;
  title: string;
  type: string;
  price: number;
  price_per_night?: number;
  capacity: number;
  rating: number;
  popular?: boolean;
  offer?: string;
  image: string;
  gallery: string[];
  description: string;
  amenities: string[];
  included: string[];
  policy: string;
  status?: string;
  available?: boolean;
}

export const luxuryRooms: LuxuryRoom[] = [
  {
    id: 'terrace-suite',
    title: 'Terrace Garden Suite',
    type: 'Suite',
    price: 14500,
    capacity: 3,
    rating: 4.9,
    popular: true,
    offer: 'Weekend upgrade eligible',
    image: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?q=80&w=1400&auto=format&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1618773928121-c32242e63f39?q=80&w=1400&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=1400&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?q=80&w=1400&auto=format&fit=crop'
    ],
    description:
      'A calm private suite with garden-facing lounge space, warm textures, and a quiet evening terrace designed for slow luxury.',
    amenities: ['Private terrace', 'King bed', 'Rain shower', 'Breakfast included'],
    included: ['Airport assistance', 'Evening turn-down', 'Welcome drink', 'High-speed Wi-Fi'],
    policy: 'Free cancellation until 24 hours before arrival. Check-in after 2 PM.'
  },
  {
    id: 'signature-room',
    title: 'Signature King Room',
    type: 'Premium',
    price: 9200,
    capacity: 2,
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?q=80&w=1400&auto=format&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1566665797739-1674de7a421a?q=80&w=1400&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?q=80&w=1400&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=1400&auto=format&fit=crop'
    ],
    description:
      'A refined king room with soft lighting, premium linens, and a work-friendly corner for business and leisure stays.',
    amenities: ['King bed', 'Work desk', 'Smart TV', 'City view'],
    included: ['Daily breakfast', 'Wi-Fi', 'Tea service', 'Late checkout on request'],
    policy: 'Flexible date changes subject to availability. Check-out by 11 AM.'
  },
  {
    id: 'family-residence',
    title: 'Family Residence',
    type: 'Family',
    price: 17800,
    capacity: 5,
    rating: 4.9,
    offer: 'Kids dine complimentary',
    image: 'https://images.unsplash.com/photo-1590490359683-658d34c8f11f?q=80&w=1400&auto=format&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1590490359683-658d34c8f11f?q=80&w=1400&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1598928636135-d146006ff4be?q=80&w=1400&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1400&auto=format&fit=crop'
    ],
    description:
      'A spacious residence with connected sleeping zones, generous seating, and family-friendly service touches.',
    amenities: ['Two bedrooms', 'Living area', 'Mini pantry', 'Kids amenities'],
    included: ['Breakfast for four', 'Kids welcome kit', 'Wi-Fi', 'Priority housekeeping'],
    policy: 'Free cancellation until 48 hours before arrival. Extra bed available on request.'
  },
  {
    id: 'presidential-retreat',
    title: 'Presidential Retreat',
    type: 'Luxury',
    price: 32500,
    capacity: 4,
    rating: 5,
    popular: true,
    image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?q=80&w=1400&auto=format&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1582719508461-905c673771fd?q=80&w=1400&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1591088398332-8a7791972843?q=80&w=1400&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1540518614846-7eded433c457?q=80&w=1400&auto=format&fit=crop'
    ],
    description:
      'The flagship suite experience with private dining, dedicated service, deep soaking bath, and an elevated city panorama.',
    amenities: ['Private dining', 'Butler service', 'Soaking bath', 'Skyline view'],
    included: ['Personal concierge', 'Club lounge access', 'Chef-curated breakfast', 'Airport transfer'],
    policy: 'Deposit required. Free date change up to 72 hours before arrival.'
  }
];

export const amenityIconMap = [
  { label: 'Wi-Fi', icon: Wifi },
  { label: 'Spa', icon: Flower2 },
  { label: 'Pool', icon: Waves },
  { label: 'Dining', icon: Utensils },
  { label: 'Gym', icon: Dumbbell },
  { label: 'Bar', icon: Martini },
  { label: 'Bath', icon: Bath },
  { label: 'Business', icon: BriefcaseBusiness },
  { label: 'Premium stay', icon: Crown },
  { label: 'Romantic', icon: Heart },
  { label: 'Breakfast', icon: Coffee },
  { label: 'Experiences', icon: Sparkles },
  { label: 'Comfort', icon: BedDouble }
];

export const offers = [
  {
    title: 'Golden Weekend Escape',
    tag: 'Weekend Deal',
    discount: '20% off',
    ends: 'Ends in 02d 14h',
    copy: 'Includes breakfast, late checkout, and a room upgrade when available.'
  },
  {
    title: 'Honeymoon Indulgence',
    tag: 'Romantic',
    discount: 'Rs 4,000 value',
    ends: 'Limited slots',
    copy: 'Flower setup, candlelight dinner credit, and spa welcome ritual.'
  },
  {
    title: 'Festival Luxury Saver',
    tag: 'Festival',
    discount: '15% off',
    ends: 'This week',
    copy: 'Stay two nights and unlock dining credits for signature restaurants.'
  }
];

export const experiences = [
  {
    title: 'Romantic Stays',
    copy: 'Private dinners, flower arrangements, spa rituals, and sunset experiences.',
    image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?q=80&w=1200&auto=format&fit=crop'
  },
  {
    title: 'Family Retreats',
    copy: 'Connected rooms, children-friendly dining, pool access, and curated city days.',
    image: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?q=80&w=1200&auto=format&fit=crop'
  },
  {
    title: 'Business Calm',
    copy: 'Quiet suites, fast Wi-Fi, boardroom assistance, and express services.',
    image: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?q=80&w=1200&auto=format&fit=crop'
  }
];

export const testimonials = [
  {
    name: 'Rhea Nair',
    rating: 5,
    quote: 'Every detail felt intentional. The booking flow was simple, and the stay felt deeply personal.'
  },
  {
    name: 'Aman Khanna',
    rating: 5,
    quote: 'Premium without being loud. The room, dining, and service felt effortless from start to finish.'
  },
  {
    name: 'Meera Shah',
    rating: 4.9,
    quote: 'The guest portal made it easy to see my booking and plan add-ons before arrival.'
  }
];

import { connectDatabase } from '../database/dbConnection.js';
import {
  User,
  Salon,
  Service,
  Staff,
  Appointment,
  QueueEntry,
  Review,
  Transaction
} from '../database/models.js';

async function seedDevData() {
  console.log('[SEED] Running explicit development seed script...');
  await connectDatabase();

  // Create demo salon owner if not existing
  let owner = await User.findOne({ email: 'owner@uplookz.com' });
  if (!owner) {
    owner = await User.create({
      id: 'usr_dev_owner_01',
      name: 'Vikram Mehta',
      email: 'owner@uplookz.com',
      phone: '+919999900001',
      passwordHash: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', // 'password'
      roles: ['salon'],
      activeRole: 'salon',
      salonName: 'Luxe Hair & Grooming Lounge',
      city: 'Mumbai, Bandra West',
      isVerified: true
    });
    console.log('[SEED] Created dev owner:', owner.email);
  }

  // Create demo salon
  let salon = await Salon.findById('salon_dev_01');
  if (!salon) {
    salon = await Salon.create({
      id: 'salon_dev_01',
      ownerId: owner.id,
      name: 'Luxe Hair & Grooming Lounge',
      tagline: 'Precision Styling & Luxury Grooming Experiences',
      description: 'Modern grooming salon catering to professionals with luxury haircutting, beard grooming, and facial treatments.',
      phone: '+91 99999 00001',
      email: 'owner@uplookz.com',
      address: 'Suite 101, Horizon Plaza, Bandra West',
      city: 'Mumbai, Bandra West',
      state: 'Maharashtra',
      pincode: '400050',
      openingTime: '09:00',
      closingTime: '21:00',
      workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      amenities: ['High-Speed Wi-Fi', 'Air Conditioning', 'Free Valet Parking', 'Espresso Lounge', 'UPI & Card Accepted'],
      specialties: ['Executive Haircuts', 'Beard Sculpting', 'Skin Refresh Treatments'],
      rating: 4.9,
      reviewCount: 3,
      verified: true,
      active: true
    });
    console.log('[SEED] Created dev salon:', salon.name);
  }

  // Create demo services
  const devServices = [
    { id: 'srv_dev_01', salonId: salon.id, name: 'Executive Haircut & Wash', category: 'Hair', price: 450, durationMinutes: 30 },
    { id: 'srv_dev_02', salonId: salon.id, name: 'Beard Sculpting & Hot Towel', category: 'Beard', price: 300, durationMinutes: 20 },
    { id: 'srv_dev_03', salonId: salon.id, name: 'Charcoal Deep Cleansing Facial', category: 'Facial', price: 750, durationMinutes: 45 },
    { id: 'srv_dev_04', salonId: salon.id, name: 'Royal Grooming Package', category: 'Combo', price: 1200, durationMinutes: 75 }
  ];

  for (const s of devServices) {
    const existing = await Service.findById(s.id);
    if (!existing) {
      await Service.create(s);
    }
  }
  console.log('[SEED] Seeded dev services.');

  // Create demo staff
  const devStaff = [
    { id: 'stf_dev_01', salonId: salon.id, name: 'Aakash Verma', role: 'Senior Stylist', phone: '+919999911111', active: true },
    { id: 'stf_dev_02', salonId: salon.id, name: 'Sameer Khan', role: 'Master Barber', phone: '+919999922222', active: true }
  ];

  for (const st of devStaff) {
    const existing = await Staff.findById(st.id);
    if (!existing) {
      await Staff.create(st);
    }
  }
  console.log('[SEED] Seeded dev staff.');

  // Create demo customer
  let customer = await User.findOne({ email: 'customer@uplookz.com' });
  if (!customer) {
    customer = await User.create({
      id: 'usr_dev_customer_01',
      name: 'Aditya Roy',
      email: 'customer@uplookz.com',
      phone: '+919888877777',
      passwordHash: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
      roles: ['customer'],
      activeRole: 'customer',
      city: 'Mumbai, Bandra West',
      isVerified: true
    });
    console.log('[SEED] Created dev customer:', customer.email);
  }

  console.log('[SEED] Development seed complete.');
}

seedDevData().catch(err => {
  console.error('[SEED] Fatal seed error:', err);
  process.exit(1);
});

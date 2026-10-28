import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');
const UPLOADS_DIR = path.join(__dirname, '..', 'public', 'uploads');

// Ensure data and uploads directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

function getFilePath(filename) {
  return path.join(DATA_DIR, filename);
}

export function readData(filename, defaultData = []) {
  const filePath = getFilePath(filename);
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error(`[DB Error] Reading ${filename}:`, err);
  }
  return defaultData;
}

export function writeData(filename, data) {
  const filePath = getFilePath(filename);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error(`[DB Error] Writing ${filename}:`, err);
    return false;
  }
}

/**
 * Initialize default salon dataset if files do not exist yet.
 * Does NOT overwrite existing data.
 */
export function initializeDatabase() {
  const now = new Date();
  const todayStr = '2026-10-28'; // Matches the system date context

  // 1. Salons
  if (!fs.existsSync(getFilePath('salons.json'))) {
    const defaultSalons = [
      {
        id: 'salon_apex_01',
        ownerId: 'usr_salon_02', // Rahul Sharma
        name: 'Apex Studio & Grooming',
        tagline: 'Premium Unisex Styling & Executive Grooming',
        description:
          'Experience world-class hair styling, beard grooming, and skincare treatments with master barbers and certified colorists in an ultra-modern, serene lounge.',
        phone: '+91 98765 01234',
        email: 'salon@example.com',
        address: 'Plot 42, Linking Road, Near Bandra Station',
        city: 'Mumbai, Bandra West',
        state: 'Maharashtra',
        pincode: '400050',
        openingTime: '09:00',
        closingTime: '21:00',
        workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        holidays: ['2026-11-12', '2026-12-25'],
        amenities: [
          'High-Speed Wi-Fi',
          'Air Conditioning',
          'Free Dedicated Parking',
          'Complimentary Espresso & Infused Water',
          'UPI & Card Accepted',
          'UV-Sanitized Tools',
          'Unisex Waiting Lounge',
          'Wheelchair Accessible'
        ],
        specialties: [
          'Executive Haircuts',
          'Precision Fade & Beard Sculpting',
          'Keratin & Hair Botox',
          'HydraFacial Glow Therapy',
          'Scalp Rejuvenation'
        ],
        policies: {
          cancellationHours: 2,
          cancellationPolicy: 'Free cancellation up to 2 hours before scheduled appointment time.',
          lateArrivalMinutes: 15,
          lateArrivalPolicy: 'Please arrive 5-10 minutes early. Bookings may be adjusted if arrival exceeds 15 minutes.',
          walkInPolicy: 'Walk-ins are managed through our real-time Live Queue on a first-come, first-served basis.'
        },
        logo: '',
        gallery: [],
        rating: 4.9,
        reviewCount: 128,
        verified: true,
        active: true,
        createdAt: '2026-01-12T14:30:00.000Z'
      }
    ];
    writeData('salons.json', defaultSalons);
  }

  // 2. Services
  if (!fs.existsSync(getFilePath('services.json'))) {
    const defaultServices = [
      {
        id: 'srv_01',
        salonId: 'salon_apex_01',
        name: 'Executive Haircut & Styling',
        category: 'Hair',
        price: 650,
        durationMinutes: 45,
        description: 'Personalized consultation, custom precision cut, revitalizing hair wash, and blowdry finish.',
        active: true,
        image: ''
      },
      {
        id: 'srv_02',
        salonId: 'salon_apex_01',
        name: 'Beard Sculpt & Luxury Shave',
        category: 'Beard & Shave',
        price: 400,
        durationMinutes: 30,
        description: 'Hot towel prep, straight-razor detailing, beard oil treatment, and soothing aftershave balm.',
        active: true,
        image: ''
      },
      {
        id: 'srv_03',
        salonId: 'salon_apex_01',
        name: 'Hair Spa & Scalp Detox',
        category: 'Hair',
        price: 1200,
        durationMinutes: 60,
        description: 'Deep nourishing hair mask, steam infusion, and relaxing 20-minute acupressure head massage.',
        active: true,
        image: ''
      },
      {
        id: 'srv_04',
        salonId: 'salon_apex_01',
        name: 'Hydra Glow Deep Facial',
        category: 'Skin & Facial',
        price: 1800,
        durationMinutes: 60,
        description: 'Ultrasonic pore cleansing, antioxidant serum infusion, and brightening cold-globe massage.',
        active: true,
        image: ''
      },
      {
        id: 'srv_05',
        salonId: 'salon_apex_01',
        name: 'Royal Grooming Package (Hair + Beard + Facial)',
        category: 'Combo Packages',
        price: 2400,
        durationMinutes: 105,
        description: 'Full signature haircut, luxury beard sculpt, and fast-acting 30-min charcoal express facial.',
        active: true,
        image: ''
      },
      {
        id: 'srv_06',
        salonId: 'salon_apex_01',
        name: 'Charcoal Blackhead Peel & Mask',
        category: 'Skin & Facial',
        price: 500,
        durationMinutes: 25,
        description: 'Targeted T-zone unclogging with botanical soothing gel for instant clarity.',
        active: true,
        image: ''
      },
      {
        id: 'srv_07',
        salonId: 'salon_apex_01',
        name: 'Keratin Smoothing Treatment',
        category: 'Hair',
        price: 3500,
        durationMinutes: 120,
        description: 'Formaldehyde-free protein smoothing that eliminates frizz for up to 3 months.',
        active: true,
        image: ''
      },
      {
        id: 'srv_08',
        salonId: 'salon_apex_01',
        name: 'Head & Shoulder Acupressure Massage',
        category: 'Spa & Wellness',
        price: 700,
        durationMinutes: 35,
        description: 'Relieves neck tension and stimulates scalp circulation with therapeutic herbal oils.',
        active: true,
        image: ''
      }
    ];
    writeData('services.json', defaultServices);
  }

  // 3. Staff
  if (!fs.existsSync(getFilePath('staff.json'))) {
    const defaultStaff = [
      {
        id: 'stf_01',
        salonId: 'salon_apex_01',
        name: 'Karan Malhotra',
        role: 'Senior Stylist & Barber',
        phone: '+91 98111 22334',
        email: 'karan@apexstudio.com',
        avatar: '',
        assignedServiceIds: ['srv_01', 'srv_02', 'srv_05'],
        workingHours: { start: '09:00', end: '18:00' },
        weeklyOffDays: ['Monday'],
        active: true,
        isManager: false,
        rating: 4.9,
        reviewsCount: 64
      },
      {
        id: 'stf_02',
        salonId: 'salon_apex_01',
        name: 'Priya Deshmukh',
        role: 'Master Colorist & Skin Specialist',
        phone: '+91 98222 33445',
        email: 'priya@apexstudio.com',
        avatar: '',
        assignedServiceIds: ['srv_01', 'srv_03', 'srv_04', 'srv_06', 'srv_07'],
        workingHours: { start: '10:00', end: '19:00' },
        weeklyOffDays: ['Tuesday'],
        active: true,
        isManager: false,
        rating: 4.95,
        reviewsCount: 78
      },
      {
        id: 'stf_03',
        salonId: 'salon_apex_01',
        name: 'Amit Verma',
        role: 'Lead Barber & Grooming Expert',
        phone: '+91 98333 44556',
        email: 'amit@apexstudio.com',
        avatar: '',
        assignedServiceIds: ['srv_01', 'srv_02', 'srv_05', 'srv_08'],
        workingHours: { start: '12:00', end: '21:00' },
        weeklyOffDays: ['Wednesday'],
        active: true,
        isManager: false,
        rating: 4.85,
        reviewsCount: 52
      },
      {
        id: 'stf_04',
        salonId: 'salon_apex_01',
        name: 'Neha Kulkarni',
        role: 'Spa & Wellness Therapist',
        phone: '+91 98444 55667',
        email: 'neha@apexstudio.com',
        avatar: '',
        assignedServiceIds: ['srv_03', 'srv_04', 'srv_08'],
        workingHours: { start: '11:00', end: '20:00' },
        weeklyOffDays: ['Thursday'],
        active: true,
        isManager: false,
        rating: 4.9,
        reviewsCount: 41
      },
      {
        id: 'stf_05',
        salonId: 'salon_apex_01',
        name: 'Rahul Sharma',
        role: 'Owner & Creative Director',
        phone: '+91 98765 01234',
        email: 'salon@example.com',
        avatar: '',
        assignedServiceIds: ['srv_01', 'srv_02', 'srv_03', 'srv_04', 'srv_05'],
        workingHours: { start: '09:00', end: '21:00' },
        weeklyOffDays: [],
        active: true,
        isManager: true,
        rating: 5.0,
        reviewsCount: 95
      }
    ];
    writeData('staff.json', defaultStaff);
  }

  // 4. Appointments
  if (!fs.existsSync(getFilePath('appointments.json'))) {
    const defaultAppointments = [
      {
        id: 'apt_101',
        salonId: 'salon_apex_01',
        customerId: 'usr_customer_01',
        customerName: 'John Doe',
        customerPhone: '+91 98765 43210',
        customerEmail: 'john@example.com',
        serviceIds: ['srv_01'],
        serviceNames: ['Executive Haircut & Styling'],
        staffId: 'stf_01',
        staffName: 'Karan Malhotra',
        date: todayStr,
        time: '11:00 AM',
        durationMinutes: 45,
        totalAmount: 650,
        status: 'completed',
        paymentStatus: 'paid',
        paymentMethod: 'UPI / GPay',
        notes: 'Low taper fade, texturize top',
        createdAt: '2026-10-27T08:00:00.000Z',
        updatedAt: `${todayStr}T11:45:00.000Z`
      },
      {
        id: 'apt_102',
        salonId: 'salon_apex_01',
        customerId: 'usr_1792086512172_tg46h',
        customerName: 'Priya Patel',
        customerPhone: '+91 91234 56789',
        customerEmail: 'priya.p@example.com',
        serviceIds: ['srv_03'],
        serviceNames: ['Hair Spa & Scalp Detox'],
        staffId: 'stf_02',
        staffName: 'Priya Deshmukh',
        date: todayStr,
        time: '12:30 PM',
        durationMinutes: 60,
        totalAmount: 1200,
        status: 'completed',
        paymentStatus: 'paid',
        paymentMethod: 'Credit Card',
        notes: 'Scalp dryness treatment',
        createdAt: '2026-10-27T10:15:00.000Z',
        updatedAt: `${todayStr}T13:30:00.000Z`
      },
      {
        id: 'apt_103',
        salonId: 'salon_apex_01',
        customerId: 'cust_03',
        customerName: 'Vikram Mehta',
        customerPhone: '+91 98201 44556',
        customerEmail: 'vikram.m@example.com',
        serviceIds: ['srv_02'],
        serviceNames: ['Beard Sculpt & Luxury Shave'],
        staffId: 'stf_03',
        staffName: 'Amit Verma',
        date: todayStr,
        time: '02:00 PM',
        durationMinutes: 30,
        totalAmount: 400,
        status: 'in_service',
        paymentStatus: 'pending',
        paymentMethod: 'Cash',
        notes: 'Sharpen cheeklines',
        createdAt: '2026-10-28T07:30:00.000Z',
        updatedAt: `${todayStr}T14:00:00.000Z`
      },
      {
        id: 'apt_104',
        salonId: 'salon_apex_01',
        customerId: 'cust_04',
        customerName: 'Sneha Roy',
        customerPhone: '+91 98902 33441',
        customerEmail: 'sneha.roy@example.com',
        serviceIds: ['srv_01'],
        serviceNames: ['Executive Haircut & Styling'],
        staffId: 'stf_02',
        staffName: 'Priya Deshmukh',
        date: todayStr,
        time: '03:15 PM',
        durationMinutes: 45,
        totalAmount: 650,
        status: 'confirmed',
        paymentStatus: 'pending',
        paymentMethod: 'UPI / GPay',
        notes: 'Layered trim',
        createdAt: '2026-10-28T09:00:00.000Z',
        updatedAt: `${todayStr}T09:00:00.000Z`
      },
      {
        id: 'apt_105',
        salonId: 'salon_apex_01',
        customerId: 'cust_05',
        customerName: 'Arjun Nair',
        customerPhone: '+91 97654 11223',
        customerEmail: 'arjun.nair@example.com',
        serviceIds: ['srv_04'],
        serviceNames: ['Hydra Glow Deep Facial'],
        staffId: 'stf_04',
        staffName: 'Neha Kulkarni',
        date: todayStr,
        time: '05:00 PM',
        durationMinutes: 60,
        totalAmount: 1800,
        status: 'confirmed',
        paymentStatus: 'pending',
        paymentMethod: 'Card',
        notes: 'Sensitive skin prep',
        createdAt: '2026-10-28T10:45:00.000Z',
        updatedAt: `${todayStr}T10:45:00.000Z`
      },
      {
        id: 'apt_106',
        salonId: 'salon_apex_01',
        customerId: 'cust_06',
        customerName: 'Rohan Joshi',
        customerPhone: '+91 98321 99887',
        customerEmail: 'rohan.j@example.com',
        serviceIds: ['srv_05'],
        serviceNames: ['Royal Grooming Package (Hair + Beard + Facial)'],
        staffId: 'stf_01',
        staffName: 'Karan Malhotra',
        date: todayStr,
        time: '06:30 PM',
        durationMinutes: 105,
        totalAmount: 2400,
        status: 'pending',
        paymentStatus: 'pending',
        paymentMethod: 'UPI / GPay',
        notes: 'Wedding attending tomorrow',
        createdAt: '2026-10-28T12:00:00.000Z',
        updatedAt: `${todayStr}T12:00:00.000Z`
      },
      // Previous completed appointments for weekly & monthly revenue
      {
        id: 'apt_090',
        salonId: 'salon_apex_01',
        customerId: 'cust_07',
        customerName: 'Aditya Birla',
        customerPhone: '+91 98111 55667',
        customerEmail: 'aditya@example.com',
        serviceIds: ['srv_05'],
        serviceNames: ['Royal Grooming Package (Hair + Beard + Facial)'],
        staffId: 'stf_01',
        staffName: 'Karan Malhotra',
        date: '2026-10-27',
        time: '04:00 PM',
        durationMinutes: 105,
        totalAmount: 2400,
        status: 'completed',
        paymentStatus: 'paid',
        paymentMethod: 'Credit Card',
        createdAt: '2026-10-26T11:00:00.000Z',
        updatedAt: '2026-10-27T17:45:00.000Z'
      },
      {
        id: 'apt_091',
        salonId: 'salon_apex_01',
        customerId: 'cust_08',
        customerName: 'Manish Sisodia',
        customerPhone: '+91 98222 66778',
        customerEmail: 'manish@example.com',
        serviceIds: ['srv_01', 'srv_02'],
        serviceNames: ['Executive Haircut & Styling', 'Beard Sculpt & Luxury Shave'],
        staffId: 'stf_03',
        staffName: 'Amit Verma',
        date: '2026-10-26',
        time: '02:30 PM',
        durationMinutes: 75,
        totalAmount: 1050,
        status: 'completed',
        paymentStatus: 'paid',
        paymentMethod: 'UPI / GPay',
        createdAt: '2026-10-25T14:00:00.000Z',
        updatedAt: '2026-10-26T15:45:00.000Z'
      },
      {
        id: 'apt_092',
        salonId: 'salon_apex_01',
        customerId: 'cust_09',
        customerName: 'Devika Sen',
        customerPhone: '+91 98333 77889',
        customerEmail: 'devika@example.com',
        serviceIds: ['srv_07'],
        serviceNames: ['Keratin Smoothing Treatment'],
        staffId: 'stf_02',
        staffName: 'Priya Deshmukh',
        date: '2026-10-25',
        time: '11:00 AM',
        durationMinutes: 120,
        totalAmount: 3500,
        status: 'completed',
        paymentStatus: 'paid',
        paymentMethod: 'UPI / GPay',
        createdAt: '2026-10-24T09:00:00.000Z',
        updatedAt: '2026-10-25T13:00:00.000Z'
      },
      {
        id: 'apt_093',
        salonId: 'salon_apex_01',
        customerId: 'cust_10',
        customerName: 'Sanjay Dutt',
        customerPhone: '+91 98444 88990',
        customerEmail: 'sanjay@example.com',
        serviceIds: ['srv_01'],
        serviceNames: ['Executive Haircut & Styling'],
        staffId: 'stf_01',
        staffName: 'Karan Malhotra',
        date: '2026-10-24',
        time: '05:30 PM',
        durationMinutes: 45,
        totalAmount: 650,
        status: 'cancelled',
        paymentStatus: 'refunded',
        paymentMethod: 'UPI / GPay',
        notes: 'Client cancelled due to emergency',
        createdAt: '2026-10-23T16:00:00.000Z',
        updatedAt: '2026-10-24T12:00:00.000Z'
      }
    ];
    writeData('appointments.json', defaultAppointments);
  }

  // 5. Live Queue
  if (!fs.existsSync(getFilePath('queue.json'))) {
    const defaultQueue = [
      {
        id: 'q_01',
        salonId: 'salon_apex_01',
        customerName: 'Sameer Kapoor',
        customerPhone: '+91 98200 11223',
        serviceId: 'srv_02',
        serviceName: 'Beard Sculpt & Luxury Shave',
        staffId: 'stf_03',
        staffName: 'Amit Verma',
        position: 1,
        status: 'in_service',
        arrivalTime: '01:45 PM',
        startedAt: '02:00 PM',
        estimatedWaitMinutes: 0,
        notes: 'Quick clean up',
        createdAt: `${todayStr}T13:45:00.000Z`
      },
      {
        id: 'q_02',
        salonId: 'salon_apex_01',
        customerName: 'Devendra Sharma',
        customerPhone: '+91 98311 22334',
        serviceId: 'srv_01',
        serviceName: 'Executive Haircut & Styling',
        staffId: 'stf_01',
        staffName: 'Karan Malhotra',
        position: 2,
        status: 'waiting',
        arrivalTime: '02:10 PM',
        startedAt: null,
        estimatedWaitMinutes: 15,
        notes: 'Prefers classic side part',
        createdAt: `${todayStr}T14:10:00.000Z`
      },
      {
        id: 'q_03',
        salonId: 'salon_apex_01',
        customerName: 'Kunal Shah',
        customerPhone: '+91 98422 33445',
        serviceId: 'srv_08',
        serviceName: 'Head & Shoulder Acupressure Massage',
        staffId: 'stf_04',
        staffName: 'Neha Kulkarni',
        position: 3,
        status: 'waiting',
        arrivalTime: '02:25 PM',
        startedAt: null,
        estimatedWaitMinutes: 35,
        notes: 'Walk-in regular',
        createdAt: `${todayStr}T14:25:00.000Z`
      },
      {
        id: 'q_04',
        salonId: 'salon_apex_01',
        customerName: 'Mihir Banerjee',
        customerPhone: '+91 98533 44556',
        serviceId: 'srv_01',
        serviceName: 'Executive Haircut & Styling',
        staffId: 'stf_01',
        staffName: 'Karan Malhotra',
        position: 0,
        status: 'completed',
        arrivalTime: '10:30 AM',
        startedAt: '10:45 AM',
        completedAt: '11:30 AM',
        estimatedWaitMinutes: 0,
        notes: 'First time visit',
        createdAt: `${todayStr}T10:30:00.000Z`
      }
    ];
    writeData('queue.json', defaultQueue);
  }

  // 6. Transactions
  if (!fs.existsSync(getFilePath('transactions.json'))) {
    const defaultTransactions = [
      {
        id: 'txn_101',
        salonId: 'salon_apex_01',
        appointmentId: 'apt_101',
        customerName: 'John Doe',
        amount: 650,
        paymentMethod: 'UPI / GPay',
        status: 'completed',
        date: todayStr,
        timestamp: `${todayStr}T11:45:00.000Z`
      },
      {
        id: 'txn_102',
        salonId: 'salon_apex_01',
        appointmentId: 'apt_102',
        customerName: 'Priya Patel',
        amount: 1200,
        paymentMethod: 'Credit Card',
        status: 'completed',
        date: todayStr,
        timestamp: `${todayStr}T13:30:00.000Z`
      },
      {
        id: 'txn_103',
        salonId: 'salon_apex_01',
        appointmentId: null, // Walk-in
        customerName: 'Mihir Banerjee',
        amount: 650,
        paymentMethod: 'Cash',
        status: 'completed',
        date: todayStr,
        timestamp: `${todayStr}T11:30:00.000Z`
      },
      // Previous transactions
      {
        id: 'txn_090',
        salonId: 'salon_apex_01',
        appointmentId: 'apt_090',
        customerName: 'Aditya Birla',
        amount: 2400,
        paymentMethod: 'Credit Card',
        status: 'completed',
        date: '2026-10-27',
        timestamp: '2026-10-27T17:45:00.000Z'
      },
      {
        id: 'txn_091',
        salonId: 'salon_apex_01',
        appointmentId: 'apt_091',
        customerName: 'Manish Sisodia',
        amount: 1050,
        paymentMethod: 'UPI / GPay',
        status: 'completed',
        date: '2026-10-26',
        timestamp: '2026-10-26T15:45:00.000Z'
      },
      {
        id: 'txn_092',
        salonId: 'salon_apex_01',
        appointmentId: 'apt_092',
        customerName: 'Devika Sen',
        amount: 3500,
        paymentMethod: 'UPI / GPay',
        status: 'completed',
        date: '2026-10-25',
        timestamp: '2026-10-25T13:00:00.000Z'
      }
    ];
    writeData('transactions.json', defaultTransactions);
  }

  // 7. Reviews
  if (!fs.existsSync(getFilePath('reviews.json'))) {
    const defaultReviews = [
      {
        id: 'rev_01',
        salonId: 'salon_apex_01',
        customerName: 'Aakash Saxena',
        rating: 5,
        comment: 'Best fade and beard line in Bandra! Karan really takes his time and understands textures. Super clean aesthetic.',
        date: '2026-10-25',
        verifiedVisit: true,
        serviceUsed: 'Executive Haircut & Styling',
        ownerReply: 'Thank you so much Aakash! Looking forward to your next visit at Apex Studio.',
        ownerReplyDate: '2026-10-25T16:00:00.000Z'
      },
      {
        id: 'rev_02',
        salonId: 'salon_apex_01',
        customerName: 'Pooja Marathe',
        rating: 5,
        comment: 'The HydraFacial glow is unreal! Priya is master of her craft and the salon hospitality is top notch.',
        date: '2026-10-22',
        verifiedVisit: true,
        serviceUsed: 'Hydra Glow Deep Facial',
        ownerReply: 'Glad you loved the facial Pooja! See you next month.',
        ownerReplyDate: '2026-10-22T19:30:00.000Z'
      },
      {
        id: 'rev_03',
        salonId: 'salon_apex_01',
        customerName: 'Ravi Teja',
        rating: 4,
        comment: 'Great haircut by Amit. The live queue was busy on Sunday afternoon, but the coffee made up for the 15 min wait.',
        date: '2026-10-18',
        verifiedVisit: true,
        serviceUsed: 'Beard Sculpt & Luxury Shave',
        ownerReply: null,
        ownerReplyDate: null
      },
      {
        id: 'rev_04',
        salonId: 'salon_apex_01',
        customerName: 'Siddharth Roy',
        rating: 5,
        comment: 'Very professional, no rush. Hair spa was intensely relaxing. Will definitely book again through UPLOOKZ.',
        date: '2026-10-12',
        verifiedVisit: true,
        serviceUsed: 'Hair Spa & Scalp Detox',
        ownerReply: 'Cheers Siddharth! Always a pleasure having you.',
        ownerReplyDate: '2026-10-12T18:00:00.000Z'
      }
    ];
    writeData('reviews.json', defaultReviews);
  }

  // 8. Notifications
  if (!fs.existsSync(getFilePath('notifications.json'))) {
    const defaultNotifications = [
      {
        id: 'notif_01',
        salonId: 'salon_apex_01',
        type: 'appointment',
        title: 'New Appointment Request',
        message: 'Rohan Joshi booked Royal Grooming Package for 06:30 PM today.',
        date: `${todayStr}T12:00:00.000Z`,
        read: false,
        link: 'appointments'
      },
      {
        id: 'notif_02',
        salonId: 'salon_apex_01',
        type: 'queue',
        title: 'Walk-In Customer Added',
        message: 'Kunal Shah joined the live queue for Head & Shoulder Massage.',
        date: `${todayStr}T14:25:00.000Z`,
        read: false,
        link: 'queue'
      },
      {
        id: 'notif_03',
        salonId: 'salon_apex_01',
        type: 'payment',
        title: 'Payment Received',
        message: 'Received ₹1,200 via Credit Card for Priya Patel appointment.',
        date: `${todayStr}T13:30:00.000Z`,
        read: true,
        link: 'analytics'
      },
      {
        id: 'notif_04',
        salonId: 'salon_apex_01',
        type: 'review',
        title: 'New 5-Star Review Received',
        message: 'Aakash Saxena left a 5-star review: "Best fade and beard line in Bandra!"',
        date: '2026-10-25T15:30:00.000Z',
        read: true,
        link: 'reviews'
      }
    ];
    writeData('notifications.json', defaultNotifications);
  }

  // 9. Blocked calendar slots
  if (!fs.existsSync(getFilePath('blocked_slots.json'))) {
    const defaultBlockedSlots = [
      {
        id: 'blk_01',
        salonId: 'salon_apex_01',
        staffId: null, // Entire salon or specific staff
        date: todayStr,
        startTime: '01:30 PM',
        endTime: '02:00 PM',
        reason: 'Staff Lunch & Sanitization Break',
        createdAt: '2026-10-28T08:00:00.000Z'
      }
    ];
    writeData('blocked_slots.json', defaultBlockedSlots);
  }

  // 10. Customer notes & preferences
  if (!fs.existsSync(getFilePath('customer_notes.json'))) {
    const defaultCustomerNotes = {
      'usr_customer_01': {
        notes: 'Low taper fade, texturize top. Prefers matte paste styling.',
        preferences: ['Scissor cut on top', 'No heavy pomade', 'Espresso drinker'],
        tags: ['VIP Regular', 'Always on time']
      },
      'usr_1792086512172_tg46h': {
        notes: 'Sensitive scalp, prefers sulfate-free organic shampoo.',
        preferences: ['Organic products only'],
        tags: ['Spa Regular']
      }
    };
    writeData('customer_notes.json', defaultCustomerNotes);
  }
}

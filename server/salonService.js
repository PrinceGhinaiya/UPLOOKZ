import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readData, writeData, initializeDatabase } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_DIR = path.join(__dirname, '..', 'public', 'uploads');

// Ensure DB is initialized
initializeDatabase();

// Helper to generate unique IDs
function generateId(prefix = 'id') {
  return `${prefix}_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
}

/**
 * Helper to parse time strings like "11:00 AM" into minutes from midnight
 */
export function timeStringToMinutes(timeStr) {
  if (!timeStr) return 0;
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return 0;
  let [_, hours, mins, meridiem] = match;
  hours = parseInt(hours, 10);
  mins = parseInt(mins, 10);
  if (meridiem) {
    meridiem = meridiem.toUpperCase();
    if (meridiem === 'PM' && hours !== 12) hours += 12;
    if (meridiem === 'AM' && hours === 12) hours = 0;
  }
  return hours * 60 + mins;
}

/**
 * Helper to format minutes from midnight to "hh:mm AM/PM"
 */
export function minutesToTimeString(totalMinutes) {
  const hours24 = Math.floor(totalMinutes / 60) % 24;
  const mins = totalMinutes % 60;
  const meridiem = hours24 >= 12 ? 'PM' : 'AM';
  let hours12 = hours24 % 12;
  if (hours12 === 0) hours12 = 12;
  const pad = (n) => (n < 10 ? `0${n}` : `${n}`);
  return `${pad(hours12)}:${pad(mins)} ${meridiem}`;
}

/**
 * Helper to get current date, time, and month in Asia/Kolkata timezone
 */
export function getNowInIST() {
  const now = new Date();
  const dateStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(now);
  const timeStr = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).format(now);
  const monthStr = dateStr.slice(0, 7);
  return { now, dateStr, timeStr, monthStr };
}

/**
 * ============================================================
 * 1. SALON PROFILE MANAGEMENT
 * ============================================================
 */
export async function getSalonByOwner(ownerId) {
  if (!ownerId) return null;
  const salons = readData('salons.json', []);
  const salon = salons.find((s) => s.ownerId === ownerId);
  return salon || null;
}

export async function getSalonById(salonId) {
  const salons = readData('salons.json', []);
  return salons.find((s) => s.id === salonId) || null;
}

export async function createSalon(ownerId, salonData) {
  const salons = readData('salons.json', []);
  const newSalon = {
    id: generateId('salon'),
    ownerId,
    name: salonData.name || 'New Salon',
    tagline: salonData.tagline || 'Premium Styling & Grooming',
    description: salonData.description || 'Welcome to our salon. We offer top tier styling and grooming services.',
    phone: salonData.phone || '',
    email: salonData.email || '',
    address: salonData.address || '',
    city: salonData.city || 'Mumbai',
    state: salonData.state || 'Maharashtra',
    pincode: salonData.pincode || '400001',
    openingTime: salonData.openingTime || '09:00 AM',
    closingTime: salonData.closingTime || '09:00 PM',
    workingDays: salonData.workingDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    holidays: salonData.holidays || [],
    amenities: salonData.amenities || ['Air Conditioning', 'Wi-Fi', 'UPI & Card Accepted'],
    specialties: salonData.specialties || ['Haircuts', 'Styling'],
    policies: salonData.policies || {
      cancellationHours: 2,
      cancellationPolicy: 'Free cancellation up to 2 hours prior to appointment.',
      lateArrivalMinutes: 15,
      lateArrivalPolicy: 'Grace period of 15 minutes applies.',
      walkInPolicy: 'Live queue priority applies.'
    },
    logo: salonData.logo || '',
    gallery: salonData.gallery || [],
    rating: 5.0,
    reviewCount: 0,
    verified: true,
    active: true,
    createdAt: new Date().toISOString()
  };

  salons.push(newSalon);
  writeData('salons.json', salons);

  // Auto-seed default staff (the owner)
  const staffList = readData('staff.json', []);
  staffList.push({
    id: generateId('stf'),
    salonId: newSalon.id,
    name: salonData.ownerName || 'Lead Stylist',
    role: 'Owner & Creative Director',
    phone: salonData.phone || '',
    email: salonData.email || '',
    avatar: '',
    assignedServiceIds: [],
    workingHours: { start: newSalon.openingTime, end: newSalon.closingTime },
    weeklyOffDays: [],
    active: true,
    isManager: true,
    rating: 5.0,
    reviewsCount: 0,
    createdAt: new Date().toISOString()
  });
  writeData('staff.json', staffList);

  // Auto-seed starter services
  const servicesList = readData('services.json', []);
  servicesList.push(
    {
      id: generateId('srv'),
      salonId: newSalon.id,
      name: 'Classic Haircut & Styling',
      category: 'Hair',
      price: 450,
      durationMinutes: 40,
      description: 'Precision cut, wash, and master style finish.',
      active: true,
      image: '',
      updatedAt: new Date().toISOString()
    },
    {
      id: generateId('srv'),
      salonId: newSalon.id,
      name: 'Beard Trim & Shape',
      category: 'Beard & Shave',
      price: 300,
      durationMinutes: 25,
      description: 'Clean line shaping and conditioning oil treatment.',
      active: true,
      image: '',
      updatedAt: new Date().toISOString()
    }
  );
  writeData('services.json', servicesList);

  return newSalon;
}

export async function updateSalonProfile(salonId, updateData) {
  const salons = readData('salons.json', []);
  const index = salons.findIndex((s) => s.id === salonId);
  if (index === -1) {
    throw new Error('Salon not found.');
  }

  // Merge allowed fields safely
  salons[index] = {
    ...salons[index],
    name: updateData.name !== undefined ? updateData.name.trim() : salons[index].name,
    tagline: updateData.tagline !== undefined ? updateData.tagline.trim() : salons[index].tagline,
    description: updateData.description !== undefined ? updateData.description.trim() : salons[index].description,
    phone: updateData.phone !== undefined ? updateData.phone.trim() : salons[index].phone,
    email: updateData.email !== undefined ? updateData.email.trim() : salons[index].email,
    address: updateData.address !== undefined ? updateData.address.trim() : salons[index].address,
    city: updateData.city !== undefined ? updateData.city.trim() : salons[index].city,
    state: updateData.state !== undefined ? updateData.state.trim() : salons[index].state,
    pincode: updateData.pincode !== undefined ? updateData.pincode.trim() : salons[index].pincode,
    openingTime: updateData.openingTime || salons[index].openingTime,
    closingTime: updateData.closingTime || salons[index].closingTime,
    workingDays: updateData.workingDays || salons[index].workingDays,
    holidays: updateData.holidays || salons[index].holidays,
    amenities: updateData.amenities || salons[index].amenities,
    specialties: updateData.specialties || salons[index].specialties,
    policies: { ...salons[index].policies, ...(updateData.policies || {}) },
    logo: updateData.logo !== undefined ? updateData.logo : salons[index].logo,
    gallery: updateData.gallery !== undefined ? updateData.gallery : salons[index].gallery,
    updatedAt: new Date().toISOString()
  };

  writeData('salons.json', salons);
  return salons[index];
}

/**
 * ============================================================
 * 2. SERVICES & PRICING
 * ============================================================
 */
export async function getServices(salonId) {
  const services = readData('services.json', []);
  return services.filter((s) => s.salonId === salonId);
}

export async function addService(salonId, serviceData) {
  if (!serviceData.name || !serviceData.price) {
    throw new Error('Service name and price are required.');
  }

  const services = readData('services.json', []);
  const newService = {
    id: generateId('srv'),
    salonId,
    name: serviceData.name.trim(),
    category: serviceData.category || 'General',
    price: parseFloat(serviceData.price) || 0,
    durationMinutes: parseInt(serviceData.durationMinutes, 10) || 30,
    description: serviceData.description ? serviceData.description.trim() : '',
    active: serviceData.active !== undefined ? Boolean(serviceData.active) : true,
    image: serviceData.image || '',
    createdAt: new Date().toISOString()
  };

  services.push(newService);
  writeData('services.json', services);
  return newService;
}

export async function updateService(salonId, serviceId, updateData) {
  const services = readData('services.json', []);
  const index = services.findIndex((s) => s.id === serviceId && s.salonId === salonId);
  if (index === -1) {
    throw new Error('Service not found.');
  }

  services[index] = {
    ...services[index],
    name: updateData.name !== undefined ? updateData.name.trim() : services[index].name,
    category: updateData.category !== undefined ? updateData.category : services[index].category,
    price: updateData.price !== undefined ? parseFloat(updateData.price) : services[index].price,
    durationMinutes:
      updateData.durationMinutes !== undefined
        ? parseInt(updateData.durationMinutes, 10)
        : services[index].durationMinutes,
    description: updateData.description !== undefined ? updateData.description.trim() : services[index].description,
    active: updateData.active !== undefined ? Boolean(updateData.active) : services[index].active,
    image: updateData.image !== undefined ? updateData.image : services[index].image,
    updatedAt: new Date().toISOString()
  };

  writeData('services.json', services);
  return services[index];
}

export async function deleteService(salonId, serviceId) {
  let services = readData('services.json', []);
  const exists = services.some((s) => s.id === serviceId && s.salonId === salonId);
  if (!exists) {
    throw new Error('Service not found.');
  }

  services = services.filter((s) => !(s.id === serviceId && s.salonId === salonId));
  writeData('services.json', services);
  return { success: true };
}

/**
 * ============================================================
 * 3. STAFF MANAGEMENT
 * ============================================================
 */
export async function getStaff(salonId) {
  const staff = readData('staff.json', []);
  return staff.filter((st) => st.salonId === salonId);
}

export async function addStaff(salonId, staffData) {
  if (!staffData.name) {
    throw new Error('Staff name is required.');
  }

  const staff = readData('staff.json', []);
  const newStaff = {
    id: generateId('stf'),
    salonId,
    name: staffData.name.trim(),
    role: staffData.role ? staffData.role.trim() : 'Stylist',
    phone: staffData.phone ? staffData.phone.trim() : '',
    email: staffData.email ? staffData.email.trim() : '',
    avatar: staffData.avatar || '',
    assignedServiceIds: staffData.assignedServiceIds || [],
    workingHours: staffData.workingHours || { start: '09:00', end: '19:00' },
    weeklyOffDays: staffData.weeklyOffDays || [],
    active: staffData.active !== undefined ? Boolean(staffData.active) : true,
    isManager: staffData.isManager !== undefined ? Boolean(staffData.isManager) : false,
    rating: 5.0,
    reviewsCount: 0,
    createdAt: new Date().toISOString()
  };

  staff.push(newStaff);
  writeData('staff.json', staff);
  return newStaff;
}

export async function updateStaff(salonId, staffId, updateData) {
  const staff = readData('staff.json', []);
  const index = staff.findIndex((st) => st.id === staffId && st.salonId === salonId);
  if (index === -1) {
    throw new Error('Staff member not found.');
  }

  staff[index] = {
    ...staff[index],
    name: updateData.name !== undefined ? updateData.name.trim() : staff[index].name,
    role: updateData.role !== undefined ? updateData.role.trim() : staff[index].role,
    phone: updateData.phone !== undefined ? updateData.phone.trim() : staff[index].phone,
    email: updateData.email !== undefined ? updateData.email.trim() : staff[index].email,
    avatar: updateData.avatar !== undefined ? updateData.avatar : staff[index].avatar,
    assignedServiceIds:
      updateData.assignedServiceIds !== undefined ? updateData.assignedServiceIds : staff[index].assignedServiceIds,
    workingHours: updateData.workingHours !== undefined ? updateData.workingHours : staff[index].workingHours,
    weeklyOffDays: updateData.weeklyOffDays !== undefined ? updateData.weeklyOffDays : staff[index].weeklyOffDays,
    active: updateData.active !== undefined ? Boolean(updateData.active) : staff[index].active,
    isManager: updateData.isManager !== undefined ? Boolean(updateData.isManager) : staff[index].isManager,
    updatedAt: new Date().toISOString()
  };

  writeData('staff.json', staff);
  return staff[index];
}

export async function deleteStaff(salonId, staffId) {
  let staff = readData('staff.json', []);
  const exists = staff.some((st) => st.id === staffId && st.salonId === salonId);
  if (!exists) {
    throw new Error('Staff member not found.');
  }

  staff = staff.filter((st) => !(st.id === staffId && st.salonId === salonId));
  writeData('staff.json', staff);
  return { success: true };
}

/**
 * Helper to get current date and time in a specific timezone (defaults to Asia/Kolkata)
 */
export function getNowInTimezone(timeZone = 'Asia/Kolkata') {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const parts = formatter.formatToParts(now);
  const partMap = {};
  for (const p of parts) partMap[p.type] = p.value;

  const year = partMap.year;
  const month = partMap.month;
  const day = partMap.day;
  const hour = parseInt(partMap.hour, 10);
  const minute = parseInt(partMap.minute, 10);

  const dateStr = `${year}-${month}-${day}`;
  const minutesSinceMidnight = hour * 60 + minute;
  const dayName = new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'long' }).format(now);

  return { dateStr, hour, minute, minutesSinceMidnight, dayName };
}

/**
 * ============================================================
 * 4. APPOINTMENT MANAGEMENT & CONFLICT CHECKING
 * ============================================================
 */
export async function checkAvailability(salonId, date, timeStr, durationMinutes, staffId = null, excludeAptId = null) {
  const startMins = timeStringToMinutes(timeStr);
  const endMins = startMins + durationMinutes;

  // 1. Timezone and Past Date / Time Validation (Asia/Kolkata)
  const now = getNowInTimezone('Asia/Kolkata');
  if (date < now.dateStr) {
    return { available: false, reason: 'Cannot book an appointment for a past date.' };
  }
  if (date === now.dateStr && startMins <= now.minutesSinceMidnight + 10) {
    return {
      available: false,
      reason: 'The selected time slot has already passed for today. Please select an upcoming slot.'
    };
  }

  // 2. Check Salon Working Hours & Working Days
  const salon = await getSalonById(salonId);
  if (salon) {
    // Check closed day of week
    const parts = date.split('-').map(Number);
    if (parts.length === 3) {
      const dateObj = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2], 12, 0, 0));
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayOfWeek = dayNames[dateObj.getUTCDay()];
      if (salon.workingDays && Array.isArray(salon.workingDays) && salon.workingDays.length > 0) {
        if (!salon.workingDays.includes(dayOfWeek)) {
          return { available: false, reason: `${salon.name} is closed on ${dayOfWeek}s.` };
        }
      }
      if (salon.holidays && Array.isArray(salon.holidays) && salon.holidays.includes(date)) {
        return { available: false, reason: `${salon.name} is closed for holiday on this date.` };
      }
    }

    const salonOpen = timeStringToMinutes(salon.openingTime || '09:00 AM');
    const salonClose = timeStringToMinutes(salon.closingTime || '09:00 PM');
    if (startMins < salonOpen || endMins > salonClose) {
      return {
        available: false,
        reason: `Salon operating hours are ${salon.openingTime || '09:00 AM'} to ${salon.closingTime || '09:00 PM'}.`
      };
    }
  }

  // 3. Check Blocked Slots
  const blockedSlots = readData('blocked_slots.json', []);
  const hasBlock = blockedSlots.some((blk) => {
    if (blk.salonId !== salonId || blk.date !== date) return false;
    if (blk.staffId && staffId && blk.staffId !== staffId) return false;
    const bStart = timeStringToMinutes(blk.startTime);
    const bEnd = timeStringToMinutes(blk.endTime);
    return Math.max(startMins, bStart) < Math.min(endMins, bEnd);
  });

  if (hasBlock) {
    return {
      available: false,
      reason: 'The selected time slot overlaps with a blocked break or maintenance period.'
    };
  }

  // 4. Check Conflicting Appointments
  const appointments = readData('appointments.json', []);

  // If a specific staff member is requested
  if (staffId && staffId !== 'any') {
    const conflictApt = appointments.find((apt) => {
      if (apt.salonId !== salonId || apt.date !== date) return false;
      if (apt.status === 'cancelled') return false;
      if (excludeAptId && apt.id === excludeAptId) return false;
      if (apt.staffId !== staffId) return false;

      const aStart = timeStringToMinutes(apt.time);
      const aEnd = aStart + (apt.durationMinutes || 30);
      return Math.max(startMins, aStart) < Math.min(endMins, aEnd);
    });

    if (conflictApt) {
      return {
        available: false,
        conflictAppointment: conflictApt,
        reason: `Slot conflicts with an existing appointment with ${conflictApt.staffName || 'this stylist'}.`
      };
    }
  } else {
    // If 'any' stylist requested, check overall staff capacity
    const allStaff = readData('staff.json', []).filter((s) => s.salonId === salonId && s.active !== false);
    const staffCapacity = allStaff.length > 0 ? allStaff.length : 3;

    const overlappingCount = appointments.filter((apt) => {
      if (apt.salonId !== salonId || apt.date !== date) return false;
      if (apt.status === 'cancelled') return false;
      if (excludeAptId && apt.id === excludeAptId) return false;

      const aStart = timeStringToMinutes(apt.time);
      const aEnd = aStart + (apt.durationMinutes || 30);
      return Math.max(startMins, aStart) < Math.min(endMins, aEnd);
    }).length;

    if (overlappingCount >= staffCapacity) {
      return {
        available: false,
        reason: 'All stylists are fully booked for this time slot. Please select another slot.'
      };
    }
  }

  return { available: true };
}

export async function getAppointments(salonId, filters = {}) {
  let appointments = readData('appointments.json', []);
  appointments = appointments.filter((a) => a.salonId === salonId);

  if (filters.date) {
    appointments = appointments.filter((a) => a.date === filters.date);
  }
  if (filters.status && filters.status !== 'all') {
    appointments = appointments.filter((a) => a.status === filters.status);
  }
  if (filters.staffId && filters.staffId !== 'all') {
    appointments = appointments.filter((a) => a.staffId === filters.staffId);
  }
  if (filters.search) {
    const q = filters.search.toLowerCase();
    appointments = appointments.filter(
      (a) =>
        (a.customerName && a.customerName.toLowerCase().includes(q)) ||
        (a.customerPhone && a.customerPhone.includes(q)) ||
        (a.serviceNames && a.serviceNames.some((sn) => sn.toLowerCase().includes(q)))
    );
  }

  // Sort by date desc, then time asc
  appointments.sort((a, b) => {
    if (a.date !== b.date) return b.date.localeCompare(a.date);
    return timeStringToMinutes(a.time) - timeStringToMinutes(b.time);
  });

  return appointments;
}

export async function createAppointment(salonId, appointmentData) {
  if (!salonId) {
    throw new Error('Salon ID is required to book an appointment.');
  }

  // 1. Validate salon existence and active status
  const salons = readData('salons.json', []);
  const targetSalon = salons.find((s) => s.id === salonId && s.active !== false);
  if (!targetSalon) {
    throw new Error('Selected salon does not exist or is inactive.');
  }

  const { customerName, customerPhone, customerEmail, serviceIds, staffId, date, time, notes } = appointmentData;

  if (!customerName || !date || !time) {
    throw new Error('Customer name, date, and time are required.');
  }

  // 2. Validate services and ensure they strictly belong to THIS salon
  const allServices = readData('services.json', []);
  let selectedServices = [];
  if (serviceIds && Array.isArray(serviceIds) && serviceIds.length > 0) {
    selectedServices = allServices.filter((s) => serviceIds.includes(s.id) && s.active !== false);
    for (const reqServiceId of serviceIds) {
      const match = selectedServices.find((s) => s.id === reqServiceId);
      if (!match) {
        throw new Error(`Service ID "${reqServiceId}" was not found or is inactive.`);
      }
      if (match.salonId !== salonId) {
        throw new Error(`Service "${match.name}" belongs to another salon and cannot be booked at ${targetSalon.name}.`);
      }
    }
  }

  const serviceNames = selectedServices.length > 0
    ? selectedServices.map((s) => s.name)
    : [appointmentData.serviceName || 'Custom Grooming Service'];
  const durationMinutes = selectedServices.length > 0
    ? selectedServices.reduce((sum, s) => sum + (s.durationMinutes || 30), 0)
    : (appointmentData.durationMinutes || 30);
  const totalAmount = selectedServices.length > 0
    ? selectedServices.reduce((sum, s) => sum + (s.price || 0), 0)
    : (appointmentData.totalAmount !== undefined ? appointmentData.totalAmount : 0);

  // 3. Validate staff member strictly belongs to THIS salon
  let staffName = 'Any Available Stylist';
  if (staffId) {
    const allStaff = readData('staff.json', []);
    const foundStaff = allStaff.find((st) => st.id === staffId);
    if (!foundStaff) {
      throw new Error(`Stylist ID "${staffId}" was not found.`);
    }
    if (foundStaff.salonId !== salonId) {
      throw new Error(`Stylist "${foundStaff.name}" does not belong to ${targetSalon.name}.`);
    }
    staffName = foundStaff.name;
  }

  // 4. Validate server availability & double-booking prevention with Asia/Kolkata timezone buffer
  const avail = await checkAvailability(salonId, date, time, durationMinutes, staffId);
  if (!avail.available) {
    throw new Error(avail.reason);
  }

  const appointments = readData('appointments.json', []);
  const newAppointment = {
    id: generateId('apt'),
    salonId,
    salonName: targetSalon.name,
    customerId: appointmentData.customerId || generateId('cust'),
    customerName: customerName.trim(),
    customerPhone: customerPhone ? customerPhone.trim() : '',
    customerEmail: customerEmail ? customerEmail.trim() : '',
    serviceIds: serviceIds || [],
    serviceNames,
    staffId: staffId || null,
    staffName,
    date,
    time,
    durationMinutes,
    totalAmount,
    status: appointmentData.status || 'confirmed',
    paymentStatus: appointmentData.paymentStatus || 'pending',
    paymentMethod: appointmentData.paymentMethod || 'Pay at Salon',
    notes: notes ? notes.trim() : '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  appointments.push(newAppointment);
  writeData('appointments.json', appointments);

  // Create notification for salon owner
  createNotification(salonId, {
    type: 'appointment',
    title: 'New Appointment Booked',
    message: `${customerName} booked ${newAppointment.serviceNames.join(', ')} for ${date} at ${time}.`,
    link: 'appointments'
  });

  return newAppointment;
}

export async function updateAppointmentStatus(salonId, appointmentId, status, notes = '', paymentData = null) {
  const appointments = readData('appointments.json', []);
  const index = appointments.findIndex((a) => a.id === appointmentId && a.salonId === salonId);
  if (index === -1) {
    throw new Error('Appointment not found.');
  }

  const prevStatus = appointments[index].status || 'confirmed';

  if (status === prevStatus) {
    if (notes) appointments[index].notes = notes;
    writeData('appointments.json', appointments);
    return appointments[index];
  }

  // Terminal states cannot be changed
  if (prevStatus === 'completed') {
    throw new Error('Cannot change status of a completed appointment.');
  }
  if (prevStatus === 'cancelled') {
    throw new Error('Cannot change status of a cancelled appointment.');
  }

  // Allowed transitions across complete appointment lifecycle
  const allowedTransitions = {
    pending: ['confirmed', 'arrived', 'cancelled'],
    confirmed: ['arrived', 'in_service', 'completed', 'cancelled'],
    arrived: ['in_service', 'completed', 'confirmed', 'cancelled'],
    in_service: ['completed', 'cancelled']
  };

  const validNext = allowedTransitions[prevStatus];
  if (!validNext || !validNext.includes(status)) {
    throw new Error(`Invalid status transition from "${prevStatus}" to "${status}".`);
  }

  appointments[index].status = status;
  appointments[index].updatedAt = new Date().toISOString();
  if (notes) appointments[index].notes = notes;

  // Track timestamps for lifecycle milestones
  if (status === 'arrived') {
    const ist = getNowInIST();
    appointments[index].arrivedAt = `${ist.dateStr} ${ist.timeStr}`;
    createNotification(salonId, {
      type: 'appointment',
      title: 'Customer Arrived',
      message: `${appointments[index].customerName} has arrived at the salon for their appointment.`,
      link: 'appointments'
    });
  }

  if (status === 'in_service') {
    const ist = getNowInIST();
    appointments[index].serviceStartedAt = `${ist.dateStr} ${ist.timeStr}`;
  }

  if (status === 'completed') {
    const ist = getNowInIST();
    appointments[index].completedAt = `${ist.dateStr} ${ist.timeStr}`;
  }

  // Handle optional explicit payment recording upon completion
  if (status === 'completed' && paymentData && paymentData.paymentStatus === 'paid') {
    appointments[index].paymentStatus = 'paid';
    if (paymentData.paymentMethod) appointments[index].paymentMethod = paymentData.paymentMethod;
    const ist = getNowInIST();
    recordTransaction({
      salonId,
      appointmentId,
      customerName: appointments[index].customerName,
      amount: paymentData.amount !== undefined ? parseFloat(paymentData.amount) : appointments[index].totalAmount,
      paymentMethod: appointments[index].paymentMethod || 'Cash',
      status: 'completed',
      date: ist.dateStr
    });
  }

  writeData('appointments.json', appointments);

  // If cancelled, notify
  if (status === 'cancelled') {
    createNotification(salonId, {
      type: 'appointment',
      title: 'Appointment Cancelled',
      message: `Appointment for ${appointments[index].customerName} on ${appointments[index].date} was marked cancelled.`,
      link: 'appointments'
    });
  }

  return appointments[index];
}

export async function updateAppointmentPaymentStatus(salonId, appointmentId, paymentStatus, paymentMethod = 'Cash', customAmount = null) {
  const allowed = ['unpaid', 'pending', 'paid', 'refunded'];
  if (!allowed.includes(paymentStatus)) {
    throw new Error(`Invalid payment status "${paymentStatus}". Allowed: ${allowed.join(', ')}`);
  }

  const appointments = readData('appointments.json', []);
  const index = appointments.findIndex((a) => a.id === appointmentId && a.salonId === salonId);
  if (index === -1) {
    throw new Error('Appointment not found.');
  }

  const apt = appointments[index];
  apt.paymentStatus = paymentStatus;
  if (paymentMethod) apt.paymentMethod = paymentMethod;
  apt.updatedAt = new Date().toISOString();

  const finalAmount = customAmount !== null && customAmount !== undefined && !isNaN(customAmount)
    ? parseFloat(customAmount)
    : (apt.totalAmount || 0);

  const ist = getNowInIST();

  if (paymentStatus === 'paid') {
    recordTransaction({
      salonId,
      appointmentId,
      customerName: apt.customerName,
      amount: finalAmount,
      paymentMethod: apt.paymentMethod || 'Cash',
      status: 'completed',
      date: ist.dateStr
    });
  } else if (paymentStatus === 'refunded') {
    recordTransaction({
      salonId,
      appointmentId,
      customerName: apt.customerName,
      amount: -Math.abs(finalAmount),
      paymentMethod: apt.paymentMethod || 'Refund',
      status: 'refunded',
      date: ist.dateStr
    });
  }

  writeData('appointments.json', appointments);
  return apt;
}

export async function rescheduleAppointment(salonId, appointmentId, newDate, newTime, newStaffId = null) {
  const appointments = readData('appointments.json', []);
  const index = appointments.findIndex((a) => a.id === appointmentId && a.salonId === salonId);
  if (index === -1) {
    throw new Error('Appointment not found.');
  }

  const apt = appointments[index];
  const targetStaffId = newStaffId !== null ? newStaffId : apt.staffId;

  // Check availability
  const avail = await checkAvailability(
    salonId,
    newDate,
    newTime,
    apt.durationMinutes || 45,
    targetStaffId,
    appointmentId
  );
  if (!avail.available) {
    throw new Error(avail.reason);
  }

  apt.date = newDate;
  apt.time = newTime;
  if (newStaffId) {
    apt.staffId = newStaffId;
    const allStaff = readData('staff.json', []);
    const st = allStaff.find((s) => s.id === newStaffId);
    if (st) apt.staffName = st.name;
  }
  apt.status = 'confirmed';
  apt.updatedAt = new Date().toISOString();

  writeData('appointments.json', appointments);

  createNotification(salonId, {
    type: 'appointment',
    title: 'Appointment Rescheduled',
    message: `${apt.customerName}'s appointment rescheduled to ${newDate} at ${newTime}.`,
    link: 'appointments'
  });

  return apt;
}

/**
 * ============================================================
 * 5. WALK-IN CUSTOMERS & LIVE QUEUE
 * ============================================================
 */
export async function getQueue(salonId) {
  const queue = readData('queue.json', []);
  const salonQueue = queue.filter((q) => q.salonId === salonId);

  // Re-calculate dynamic wait estimates based on positions and active staff
  const staff = readData('staff.json', []).filter((s) => s.salonId === salonId && s.active);
  const activeStaffCount = Math.max(staff.length, 1);

  // Separate active queue (waiting + in_service) from completed/cancelled
  const waitingEntries = salonQueue.filter((q) => q.status === 'waiting');
  waitingEntries.sort((a, b) => (a.position || 999) - (b.position || 999));

  let cumulativeDuration = 0;
  waitingEntries.forEach((entry, idx) => {
    entry.position = idx + 1;
    // Estimate: prior cumulative time / active staff count
    const wait = Math.round(cumulativeDuration / activeStaffCount / 5) * 5;
    entry.estimatedWaitMinutes = Math.max(wait, 5);
    cumulativeDuration += 30; // standard average walk-in service duration
  });

  writeData('queue.json', queue);
  return salonQueue;
}

export async function addWalkInToQueue(salonId, queueData) {
  const { customerName, customerPhone, serviceId, staffId, notes } = queueData;
  if (!customerName) {
    throw new Error('Customer name is required.');
  }

  const queue = readData('queue.json', []);
  const salonQueue = queue.filter((q) => q.salonId === salonId && (q.status === 'waiting' || q.status === 'in_service'));
  const waitingCount = salonQueue.filter((q) => q.status === 'waiting').length;

  let serviceName = 'Haircut & Styling';
  if (serviceId) {
    const services = readData('services.json', []);
    const found = services.find((s) => s.id === serviceId);
    if (found) serviceName = found.name;
  }

  let staffName = 'Next Available';
  if (staffId) {
    const staff = readData('staff.json', []);
    const found = staff.find((s) => s.id === staffId);
    if (found) staffName = found.name;
  }

  const now = new Date();
  const arrivalTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

  const newEntry = {
    id: generateId('q'),
    salonId,
    customerName: customerName.trim(),
    customerPhone: customerPhone ? customerPhone.trim() : '',
    serviceId: serviceId || null,
    serviceName,
    staffId: staffId || null,
    staffName,
    position: waitingCount + 1,
    status: 'waiting',
    arrivalTime,
    startedAt: null,
    completedAt: null,
    estimatedWaitMinutes: Math.max((waitingCount + 1) * 15, 5),
    notes: notes ? notes.trim() : '',
    createdAt: now.toISOString()
  };

  queue.push(newEntry);
  writeData('queue.json', queue);

  createNotification(salonId, {
    type: 'queue',
    title: 'Walk-In Added to Queue',
    message: `${customerName} joined the live queue (Position #${newEntry.position}).`,
    link: 'queue'
  });

  return newEntry;
}

export async function updateQueueStatus(salonId, queueId, status, reason = '') {
  const queue = readData('queue.json', []);
  const index = queue.findIndex((q) => q.id === queueId && q.salonId === salonId);
  if (index === -1) {
    throw new Error('Queue entry not found.');
  }

  const entry = queue[index];
  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

  entry.status = status;
  if (status === 'in_service') {
    entry.startedAt = timeStr;
    entry.estimatedWaitMinutes = 0;
  } else if (status === 'completed') {
    entry.completedAt = timeStr;
    entry.position = 0;
    // Record walk-in transaction
    recordTransaction({
      salonId,
      appointmentId: null,
      customerName: entry.customerName,
      amount: 500, // standard walk-in ticket
      paymentMethod: 'Cash / UPI',
      status: 'completed',
      date: now.toISOString().split('T')[0]
    });
  } else if (status === 'cancelled') {
    entry.position = 0;
    entry.cancellationReason = reason || 'Customer left / Cancelled';
  }

  // Re-sequence remaining waiting queue
  const waitingEntries = queue.filter((q) => q.salonId === salonId && q.status === 'waiting');
  waitingEntries.sort((a, b) => a.position - b.position);
  waitingEntries.forEach((item, idx) => {
    item.position = idx + 1;
    item.estimatedWaitMinutes = Math.max((idx + 1) * 15, 5);
  });

  writeData('queue.json', queue);
  return entry;
}

export async function reorderQueue(salonId, queueId, direction) {
  const queue = readData('queue.json', []);
  const waiting = queue
    .filter((q) => q.salonId === salonId && q.status === 'waiting')
    .sort((a, b) => a.position - b.position);

  const idx = waiting.findIndex((q) => q.id === queueId);
  if (idx === -1) throw new Error('Queue item not found or not waiting.');

  if (direction === 'up' && idx > 0) {
    const temp = waiting[idx].position;
    waiting[idx].position = waiting[idx - 1].position;
    waiting[idx - 1].position = temp;
  } else if (direction === 'down' && idx < waiting.length - 1) {
    const temp = waiting[idx].position;
    waiting[idx].position = waiting[idx + 1].position;
    waiting[idx + 1].position = temp;
  }

  writeData('queue.json', queue);
  return waiting;
}

/**
 * ============================================================
 * 6. CUSTOMER MANAGEMENT (Salon Scoped)
 * ============================================================
 */
export async function getCustomersForSalon(salonId) {
  const appointments = readData('appointments.json', []).filter((a) => a.salonId === salonId);
  const queue = readData('queue.json', []).filter((q) => q.salonId === salonId);
  const customerNotes = readData('customer_notes.json', {});

  const clientMap = new Map();

  // Aggregate from appointments
  appointments.forEach((apt) => {
    const key = apt.customerPhone || apt.customerId || apt.customerName;
    if (!key) return;

    if (!clientMap.has(key)) {
      clientMap.set(key, {
        id: apt.customerId || key,
        name: apt.customerName,
        phone: apt.customerPhone || '',
        email: apt.customerEmail || '',
        totalVisits: 0,
        totalSpend: 0,
        lastVisitDate: apt.date,
        servicesUsed: new Set(),
        appointments: [],
        notes: customerNotes[apt.customerId]?.notes || '',
        preferences: customerNotes[apt.customerId]?.preferences || [],
        tags: customerNotes[apt.customerId]?.tags || []
      });
    }

    const c = clientMap.get(key);
    c.appointments.push(apt);
    if (apt.status === 'completed') {
      c.totalVisits += 1;
      c.totalSpend += apt.totalAmount || 0;
    }
    if (apt.serviceNames) {
      apt.serviceNames.forEach((s) => c.servicesUsed.add(s));
    }
    if (apt.date > c.lastVisitDate) {
      c.lastVisitDate = apt.date;
    }
  });

  // Aggregate from walk-in queue
  queue.forEach((q) => {
    if (!q.customerPhone && !q.customerName) return;
    const key = q.customerPhone || q.customerName;
    if (!clientMap.has(key)) {
      clientMap.set(key, {
        id: key,
        name: q.customerName,
        phone: q.customerPhone || '',
        email: '',
        totalVisits: q.status === 'completed' ? 1 : 0,
        totalSpend: q.status === 'completed' ? 500 : 0,
        lastVisitDate: q.createdAt.split('T')[0],
        servicesUsed: new Set([q.serviceName]),
        appointments: [],
        notes: q.notes || '',
        preferences: [],
        tags: ['Walk-in Client']
      });
    }
  });

  // Convert sets to arrays and return sorted by total spend/visits
  const result = Array.from(clientMap.values()).map((c) => ({
    ...c,
    servicesUsed: Array.from(c.servicesUsed)
  }));

  result.sort((a, b) => b.totalVisits - a.totalVisits || b.totalSpend - a.totalSpend);
  return result;
}

export async function updateCustomerNotes(salonId, customerId, notesData) {
  const notesStore = readData('customer_notes.json', {});
  notesStore[customerId] = {
    ...notesStore[customerId],
    notes: notesData.notes !== undefined ? notesData.notes : (notesStore[customerId]?.notes || ''),
    preferences: notesData.preferences || (notesStore[customerId]?.preferences || []),
    tags: notesData.tags || (notesStore[customerId]?.tags || [])
  };
  writeData('customer_notes.json', notesStore);
  return notesStore[customerId];
}

/**
 * ============================================================
 * 7. TRANSACTIONS & BUSINESS ANALYTICS
 * ============================================================
 */
export function recordTransaction(txData) {
  const transactions = readData('transactions.json', []);
  const ist = getNowInIST();

  if (txData.appointmentId) {
    const existingIndex = transactions.findIndex(
      (t) => t.appointmentId === txData.appointmentId && t.salonId === txData.salonId
    );
    if (existingIndex !== -1) {
      const existing = transactions[existingIndex];
      existing.amount = parseFloat(txData.amount !== undefined ? txData.amount : existing.amount) || 0;
      existing.currency = txData.currency || existing.currency || 'INR';
      existing.paymentMethod = txData.paymentMethod || existing.paymentMethod || 'Cash';
      existing.status = txData.status || existing.status || 'completed';
      existing.customerName = txData.customerName || existing.customerName;
      if (txData.payuTxnId) existing.payuTxnId = txData.payuTxnId;
      if (txData.payuPaymentId) existing.payuPaymentId = txData.payuPaymentId;
      if (txData.payuMode) existing.payuMode = txData.payuMode;
      existing.updatedAt = new Date().toISOString();
      writeData('transactions.json', transactions);
      return existing;
    }
  }

  const newTx = {
    id: generateId('txn'),
    salonId: txData.salonId,
    appointmentId: txData.appointmentId || null,
    bookingReference: txData.appointmentId || txData.bookingReference || '',
    customerName: txData.customerName || 'Customer',
    amount: parseFloat(txData.amount) || 0,
    currency: txData.currency || 'INR',
    paymentMethod: txData.paymentMethod || 'Cash',
    payuTxnId: txData.payuTxnId || null,
    payuPaymentId: txData.payuPaymentId || null,
    payuMode: txData.payuMode || null,
    status: txData.status || 'completed',
    date: txData.date || ist.dateStr,
    timestamp: txData.timestamp || new Date().toISOString(),
    createdAt: new Date().toISOString()
  };

  transactions.push(newTx);
  writeData('transactions.json', transactions);
  return newTx;
}

export async function getAnalytics(salonId, timeframe = 'month', options = {}) {
  const allTx = readData('transactions.json', []).filter((t) => t.salonId === salonId && t.status === 'completed');
  const allApts = readData('appointments.json', []).filter((a) => a.salonId === salonId);
  const allStaff = readData('staff.json', []).filter((s) => s.salonId === salonId);

  const ist = getNowInIST();
  const todayStr = ist.dateStr; // e.g. 2026-10-30 in Asia/Kolkata
  const currentMonthStr = ist.monthStr; // e.g. 2026-10

  // 1. Calculate Revenue Breakdown dynamically in Asia/Kolkata
  // Today's revenue: completed transactions where date === todayStr (or timestamp matches today)
  const todayRevenue = allTx
    .filter((t) => t.date === todayStr || (t.timestamp && t.timestamp.startsWith(todayStr)))
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  // Rolling 7 days revenue (ending today)
  const past7Days = [];
  const nowMs = Date.now();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(nowMs - i * 24 * 60 * 60 * 1000);
    const dStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(d);
    const dayName = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Kolkata', weekday: 'short' }).format(d);
    past7Days.push({ date: dStr, day: dayName });
  }
  const weekStartStr = past7Days[0].date;

  const weekRevenue = allTx
    .filter((t) => {
      const txDate = t.date || (t.timestamp ? t.timestamp.slice(0, 10) : '');
      return txDate >= weekStartStr && txDate <= todayStr;
    })
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  // Month revenue (current month)
  const monthRevenue = allTx
    .filter((t) => {
      const txDate = t.date || (t.timestamp ? t.timestamp.slice(0, 10) : '');
      return txDate.startsWith(currentMonthStr);
    })
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  // Custom date range revenue if provided
  let customRevenue = 0;
  if (options.startDate && options.endDate) {
    customRevenue = allTx
      .filter((t) => {
        const txDate = t.date || (t.timestamp ? t.timestamp.slice(0, 10) : '');
        return txDate >= options.startDate && txDate <= options.endDate;
      })
      .reduce((sum, t) => sum + (t.amount || 0), 0);
  }

  // Total Lifetime Revenue
  const totalRevenue = allTx.reduce((sum, t) => sum + (t.amount || 0), 0);

  // 2. Appointment metrics
  const totalAppointments = allApts.length;
  const completedAppointments = allApts.filter((a) => a.status === 'completed').length;
  const completedPaidAppointments = allApts.filter((a) => a.status === 'completed' && a.paymentStatus === 'paid').length;
  const cancelledAppointments = allApts.filter((a) => a.status === 'cancelled').length;
  const completionRate = totalAppointments > 0 ? Math.round((completedAppointments / totalAppointments) * 100) : 0;

  // 3. Service Breakdown & Popular Services (calculated strictly from paid completed appointments)
  const serviceStats = new Map();
  allApts.forEach((apt) => {
    if (apt.serviceNames && Array.isArray(apt.serviceNames)) {
      apt.serviceNames.forEach((sName) => {
        const cur = serviceStats.get(sName) || { name: sName, bookings: 0, revenue: 0, paidBookings: 0 };
        cur.bookings += 1;
        if (apt.status === 'completed' && apt.paymentStatus === 'paid') {
          cur.paidBookings += 1;
          cur.revenue += Math.round((apt.totalAmount || 0) / apt.serviceNames.length);
        }
        serviceStats.set(sName, cur);
      });
    }
  });
  const popularServices = Array.from(serviceStats.values()).sort((a, b) => b.revenue - a.revenue || b.bookings - a.bookings).slice(0, 5);

  // 4. Staff Performance (strictly from paid completed bookings)
  const staffMetrics = allStaff.map((st) => {
    const stApts = allApts.filter((a) => a.staffId === st.id);
    const stCompletedPaid = stApts.filter((a) => a.status === 'completed' && a.paymentStatus === 'paid');
    const revenue = stCompletedPaid.reduce((sum, a) => sum + (a.totalAmount || 0), 0);
    return {
      id: st.id,
      name: st.name,
      role: st.role,
      appointmentsHandled: stCompletedPaid.length,
      revenueGenerated: revenue,
      rating: st.rating || 5.0
    };
  });

  // 5. Customer Return Rate
  const customerVisits = new Map();
  allApts
    .filter((a) => a.status === 'completed')
    .forEach((a) => {
      const key = a.customerPhone || a.customerName;
      if (key) {
        customerVisits.set(key, (customerVisits.get(key) || 0) + 1);
      }
    });
  const totalCustomers = customerVisits.size;
  const repeatCustomers = Array.from(customerVisits.values()).filter((v) => v > 1).length;
  const returnRate = totalCustomers > 0 ? Math.round((repeatCustomers / totalCustomers) * 100) : 0;

  // 6. Dynamic Rolling 7-Day Revenue Trends
  const trends = past7Days.map(({ date, day }) => {
    const dayTotal = allTx
      .filter((t) => t.date === date || (t.timestamp && t.timestamp.startsWith(date)))
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    return { date, day, revenue: dayTotal };
  });

  return {
    todayRevenue,
    weekRevenue,
    monthRevenue,
    customRevenue,
    totalRevenue,
    totalAppointments,
    completedAppointments,
    completedPaidAppointments,
    cancelledAppointments,
    completionRate,
    returnRate,
    popularServices,
    staffMetrics,
    revenueTrends: trends,
    currentDate: todayStr,
    currentMonth: currentMonthStr,
    transactions: [...allTx].sort((a, b) => (b.timestamp || b.date || '').localeCompare(a.timestamp || a.date || '')).slice(0, 25)
  };
}

/**
 * ============================================================
 * 8. REVIEWS & CUSTOMER FEEDBACK
 * ============================================================
 */
export async function getReviews(salonId) {
  const reviews = readData('reviews.json', []).filter((r) => r.salonId === salonId);
  const totalReviews = reviews.length;
  const averageRating =
    totalReviews > 0 ? (reviews.reduce((sum, r) => sum + (r.rating || 5), 0) / totalReviews).toFixed(1) : '5.0';

  const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach((r) => {
    const rating = Math.min(Math.max(Math.round(r.rating || 5), 1), 5);
    distribution[rating] = (distribution[rating] || 0) + 1;
  });

  return {
    averageRating: parseFloat(averageRating),
    totalReviews,
    ratingDistribution: distribution,
    reviews
  };
}

export async function replyToReview(salonId, reviewId, replyText) {
  if (!replyText || !replyText.trim()) {
    throw new Error('Reply message cannot be empty.');
  }

  const reviews = readData('reviews.json', []);
  const index = reviews.findIndex((r) => r.id === reviewId && r.salonId === salonId);
  if (index === -1) {
    throw new Error('Review not found.');
  }

  reviews[index].ownerReply = replyText.trim();
  reviews[index].ownerReplyDate = new Date().toISOString();
  writeData('reviews.json', reviews);

  return reviews[index];
}

/**
 * ============================================================
 * 9. NOTIFICATIONS
 * ============================================================
 */
export function createNotification(salonId, notifData) {
  const notifications = readData('notifications.json', []);
  const newNotif = {
    id: generateId('notif'),
    salonId,
    type: notifData.type || 'system',
    title: notifData.title || 'Notification',
    message: notifData.message || '',
    date: new Date().toISOString(),
    read: false,
    link: notifData.link || 'overview'
  };
  notifications.unshift(newNotif);
  writeData('notifications.json', notifications.slice(0, 50)); // keep last 50
  return newNotif;
}

export async function getNotifications(salonId) {
  const notifications = readData('notifications.json', []);
  return notifications.filter((n) => n.salonId === salonId);
}

export async function markNotificationRead(salonId, notifId) {
  const notifications = readData('notifications.json', []);
  const notif = notifications.find((n) => n.id === notifId && n.salonId === salonId);
  if (notif) {
    notif.read = true;
    writeData('notifications.json', notifications);
  }
  return notif;
}

export async function markAllNotificationsRead(salonId) {
  const notifications = readData('notifications.json', []);
  notifications.forEach((n) => {
    if (n.salonId === salonId) n.read = true;
  });
  writeData('notifications.json', notifications);
  return { success: true };
}

/**
 * ============================================================
 * 10. BLOCKED CALENDAR SLOTS
 * ============================================================
 */
export async function getBlockedSlots(salonId, date = null) {
  let slots = readData('blocked_slots.json', []).filter((b) => b.salonId === salonId);
  if (date) slots = slots.filter((b) => b.date === date);
  return slots;
}

export async function addBlockedSlot(salonId, slotData) {
  const { date, startTime, endTime, reason, staffId } = slotData;
  if (!date || !startTime || !endTime) {
    throw new Error('Date, start time, and end time are required.');
  }

  const slots = readData('blocked_slots.json', []);
  const newSlot = {
    id: generateId('blk'),
    salonId,
    staffId: staffId || null,
    date,
    startTime,
    endTime,
    reason: reason ? reason.trim() : 'Blocked Time',
    createdAt: new Date().toISOString()
  };

  slots.push(newSlot);
  writeData('blocked_slots.json', slots);
  return newSlot;
}

export async function deleteBlockedSlot(salonId, slotId) {
  let slots = readData('blocked_slots.json', []);
  slots = slots.filter((s) => !(s.id === slotId && s.salonId === salonId));
  writeData('blocked_slots.json', slots);
  return { success: true };
}

/**
 * ============================================================
 * 11. CUSTOMER INTEGRATION & DISCOVERY
 * ============================================================
 */

export async function getAvailableSlots(salonId, date, durationMinutes = 45, staffId = null) {
  const salon = await getSalonById(salonId);
  if (!salon) {
    throw new Error('Salon not found.');
  }

  const now = getNowInTimezone('Asia/Kolkata');
  if (date < now.dateStr) {
    return { slots: [], isClosed: true, closedReason: 'Selected date is in the past.', totalAvailable: 0 };
  }

  // Check working days
  const parts = date.split('-').map(Number);
  if (parts.length === 3) {
    const dateObj = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2], 12, 0, 0));
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayOfWeek = dayNames[dateObj.getUTCDay()];
    if (salon.workingDays && Array.isArray(salon.workingDays) && salon.workingDays.length > 0) {
      if (!salon.workingDays.includes(dayOfWeek)) {
        return {
          slots: [],
          isClosed: true,
          closedReason: `${salon.name} is closed on ${dayOfWeek}s. Please select another date.`,
          totalAvailable: 0
        };
      }
    }
    if (salon.holidays && Array.isArray(salon.holidays) && salon.holidays.includes(date)) {
      return {
        slots: [],
        isClosed: true,
        closedReason: `${salon.name} is closed for holiday on this date.`,
        totalAvailable: 0
      };
    }
  }

  const openMins = timeStringToMinutes(salon.openingTime || '09:00 AM');
  const closeMins = timeStringToMinutes(salon.closingTime || '09:00 PM');
  const duration = parseInt(durationMinutes, 10) || 45;

  const slots = [];
  for (let m = openMins; m + duration <= closeMins; m += 30) {
    const timeStr = minutesToTimeString(m);
    const avail = await checkAvailability(salonId, date, timeStr, duration, staffId);
    slots.push({
      time: timeStr,
      minutes: m,
      available: avail.available,
      reason: avail.available ? null : avail.reason
    });
  }

  const totalAvailable = slots.filter((s) => s.available).length;
  return {
    slots,
    isClosed: false,
    closedReason: null,
    totalAvailable
  };
}

/**
 * Check if a salon is currently open in Asia/Kolkata timezone based on working hours, days, and holidays
 */
export function isSalonOpenNow(salon) {
  if (!salon || salon.active === false) return false;
  const now = getNowInTimezone('Asia/Kolkata');

  // 1. Holiday check
  const holidays = Array.isArray(salon.holidays)
    ? salon.holidays
    : (typeof salon.holidays === 'string' && salon.holidays.trim() ? salon.holidays.trim().split(/\s+/) : []);
  if (holidays.includes(now.dateStr)) return false;

  // 2. Working days check
  let workingDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  if (Array.isArray(salon.workingDays) && salon.workingDays.length > 0) {
    workingDays = salon.workingDays;
  } else if (typeof salon.workingDays === 'string' && salon.workingDays.trim()) {
    workingDays = salon.workingDays.trim().split(/\s+/);
  }
  if (!workingDays.includes(now.dayName)) return false;

  // 3. Operating hours check
  const openMins = timeStringToMinutes(salon.openingTime || '09:00 AM');
  const closeMins = timeStringToMinutes(salon.closingTime || '09:00 PM');

  return now.minutesSinceMidnight >= openMins && now.minutesSinceMidnight < closeMins;
}

export async function getAllSalons(filters = {}) {
  let salons = readData('salons.json', []);
  const allReviews = readData('reviews.json', []);
  const allQueue = readData('queue.json', []);
  const allServices = readData('services.json', []).filter((s) => s.active !== false);

  salons = salons.filter((s) => s.active !== false);

  // 1. Search Query across salon name, city, address, specialties AND service names/categories
  if (filters.search) {
    const q = filters.search.trim().toLowerCase();
    salons = salons.filter((s) => {
      const nameMatch = s.name && s.name.toLowerCase().includes(q);
      const cityMatch = s.city && s.city.toLowerCase().includes(q);
      const addressMatch = s.address && s.address.toLowerCase().includes(q);
      const specMatch = Array.isArray(s.specialties)
        ? s.specialties.some((sp) => sp.toLowerCase().includes(q))
        : (typeof s.specialties === 'string' && s.specialties.toLowerCase().includes(q));

      const salonServices = allServices.filter((srv) => srv.salonId === s.id);
      const serviceMatch = salonServices.some((srv) =>
        (srv.name && srv.name.toLowerCase().includes(q)) ||
        (srv.category && srv.category.toLowerCase().includes(q)) ||
        (srv.description && srv.description.toLowerCase().includes(q))
      );

      return nameMatch || cityMatch || addressMatch || specMatch || serviceMatch;
    });
  }

  // 2. City Filter
  if (filters.city && filters.city !== 'All Locations' && filters.city !== 'all') {
    const c = filters.city.trim().toLowerCase();
    salons = salons.filter((s) => s.city && s.city.toLowerCase().includes(c));
  }

  // 3. Category Filter (e.g. Haircut, Hair Styling, Beard Grooming, Facial, Hair Spa)
  if (filters.category && filters.category !== 'All' && filters.category !== 'all') {
    const cat = filters.category.trim().toLowerCase();
    salons = salons.filter((s) => {
      const salonServices = allServices.filter((srv) => srv.salonId === s.id);
      return salonServices.some((srv) => {
        const c = (srv.category || '').toLowerCase();
        const n = (srv.name || '').toLowerCase();
        return c.includes(cat) || n.includes(cat);
      });
    });
  }

  // 4. Enrich Salons with Ratings, Queue, Real-time Open Status, Starting Price, Categories
  let enriched = salons.map((salon) => {
    const salonReviews = allReviews.filter((r) => r.salonId === salon.id);
    const totalReviews = salonReviews.length;
    const avgRating = totalReviews > 0
      ? parseFloat((salonReviews.reduce((sum, r) => sum + (r.rating || 5), 0) / totalReviews).toFixed(1))
      : (salon.rating || 5.0);

    const salonQueue = allQueue.filter((q) => q.salonId === salon.id && (q.status === 'waiting' || q.status === 'in_service'));
    const waitingQueue = salonQueue.filter((q) => q.status === 'waiting');
    const estimatedWait = waitingQueue.length > 0
      ? (waitingQueue[waitingQueue.length - 1].estimatedWaitMinutes || waitingQueue.length * 15)
      : (salon.queueStatus?.estimatedWaitMins || 0);

    const salonServices = allServices.filter((s) => s.salonId === salon.id);
    const prices = salonServices.map((s) => s.price).filter((p) => typeof p === 'number' && !isNaN(p));
    const startingPrice = prices.length > 0 ? Math.min(...prices) : 0;
    const maxServicePrice = prices.length > 0 ? Math.max(...prices) : 0;
    const serviceCategories = Array.from(new Set(salonServices.map((s) => s.category || 'General')));
    const openStatus = isSalonOpenNow(salon);

    const gallery = Array.isArray(salon.gallery) ? salon.gallery : (salon.gallery ? [salon.gallery] : []);

    return {
      ...salon,
      gallery,
      rating: avgRating,
      reviewCount: totalReviews > 0 ? totalReviews : (salon.reviewCount || 0),
      liveQueueCount: waitingQueue.length,
      estimatedWaitMinutes: estimatedWait,
      liveQueue: {
        waitingCount: waitingQueue.length,
        estimatedWaitMinutes: estimatedWait
      },
      startingPrice,
      maxServicePrice,
      serviceCategories,
      servicesCount: salonServices.length,
      featuredServices: salonServices.slice(0, 4),
      isOpen: openStatus
    };
  });

  // 5. Min Rating Filter
  if (filters.minRating) {
    const minR = parseFloat(filters.minRating);
    if (!isNaN(minR)) {
      enriched = enriched.filter((s) => s.rating >= minR);
    }
  }

  // 6. Max Price Filter
  if (filters.maxPrice) {
    const maxP = parseFloat(filters.maxPrice);
    if (!isNaN(maxP)) {
      enriched = enriched.filter((s) => s.startingPrice <= maxP);
    }
  }

  // 7. Open Only Filter
  if (filters.openOnly === 'true' || filters.openOnly === true) {
    enriched = enriched.filter((s) => s.isOpen === true);
  }

  // 8. Sorting
  const sortBy = filters.sortBy || 'relevance';
  if (sortBy === 'rating') {
    enriched.sort((a, b) => b.rating - a.rating);
  } else if (sortBy === 'price_asc') {
    enriched.sort((a, b) => a.startingPrice - b.startingPrice);
  } else if (sortBy === 'price_desc') {
    enriched.sort((a, b) => b.startingPrice - a.startingPrice);
  } else if (sortBy === 'name') {
    enriched.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  } else {
    // Default: verified first, then highest rating
    enriched.sort((a, b) => {
      if (a.verified !== b.verified) return b.verified ? 1 : -1;
      return b.rating - a.rating;
    });
  }

  return enriched;
}

/**
 * Live search suggestions for typeahead search dropdown
 */
export async function getSearchSuggestions(query = '') {
  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    return { salons: [], services: [], categories: [], locations: [] };
  }

  const q = query.trim().toLowerCase();
  const allSalons = readData('salons.json', []).filter((s) => s.active !== false);
  const allServices = readData('services.json', []).filter((s) => s.active !== false);

  // Matching salons
  const matchedSalons = allSalons
    .filter((s) => (s.name && s.name.toLowerCase().includes(q)) || (s.city && s.city.toLowerCase().includes(q)))
    .slice(0, 5)
    .map((s) => ({
      id: s.id,
      name: s.name,
      city: s.city || '',
      logo: s.logo || '',
      cover: Array.isArray(s.gallery) && s.gallery.length > 0 ? s.gallery[0] : (s.logo || '')
    }));

  // Matching services
  const matchedServices = [];
  const seenServiceNames = new Set();
  for (const s of allServices) {
    if (s.name && s.name.toLowerCase().includes(q) && !seenServiceNames.has(s.name.toLowerCase())) {
      seenServiceNames.add(s.name.toLowerCase());
      const salon = allSalons.find((sl) => sl.id === s.salonId);
      matchedServices.push({
        id: s.id,
        name: s.name,
        category: s.category || 'General',
        price: s.price,
        salonId: s.salonId,
        salonName: salon?.name || 'Partner Salon'
      });
      if (matchedServices.length >= 6) break;
    }
  }

  // Matching categories
  const standardCategories = ['Haircut', 'Hair Styling', 'Beard Grooming', 'Facial', 'Hair Spa', 'Massage', 'Color & Highlights', 'Grooming'];
  const matchedCategories = standardCategories.filter((c) => c.toLowerCase().includes(q)).slice(0, 4);

  // Matching locations/cities
  const locations = Array.from(
    new Set(allSalons.map((s) => s.city).filter((c) => c && c.toLowerCase().includes(q)))
  ).slice(0, 4);

  return {
    salons: matchedSalons,
    services: matchedServices,
    categories: matchedCategories,
    locations
  };
}

/**
 * Customer Favorites Management
 */
export async function getCustomerFavorites(userId) {
  if (!userId) return [];
  const users = readData('users.json', {});
  const user = Object.values(users).find((u) => u.id === userId || u._id === userId);
  const favIds = user?.favorites || [];
  if (!Array.isArray(favIds) || favIds.length === 0) return [];
  const allSalons = await getAllSalons();
  return allSalons.filter((s) => favIds.includes(s.id));
}

export async function toggleCustomerFavorite(userId, salonId) {
  if (!userId || !salonId) throw new Error('User ID and Salon ID are required.');
  const users = readData('users.json', {});
  let userKey = null;
  let targetUser = null;

  for (const [key, u] of Object.entries(users)) {
    if (u.id === userId || u._id === userId) {
      userKey = key;
      targetUser = u;
      break;
    }
  }

  if (!targetUser) throw new Error('User not found.');

  const currentFavs = Array.isArray(targetUser.favorites) ? [...targetUser.favorites] : [];
  const existsIndex = currentFavs.indexOf(salonId);
  let isFavorite = false;

  if (existsIndex >= 0) {
    currentFavs.splice(existsIndex, 1);
    isFavorite = false;
  } else {
    currentFavs.push(salonId);
    isFavorite = true;
  }

  targetUser.favorites = currentFavs;
  users[userKey] = targetUser;
  writeData('users.json', users);

  return { success: true, isFavorite, favorites: currentFavs };
}

/**
 * Customer Recently Viewed Salons Management
 */
export async function getCustomerRecentlyViewed(userId) {
  if (!userId) return [];
  const users = readData('users.json', {});
  const user = Object.values(users).find((u) => u.id === userId || u._id === userId);
  const viewedIds = user?.recentlyViewed || [];
  if (!Array.isArray(viewedIds) || viewedIds.length === 0) return [];
  const allSalons = await getAllSalons();
  return viewedIds
    .map((id) => allSalons.find((s) => s.id === id))
    .filter(Boolean);
}

export async function recordCustomerRecentlyViewed(userId, salonId) {
  if (!userId || !salonId) return { success: false };
  const users = readData('users.json', {});
  let userKey = null;
  let targetUser = null;

  for (const [key, u] of Object.entries(users)) {
    if (u.id === userId || u._id === userId) {
      userKey = key;
      targetUser = u;
      break;
    }
  }

  if (!targetUser) return { success: false };

  let viewed = Array.isArray(targetUser.recentlyViewed) ? [...targetUser.recentlyViewed] : [];
  viewed = viewed.filter((id) => id !== salonId);
  viewed.unshift(salonId);
  if (viewed.length > 10) viewed = viewed.slice(0, 10);

  targetUser.recentlyViewed = viewed;
  users[userKey] = targetUser;
  writeData('users.json', users);

  return { success: true, recentlyViewed: viewed };
}

export async function addCustomerReview(salonId, appointmentId, customerId, customerName, rating, comment) {
  if (!salonId || !appointmentId) {
    throw new Error('Salon ID and Appointment ID are required.');
  }

  const appointments = readData('appointments.json', []);
  const apt = appointments.find((a) => a.id === appointmentId && a.salonId === salonId);
  if (!apt) {
    throw new Error('Appointment not found.');
  }

  if (apt.status !== 'completed') {
    throw new Error('Reviews can only be submitted for completed appointments.');
  }

  if (customerId && apt.customerId && apt.customerId !== customerId) {
    throw new Error('You can only review your own appointments.');
  }

  const reviews = readData('reviews.json', []);
  const existingReview = reviews.find((r) => r.appointmentId === appointmentId);
  if (existingReview) {
    throw new Error('You have already submitted a review for this appointment.');
  }

  const numRating = Math.max(1, Math.min(5, parseInt(rating, 10) || 5));
  const newReview = {
    id: generateId('rev'),
    salonId,
    appointmentId,
    customerId: customerId || apt.customerId || generateId('cust'),
    customerName: customerName || apt.customerName || 'Verified Customer',
    rating: numRating,
    comment: (comment || '').trim(),
    date: new Date().toISOString().split('T')[0],
    verifiedVisit: true,
    serviceUsed: apt.serviceNames ? apt.serviceNames.join(', ') : 'Grooming Service',
    ownerReply: null,
    ownerReplyDate: null,
    createdAt: new Date().toISOString()
  };

  reviews.unshift(newReview);
  writeData('reviews.json', reviews);

  // Recalculate average rating & review count for salon
  const salonReviews = reviews.filter((r) => r.salonId === salonId);
  const avg = parseFloat((salonReviews.reduce((sum, r) => sum + r.rating, 0) / salonReviews.length).toFixed(1));

  const salons = readData('salons.json', []);
  const salonIndex = salons.findIndex((s) => s.id === salonId);
  if (salonIndex !== -1) {
    salons[salonIndex].rating = avg;
    salons[salonIndex].reviewCount = salonReviews.length;
    writeData('salons.json', salons);
  }

  createNotification(salonId, {
    type: 'review',
    title: 'New Customer Review',
    message: `${newReview.customerName} left a ${newReview.rating}★ review: "${newReview.comment.slice(0, 50)}..."`,
    link: 'reviews'
  });

  return newReview;
}

export async function cancelCustomerAppointment(salonId, appointmentId, customerId, reason = '') {
  const appointments = readData('appointments.json', []);
  const index = appointments.findIndex((a) => a.id === appointmentId && a.salonId === salonId);
  if (index === -1) {
    throw new Error('Appointment not found.');
  }

  const apt = appointments[index];
  if (customerId && apt.customerId && apt.customerId !== customerId) {
    throw new Error('Unauthorized to cancel this appointment.');
  }

  if (apt.status === 'cancelled') {
    throw new Error('This appointment has already been cancelled.');
  }

  if (apt.status === 'completed') {
    throw new Error('Completed appointments cannot be cancelled.');
  }

  apt.status = 'cancelled';
  apt.cancellationReason = reason || 'Cancelled by customer';
  apt.cancelledAt = new Date().toISOString();
  apt.updatedAt = new Date().toISOString();

  writeData('appointments.json', appointments);

  createNotification(salonId, {
    type: 'appointment',
    title: 'Appointment Cancelled by Customer',
    message: `${apt.customerName} cancelled appointment on ${apt.date} at ${apt.time}. Reason: ${apt.cancellationReason}`,
    link: 'appointments'
  });

  return apt;
}

export async function rescheduleCustomerAppointment(salonId, appointmentId, customerId, newDate, newTime, newStaffId = null) {
  const appointments = readData('appointments.json', []);
  const index = appointments.findIndex((a) => a.id === appointmentId && a.salonId === salonId);
  if (index === -1) {
    throw new Error('Appointment not found.');
  }

  const apt = appointments[index];
  if (customerId && apt.customerId && apt.customerId !== customerId) {
    throw new Error('Unauthorized to reschedule this appointment.');
  }

  if (apt.status === 'cancelled' || apt.status === 'completed') {
    throw new Error(`Cannot reschedule an appointment that is already ${apt.status}.`);
  }

  const targetStaffId = newStaffId !== null ? newStaffId : apt.staffId;
  const avail = await checkAvailability(salonId, newDate, newTime, apt.durationMinutes || 45, targetStaffId, appointmentId);
  if (!avail.available) {
    throw new Error(avail.reason);
  }

  const oldDate = apt.date;
  const oldTime = apt.time;
  apt.date = newDate;
  apt.time = newTime;
  if (newStaffId) {
    apt.staffId = newStaffId;
    const allStaff = readData('staff.json', []);
    const st = allStaff.find((s) => s.id === newStaffId);
    if (st) apt.staffName = st.name;
  }
  apt.status = 'confirmed';
  apt.updatedAt = new Date().toISOString();

  writeData('appointments.json', appointments);

  createNotification(salonId, {
    type: 'appointment',
    title: 'Appointment Rescheduled by Customer',
    message: `${apt.customerName} moved appointment from ${oldDate} ${oldTime} to ${newDate} at ${newTime}.`,
    link: 'appointments'
  });

  return apt;
}


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
 * ============================================================
 * 1. SALON PROFILE MANAGEMENT
 * ============================================================
 */
export async function getSalonByOwner(ownerId) {
  const salons = readData('salons.json', []);
  let salon = salons.find((s) => s.ownerId === ownerId);
  // Fallback for dev mode: if not found, return primary salon
  if (!salon && salons.length > 0) {
    salon = salons[0];
  }
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
    tagline: salonData.tagline || '',
    description: salonData.description || '',
    phone: salonData.phone || '',
    email: salonData.email || '',
    address: salonData.address || '',
    city: salonData.city || '',
    state: salonData.state || '',
    pincode: salonData.pincode || '',
    openingTime: salonData.openingTime || '09:00',
    closingTime: salonData.closingTime || '21:00',
    workingDays: salonData.workingDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    holidays: salonData.holidays || [],
    amenities: salonData.amenities || ['Air Conditioning', 'Wi-Fi'],
    specialties: salonData.specialties || ['Haircuts'],
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
    verified: false,
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
    reviewsCount: 0
  });
  writeData('staff.json', staffList);

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
 * ============================================================
 * 4. APPOINTMENT MANAGEMENT & CONFLICT CHECKING
 * ============================================================
 */
export async function checkAvailability(salonId, date, timeStr, durationMinutes, staffId = null, excludeAptId = null) {
  const startMins = timeStringToMinutes(timeStr);
  const endMins = startMins + durationMinutes;

  // 1. Check Salon Working Hours
  const salon = await getSalonById(salonId);
  if (salon) {
    const salonOpen = timeStringToMinutes(salon.openingTime);
    const salonClose = timeStringToMinutes(salon.closingTime);
    if (startMins < salonOpen || endMins > salonClose) {
      return {
        available: false,
        reason: `Salon operating hours are ${salon.openingTime} to ${salon.closingTime}.`
      };
    }
  }

  // 2. Check Blocked Slots
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

  // 3. Check Conflicting Appointments for the specified staff member
  const appointments = readData('appointments.json', []);
  const activeAppointments = appointments.filter((apt) => {
    if (apt.salonId !== salonId || apt.date !== date) return false;
    if (apt.status === 'cancelled') return false;
    if (excludeAptId && apt.id === excludeAptId) return false;
    if (staffId && apt.staffId && apt.staffId !== staffId) return false;
    return true;
  });

  for (const apt of activeAppointments) {
    const aStart = timeStringToMinutes(apt.time);
    const aEnd = aStart + (apt.durationMinutes || 30);
    // Check overlap: max(start1, start2) < min(end1, end2)
    if (Math.max(startMins, aStart) < Math.min(endMins, aEnd)) {
      return {
        available: false,
        conflictAppointment: apt,
        reason: `Slot conflicts with an existing appointment (${apt.time} - ${apt.customerName} with ${apt.staffName || 'stylist'}).`
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
  const { customerName, customerPhone, customerEmail, serviceIds, staffId, date, time, notes } = appointmentData;

  if (!customerName || !date || !time) {
    throw new Error('Customer name, date, and time are required.');
  }

  // Determine services, duration, and total amount
  const allServices = readData('services.json', []);
  const selectedServices = allServices.filter((s) => serviceIds && serviceIds.includes(s.id));
  const serviceNames = selectedServices.map((s) => s.name);
  const durationMinutes = selectedServices.reduce((sum, s) => sum + (s.durationMinutes || 30), 0) || 45;
  const totalAmount = selectedServices.reduce((sum, s) => sum + (s.price || 0), 0) || 500;

  // Determine staff name
  let staffName = 'Any Available Stylist';
  if (staffId) {
    const allStaff = readData('staff.json', []);
    const foundStaff = allStaff.find((st) => st.id === staffId);
    if (foundStaff) staffName = foundStaff.name;
  }

  // Validate server availability & double-booking prevention
  const avail = await checkAvailability(salonId, date, time, durationMinutes, staffId);
  if (!avail.available) {
    throw new Error(avail.reason);
  }

  const appointments = readData('appointments.json', []);
  const newAppointment = {
    id: generateId('apt'),
    salonId,
    customerId: appointmentData.customerId || generateId('cust'),
    customerName: customerName.trim(),
    customerPhone: customerPhone ? customerPhone.trim() : '',
    customerEmail: customerEmail ? customerEmail.trim() : '',
    serviceIds: serviceIds || [],
    serviceNames: serviceNames.length > 0 ? serviceNames : [appointmentData.serviceName || 'Custom Service'],
    staffId: staffId || null,
    staffName,
    date,
    time,
    durationMinutes,
    totalAmount,
    status: appointmentData.status || 'confirmed',
    paymentStatus: appointmentData.paymentStatus || 'pending',
    paymentMethod: appointmentData.paymentMethod || 'UPI / Cash',
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

export async function updateAppointmentStatus(salonId, appointmentId, status, notes = '') {
  const appointments = readData('appointments.json', []);
  const index = appointments.findIndex((a) => a.id === appointmentId && a.salonId === salonId);
  if (index === -1) {
    throw new Error('Appointment not found.');
  }

  const prevStatus = appointments[index].status;
  appointments[index].status = status;
  appointments[index].updatedAt = new Date().toISOString();
  if (notes) appointments[index].notes = notes;

  // If status is changed to completed and payment was pending, mark as paid and generate transaction
  if (status === 'completed') {
    appointments[index].paymentStatus = 'paid';
    recordTransaction({
      salonId,
      appointmentId,
      customerName: appointments[index].customerName,
      amount: appointments[index].totalAmount,
      paymentMethod: appointments[index].paymentMethod || 'UPI / GPay',
      status: 'completed',
      date: appointments[index].date
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
  const newTx = {
    id: generateId('txn'),
    salonId: txData.salonId,
    appointmentId: txData.appointmentId || null,
    customerName: txData.customerName || 'Customer',
    amount: parseFloat(txData.amount) || 0,
    paymentMethod: txData.paymentMethod || 'UPI / Cash',
    status: txData.status || 'completed',
    date: txData.date || new Date().toISOString().split('T')[0],
    timestamp: new Date().toISOString()
  };
  transactions.push(newTx);
  writeData('transactions.json', transactions);
  return newTx;
}

export async function getAnalytics(salonId, timeframe = 'month') {
  const allTx = readData('transactions.json', []).filter((t) => t.salonId === salonId && t.status === 'completed');
  const allApts = readData('appointments.json', []).filter((a) => a.salonId === salonId);
  const allStaff = readData('staff.json', []).filter((s) => s.salonId === salonId);

  const todayStr = '2026-10-28'; // Reference current date

  // 1. Calculate Revenue Breakdown
  const todayRevenue = allTx
    .filter((t) => t.date === todayStr)
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  // Last 7 days
  const sevenDaysAgo = new Date('2026-10-21');
  const weekRevenue = allTx
    .filter((t) => new Date(t.date) >= sevenDaysAgo)
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  // Month (October 2026)
  const monthRevenue = allTx
    .filter((t) => t.date.startsWith('2026-10'))
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  // Total Lifetime
  const totalRevenue = allTx.reduce((sum, t) => sum + (t.amount || 0), 0);

  // 2. Appointment metrics
  const totalAppointments = allApts.length;
  const completedAppointments = allApts.filter((a) => a.status === 'completed').length;
  const cancelledAppointments = allApts.filter((a) => a.status === 'cancelled').length;
  const completionRate = totalAppointments > 0 ? Math.round((completedAppointments / totalAppointments) * 100) : 0;

  // 3. Popular Services
  const serviceStats = new Map();
  allApts.forEach((apt) => {
    if (apt.serviceNames) {
      apt.serviceNames.forEach((sName) => {
        const cur = serviceStats.get(sName) || { name: sName, bookings: 0, revenue: 0 };
        cur.bookings += 1;
        if (apt.status === 'completed') {
          cur.revenue += Math.round((apt.totalAmount || 0) / apt.serviceNames.length);
        }
        serviceStats.set(sName, cur);
      });
    }
  });
  const popularServices = Array.from(serviceStats.values()).sort((a, b) => b.bookings - a.bookings).slice(0, 5);

  // 4. Staff Performance
  const staffMetrics = allStaff.map((st) => {
    const stApts = allApts.filter((a) => a.staffId === st.id);
    const stCompleted = stApts.filter((a) => a.status === 'completed');
    const revenue = stCompleted.reduce((sum, a) => sum + (a.totalAmount || 0), 0);
    return {
      id: st.id,
      name: st.name,
      role: st.role,
      appointmentsHandled: stCompleted.length,
      revenueGenerated: revenue,
      rating: st.rating || 4.9
    };
  });

  // 5. Customer Return Rate
  const customerVisits = new Map();
  allApts
    .filter((a) => a.status === 'completed')
    .forEach((a) => {
      const key = a.customerPhone || a.customerName;
      customerVisits.set(key, (customerVisits.get(key) || 0) + 1);
    });
  const totalCustomers = customerVisits.size;
  const repeatCustomers = Array.from(customerVisits.values()).filter((v) => v > 1).length;
  const returnRate = totalCustomers > 0 ? Math.round((repeatCustomers / totalCustomers) * 100) : 0;

  // 6. Revenue Trends by Date (Last 7 days)
  const trends = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date('2026-10-28');
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
    const dayTotal = allTx.filter((t) => t.date === dateStr).reduce((sum, t) => sum + (t.amount || 0), 0);
    trends.push({ date: dateStr, day: dayName, revenue: dayTotal });
  }

  return {
    todayRevenue,
    weekRevenue,
    monthRevenue,
    totalRevenue,
    totalAppointments,
    completedAppointments,
    cancelledAppointments,
    completionRate,
    returnRate,
    popularServices,
    staffMetrics,
    revenueTrends: trends,
    transactions: allTx.slice(-20) // recent 20
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

import mongoose from 'mongoose';
import crypto from 'node:crypto';
import { getDatabaseType, getSqliteDb } from './dbConnection.js';

// =========================================================================
// MONGOOSE SCHEMAS (Used when MONGODB_URI is provided)
// =========================================================================
const UserSchema = new mongoose.Schema({
  _id: { type: String, default: () => `usr_${Date.now()}_${crypto.randomBytes(3).toString('hex')}` },
  email: { type: String, unique: true, sparse: true, lowercase: true, trim: true, index: true },
  phone: { type: String, sparse: true, index: true },
  name: { type: String, required: true },
  passwordHash: { type: String, select: false },
  roles: { type: [String], default: ['customer'] },
  activeRole: { type: String, default: 'customer' },
  salonId: { type: String, index: true },
  salonName: { type: String },
  city: { type: String },
  isVerified: { type: Boolean, default: false },
  favorites: { type: [String], default: [] },
  recentlyViewed: { type: [String], default: [] }
}, { timestamps: true });

const SalonSchema = new mongoose.Schema({
  _id: { type: String, default: () => `salon_${Date.now()}_${crypto.randomBytes(3).toString('hex')}` },
  ownerId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  tagline: { type: String, default: 'Premium Styling & Grooming' },
  description: { type: String },
  phone: { type: String },
  email: { type: String },
  address: { type: String },
  city: { type: String, required: true, index: true },
  state: { type: String, default: 'Maharashtra' },
  pincode: { type: String },
  openingTime: { type: String, default: '09:00' },
  closingTime: { type: String, default: '21:00' },
  workingDays: { type: [String], default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] },
  holidays: { type: [String], default: [] },
  amenities: { type: [String], default: [] },
  specialties: { type: [String], default: [] },
  policies: {
    cancellationHours: { type: Number, default: 2 },
    cancellationPolicy: { type: String, default: 'Free cancellation up to 2 hours prior to appointment.' },
    lateArrivalMinutes: { type: Number, default: 15 },
    lateArrivalPolicy: { type: String, default: 'Grace period of 15 minutes applies.' },
    walkInPolicy: { type: String, default: 'Live queue priority applies.' }
  },
  logo: { type: String, default: '' },
  gallery: { type: [String], default: [] },
  rating: { type: Number, default: 5.0 },
  reviewCount: { type: Number, default: 0 },
  verified: { type: Boolean, default: false },
  active: { type: Boolean, default: true }
}, { timestamps: true });

const ServiceSchema = new mongoose.Schema({
  _id: { type: String, default: () => `srv_${Date.now()}_${crypto.randomBytes(3).toString('hex')}` },
  salonId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  category: { type: String, default: 'General' },
  price: { type: Number, required: true },
  durationMinutes: { type: Number, default: 30 },
  description: { type: String },
  active: { type: Boolean, default: true }
}, { timestamps: true });

const StaffSchema = new mongoose.Schema({
  _id: { type: String, default: () => `stf_${Date.now()}_${crypto.randomBytes(3).toString('hex')}` },
  salonId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  role: { type: String, default: 'Stylist' },
  phone: { type: String },
  email: { type: String },
  avatar: { type: String, default: '' },
  assignedServiceIds: { type: [String], default: [] },
  workingHours: {
    start: { type: String, default: '09:00' },
    end: { type: String, default: '21:00' }
  },
  weeklyOffDays: { type: [String], default: [] },
  active: { type: Boolean, default: true },
  isManager: { type: Boolean, default: false }
}, { timestamps: true });

const AppointmentSchema = new mongoose.Schema({
  _id: { type: String, default: () => `apt_${Date.now()}_${crypto.randomBytes(3).toString('hex')}` },
  salonId: { type: String, required: true, index: true },
  salonName: { type: String },
  customerId: { type: String, required: true, index: true },
  customerName: { type: String, required: true },
  customerPhone: { type: String },
  customerEmail: { type: String },
  serviceIds: { type: [String], default: [] },
  serviceNames: { type: [String], default: [] },
  staffId: { type: String, index: true },
  staffName: { type: String },
  date: { type: String, required: true, index: true },
  time: { type: String, required: true },
  durationMinutes: { type: Number, default: 30 },
  totalAmount: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'in_service', 'completed', 'cancelled'],
    default: 'confirmed',
    index: true
  },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'pending', 'paid', 'refunded'],
    default: 'unpaid'
  },
  paymentMethod: { type: String, default: 'Pay at Salon' },
  payuTxnId: { type: String, sparse: true, index: true },
  payuPaymentId: { type: String, sparse: true, index: true },
  payuMode: { type: String },
  paidAt: { type: String },
  notes: { type: String, default: '' },
  cancellationReason: { type: String, default: null }
}, { timestamps: true });

AppointmentSchema.index({ salonId: 1, date: 1, time: 1, staffId: 1 });

const QueueSchema = new mongoose.Schema({
  _id: { type: String, default: () => `q_${Date.now()}_${crypto.randomBytes(3).toString('hex')}` },
  salonId: { type: String, required: true, index: true },
  customerId: { type: String },
  customerName: { type: String, required: true },
  customerPhone: { type: String },
  serviceId: { type: String },
  serviceName: { type: String },
  staffId: { type: String },
  checkInTime: { type: String },
  estimatedWaitMinutes: { type: Number, default: 15 },
  status: {
    type: String,
    enum: ['waiting', 'in_service', 'completed', 'cancelled'],
    default: 'waiting',
    index: true
  },
  position: { type: Number, default: 1 },
  priority: { type: Boolean, default: false },
  notes: { type: String, default: '' }
}, { timestamps: true });

const ReviewSchema = new mongoose.Schema({
  _id: { type: String, default: () => `rev_${Date.now()}_${crypto.randomBytes(3).toString('hex')}` },
  salonId: { type: String, required: true, index: true },
  appointmentId: { type: String, unique: true, required: true, index: true },
  customerId: { type: String, required: true, index: true },
  customerName: { type: String, required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String, required: true },
  date: { type: String },
  verifiedVisit: { type: Boolean, default: true },
  serviceUsed: { type: String },
  ownerReply: { type: String, default: null },
  ownerReplyDate: { type: String, default: null }
}, { timestamps: true });

const TransactionSchema = new mongoose.Schema({
  _id: { type: String, default: () => `txn_${Date.now()}_${crypto.randomBytes(3).toString('hex')}` },
  salonId: { type: String, required: true, index: true },
  appointmentId: { type: String },
  bookingReference: { type: String },
  customerName: { type: String },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  paymentMethod: { type: String, default: 'Pay at Salon' },
  payuTxnId: { type: String, sparse: true, index: true },
  payuPaymentId: { type: String, sparse: true, index: true },
  payuMode: { type: String },
  status: {
    type: String,
    enum: ['pending', 'completed', 'refunded', 'failed'],
    default: 'completed'
  },
  date: { type: String },
  timestamp: { type: String, default: () => new Date().toISOString() }
}, { timestamps: true });

const BlockedSlotSchema = new mongoose.Schema({
  _id: { type: String, default: () => `blk_${Date.now()}_${crypto.randomBytes(3).toString('hex')}` },
  salonId: { type: String, required: true, index: true },
  staffId: { type: String },
  date: { type: String, required: true, index: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  reason: { type: String, default: 'Blocked' }
}, { timestamps: true });

const NotificationSchema = new mongoose.Schema({
  _id: { type: String, default: () => `notif_${Date.now()}_${crypto.randomBytes(3).toString('hex')}` },
  salonId: { type: String, required: true, index: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, default: 'info' },
  read: { type: Boolean, default: false },
  appointmentId: { type: String },
  createdAt: { type: String, default: () => new Date().toISOString() }
});

const CustomerNoteSchema = new mongoose.Schema({
  _id: { type: String, default: () => `cnote_${Date.now()}_${crypto.randomBytes(3).toString('hex')}` },
  salonId: { type: String, required: true, index: true },
  customerId: { type: String, required: true, index: true },
  customerName: { type: String },
  customerPhone: { type: String },
  notes: { type: String, default: '' },
  tags: { type: [String], default: [] },
  updatedBy: { type: String },
  updatedAt: { type: String, default: () => new Date().toISOString() }
});

// Create Mongoose models
export const MongoUser = mongoose.models.User || mongoose.model('User', UserSchema);
export const MongoSalon = mongoose.models.Salon || mongoose.model('Salon', SalonSchema);
export const MongoService = mongoose.models.Service || mongoose.model('Service', ServiceSchema);
export const MongoStaff = mongoose.models.Staff || mongoose.model('Staff', StaffSchema);
export const MongoAppointment = mongoose.models.Appointment || mongoose.model('Appointment', AppointmentSchema);
export const MongoQueue = mongoose.models.Queue || mongoose.model('Queue', QueueSchema);
export const MongoReview = mongoose.models.Review || mongoose.model('Review', ReviewSchema);
export const MongoTransaction = mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);
export const MongoBlockedSlot = mongoose.models.BlockedSlot || mongoose.model('BlockedSlot', BlockedSlotSchema);
export const MongoNotification = mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);
export const MongoCustomerNote = mongoose.models.CustomerNote || mongoose.model('CustomerNote', CustomerNoteSchema);

// =========================================================================
// UNIVERSAL DATABASE ADAPTER (SQLite & MongoDB Unified Model Contract)
// =========================================================================
function createUnifiedModel(tableName, mongoModel) {
  return {
    async find(query = {}, sort = null, limit = null) {
      if (getDatabaseType() === 'mongo') {
        let q = mongoModel.find(query);
        if (sort) q = q.sort(sort);
        if (limit) q = q.limit(limit);
        const docs = await q.lean();
        return docs.map(d => ({ ...d, id: d._id }));
      }

      // SQLite Driver
      const db = getSqliteDb();
      let sql = `SELECT * FROM ${tableName}`;
      const params = [];
      const whereClauses = [];

      for (const [key, val] of Object.entries(query)) {
        if (val === undefined) continue;
        if (key === 'id' || key === '_id') {
          whereClauses.push(`id = ?`);
          params.push(val);
        } else if (val && typeof val === 'object' && val.$ne !== undefined) {
          whereClauses.push(`json_extract(data, '$.${key}') != ?`);
          params.push(val.$ne);
        } else if (val && typeof val === 'object' && val.$in !== undefined) {
          const placeholders = val.$in.map(() => '?').join(', ');
          whereClauses.push(`json_extract(data, '$.${key}') IN (${placeholders})`);
          params.push(...val.$in);
        } else if (typeof val === 'boolean') {
          whereClauses.push(`json_extract(data, '$.${key}') = ?`);
          params.push(val ? 1 : 0);
        } else {
          whereClauses.push(`json_extract(data, '$.${key}') = ?`);
          params.push(val);
        }
      }

      if (whereClauses.length > 0) {
        sql += ` WHERE ` + whereClauses.join(' AND ');
      }

      if (sort) {
        const [field, direction] = Object.entries(sort)[0];
        const dir = direction === -1 || direction === 'desc' ? 'DESC' : 'ASC';
        sql += ` ORDER BY json_extract(data, '$.${field}') ${dir}`;
      }

      if (limit) {
        sql += ` LIMIT ${parseInt(limit, 10)}`;
      }

      const rows = db.prepare(sql).all(...params);
      return rows.map(r => {
        try {
          const parsed = JSON.parse(r.data);
          return { ...parsed, id: r.id };
        } catch {
          return { id: r.id };
        }
      });
    },

    async findOne(query = {}) {
      const results = await this.find(query, null, 1);
      return results.length > 0 ? results[0] : null;
    },

    async findById(id) {
      if (!id) return null;
      return this.findOne({ id });
    },

    async create(doc) {
      const id = doc.id || doc._id || `${tableName.slice(0, 3)}_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
      const cleanDoc = { ...doc, id, _id: id };
      const now = new Date().toISOString();
      if (!cleanDoc.createdAt) cleanDoc.createdAt = now;
      cleanDoc.updatedAt = now;

      if (getDatabaseType() === 'mongo') {
        const created = await mongoModel.create(cleanDoc);
        const obj = created.toObject();
        return { ...obj, id: obj._id };
      }

      // SQLite Driver
      const db = getSqliteDb();
      const serialized = JSON.stringify(cleanDoc);
      const email = cleanDoc.email || null;
      const phone = cleanDoc.phone || null;
      const name = cleanDoc.name || null;
      const ownerId = cleanDoc.ownerId || null;
      const salonId = cleanDoc.salonId || null;
      const customerId = cleanDoc.customerId || null;
      const date = cleanDoc.date || null;
      const time = cleanDoc.time || null;
      const status = cleanDoc.status || null;

      const stmt = db.prepare(`
        INSERT OR REPLACE INTO ${tableName} (id, data, createdAt, updatedAt)
        VALUES (?, ?, ?, ?)
      `);
      stmt.run(id, serialized, cleanDoc.createdAt, cleanDoc.updatedAt);
      return cleanDoc;
    },

    async updateOne(query, update) {
      const existing = await this.findOne(query);
      if (!existing) return { matchedCount: 0, modifiedCount: 0 };

      const updateData = update.$set ? update.$set : update;
      const updatedDoc = { ...existing, ...updateData, updatedAt: new Date().toISOString() };

      if (getDatabaseType() === 'mongo') {
        await mongoModel.updateOne({ _id: existing.id }, { $set: updateData });
        return { matchedCount: 1, modifiedCount: 1, doc: updatedDoc };
      }

      const db = getSqliteDb();
      db.prepare(`UPDATE ${tableName} SET data = ?, updatedAt = ? WHERE id = ?`)
        .run(JSON.stringify(updatedDoc), updatedDoc.updatedAt, existing.id);
      return { matchedCount: 1, modifiedCount: 1, doc: updatedDoc };
    },

    async findByIdAndUpdate(id, update, options = {}) {
      await this.updateOne({ id }, update);
      return this.findById(id);
    },

    async deleteOne(query) {
      const existing = await this.findOne(query);
      if (!existing) return { deletedCount: 0 };

      if (getDatabaseType() === 'mongo') {
        await mongoModel.deleteOne({ _id: existing.id });
        return { deletedCount: 1 };
      }

      const db = getSqliteDb();
      db.prepare(`DELETE FROM ${tableName} WHERE id = ?`).run(existing.id);
      return { deletedCount: 1 };
    },

    async findByIdAndDelete(id) {
      const existing = await this.findById(id);
      if (existing) {
        await this.deleteOne({ id });
      }
      return existing;
    },

    async countDocuments(query = {}) {
      const records = await this.find(query);
      return records.length;
    }
  };
}

// Export Models
export const User = createUnifiedModel('users', MongoUser);
export const Salon = createUnifiedModel('salons', MongoSalon);
export const Service = createUnifiedModel('services', MongoService);
export const Staff = createUnifiedModel('staff', MongoStaff);
export const Appointment = createUnifiedModel('appointments', MongoAppointment);
export const QueueEntry = createUnifiedModel('queue', MongoQueue);
export const Review = createUnifiedModel('reviews', MongoReview);
export const Transaction = createUnifiedModel('transactions', MongoTransaction);
export const BlockedSlot = createUnifiedModel('blocked_slots', MongoBlockedSlot);
export const Notification = createUnifiedModel('notifications', MongoNotification);
export const CustomerNote = createUnifiedModel('customer_notes', MongoCustomerNote);

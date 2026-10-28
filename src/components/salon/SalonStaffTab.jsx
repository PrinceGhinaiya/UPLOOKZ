import React, { useState } from 'react';
import {
  Users,
  Plus,
  Phone,
  Mail,
  Clock,
  Calendar,
  CheckCircle2,
  XCircle,
  Edit2,
  Trash2,
  ShieldCheck,
  Star,
  Scissors
} from 'lucide-react';
import { StaffModal, ConfirmDialog } from './SalonModals';

export default function SalonStaffTab({
  staff = [],
  services = [],
  appointments = [],
  onAddStaff,
  onUpdateStaff,
  onDeleteStaff
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [deleteConfirmStaff, setDeleteConfirmStaff] = useState(null);

  const handleOpenAdd = () => {
    setEditingStaff(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (st) => {
    setEditingStaff(st);
    setIsModalOpen(true);
  };

  const handleToggleActive = async (st) => {
    await onUpdateStaff(st.id, { active: !st.active });
  };

  const handleSaveStaff = async (formData) => {
    if (editingStaff) {
      await onUpdateStaff(editingStaff.id, formData);
    } else {
      await onAddStaff(formData);
    }
  };

  const handleConfirmDelete = async () => {
    if (deleteConfirmStaff) {
      await onDeleteStaff(deleteConfirmStaff.id);
      setDeleteConfirmStaff(null);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#111827]">
            Staff & Team Management
          </h2>
          <p className="text-xs sm:text-sm text-[#64748B]">
            Configure staff profiles, duty shifts, weekly off schedules, and assigned services.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="btn-lift inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0EA5E9] hover:bg-[#0284C7] text-white text-xs font-semibold shadow-sm transition-all shrink-0"
        >
          <Plus size={16} />
          <span>+ Add Team Member</span>
        </button>
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {staff.length === 0 ? (
          <div className="col-span-full bg-white border border-[#E2E8F0] rounded-2xl p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#F0F9FF] text-[#0EA5E9] flex items-center justify-center mx-auto">
              <Users size={22} />
            </div>
            <h3 className="text-base font-bold text-[#111827]">No Staff Configured</h3>
            <p className="text-xs text-[#64748B] max-w-sm mx-auto">
              Add your master barbers, hair colorists, and spa specialists.
            </p>
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0EA5E9] text-white text-xs font-semibold shadow-sm"
            >
              <Plus size={14} />
              <span>Add Staff Profile</span>
            </button>
          </div>
        ) : (
          staff.map((st) => {
            // Count today's assignments
            const stAppointments = appointments.filter((a) => a.staffId === st.id && a.status !== 'cancelled');
            const assignedServiceObjects = services.filter((s) => st.assignedServiceIds?.includes(s.id));

            return (
              <div
                key={st.id}
                className={`bg-white border rounded-2xl p-5 shadow-clean hover:shadow-clean-md transition-all flex flex-col justify-between space-y-4 ${
                  st.active ? 'border-[#E2E8F0] hover:border-[#BAE6FD]' : 'border-[#CBD5E1] bg-[#F8FAFC]/70 opacity-80'
                }`}
              >
                <div className="space-y-3">
                  
                  {/* Top: Avatar & Name + Status Toggle */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-[#E0F2FE] text-[#0284C7] font-bold text-sm flex items-center justify-center shrink-0 border border-[#BAE6FD]">
                        {st.name?.slice(0, 2).toUpperCase() || 'ST'}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-sm font-bold text-[#111827]">{st.name}</h3>
                          {st.isManager && (
                            <span className="p-0.5 rounded text-amber-600" title="Manager Privileges">
                              <ShieldCheck size={14} />
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#64748B]">{st.role}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggleActive(st)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold transition-colors ${
                        st.active
                          ? 'bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0]'
                          : 'bg-gray-100 text-[#64748B] border border-gray-200'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${st.active ? 'bg-[#16A34A]' : 'bg-gray-400'}`} />
                      <span>{st.active ? 'On Duty' : 'On Leave'}</span>
                    </button>
                  </div>

                  {/* Rating & Contact Details */}
                  <div className="space-y-1.5 text-xs text-[#64748B] pt-1">
                    {st.phone && (
                      <p className="flex items-center gap-2">
                        <Phone size={13} className="text-[#0EA5E9]" />
                        <span>{st.phone}</span>
                      </p>
                    )}
                    {st.email && (
                      <p className="flex items-center gap-2">
                        <Mail size={13} className="text-[#0EA5E9]" />
                        <span className="truncate">{st.email}</span>
                      </p>
                    )}
                    <p className="flex items-center gap-2">
                      <Clock size={13} className="text-[#0EA5E9]" />
                      <span>
                        Shift: {st.workingHours?.start || '09:00'} – {st.workingHours?.end || '18:00'}
                      </span>
                    </p>
                    {st.weeklyOffDays && st.weeklyOffDays.length > 0 && (
                      <p className="flex items-center gap-2">
                        <Calendar size={13} className="text-[#0EA5E9]" />
                        <span>Weekly Off: {st.weeklyOffDays.join(', ')}</span>
                      </p>
                    )}
                  </div>

                  {/* Assigned Specialties & Services */}
                  <div className="pt-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1.5">
                      Assigned Services ({assignedServiceObjects.length})
                    </p>
                    <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
                      {assignedServiceObjects.length === 0 ? (
                        <span className="text-xs text-[#94A3B8]">All salon services</span>
                      ) : (
                        assignedServiceObjects.slice(0, 4).map((s) => (
                          <span
                            key={s.id}
                            className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-[#F8FAFC] border border-[#E2E8F0] text-[#475569]"
                          >
                            {s.name}
                          </span>
                        ))
                      )}
                      {assignedServiceObjects.length > 4 && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] text-[#64748B] font-semibold">
                          +{assignedServiceObjects.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>

                </div>

                {/* Footer: Appointments Handled & Edit Actions */}
                <div className="pt-3 border-t border-[#F1F5F9] flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#0284C7] bg-[#F0F9FF] px-2.5 py-1 rounded-md">
                    {stAppointments.length} Bookings Assigned
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEdit(st)}
                      className="p-1.5 rounded-lg text-[#64748B] hover:text-[#0EA5E9] hover:bg-[#F0F9FF] border border-[#E2E8F0] transition-colors"
                      title="Edit Staff Member"
                    >
                      <Edit2 size={14} />
                    </button>
                    {!st.isManager && (
                      <button
                        onClick={() => setDeleteConfirmStaff(st)}
                        className="p-1.5 rounded-lg text-[#64748B] hover:text-red-600 hover:bg-red-50 border border-[#E2E8F0] transition-colors"
                        title="Delete Staff Member"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Staff Modal */}
      <StaffModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveStaff}
        staff={editingStaff}
        services={services}
      />

      {/* Delete Staff Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteConfirmStaff)}
        onClose={() => setDeleteConfirmStaff(null)}
        onConfirm={handleConfirmDelete}
        title="Remove Staff Member"
        message={`Are you sure you want to remove "${deleteConfirmStaff?.name}" from your team? Active appointments will need to be reassigned.`}
        confirmText="Remove Member"
        isDestructive={true}
      />

    </div>
  );
}

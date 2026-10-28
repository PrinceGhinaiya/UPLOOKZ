import React, { useState } from 'react';
import {
  Scissors,
  Plus,
  Search,
  Edit2,
  Trash2,
  Clock,
  CheckCircle2,
  XCircle,
  Tag
} from 'lucide-react';
import { ServiceModal, ConfirmDialog } from './SalonModals';

export default function SalonServicesTab({
  services = [],
  onAddService,
  onUpdateService,
  onDeleteService
}) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [deleteConfirmService, setDeleteConfirmService] = useState(null);

  const categories = ['All', 'Hair', 'Beard & Shave', 'Skin & Facial', 'Spa & Wellness', 'Combo Packages'];

  const filteredServices = services.filter((srv) => {
    if (selectedCategory !== 'All' && srv.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = srv.name && srv.name.toLowerCase().includes(q);
      const matchDesc = srv.description && srv.description.toLowerCase().includes(q);
      if (!matchName && !matchDesc) return false;
    }
    return true;
  });

  const handleOpenAdd = () => {
    setEditingService(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (srv) => {
    setEditingService(srv);
    setIsModalOpen(true);
  };

  const handleToggleActive = async (srv) => {
    await onUpdateService(srv.id, { active: !srv.active });
  };

  const handleSaveService = async (formData) => {
    if (editingService) {
      await onUpdateService(editingService.id, formData);
    } else {
      await onAddService(formData);
    }
  };

  const handleConfirmDelete = async () => {
    if (deleteConfirmService) {
      await onDeleteService(deleteConfirmService.id);
      setDeleteConfirmService(null);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#111827]">
            Services & Pricing Menu
          </h2>
          <p className="text-xs sm:text-sm text-[#64748B]">
            Configure your salon's digital service catalog, pricing, and estimated durations.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="btn-lift inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0EA5E9] hover:bg-[#0284C7] text-white text-xs font-semibold shadow-sm transition-all shrink-0"
        >
          <Plus size={16} />
          <span>+ Add New Service</span>
        </button>
      </div>

      {/* Filter Bar: Category Tabs & Search */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 shadow-clean space-y-4">
        
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                selectedCategory === cat
                  ? 'bg-[#0EA5E9] text-white shadow-sm'
                  : 'bg-[#F1F5F9] text-[#64748B] hover:text-[#111827] hover:bg-[#E2E8F0]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search size={14} className="absolute left-3 top-2.5 text-[#94A3B8]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search service name or description..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0EA5E9]"
          />
        </div>

      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredServices.length === 0 ? (
          <div className="col-span-full bg-white border border-[#E2E8F0] rounded-2xl p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#F0F9FF] text-[#0EA5E9] flex items-center justify-center mx-auto">
              <Scissors size={22} />
            </div>
            <h3 className="text-base font-bold text-[#111827]">No Services Found</h3>
            <p className="text-xs text-[#64748B] max-w-sm mx-auto">
              No services match the selected category or search filter.
            </p>
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0EA5E9] text-white text-xs font-semibold shadow-sm"
            >
              <Plus size={14} />
              <span>Add Your First Service</span>
            </button>
          </div>
        ) : (
          filteredServices.map((srv) => (
            <div
              key={srv.id}
              className={`bg-white border rounded-2xl p-5 shadow-clean hover:shadow-clean-md transition-all flex flex-col justify-between space-y-4 ${
                srv.active ? 'border-[#E2E8F0] hover:border-[#BAE6FD]' : 'border-[#CBD5E1] bg-[#F8FAFC]/70 opacity-75'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#F0F9FF] text-[#0284C7] border border-[#BAE6FD]">
                    {srv.category}
                  </span>
                  
                  {/* Active Toggle Switch */}
                  <button
                    onClick={() => handleToggleActive(srv)}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold transition-colors ${
                      srv.active
                        ? 'bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0]'
                        : 'bg-gray-100 text-[#64748B] border border-gray-200'
                    }`}
                    title="Toggle online availability"
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${srv.active ? 'bg-[#16A34A]' : 'bg-gray-400'}`} />
                    <span>{srv.active ? 'Available' : 'Unavailable'}</span>
                  </button>
                </div>

                <h3 className="text-base font-bold text-[#111827]">{srv.name}</h3>
                <p className="text-xs text-[#64748B] line-clamp-2 leading-relaxed">
                  {srv.description || 'Professional grooming service executed with premium salon essentials.'}
                </p>
              </div>

              {/* Price & Duration Strip */}
              <div className="pt-3 border-t border-[#F1F5F9] flex items-center justify-between">
                <div>
                  <span className="text-lg font-bold text-[#111827]">₹{srv.price}</span>
                  <p className="text-[10px] text-[#94A3B8] flex items-center gap-1">
                    <Clock size={11} /> ~{srv.durationMinutes} mins
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenEdit(srv)}
                    className="p-1.5 rounded-lg text-[#64748B] hover:text-[#0EA5E9] hover:bg-[#F0F9FF] border border-[#E2E8F0] transition-colors"
                    title="Edit Service"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => setDeleteConfirmService(srv)}
                    className="p-1.5 rounded-lg text-[#64748B] hover:text-red-600 hover:bg-red-50 border border-[#E2E8F0] transition-colors"
                    title="Delete Service"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Service Modal */}
      <ServiceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveService}
        service={editingService}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteConfirmService)}
        onClose={() => setDeleteConfirmService(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Service"
        message={`Are you sure you want to remove "${deleteConfirmService?.name}" from your service catalog? This action cannot be undone.`}
        confirmText="Delete Service"
        isDestructive={true}
      />

    </div>
  );
}

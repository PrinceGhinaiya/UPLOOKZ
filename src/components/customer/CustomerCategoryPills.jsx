import React from 'react';
import { Scissors, Sparkles, Smile, Flame, ShieldCheck, Heart } from 'lucide-react';

const CATEGORIES = [
  { id: 'All', label: 'All Services', icon: Sparkles },
  { id: 'Haircut', label: 'Haircut', icon: Scissors },
  { id: 'Hair Styling', label: 'Hair Styling', icon: Flame },
  { id: 'Beard Grooming', label: 'Beard Grooming', icon: ShieldCheck },
  { id: 'Facial', label: 'Facial & Skincare', icon: Smile },
  { id: 'Hair Spa', label: 'Hair Spa & Detox', icon: Heart }
];

export default function CustomerCategoryPills({ activeCategory, onSelectCategory }) {
  return (
    <div className="w-full">
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive =
            (!activeCategory && cat.id === 'All') ||
            (Boolean(activeCategory) && activeCategory.toLowerCase() === cat.id.toLowerCase());
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(cat.id === 'All' ? '' : cat.id)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
                isActive
                  ? 'bg-[#0EA5E9] text-white shadow-sm ring-2 ring-[#0EA5E9]/20'
                  : 'bg-white hover:bg-[#F8FAFC] text-[#475569] border border-[#E2E8F0] hover:border-[#CBD5E1]'
              }`}
            >
              <Icon size={14} className={isActive ? 'text-white' : 'text-[#0EA5E9]'} />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

import { ChevronDown, ChevronUp } from 'lucide-react'

export default function FilterItem({ label, icon, isOpen, onToggle, children }) {
  return (
    <div className="filter-item">
      <div className="filter-header" onClick={onToggle}>
        <span className="filter-icon">{icon}</span>
        <span>{label}</span>
        {isOpen
          ? <ChevronUp size={16} className="chevron" />
          : <ChevronDown size={16} className="chevron" />
        }
      </div>
      {isOpen && <div className="filter-content">{children}</div>}
    </div>
  )
}

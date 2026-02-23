import React, { useState } from 'react';
import './App.css';
// Using Lucide React for icons (standard lightweight icon set)
import {
  Menu,
  Search,
  Briefcase,
  DollarSign,
  Hourglass,
  MapPin,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

const App = () => {
  // State to manage which filter section is open
  const [openSection, setOpenSection] = useState('mood');

  const toggleSection = (section) => {
    setOpenSection(openSection === section ? null : section);
  };

  return (
    <div className="app-container">
      {/* 1. Map Background
         Note: In a real app, replace this <img> with a Google Maps or Leaflet component.
         Here I'm using a placeholder image logic.
      */}
      <img
        src="https://upload.wikimedia.org/wikipedia/commons/e/e3/Lviv_OpenStreetMap.png"
        alt="Map should be here"
        className="map-background"
      />

      {/* 2. Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <span className="logo">SEARCH4YOU</span>
          <Menu size={20} className="menu-icon" />
        </div>

        <div className="filters-container">

          {/* Mood Section (Active in screenshot) */}
          <FilterItem
            id="mood"
            label="Mood"
            icon={<Briefcase size={18} />}
            isOpen={openSection === 'mood'}
            onToggle={() => toggleSection('mood')}
          >
            <div className="mood-option active">Calm</div>
            <div className="mood-option">Adventurous</div>
            <div className="mood-option">Curious</div>
          </FilterItem>

          {/* Budget Section */}
          <FilterItem
            id="budget"
            label="Budget"
            icon={<DollarSign size={18} />}
            isOpen={openSection === 'budget'}
            onToggle={() => toggleSection('budget')}
          >
            <div className="mood-option">Low</div>
            <div className="mood-option">Medium</div>
            <div className="mood-option">High</div>
          </FilterItem>

          {/* Time Section */}
          <FilterItem
            id="time"
            label="Time to spend"
            icon={<Hourglass size={18} />}
            isOpen={openSection === 'time'}
            onToggle={() => toggleSection('time')}
          >
            <div className="mood-option">1 Hour</div>
            <div className="mood-option">Half Day</div>
            <div className="mood-option">Full Day</div>
          </FilterItem>

          {/* Destination Section */}
          <FilterItem
            id="destination"
            label="Destination"
            icon={<MapPin size={18} />}
            isOpen={openSection === 'destination'}
            onToggle={() => toggleSection('destination')}
          >
            <div className="mood-option">Parks</div>
            <div className="mood-option">Museums</div>
            <div className="mood-option">Cafes</div>
          </FilterItem>

        </div>

        <div className="sidebar-footer">
          <button className="find-path-btn">Find path</button>
        </div>
      </aside>

      {/* 3. Top Search Bar
      <div className="search-bar-container">
        <Search className="search-icon" size={18} />
        <input type="text" placeholder="Search" className="search-input" />
      </div> */}

      {/* 4. User Profile Card */}
      <div className="user-profile">
        {/* Placeholder avatar image */}
        <img
          src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80"
          alt="User Avatar"
          className="avatar"
        />
        <div className="user-info">
          <span className="user-name">Robbi Darwis</span> {/* !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! */}
          <span className="user-email">flowforgestd@gmail.com</span>
        </div>
      </div>
    </div>
  );
};

// Helper Component for Filter Accordion
const FilterItem = ({ label, icon, isOpen, onToggle, children }) => {
  return (
    <div className="filter-item">
      <div className="filter-header" onClick={onToggle}>
        <span className="filter-icon">{icon}</span>
        <span>{label}</span>
        {isOpen ? (
          <ChevronUp size={16} className="chevron" />
        ) : (
          <ChevronDown size={16} className="chevron" />
        )}
      </div>
      {isOpen && <div className="filter-content">{children}</div>}
    </div>
  );
};

export default App;

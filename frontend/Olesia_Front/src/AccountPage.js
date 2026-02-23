import React, { useState } from 'react';
import './AccountPage.css'; // We will create this file next
import PathesList from './PathesList';

function AccountPage() {
    const [pathes, setPathes] = useState([
        { name: 'ble', date: '26.09.788', time: 3, review: 3, comment: 'lets go yiblanit', budget: 10},
        { name: 'paris', date: '26.09.788', time: 73, review: 5, comment: null, budget:34 }])
    const totalMinutes = pathes.reduce((total, item) => total + item.time, 0);
    const totalBudget = pathes.reduce((total, item) => total + item.budget, 0);

    const formatTime = (minutes) => {
        if (minutes > 60) {
            const h = Math.floor(minutes / 60);
            const m = minutes % 60;
            if (m === 0) return `${h}h`;
            return `${h}h ${m}m`;
        }
        return `${minutes}m`;
    };
    return (
        <div className="account-container">
            {/* Header Section */}
            <header className="page-header">
                <div className="header-left">
                    <div className="avatar-placeholder">👤</div>
                    <div>
                        <h1>My Account</h1>
                        <p className="subtitle">Manage your paths and view your journey history</p>
                    </div>
                </div>
                <div className="header-right">
                    {/* Simple navigation button */}
                    <button
                        className="primary-btn"
                        onClick={() => window.location.href = '/'}
                    >
                        Home Page
                    </button>
                </div>
            </header>


            {/* Stats Cards Section */}
            <section className="stats-grid">
                <div className="stat-card">
                    <div className="stat-header">
                        <span>Total Paths</span>
                    </div>
                    <div className="stat-value">{pathes.length}</div>
                </div>

                <div className="stat-card">
                    <div className="stat-header">
                        <span>Total Time</span>
                    </div>
                    <div className="stat-value">{formatTime(totalMinutes)}</div>
                </div>

                <div className="stat-card">
                    <div className="stat-header">
                        <span>Total Budget</span>
                    </div>
                    <div className="stat-value">${totalBudget}</div>
                </div>
            </section>

            {/* History Table Section */}
            <section className="history-section">
                <div className="section-header">
                    <h2>Path History</h2>
                    <p className="subtitle">A complete record of all your paths and journeys</p>
                </div>

                <table className="history-table">
                    <thead>
                        <tr>
                            <th>Path</th>
                            <th>Date</th>
                            <th>Time</th>
                            <th>Budget</th>
                            <th>Review</th>
                            <th>Comment</th>
                        </tr>
                    </thead>
                    <PathesList pathes={ pathes } />
                </table>
            </section>
        </div>
    );
};

export default AccountPage;

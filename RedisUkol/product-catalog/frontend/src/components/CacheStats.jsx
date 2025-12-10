/**
 * CacheStats komponenta
 * Zobrazuje statistiky Redis cache a akce pro správu
 */

import './CacheStats.css';

function CacheStats({ stats, lastCacheStatus, onReset, onFlush }) {
  return (
    <div className="cache-stats">
      <div className="cache-stats-container">
        {/* Nadpis */}
        <div className="cache-stats-header">
          <div className="cache-stats-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <h3>Redis Cache Statistiky</h3>
            <p>Monitoring výkonu cachování</p>
          </div>
        </div>
        
        {/* Statistiky */}
        <div className="cache-stats-grid">
          {/* Cache Hits */}
          <div className="cache-stat-card hit">
            <div className="stat-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="stat-content">
              <span className="stat-value">{stats.hits}</span>
              <span className="stat-label">Cache Hits</span>
            </div>
          </div>
          
          {/* Cache Misses */}
          <div className="cache-stat-card miss">
            <div className="stat-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="stat-content">
              <span className="stat-value">{stats.misses}</span>
              <span className="stat-label">Cache Misses</span>
            </div>
          </div>
          
          {/* Hit Rate */}
          <div className="cache-stat-card rate">
            <div className="stat-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22 12H18L15 21L9 3L6 12H2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="stat-content">
              <span className="stat-value">{stats.hitRate}</span>
              <span className="stat-label">Hit Rate</span>
            </div>
          </div>
          
          {/* Celkem požadavků */}
          <div className="cache-stat-card total">
            <div className="stat-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 6H20M4 12H20M4 18H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="stat-content">
              <span className="stat-value">{stats.total}</span>
              <span className="stat-label">Celkem</span>
            </div>
          </div>
        </div>
        
        {/* Poslední stav cache */}
        {lastCacheStatus !== null && (
          <div className={`cache-last-status ${lastCacheStatus ? 'hit' : 'miss'}`}>
            <span className="status-icon">
              {lastCacheStatus ? '📗' : '📕'}
            </span>
            <span>
              Poslední požadavek: <strong>{lastCacheStatus ? 'Cache HIT' : 'Cache MISS'}</strong>
              {lastCacheStatus 
                ? ' - Data načtena z Redis cache' 
                : ' - Data načtena z PostgreSQL databáze'}
            </span>
          </div>
        )}
        
        {/* Akce */}
        <div className="cache-stats-actions">
          <button className="btn-secondary" onClick={onReset}>
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 4V10H7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M3.51 15C4.15839 16.8404 5.38734 18.4202 7.01166 19.5014C8.63598 20.5826 10.5677 21.1066 12.5157 20.9946C14.4637 20.8826 16.3226 20.1402 17.8121 18.8798C19.3017 17.6193 20.3413 15.9088 20.7742 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M23 20V14H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M20.49 9C19.8416 7.15957 18.6127 5.57976 16.9883 4.49856C15.364 3.41736 13.4323 2.89339 11.4843 3.00539C9.53627 3.11739 7.67739 3.85985 6.18785 5.12026C4.69831 6.38068 3.65868 8.09118 3.22578 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Reset statistik
          </button>
          <button className="btn-danger" onClick={onFlush}>
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 6H5H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M8 6V4C8 3.44772 8.44772 3 9 3H15C15.5523 3 16 3.44772 16 4V6" stroke="currentColor" strokeWidth="2"/>
              <path d="M19 6V20C19 20.5523 18.5523 21 18 21H6C5.44772 21 5 20.5523 5 20V6" stroke="currentColor" strokeWidth="2"/>
              <path d="M10 11V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M14 11V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Vyprázdnit cache
          </button>
        </div>
      </div>
    </div>
  );
}

export default CacheStats;


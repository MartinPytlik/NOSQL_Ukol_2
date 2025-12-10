/**
 * Header komponenta
 * Obsahuje logo, vyhledávání a filtr kategorií
 */

import './Header.css';

function Header({ 
  search, 
  onSearchChange, 
  categories, 
  selectedCategory, 
  onCategoryChange,
  onAddProduct 
}) {
  return (
    <header className="header">
      <div className="header-container">
        {/* Logo a název */}
        <div className="header-brand">
          <div className="header-logo">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 7H4C2.89543 7 2 7.89543 2 9V19C2 20.1046 2.89543 21 4 21H20C21.1046 21 22 20.1046 22 19V9C22 7.89543 21.1046 7 20 7Z" stroke="currentColor" strokeWidth="2"/>
              <path d="M16 7V5C16 3.89543 15.1046 3 14 3H10C8.89543 3 8 3.89543 8 5V7" stroke="currentColor" strokeWidth="2"/>
              <circle cx="12" cy="14" r="2" fill="currentColor"/>
            </svg>
          </div>
          <div className="header-title">
            <h1>Product Catalog</h1>
            <span className="header-subtitle">E-shop s Redis Cache</span>
          </div>
        </div>
        
        {/* Vyhledávání a filtry */}
        <div className="header-controls">
          {/* Vyhledávací pole */}
          <div className="search-box">
            <svg className="search-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2"/>
              <path d="M20 20L16 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <input
              type="text"
              placeholder="Hledat produkty..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="search-input"
            />
            {search && (
              <button 
                className="search-clear"
                onClick={() => onSearchChange('')}
                aria-label="Vymazat vyhledávání"
              >
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            )}
          </div>
          
          {/* Filtr kategorií */}
          <div className="category-filter">
            <select
              value={selectedCategory}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="category-select"
            >
              <option value="">Všechny kategorie</option>
              {categories.map((cat) => (
                <option key={cat.category} value={cat.category}>
                  {cat.category} ({cat.count})
                </option>
              ))}
            </select>
          </div>
          
          {/* Tlačítko pro přidání produktu */}
          <button className="btn-add-product" onClick={onAddProduct}>
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <span>Přidat produkt</span>
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;


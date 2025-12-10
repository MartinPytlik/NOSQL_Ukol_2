/**
 * ProductCard komponenta
 * Zobrazuje jednotlivý produkt v kartě
 */

import './ProductCard.css';

function ProductCard({ product, onEdit, onDelete, onView, style }) {
  // Formátování ceny
  const formatPrice = (price) => {
    return new Intl.NumberFormat('cs-CZ', {
      style: 'currency',
      currency: 'CZK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  // Fallback obrázek
  const handleImageError = (e) => {
    e.target.src = 'data:image/svg+xml,' + encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" fill="none">
        <rect width="400" height="300" fill="#1a1a24"/>
        <path d="M200 100v60m0 20v.01" stroke="#3a3a4a" stroke-width="8" stroke-linecap="round"/>
        <text x="200" y="220" text-anchor="middle" fill="#3a3a4a" font-family="system-ui" font-size="14">Obrázek není k dispozici</text>
      </svg>
    `);
  };

  return (
    <article className="product-card animate-slide-up" style={style}>
      {/* Obrázek produktu */}
      <div className="product-card-image">
        <img 
          src={product.image_url || ''} 
          alt={product.name}
          onError={handleImageError}
          loading="lazy"
        />
        
        {/* Kategorie badge */}
        <span className="product-category-badge">{product.category}</span>
        
        {/* Skladem badge */}
        <span className={`product-stock-badge ${product.stock_quantity > 0 ? 'in-stock' : 'out-of-stock'}`}>
          {product.stock_quantity > 0 ? `${product.stock_quantity} ks` : 'Vyprodáno'}
        </span>
      </div>
      
      {/* Obsah karty */}
      <div className="product-card-content">
        <h3 className="product-name">{product.name}</h3>
        
        {product.description && (
          <p className="product-description">{product.description}</p>
        )}
        
        <div className="product-price">{formatPrice(product.price)}</div>
      </div>
      
      {/* Akce */}
      <div className="product-card-actions">
        <button 
          className="action-btn action-view"
          onClick={() => onView(product.id)}
          title="Zobrazit detail (test cache)"
        >
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2 12C2 12 5 5 12 5C19 5 22 12 22 12C22 12 19 19 12 19C5 19 2 12 2 12Z" stroke="currentColor" strokeWidth="2"/>
            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
          </svg>
          <span>Cache test</span>
        </button>
        
        <button 
          className="action-btn action-edit"
          onClick={() => onEdit(product)}
          title="Upravit produkt"
        >
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M11 4H4C3.44772 4 3 4.44772 3 5V20C3 20.5523 3.44772 21 4 21H19C19.5523 21 20 20.5523 20 20V13" stroke="currentColor" strokeWidth="2"/>
            <path d="M18.5 2.5C19.3284 1.67157 20.6716 1.67157 21.5 2.5C22.3284 3.32843 22.3284 4.67157 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" stroke="currentColor" strokeWidth="2"/>
          </svg>
        </button>
        
        <button 
          className="action-btn action-delete"
          onClick={() => onDelete(product.id)}
          title="Smazat produkt"
        >
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 6H5H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <path d="M8 6V4C8 3.44772 8.44772 3 9 3H15C15.5523 3 16 3.44772 16 4V6" stroke="currentColor" strokeWidth="2"/>
            <path d="M19 6V20C19 20.5523 18.5523 21 18 21H6C5.44772 21 5 20.5523 5 20V6" stroke="currentColor" strokeWidth="2"/>
          </svg>
        </button>
      </div>
    </article>
  );
}

export default ProductCard;


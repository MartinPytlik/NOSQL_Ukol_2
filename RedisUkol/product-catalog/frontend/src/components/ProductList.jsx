/**
 * ProductList komponenta
 * Zobrazuje mřížku produktů se stránkováním
 */

import ProductCard from './ProductCard';
import Pagination from './Pagination';
import './ProductList.css';

function ProductList({ 
  products, 
  loading, 
  error, 
  pagination, 
  onPageChange,
  onEdit,
  onDelete,
  onView
}) {
  // Stav načítání
  if (loading) {
    return (
      <div className="product-list-loading">
        <div className="loading-spinner"></div>
        <p>Načítám produkty...</p>
      </div>
    );
  }

  // Stav chyby
  if (error) {
    return (
      <div className="product-list-error">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
          <path d="M12 8V12M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        <h3>Nastala chyba</h3>
        <p>{error}</p>
      </div>
    );
  }

  // Prázdný stav
  if (!products || products.length === 0) {
    return (
      <div className="product-list-empty">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 7H4C2.89543 7 2 7.89543 2 9V19C2 20.1046 2.89543 21 4 21H20C21.1046 21 22 20.1046 22 19V9C22 7.89543 21.1046 7 20 7Z" stroke="currentColor" strokeWidth="2"/>
          <path d="M16 7V5C16 3.89543 15.1046 3 14 3H10C8.89543 3 8 3.89543 8 5V7" stroke="currentColor" strokeWidth="2"/>
          <path d="M12 11V17M9 14H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        <h3>Žádné produkty nenalezeny</h3>
        <p>Zkuste změnit vyhledávací kritéria nebo přidejte nový produkt.</p>
      </div>
    );
  }

  return (
    <div className="product-list-container">
      {/* Informace o počtu */}
      <div className="product-list-info">
        <span>
          Zobrazeno {products.length} z {pagination.totalItems} produktů
        </span>
      </div>
      
      {/* Mřížka produktů */}
      <div className="product-grid">
        {products.map((product, index) => (
          <ProductCard 
            key={product.id}
            product={product}
            onEdit={onEdit}
            onDelete={onDelete}
            onView={onView}
            style={{ animationDelay: `${index * 50}ms` }}
          />
        ))}
      </div>
      
      {/* Stránkování */}
      {pagination.totalPages > 1 && (
        <Pagination 
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
}

export default ProductList;


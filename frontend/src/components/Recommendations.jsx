import './Recommendations.css';

const formatPrice = (price) => {
  if (price === undefined || price === null) {
    return '—';
  }

  return new Intl.NumberFormat('cs-CZ', {
    style: 'currency',
    currency: 'CZK',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price);
};

const handleImageError = (event) => {
  event.target.src = 'data:image/svg+xml,' + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 140" fill="none">
      <rect width="220" height="140" rx="16" fill="#1a1a24"/>
      <path d="M110 45v35m0 12v.01" stroke="#3a3a4a" stroke-width="6" stroke-linecap="round"/>
      <text x="110" y="110" text-anchor="middle" fill="#3a3a4a" font-family="system-ui" font-size="12">Obrázek není k dispozici</text>
    </svg>
  `);
};

const RecommendationSection = ({ title, subtitle, products, onView }) => {
  if (!products || products.length === 0) {
    return null;
  }

  return (
    <section className="recommendation-section animate-fade-in">
      <div className="recommendation-header">
        <div>
          <h3 className="recommendation-title">{title}</h3>
          <p className="recommendation-subtitle">{subtitle}</p>
        </div>
      </div>

      <div className="recommendation-list">
        {products.map((product) => (
          <button
            key={product.id}
            type="button"
            className="recommendation-card"
            onClick={() => onView?.(product.id)}
          >
            <div className="recommendation-card-image">
              <img
                src={product.image_url || ''}
                alt={product.name}
                loading="lazy"
                onError={handleImageError}
              />
              {product.category && (
                <span className="recommendation-card-category">{product.category}</span>
              )}
            </div>
            <div className="recommendation-card-body">
              <h4>{product.name}</h4>
              {product.description && (
                <p className="recommendation-card-description">{product.description}</p>
              )}
              <div className="recommendation-card-footer">
                <span className="recommendation-card-price">{formatPrice(product.price)}</span>
                <span className="recommendation-card-cta">Zobrazit detail →</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
};

function Recommendations({ recentProducts, recommendedProducts, onView }) {
  if ((!recentProducts || recentProducts.length === 0) && (!recommendedProducts || recommendedProducts.length === 0)) {
    return null;
  }

  return (
    <div className="recommendations">
      <RecommendationSection
        title="Nedávno zobrazené"
        subtitle="Rychlý přístup k produktům, které vás zaujaly"
        products={recentProducts}
        onView={onView}
      />

      <RecommendationSection
        title="Mohlo by se vám líbit"
        subtitle="Doporučení založená na vašich posledních prohlíženích"
        products={recommendedProducts}
        onView={onView}
      />
    </div>
  );
}

export default Recommendations;

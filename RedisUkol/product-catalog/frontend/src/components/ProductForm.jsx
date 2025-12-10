/**
 * ProductForm komponenta
 * Modální formulář pro vytvoření/editaci produktu
 */

import { useState, useEffect } from 'react';
import './ProductForm.css';

function ProductForm({ product, categories, onSave, onClose }) {
  const isEditing = !!product;
  
  // Stav formuláře
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    image_url: '',
    stock_quantity: ''
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Naplnění formuláře při editaci
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        price: product.price?.toString() || '',
        category: product.category || '',
        image_url: product.image_url || '',
        stock_quantity: product.stock_quantity?.toString() || ''
      });
    }
  }, [product]);

  // Změna pole
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Smazání chyby při editaci
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Validace
  const validate = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Název je povinný';
    }
    
    if (!formData.price || parseFloat(formData.price) < 0) {
      newErrors.price = 'Zadejte platnou cenu';
    }
    
    if (!formData.category.trim()) {
      newErrors.category = 'Kategorie je povinná';
    }
    
    if (formData.image_url && !isValidUrl(formData.image_url)) {
      newErrors.image_url = 'Zadejte platnou URL adresu';
    }
    
    if (formData.stock_quantity && parseInt(formData.stock_quantity) < 0) {
      newErrors.stock_quantity = 'Množství musí být nezáporné';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Kontrola URL
  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  // Odeslání formuláře
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    setLoading(true);
    
    try {
      await onSave({
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        price: parseFloat(formData.price),
        category: formData.category.trim(),
        image_url: formData.image_url.trim() || null,
        stock_quantity: formData.stock_quantity ? parseInt(formData.stock_quantity) : 0
      });
    } finally {
      setLoading(false);
    }
  };

  // Zavření modálu při kliku na overlay
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content">
        {/* Header */}
        <div className="modal-header">
          <h2>{isEditing ? 'Upravit produkt' : 'Nový produkt'}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Zavřít">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
        
        {/* Formulář */}
        <form onSubmit={handleSubmit} className="product-form">
          {/* Název */}
          <div className="form-group">
            <label htmlFor="name">Název produktu *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Zadejte název produktu"
              className={errors.name ? 'error' : ''}
            />
            {errors.name && <span className="error-message">{errors.name}</span>}
          </div>
          
          {/* Popis */}
          <div className="form-group">
            <label htmlFor="description">Popis</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Zadejte popis produktu"
              rows="3"
            />
          </div>
          
          {/* Cena a kategorie */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="price">Cena (Kč) *</label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleChange}
                placeholder="0"
                min="0"
                step="0.01"
                className={errors.price ? 'error' : ''}
              />
              {errors.price && <span className="error-message">{errors.price}</span>}
            </div>
            
            <div className="form-group">
              <label htmlFor="category">Kategorie *</label>
              <input
                type="text"
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                placeholder="Zadejte kategorii"
                list="categories-list"
                className={errors.category ? 'error' : ''}
              />
              <datalist id="categories-list">
                {categories.map(cat => (
                  <option key={cat} value={cat} />
                ))}
              </datalist>
              {errors.category && <span className="error-message">{errors.category}</span>}
            </div>
          </div>
          
          {/* URL obrázku */}
          <div className="form-group">
            <label htmlFor="image_url">URL obrázku</label>
            <input
              type="url"
              id="image_url"
              name="image_url"
              value={formData.image_url}
              onChange={handleChange}
              placeholder="https://example.com/image.jpg"
              className={errors.image_url ? 'error' : ''}
            />
            {errors.image_url && <span className="error-message">{errors.image_url}</span>}
          </div>
          
          {/* Množství na skladě */}
          <div className="form-group">
            <label htmlFor="stock_quantity">Množství na skladě</label>
            <input
              type="number"
              id="stock_quantity"
              name="stock_quantity"
              value={formData.stock_quantity}
              onChange={handleChange}
              placeholder="0"
              min="0"
              className={errors.stock_quantity ? 'error' : ''}
            />
            {errors.stock_quantity && <span className="error-message">{errors.stock_quantity}</span>}
          </div>
          
          {/* Akce */}
          <div className="form-actions">
            <button 
              type="button" 
              className="btn-secondary" 
              onClick={onClose}
              disabled={loading}
            >
              Zrušit
            </button>
            <button 
              type="submit" 
              className="btn-primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="btn-spinner"></span>
                  Ukládám...
                </>
              ) : (
                isEditing ? 'Uložit změny' : 'Vytvořit produkt'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProductForm;


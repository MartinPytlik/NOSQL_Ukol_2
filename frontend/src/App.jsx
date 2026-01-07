/**
 * Hlavní komponenta aplikace Product Catalog
 * Obsahuje správu stavu, routování a layout
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import Header from './components/Header';
import ProductList from './components/ProductList';
import ProductForm from './components/ProductForm';
import CacheStats from './components/CacheStats';
import Recommendations from './components/Recommendations';
import Toast from './components/Toast';
import './App.css';

// API URL - při vývoji použije proxy, v produkci relativní cestu
const API_URL = '/api';

// Generování unikátního ID uživatele pro sledování napříč sessions
const getUserId = () => {
  let userId = localStorage.getItem('userId');
  if (!userId) {
    userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('userId', userId);
  }
  return userId;
};

const USER_ID = getUserId();

function App() {
  // Stav aplikace
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Stav pro stránkování
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    totalItems: 0,
    totalPages: 0
  });
  
  // Filtry
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  
  // Modální okno pro formulář
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  
  // Cache statistiky
  const [cacheStats, setCacheStats] = useState({ hits: 0, misses: 0, hitRate: '0%' });
  const [lastCacheStatus, setLastCacheStatus] = useState(null);
  
  // Toast notifikace
  const [toast, setToast] = useState(null);

  // Nedávno zobrazené a doporučené produkty z backendu
  const [recentProducts, setRecentProducts] = useState([]);
  const [recommendedProducts, setRecommendedProducts] = useState([]);

  /**
   * Zobrazí toast notifikaci
   */
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  /**
   * Načte nedávno navštívené produkty z backendu
   */
  const fetchRecentProducts = async () => {
    try {
      const response = await fetch(`${API_URL}/products/recommendations/recent?limit=6`, {
        headers: { 'x-user-id': USER_ID }
      });
      const data = await response.json();
      
      if (data.success) {
        setRecentProducts(data.data);
      }
    } catch (err) {
      console.error('Chyba při načítání nedávno navštívených produktů:', err);
    }
  };

  /**
   * Načte doporučené produkty z backendu
   */
  const fetchRecommendedProducts = async () => {
    try {
      const response = await fetch(`${API_URL}/products/recommendations/suggested?limit=6`, {
        headers: { 'x-user-id': USER_ID }
      });
      const data = await response.json();
      
      if (data.success) {
        setRecommendedProducts(data.data);
      }
    } catch (err) {
      console.error('Chyba při načítání doporučených produktů:', err);
    }
  };

  /**
   * Načte produkty z API
   */
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString()
      });
      
      if (search) params.append('search', search);
      if (selectedCategory) params.append('category', selectedCategory);
      
      const response = await fetch(`${API_URL}/products?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setProducts(data.data);
        setPagination(prev => ({
          ...prev,
          totalItems: data.pagination.totalItems,
          totalPages: data.pagination.totalPages
        }));
        setLastCacheStatus(data.fromCache);
      } else {
        throw new Error(data.error || 'Chyba při načítání produktů');
      }
    } catch (err) {
      setError(err.message);
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search, selectedCategory]);

  /**
   * Načte kategorie
   */
  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_URL}/products/categories`);
      const data = await response.json();
      
      if (data.success) {
        setCategories(data.data);
      }
    } catch (err) {
      console.error('Chyba při načítání kategorií:', err);
    }
  };

  /**
   * Načte statistiky cache
   */
  const fetchCacheStats = async () => {
    try {
      const response = await fetch(`${API_URL}/cache/stats`);
      const data = await response.json();
      
      if (data.success) {
        setCacheStats(data.data);
      }
    } catch (err) {
      console.error('Chyba při načítání cache statistik:', err);
    }
  };

  /**
   * Reset cache statistik
   */
  const resetCacheStats = async () => {
    try {
      await fetch(`${API_URL}/cache/reset-stats`, { method: 'POST' });
      setCacheStats({ hits: 0, misses: 0, hitRate: '0%' });
      showToast('Cache statistiky resetovány', 'success');
    } catch (err) {
      showToast('Chyba při resetování statistik', 'error');
    }
  };

  /**
   * Vyprázdní cache
   */
  const flushCache = async () => {
    try {
      const response = await fetch(`${API_URL}/cache/flush`, { method: 'POST' });
      const data = await response.json();
      
      if (data.success) {
        showToast(data.message, 'success');
        fetchCacheStats();
      }
    } catch (err) {
      showToast('Chyba při vyprazdňování cache', 'error');
    }
  };

  /**
   * Uloží produkt do seznamu nedávno zobrazených
   */
  const rememberProduct = useCallback(async (product) => {
    if (!product || !product.id) {
      return;
    }

    // Aktualizace proběhne automaticky na backendu při volání GET /api/products/:id
    // Znovu načteme doporučení
    await fetchRecentProducts();
    await fetchRecommendedProducts();
  }, []);

  /**
   * Vytvoří nebo aktualizuje produkt
   */
  const handleSaveProduct = async (productData) => {
    try {
      const isEditing = !!editingProduct;
      const url = isEditing 
        ? `${API_URL}/products/${editingProduct.id}`
        : `${API_URL}/products`;
      
      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        showToast(
          isEditing ? 'Produkt úspěšně aktualizován' : 'Produkt úspěšně vytvořen',
          'success'
        );
        setShowForm(false);
        setEditingProduct(null);
        fetchProducts();
        fetchCategories();
        fetchCacheStats();
      } else {
        throw new Error(data.error || 'Chyba při ukládání produktu');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  /**
   * Smaže produkt
   */
  const handleDeleteProduct = async (productId) => {
    if (!confirm('Opravdu chcete smazat tento produkt?')) return;
    
    try {
      const response = await fetch(`${API_URL}/products/${productId}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        showToast('Produkt úspěšně smazán', 'success');
        fetchProducts();
        fetchCategories();
        fetchCacheStats();
      } else {
        throw new Error(data.error || 'Chyba při mazání produktu');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  /**
   * Otevře formulář pro editaci
   */
  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  /**
   * Zobrazí detail produktu (s cache demonstrací)
   */
  const handleViewProduct = async (productId) => {
    try {
      const response = await fetch(`${API_URL}/products/${productId}`, {
        headers: { 'x-user-id': USER_ID }
      });
      const data = await response.json();
      
      if (data.success) {
        setLastCacheStatus(data.fromCache);
        await rememberProduct(data.data);
        showToast(
          data.fromCache 
            ? `📗 Cache HIT - Produkt načten z Redis cache`
            : `📕 Cache MISS - Produkt načten z databáze`,
          data.fromCache ? 'success' : 'warning'
        );
        fetchCacheStats();
      }
    } catch (err) {
      showToast('Chyba při načítání produktu', 'error');
    }
  };

  // Načtení dat při startu a změně filtrů
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    fetchCategories();
    fetchCacheStats();
    fetchRecentProducts();
    fetchRecommendedProducts();
    
    // Aktualizace cache statistik každých 5 sekund
    const interval = setInterval(fetchCacheStats, 5000);
    return () => clearInterval(interval);
  }, []);

  // Reset stránkování při změně filtrů
  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 1 }));
  }, [search, selectedCategory]);

  // Aktualizace doporučení při změně produktů
  useEffect(() => {
    if (recentProducts.length > 0) {
      fetchRecommendedProducts();
    }
  }, [recentProducts]);

  return (
    <div className="app">
      {/* Header s vyhledáváním */}
      <Header 
        search={search}
        onSearchChange={setSearch}
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        onAddProduct={() => {
          setEditingProduct(null);
          setShowForm(true);
        }}
      />
      
      {/* Cache statistiky */}
      <CacheStats 
        stats={cacheStats}
        lastCacheStatus={lastCacheStatus}
        onReset={resetCacheStats}
        onFlush={flushCache}
      />
      
      {/* Hlavní obsah - seznam produktů */}
      <main className="main-content">
        <Recommendations
          recentProducts={recentProducts}
          recommendedProducts={recommendedProducts}
          onView={handleViewProduct}
        />
        <ProductList 
          products={products}
          loading={loading}
          error={error}
          pagination={pagination}
          onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
          onEdit={handleEditProduct}
          onDelete={handleDeleteProduct}
          onView={handleViewProduct}
        />
      </main>
      
      {/* Modální okno s formulářem */}
      {showForm && (
        <ProductForm 
          product={editingProduct}
          categories={categories.map(c => c.category)}
          onSave={handleSaveProduct}
          onClose={() => {
            setShowForm(false);
            setEditingProduct(null);
          }}
        />
      )}
      
      {/* Toast notifikace */}
      {toast && (
        <Toast 
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

export default App;


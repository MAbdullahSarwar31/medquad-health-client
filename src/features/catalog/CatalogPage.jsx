import { useState, useEffect } from 'react';
import { equipmentAPI } from '../../services/api';
import { HiOutlineSearch, HiOutlineFilter, HiOutlineChevronLeft, HiOutlineChevronRight } from 'react-icons/hi';
import './Catalog.css';

const CatalogPage = () => {
    const [equipment, setEquipment] = useState([]);
    const [filters, setFilters] = useState({ manufacturers: [], categories: [] });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('');
    const [manufacturer, setManufacturer] = useState('');
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({});
    const [showFilters, setShowFilters] = useState(false);

    const fetchEquipment = async () => {
        setLoading(true);
        try {
            const params = { page, limit: 12 };
            if (search) params.search = search;
            if (category) params.category = category;
            if (manufacturer) params.manufacturer = manufacturer;

            const { data } = await equipmentAPI.getAll(params);
            setEquipment(data.data.equipment);
            setFilters(data.data.filters);
            setPagination(data.data.pagination);
        } catch (error) {
            console.error('Failed to fetch equipment:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEquipment();
    }, [page, category, manufacturer]);

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1);
        fetchEquipment();
    };

    const clearFilters = () => {
        setSearch('');
        setCategory('');
        setManufacturer('');
        setPage(1);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'operational': return 'success';
            case 'maintenance': return 'warning';
            case 'down': return 'danger';
            default: return 'neutral';
        }
    };

    const getCategoryIcon = (cat) => {
        switch (cat) {
            case 'MRI': return '🧲';
            case 'CT': return '📡';
            case 'Ultrasound': return '🔊';
            case 'X-Ray': return '☢️';
            case 'ECG': return '💓';
            default: return '🔬';
        }
    };

    return (
        <div className="catalog-page">
            {/* Hero Section */}
            <div className="catalog-hero">
                <div className="catalog-hero-content">
                    <h1 className="catalog-hero-title animate-slideUp">
                        Medical Equipment <span className="text-accent">Catalog</span>
                    </h1>
                    <p className="catalog-hero-subtitle animate-slideUp" style={{ animationDelay: '100ms' }}>
                        Explore our comprehensive range of certified medical imaging and diagnostic equipment from world-class manufacturers.
                    </p>

                    {/* Search Bar */}
                    <form onSubmit={handleSearch} className="catalog-search animate-slideUp" style={{ animationDelay: '200ms' }}>
                        <div className="search-bar">
                            <HiOutlineSearch className="search-bar-icon" />
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Search by name, model, or manufacturer..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                id="catalog-search"
                            />
                        </div>
                        <button type="submit" className="btn btn-primary">Search</button>
                        <button type="button" className="btn btn-secondary" onClick={() => setShowFilters(!showFilters)}>
                            <HiOutlineFilter /> Filters
                        </button>
                    </form>
                </div>
            </div>

            {/* Filters Bar */}
            {showFilters && (
                <div className="catalog-filters animate-slideDown">
                    <div className="catalog-filters-inner">
                        <select className="form-input form-select" value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }} id="filter-category">
                            <option value="">All Categories</option>
                            {filters.categories?.map((c) => <option key={c} value={c}>{getCategoryIcon(c)} {c}</option>)}
                        </select>
                        <select className="form-input form-select" value={manufacturer} onChange={(e) => { setManufacturer(e.target.value); setPage(1); }} id="filter-manufacturer">
                            <option value="">All Manufacturers</option>
                            {filters.manufacturers?.map((m) => <option key={m} value={m}>{m}</option>)}
                        </select>
                        <button type="button" className="btn btn-ghost" onClick={clearFilters}>Clear All</button>
                    </div>
                </div>
            )}

            {/* Results */}
            <div className="catalog-content">
                <div className="catalog-meta">
                    <span>{pagination.total || 0} equipment items found</span>
                    {(category || manufacturer || search) && (
                        <button className="btn btn-ghost btn-sm" onClick={clearFilters}>Clear filters</button>
                    )}
                </div>

                {loading ? (
                    <div className="loader"><div className="loader-spinner" /></div>
                ) : equipment.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">🔬</div>
                        <h3>No equipment found</h3>
                        <p>Try adjusting your search or filter criteria.</p>
                    </div>
                ) : (
                    <div className="catalog-grid">
                        {equipment.map((item, index) => (
                            <div key={item._id} className="catalog-card glass-card" style={{ animationDelay: `${index * 50}ms` }}>
                                <div className="catalog-card-header">
                                    <span className="catalog-card-category">{getCategoryIcon(item.category)} {item.category}</span>
                                    <span className={`badge badge-${getStatusColor(item.status)}`}>{item.status}</span>
                                </div>
                                <h3 className="catalog-card-name">{item.name}</h3>
                                <p className="catalog-card-model">{item.manufacturer} — {item.model}</p>
                                <p className="catalog-card-desc">{item.description?.substring(0, 120)}...</p>
                                <div className="catalog-card-specs">
                                    {item.specifications && Object.entries(
                                        typeof item.specifications === 'object' && item.specifications instanceof Map
                                            ? Object.fromEntries(item.specifications)
                                            : (item.specifications || {})
                                    ).slice(0, 3).map(([key, val]) => (
                                        <div key={key} className="catalog-card-spec">
                                            <span className="catalog-card-spec-label">{key}</span>
                                            <span className="catalog-card-spec-value">{val}</span>
                                        </div>
                                    ))}
                                </div>
                                {item.totalUsageHours > 0 && (
                                    <div className="catalog-card-usage">
                                        <div className="catalog-card-usage-bar">
                                            <div className="catalog-card-usage-fill" style={{ width: `${Math.min((item.totalUsageHours / 25000) * 100, 100)}%` }} />
                                        </div>
                                        <span className="catalog-card-usage-text">{item.totalUsageHours.toLocaleString()} hrs</span>
                                    </div>
                                )}
                                {item.clientId && (
                                    <div className="catalog-card-client">
                                        <span>🏥 {item.clientId.orgName || 'Assigned'}</span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {pagination.pages > 1 && (
                    <div className="pagination">
                        <button className="pagination-btn" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                            <HiOutlineChevronLeft />
                        </button>
                        {[...Array(pagination.pages)].map((_, i) => (
                            <button key={i} className={`pagination-btn ${page === i + 1 ? 'active' : ''}`} onClick={() => setPage(i + 1)}>
                                {i + 1}
                            </button>
                        ))}
                        <button className="pagination-btn" disabled={page >= pagination.pages} onClick={() => setPage(page + 1)}>
                            <HiOutlineChevronRight />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CatalogPage;

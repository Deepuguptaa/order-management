import { useState, useCallback, useRef } from 'react';
import FilterBar from './components/FilterBar';
import OrdersTable from './components/OrdersTable';
import Pagination from './components/Pagination';
import CreateOrderModal from './components/CreateOrderModal';
import SchedulerLogsPanel from './components/SchedulerLogsPanel';
import { useOrders } from './hooks/useOrders';

export default function App() {
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'scheduler'
  const debounceRef = useRef(null);

  const { orders, pagination, isLoading, error, lastUpdatedAt, refresh } = useOrders({
    status,
    search: debouncedSearch,
    page,
    limit: 20,
  });

  function handleStatusChange(val) {
    setStatus(val);
    setPage(1);
  }

  function handleSearchChange(val) {
    setSearch(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(val);
      setPage(1);
    }, 350);
  }

  const handleOrderCreated = useCallback(() => {
    setShowModal(false);
    setStatus('');
    setPage(1);
    refresh();
  }, [refresh]);

  const TAB_STYLE = (active) => ({
    padding: '8px 18px',
    fontSize: '13px',
    fontWeight: 600,
    background: active ? 'var(--surface-raised)' : 'transparent',
    color: active ? 'var(--text-primary)' : 'var(--text-muted)',
    border: '1px solid',
    borderColor: active ? 'var(--border)' : 'transparent',
    borderRadius: 'var(--radius-sm)',
    cursor: 'pointer',
  });

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Top navigation */}
      <header
        style={{
          borderBottom: '1px solid var(--border)',
          background: 'var(--surface)',
          padding: '0 28px',
          display: 'flex',
          alignItems: 'center',
          gap: '24px',
          height: '56px',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginRight: '16px' }}>
          <span style={{ fontSize: '18px', color: 'var(--accent)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
            OM
          </span>
          <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontFamily: 'var(--font-display)' }}>
            Order Management
          </span>
        </div>

        <nav style={{ display: 'flex', gap: '4px' }}>
          <button style={TAB_STYLE(activeTab === 'orders')} onClick={() => setActiveTab('orders')}>
            Orders
          </button>
          <button style={TAB_STYLE(activeTab === 'scheduler')} onClick={() => setActiveTab('scheduler')}>
            Scheduler
          </button>
        </nav>

        <div style={{ marginLeft: 'auto' }}>
          <button
            onClick={() => setShowModal(true)}
            style={{
              padding: '8px 18px',
              background: 'var(--accent)',
              color: '#0f1115',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            + New Order
          </button>
        </div>
      </header>

      <main style={{ maxWidth: '1300px', margin: '0 auto', padding: '28px' }}>
        {activeTab === 'orders' && (
          <>
            {/* Summary strip */}
            <div style={{ marginBottom: '24px' }}>
              <h1 style={{ margin: '0 0 4px', fontSize: '20px', fontFamily: 'var(--font-display)' }}>
                Orders
              </h1>
              {pagination && (
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>
                  {pagination.total} total order{pagination.total !== 1 ? 's' : ''}
                  {status ? ` with status ${status.replace(/_/g, ' ')}` : ''}
                </p>
              )}
            </div>

            <FilterBar
              status={status}
              onStatusChange={handleStatusChange}
              search={search}
              onSearchChange={handleSearchChange}
              onRefresh={refresh}
              isRefreshing={isLoading}
              lastUpdatedAt={lastUpdatedAt}
            />

            <OrdersTable
              orders={orders}
              isLoading={isLoading}
              error={error}
              onRetry={refresh}
            />

            <Pagination pagination={pagination} onPageChange={setPage} />
          </>
        )}

        {activeTab === 'scheduler' && (
          <>
            <div style={{ marginBottom: '24px' }}>
              <h1 style={{ margin: '0 0 4px', fontSize: '20px', fontFamily: 'var(--font-display)' }}>
                Scheduler
              </h1>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>
                Runs every 5 minutes. Automatically transitions orders: PLACED after 10 min to PROCESSING,
                PROCESSING after 20 min to READY TO SHIP.
              </p>
            </div>
            <SchedulerLogsPanel />
          </>
        )}
      </main>

      {showModal && (
        <CreateOrderModal
          onClose={() => setShowModal(false)}
          onCreated={handleOrderCreated}
        />
      )}
    </div>
  );
}

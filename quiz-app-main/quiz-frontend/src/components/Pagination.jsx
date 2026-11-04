import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null

  const pages = []
  for (let i = 0; i < totalPages; i++) {
    pages.push(i)
  }

  // To prevent too many pages from showing, we could add a window logic here.
  // For now, keeping it simple to just show all pages or a truncated list.
  const getVisiblePages = () => {
    if (totalPages <= 7) return pages
    if (currentPage <= 3) return [...pages.slice(0, 5), '...', totalPages - 1]
    if (currentPage >= totalPages - 4) return [0, '...', ...pages.slice(totalPages - 5)]
    return [0, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages - 1]
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 24 }}>
      <button 
        onClick={() => onPageChange(currentPage - 1)} 
        disabled={currentPage === 0}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: currentPage === 0 ? '#64748b' : '#fff', cursor: currentPage === 0 ? 'not-allowed' : 'pointer' }}
      >
        <ChevronLeft size={16} />
      </button>

      {getVisiblePages().map((page, idx) => (
        page === '...' ? (
          <span key={`ellipsis-${idx}`} style={{ color: '#64748b', padding: '0 8px' }}>...</span>
        ) : (
          <button 
            key={page} 
            onClick={() => onPageChange(page)}
            style={{ 
              display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 36, height: 36, borderRadius: 8, 
              background: currentPage === page ? 'var(--primary)' : 'rgba(255,255,255,0.05)', 
              border: currentPage === page ? 'none' : '1px solid rgba(255,255,255,0.1)', 
              color: currentPage === page ? '#fff' : '#94a3b8', 
              fontWeight: 600, fontSize: 14, cursor: 'pointer', transition: 'all 0.2s' 
            }}
          >
            {page + 1}
          </button>
        )
      ))}

      <button 
        onClick={() => onPageChange(currentPage + 1)} 
        disabled={currentPage === totalPages - 1}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: currentPage === totalPages - 1 ? '#64748b' : '#fff', cursor: currentPage === totalPages - 1 ? 'not-allowed' : 'pointer' }}
      >
        <ChevronRight size={16} />
      </button>
    </div>
  )
}

import { useState } from 'react';
import { Filter, ChevronUp, ChevronDown } from 'lucide-react';

/**
 * Hook for managing collapsible filter state
 * Returns [isVisible, toggleVisibility, FilterToggleButton]
 */
export function useCollapsibleFilters(defaultVisible = true) {
    const [filtersVisible, setFiltersVisible] = useState(defaultVisible);

    const toggleFilters = () => setFiltersVisible(!filtersVisible);

    const FilterToggleButton = ({ className = '' }) => (
        <button
            className={`filter-toggle-btn ${!filtersVisible ? 'collapsed' : ''} ${className}`}
            onClick={toggleFilters}
            title={filtersVisible ? 'Hide Filters' : 'Show Filters'}
        >
            <Filter size={14} />
            {filtersVisible ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
    );

    return {
        filtersVisible,
        toggleFilters,
        FilterToggleButton,
        filterWrapperClass: `filters-wrapper ${!filtersVisible ? 'collapsed' : ''}`
    };
}

/**
 * Wrapper component for collapsible filters section
 */
export function CollapsibleFilters({ visible, children }) {
    return (
        <div className={`filters-wrapper ${!visible ? 'collapsed' : ''}`}>
            {children}
        </div>
    );
}

export default useCollapsibleFilters;

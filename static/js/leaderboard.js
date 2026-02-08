/**
 * Leaderboard functionality for ContentBench website
 */

let leaderboardData = null;
let currentSort = { column: 'rank', direction: 'asc' };

/**
 * Initialize leaderboard when page loads
 */
document.addEventListener('DOMContentLoaded', function() {
    loadLeaderboardData();
});

/**
 * Load leaderboard data from embedded JavaScript
 */
async function loadLeaderboardData() {
    try {
        // Use embedded data to avoid CORS issues on GitHub Pages
        if (window.CONTENTBENCH_DATA) {
            leaderboardData = window.CONTENTBENCH_DATA;
            renderLeaderboard();
            setupEventListeners();
        } else {
            // Fallback to fetch for local development
            const response = await fetch('./static/data/leaderboard.json');
            leaderboardData = await response.json();
            renderLeaderboard();
            setupEventListeners();
        }
    } catch (error) {
        console.error('Error loading leaderboard data:', error);
        document.getElementById('leaderboard-tbody').innerHTML = 
            '<tr><td colspan="5" class="has-text-centered">Error loading data</td></tr>';
    }
}

/**
 * Render the leaderboard table
 */
function renderLeaderboard() {
    if (!leaderboardData || !leaderboardData.models) return;
    
    const tbody = document.getElementById('leaderboard-tbody');
    const searchTerm = document.getElementById('search-models').value.toLowerCase();
    const providerFilter = document.getElementById('provider-filter').value;
    
    // Filter data
    let filteredModels = leaderboardData.models.filter(model => {
        const matchesSearch = model.model_name.toLowerCase().includes(searchTerm) ||
                             model.display_name.toLowerCase().includes(searchTerm);
        const matchesProvider = providerFilter === 'all' || model.provider === providerFilter;
        return matchesSearch && matchesProvider;
    });
    
    // Sort data
    filteredModels.sort((a, b) => {
        let aVal = a[currentSort.column];
        let bVal = b[currentSort.column];
        
        // Handle null values
        if (aVal === null || aVal === undefined) aVal = 0;
        if (bVal === null || bVal === undefined) bVal = 0;
        
        if (currentSort.direction === 'asc') {
            return aVal > bVal ? 1 : -1;
        } else {
            return aVal < bVal ? 1 : -1;
        }
    });
    
    tbody.innerHTML = '';
    
    // Render rows
    filteredModels.forEach((model, index) => {
        const row = document.createElement('tr');
        row.className = getAccuracyClass(model.accuracy);
        
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>
                <div class="media">
                    <div class="media-content">
                        <p class="is-size-6 has-text-weight-semibold">${model.display_name}</p>
                        <p class="is-size-7 has-text-grey">${model.model_name}</p>
                    </div>
                </div>
            </td>
            <td>
                <span class="tag ${getAccuracyTag(model.accuracy)}">
                    ${model.accuracy.toFixed(1)}%
                </span>
            </td>
            <td>
                <span class="tag ${getSarcasmTag(model.sarcasm_recall)}">
                    ${model.sarcasm_recall.toFixed(1)}%
                </span>
            </td>
            <td>${model.cost_per_50k !== null ? '$' + model.cost_per_50k.toFixed(2) : 'N/A'}</td>
        `;
        
        tbody.appendChild(row);
    });
}

/**
 * Get CSS class for accuracy-based row styling
 */
function getAccuracyClass(accuracy) {
    if (accuracy >= 95) return 'accuracy-high';
    if (accuracy >= 85) return 'accuracy-medium';
    if (accuracy >= 75) return 'accuracy-low';
    return 'accuracy-very-low';
}

/**
 * Get tag class for accuracy display
 */
function getAccuracyTag(accuracy) {
    if (accuracy >= 95) return 'is-success';
    if (accuracy >= 85) return 'is-warning';
    if (accuracy >= 75) return 'is-danger';
    return 'is-dark';
}

/**
 * Get tag class for sarcasm recall display
 */
function getSarcasmTag(recall) {
    if (recall >= 90) return 'is-success';
    if (recall >= 70) return 'is-warning';
    if (recall >= 40) return 'is-danger';
    return 'is-dark';
}

/**
 * Setup event listeners for interactive features
 */
function setupEventListeners() {
    // Search functionality
    document.getElementById('search-models').addEventListener('input', renderLeaderboard);
    
    // Provider filter
    document.getElementById('provider-filter').addEventListener('change', renderLeaderboard);
    
    // Sortable columns
    document.querySelectorAll('.sortable').forEach(header => {
        header.addEventListener('click', function() {
            const column = this.dataset.sort;
            
            // Toggle sort direction if same column
            if (currentSort.column === column) {
                currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
            } else {
                currentSort.column = column;
                currentSort.direction = 'asc';
            }
            
            updateSortHeaders();
            renderLeaderboard();
        });
    });
    
}

/**
 * Update sort indicators in table headers
 */
function updateSortHeaders() {
    document.querySelectorAll('.sortable').forEach(header => {
        header.classList.remove('sort-asc', 'sort-desc');
        
        if (header.dataset.sort === currentSort.column) {
            header.classList.add(`sort-${currentSort.direction}`);
        }
    });
}


/**
 * Copy citation to clipboard
 */
function copyCitation() {
    const citationText = document.getElementById('citation-text').textContent;
    navigator.clipboard.writeText(citationText).then(() => {
        const button = document.getElementById('copy-citation');
        const originalText = button.innerHTML;
        button.innerHTML = '<span class="icon"><i class="fas fa-check"></i></span><span>Copied!</span>';
        button.classList.add('is-success');
        
        setTimeout(() => {
            button.innerHTML = originalText;
            button.classList.remove('is-success');
        }, 2000);
    });
}

// Setup citation copy functionality
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('copy-citation').addEventListener('click', copyCitation);
});
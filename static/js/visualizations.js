/**
 * Visualizations for ContentBench website using Plotly.js
 */

let visualizationData = null;

/**
 * Initialize visualizations when page loads
 */
document.addEventListener('DOMContentLoaded', function() {
    loadVisualizationData();
});

/**
 * Load data for visualizations
 */
async function loadVisualizationData() {
    try {
        // Use embedded data to avoid CORS issues on GitHub Pages
        if (window.CONTENTBENCH_DATA) {
            visualizationData = window.CONTENTBENCH_DATA;
            createAllVisualizations();
        } else {
            // Fallback to fetch for local development
            const response = await fetch('./static/data/leaderboard.json');
            visualizationData = await response.json();
            createAllVisualizations();
        }
    } catch (error) {
        console.error('Error loading visualization data:', error);
    }
}

/**
 * Create all visualizations
 */
function createAllVisualizations() {
    if (!visualizationData) return;
    
    createScatterPlot();
    createEfficiencyChart();
    createRadarChart();
    createCostCalculator();
}

/**
 * Create scatter plot: Accuracy vs Cost Efficiency
 */
function createScatterPlot() {
    const data = visualizationData.visualization_data.scatter_plot_data;
    
    if (!data || data.length === 0) return;
    
    const providerColors = {
        'openai': '#74aa9c',
        'google': '#4285f4',
        'anthropic': '#d97757',
        'meta': '#0084ff',
        'mistral': '#ff6b6b',
        'qwen': '#9c27b0',
        'other': '#95a5a6'
    };
    
    const trace = {
        x: data.map(d => d.posts_per_dollar),
        y: data.map(d => d.accuracy),
        mode: 'markers',
        type: 'scatter',
        marker: {
            size: data.map(d => d.latency_ms ? Math.max(8, 20 - Math.log10(d.latency_ms) * 2) : 12),
            color: data.map(d => providerColors[d.provider] || providerColors['other']),
            opacity: 0.7,
            line: {
                width: 1,
                color: 'white'
            }
        },
        text: data.map(d => d.display_name),
        hovertemplate: '<b>%{text}</b><br>' +
                       'Accuracy: %{y:.1f}%<br>' +
                       'Posts per $1: %{x:,.0f}<br>' +
                       'Provider: ' + data.map(d => d.provider).join('|') + '<br>' +
                       '<extra></extra>',
        showlegend: false
    };
    
    const layout = {
        title: {
            text: 'Model Performance vs Cost Efficiency',
            font: { size: 16 }
        },
        xaxis: {
            title: 'Posts Analyzable per Dollar',
            type: 'log',
            gridcolor: '#f0f0f0',
            range: [0, 6]  // 1 to 1,000,000 posts
        },
        yaxis: {
            title: 'Accuracy (%)',
            range: [0, 105],
            gridcolor: '#f0f0f0'
        },
        plot_bgcolor: 'white',
        paper_bgcolor: 'white',
        hovermode: 'closest',
        margin: { l: 50, r: 50, t: 50, b: 50 },
        annotations: [
            {
                x: 0.95,
                y: 0.95,
                xref: 'paper',
                yref: 'paper',
                text: 'High Accuracy<br>High Efficiency',
                showarrow: false,
                bgcolor: 'rgba(40, 167, 69, 0.1)',
                bordercolor: 'rgba(40, 167, 69, 0.5)',
                borderwidth: 1,
                font: { size: 10 }
            }
        ]
    };
    
    const config = {
        responsive: true,
        displayModeBar: true,
        modeBarButtonsToRemove: ['pan2d', 'select2d', 'lasso2d', 'autoScale2d'],
        displaylogo: false
    };
    
    Plotly.newPlot('scatter-chart', [trace], layout, config);
}

/**
 * Create efficiency chart by accuracy tiers
 */
function createEfficiencyChart() {
    const tiers = visualizationData.visualization_data.accuracy_tiers;
    
    if (!tiers) return;
    
    const traces = [];
    const colors = {
        'Elite (>95%)': '#27ae60',
        'High (85-95%)': '#f39c12',
        'Medium (75-85%)': '#e74c3c',
        'Low (<75%)': '#95a5a6'
    };
    
    Object.keys(tiers).forEach(tier => {
        const models = tiers[tier].filter(m => m.posts_per_dollar > 0);
        
        if (models.length === 0) return;
        
        // Get top 10 most efficient models in this tier
        const topModels = models
            .sort((a, b) => b.posts_per_dollar - a.posts_per_dollar)
            .slice(0, 10);
        
        traces.push({
            x: topModels.map(m => m.posts_per_dollar),
            y: topModels.map(m => m.display_name),
            name: tier,
            type: 'bar',
            orientation: 'h',
            marker: {
                color: colors[tier] || '#95a5a6',
                opacity: 0.8
            },
            text: topModels.map(m => `${m.posts_per_dollar.toLocaleString()} posts/$`),
            textposition: 'auto',
            hovertemplate: '<b>%{y}</b><br>' +
                           'Posts per $1: %{x:,.0f}<br>' +
                           'Accuracy: ' + topModels.map(m => m.accuracy.toFixed(1) + '%').join('|') + '<br>' +
                           '<extra></extra>'
        });
    });
    
    const layout = {
        title: {
            text: 'Most Efficient Models by Accuracy Tier',
            font: { size: 16 }
        },
        xaxis: {
            title: 'Posts per Dollar',
            type: 'log'
        },
        yaxis: {
            automargin: true,
            tickfont: { size: 10 }
        },
        plot_bgcolor: 'white',
        paper_bgcolor: 'white',
        margin: { l: 150, r: 50, t: 50, b: 50 },
        showlegend: true,
        legend: {
            x: 0.7,
            y: 1
        }
    };
    
    const config = {
        responsive: true,
        displayModeBar: false,
        displaylogo: false
    };
    
    Plotly.newPlot('efficiency-chart', traces, layout, config);
}

/**
 * Create radar chart for provider comparison
 */
function createRadarChart() {
    const providers = visualizationData.visualization_data.provider_stats;
    
    if (!providers) return;
    
    const providerNames = Object.keys(providers);
    const traces = [];
    
    const colors = {
        'openai': '#74aa9c',
        'google': '#4285f4',
        'anthropic': '#d97757',
        'meta': '#0084ff',
        'mistral': '#ff6b6b',
        'qwen': '#9c27b0'
    };
    
    providerNames.forEach(provider => {
        const stats = providers[provider];
        
        // Normalize values for radar chart (0-100 scale)
        const normalizedData = {
            accuracy: stats.avg_accuracy,
            efficiency: Math.min(100, (stats.avg_efficiency / 10000) * 100), // Scale efficiency
            speed: stats.avg_latency ? Math.max(0, 100 - (stats.avg_latency / 50)) : 50, // Invert latency
            models: Math.min(100, (stats.model_count / 10) * 100), // Scale model count
            best: stats.best_accuracy
        };
        
        traces.push({
            type: 'scatterpolar',
            r: [
                normalizedData.accuracy,
                normalizedData.efficiency,
                normalizedData.speed,
                normalizedData.models,
                normalizedData.best
            ],
            theta: ['Average Accuracy', 'Cost Efficiency', 'Speed', 'Model Count', 'Best Model'],
            fill: 'toself',
            name: provider.charAt(0).toUpperCase() + provider.slice(1),
            line: {
                color: colors[provider] || '#95a5a6'
            },
            marker: {
                color: colors[provider] || '#95a5a6',
                size: 8
            }
        });
    });
    
    const layout = {
        title: {
            text: 'Provider Comparison',
            font: { size: 16 }
        },
        polar: {
            radialaxis: {
                visible: true,
                range: [0, 100],
                tickfont: { size: 10 }
            }
        },
        showlegend: true,
        legend: {
            x: 0.8,
            y: 1
        },
        margin: { l: 50, r: 50, t: 50, b: 50 }
    };
    
    const config = {
        responsive: true,
        displayModeBar: false,
        displaylogo: false
    };
    
    Plotly.newPlot('radar-chart', traces, layout, config);
}

/**
 * Create cost calculator
 */
function createCostCalculator() {
    const slider = document.getElementById('post-slider');
    const countDisplay = document.getElementById('post-count');
    
    if (!slider || !countDisplay) return;
    
    // Initial update
    updateCostComparison();
    
    // Listen for slider changes
    slider.addEventListener('input', function() {
        const value = parseInt(this.value);
        countDisplay.textContent = value.toLocaleString();
        updateCostComparison();
    });
}

/**
 * Update cost comparison chart
 */
function updateCostComparison() {
    const postCount = parseInt(document.getElementById('post-slider').value);
    const models = visualizationData.models;
    
    if (!models) return;
    
    // Filter models with cost data and calculate costs
    const costs = models
        .filter(m => m.avg_cost_per_post > 0)
        .map(m => ({
            display_name: m.display_name,
            cost: m.avg_cost_per_post * postCount,
            accuracy: m.accuracy,
            provider: m.provider
        }))
        .sort((a, b) => a.cost - b.cost)
        .slice(0, 15); // Top 15 cheapest
    
    const providerColors = {
        'openai': '#74aa9c',
        'google': '#4285f4',
        'anthropic': '#d97757',
        'meta': '#0084ff',
        'mistral': '#ff6b6b',
        'qwen': '#9c27b0',
        'other': '#95a5a6'
    };
    
    const trace = {
        x: costs.map(d => d.cost),
        y: costs.map(d => d.display_name),
        type: 'bar',
        orientation: 'h',
        marker: {
            color: costs.map(d => providerColors[d.provider] || providerColors['other']),
            opacity: 0.8
        },
        text: costs.map(d => `$${d.cost.toFixed(2)}`),
        textposition: 'auto',
        hovertemplate: '<b>%{y}</b><br>' +
                       'Cost: $%{x:.2f}<br>' +
                       'Accuracy: ' + costs.map(d => d.accuracy.toFixed(1) + '%').join('|') + '<br>' +
                       '<extra></extra>'
    };
    
    const layout = {
        title: {
            text: `Cost for ${postCount.toLocaleString()} Posts`,
            font: { size: 16 }
        },
        xaxis: {
            title: 'Total Cost (USD)',
            tickformat: '$,.2f'
        },
        yaxis: {
            automargin: true,
            tickfont: { size: 10 }
        },
        plot_bgcolor: 'white',
        paper_bgcolor: 'white',
        margin: { l: 150, r: 50, t: 50, b: 50 },
        showlegend: false
    };
    
    const config = {
        responsive: true,
        displayModeBar: false,
        displaylogo: false
    };
    
    Plotly.newPlot('cost-comparison', [trace], layout, config);
}
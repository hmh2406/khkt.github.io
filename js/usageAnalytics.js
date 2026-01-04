// 📊 USAGE ANALYTICS - Modern usage statistics with charts and insights
import WebUsageTracker from './usageTracker.js';

class UsageAnalytics {
    constructor() {
        this.tracker = window.webUsageTracker;
        this.chartInstances = {};
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadAnalytics();
        
        // Update every minute
        setInterval(() => {
            this.updateRealTimeStats();
        }, 60000);
    }

    setupEventListeners() {
        // Listen for custom events from usage tracker
        document.addEventListener('usageUpdated', () => {
            this.updateRealTimeStats();
        });
    }

    // ==================== DATA PROCESSING ====================

    getWeeklyData() {
        if (!this.tracker) return null;

        const weekData = [];
        const today = new Date();
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            
            const dayData = this.tracker.getUsageByDate(dateStr) || {
                totalMinutes: 0,
                sessions: 0,
                pages: []
            };

            weekData.push({
                date: dateStr,
                dayName: date.toLocaleDateString('vi-VN', { weekday: 'short' }),
                fullDate: date.toLocaleDateString('vi-VN'),
                minutes: dayData.totalMinutes,
                hours: Math.round(dayData.totalMinutes / 60 * 10) / 10,
                sessions: dayData.sessions,
                pages: dayData.pages?.length || 0
            });
        }

        return weekData;
    }

    getDailyBreakdown() {
        if (!this.tracker) return null;

        const today = this.tracker.getDailyUsage();
        if (!today || !today.pages) return null;

        // Group by page/activity
        const pageStats = {};
        today.pages.forEach(page => {
            if (!pageStats[page.title]) {
                pageStats[page.title] = {
                    title: page.title,
                    url: page.url,
                    totalTime: 0,
                    visits: 0,
                    lastVisit: page.timestamp
                };
            }
            pageStats[page.title].totalTime += page.timeSpent || 0;
            pageStats[page.title].visits++;
            if (page.timestamp > pageStats[page.title].lastVisit) {
                pageStats[page.title].lastVisit = page.timestamp;
            }
        });

        return Object.values(pageStats)
            .sort((a, b) => b.totalTime - a.totalTime)
            .slice(0, 10); // Top 10 pages
    }

    getProductivityInsights() {
        const weekData = this.getWeeklyData();
        if (!weekData) return null;

        const totalMinutes = weekData.reduce((sum, day) => sum + day.minutes, 0);
        const avgDaily = Math.round(totalMinutes / 7);
        const mostActiveDay = weekData.reduce((max, day) => 
            day.minutes > max.minutes ? day : max, weekData[0]);
        
        const trend = this.calculateTrend(weekData);
        
        return {
            totalWeeklyMinutes: totalMinutes,
            totalWeeklyHours: Math.round(totalMinutes / 60 * 10) / 10,
            averageDailyMinutes: avgDaily,
            averageDailyHours: Math.round(avgDaily / 60 * 10) / 10,
            mostActiveDay: mostActiveDay,
            trend: trend,
            consistency: this.calculateConsistency(weekData),
            peakHours: this.getPeakHours()
        };
    }

    calculateTrend(weekData) {
        if (weekData.length < 2) return 'stable';
        
        const recent = weekData.slice(-3).reduce((sum, day) => sum + day.minutes, 0) / 3;
        const earlier = weekData.slice(0, 3).reduce((sum, day) => sum + day.minutes, 0) / 3;
        
        const change = ((recent - earlier) / earlier) * 100;
        
        if (change > 10) return 'increasing';
        if (change < -10) return 'decreasing';
        return 'stable';
    }

    calculateConsistency(weekData) {
        const minutes = weekData.map(d => d.minutes);
        const avg = minutes.reduce((sum, m) => sum + m, 0) / minutes.length;
        const variance = minutes.reduce((sum, m) => sum + Math.pow(m - avg, 2), 0) / minutes.length;
        const stdDev = Math.sqrt(variance);
        
        // Lower coefficient of variation = higher consistency
        const cv = avg > 0 ? stdDev / avg : 0;
        
        if (cv < 0.3) return 'high';
        if (cv < 0.6) return 'medium';
        return 'low';
    }

    getPeakHours() {
        // This would need more detailed time tracking
        // For now, return mock data based on typical patterns
        return [
            { hour: 9, usage: 85 },
            { hour: 14, usage: 92 },
            { hour: 20, usage: 78 }
        ];
    }

    // ==================== UI RENDERING ====================

    renderWeeklyChart(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const weekData = this.getWeeklyData();
        if (!weekData) return;

        const maxHours = Math.max(...weekData.map(d => d.hours));
        const chartHeight = 200;

        let html = `
            <div class="chart-container">
                <div class="chart-header">
                    <h3>📊 Thống kê 7 ngày qua</h3>
                    <div class="chart-legend">
                        <span class="legend-item">
                            <div class="legend-color primary"></div>
                            Thời gian sử dụng
                        </span>
                    </div>
                </div>
                <div class="bar-chart">
        `;

        weekData.forEach(day => {
            const height = maxHours > 0 ? (day.hours / maxHours) * chartHeight : 0;
            const percentage = Math.round((day.hours / 8) * 100); // Assuming 8h is max productive time
            
            html += `
                <div class="bar-item">
                    <div class="bar-container" style="height: ${chartHeight}px;">
                        <div class="bar-fill" 
                             style="height: ${height}px;" 
                             data-tooltip="${day.fullDate}: ${day.hours}h">
                        </div>
                    </div>
                    <div class="bar-label">
                        <div class="day-name">${day.dayName}</div>
                        <div class="day-value">${day.hours}h</div>
                    </div>
                </div>
            `;
        });

        html += `
                </div>
            </div>
        `;

        container.innerHTML = html;
        this.addChartInteractivity(container);
    }

    renderDailyBreakdown(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const breakdown = this.getDailyBreakdown();
        if (!breakdown || breakdown.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-chart-pie"></i>
                    <p>Chưa có dữ liệu hoạt động hôm nay</p>
                </div>
            `;
            return;
        }

        const totalTime = breakdown.reduce((sum, page) => sum + page.totalTime, 0);

        let html = `
            <div class="breakdown-container">
                <div class="breakdown-header">
                    <h3>🎯 Hoạt động hôm nay</h3>
                    <div class="total-time">Tổng: ${this.formatMinutes(totalTime)}</div>
                </div>
                <div class="breakdown-list">
        `;

        breakdown.forEach((page, index) => {
            const percentage = totalTime > 0 ? Math.round((page.totalTime / totalTime) * 100) : 0;
            const color = this.getActivityColor(index);
            
            html += `
                <div class="breakdown-item">
                    <div class="item-info">
                        <div class="item-title">${this.truncateText(page.title, 30)}</div>
                        <div class="item-stats">
                            <span class="time">${this.formatMinutes(page.totalTime)}</span>
                            <span class="visits">${page.visits} lần</span>
                            <span class="percentage">${percentage}%</span>
                        </div>
                    </div>
                    <div class="item-bar">
                        <div class="bar-bg">
                            <div class="bar-fill" 
                                 style="width: ${percentage}%; background-color: ${color};">
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });

        html += `
                </div>
            </div>
        `;

        container.innerHTML = html;
    }

    renderInsights(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const insights = this.getProductivityInsights();
        if (!insights) return;

        const trendIcon = {
            'increasing': '📈',
            'decreasing': '📉',
            'stable': '➡️'
        };

        const consistencyIcon = {
            'high': '🎯',
            'medium': '⚡',
            'low': '🌊'
        };

        let html = `
            <div class="insights-container">
                <div class="insights-header">
                    <h3>💡 Thông tin chi tiết</h3>
                </div>
                <div class="insights-grid">
                    <div class="insight-card primary">
                        <div class="card-icon">⏱️</div>
                        <div class="card-content">
                            <div class="card-value">${insights.totalWeeklyHours}h</div>
                            <div class="card-label">Tuần này</div>
                        </div>
                    </div>
                    
                    <div class="insight-card secondary">
                        <div class="card-icon">📅</div>
                        <div class="card-content">
                            <div class="card-value">${insights.averageDailyHours}h</div>
                            <div class="card-label">Trung bình/ngày</div>
                        </div>
                    </div>
                    
                    <div class="insight-card success">
                        <div class="card-icon">🏆</div>
                        <div class="card-content">
                            <div class="card-value">${insights.mostActiveDay.dayName}</div>
                            <div class="card-label">Ngày tích cực nhất</div>
                        </div>
                    </div>
                    
                    <div class="insight-card info">
                        <div class="card-icon">${trendIcon[insights.trend]}</div>
                        <div class="card-content">
                            <div class="card-value">${this.getTrendText(insights.trend)}</div>
                            <div class="card-label">Xu hướng</div>
                        </div>
                    </div>
                    
                    <div class="insight-card warning">
                        <div class="card-icon">${consistencyIcon[insights.consistency]}</div>
                        <div class="card-content">
                            <div class="card-value">${this.getConsistencyText(insights.consistency)}</div>
                            <div class="card-label">Tính nhất quán</div>
                        </div>
                    </div>
                    
                    <div class="insight-card accent">
                        <div class="card-icon">🎯</div>
                        <div class="card-content">
                            <div class="card-value">${this.getProductivityScore(insights)}%</div>
                            <div class="card-label">Điểm hiệu quả</div>
                        </div>
                    </div>
                </div>
                
                <div class="insights-summary">
                    <h4>📝 Tóm tắt tuần</h4>
                    <p>${this.generateWeeklySummary(insights)}</p>
                </div>
            </div>
        `;

        container.innerHTML = html;
    }

    renderRealTimeStats(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const today = this.tracker?.getDailyUsage();
        if (!today) return;

        const now = new Date();
        const sessionStart = new Date(today.sessionStart || now);
        const sessionDuration = Math.floor((now - sessionStart) / 1000 / 60);

        let html = `
            <div class="realtime-container">
                <div class="realtime-header">
                    <h3>⚡ Thời gian thực</h3>
                    <div class="live-indicator">
                        <div class="pulse"></div>
                        <span>LIVE</span>
                    </div>
                </div>
                
                <div class="realtime-stats">
                    <div class="stat-item">
                        <div class="stat-icon">🕐</div>
                        <div class="stat-content">
                            <div class="stat-value" data-usage-time>${this.formatMinutes(today.totalMinutes)}</div>
                            <div class="stat-label">Hôm nay</div>
                        </div>
                    </div>
                    
                    <div class="stat-item">
                        <div class="stat-icon">🔥</div>
                        <div class="stat-content">
                            <div class="stat-value">${sessionDuration}m</div>
                            <div class="stat-label">Phiên hiện tại</div>
                        </div>
                    </div>
                    
                    <div class="stat-item">
                        <div class="stat-icon">📊</div>
                        <div class="stat-content">
                            <div class="stat-value">${today.sessions || 1}</div>
                            <div class="stat-label">Phiên làm việc</div>
                        </div>
                    </div>
                    
                    <div class="stat-item">
                        <div class="stat-icon">⏰</div>
                        <div class="stat-content">
                            <div class="stat-value">${today.remainingMinutes || 0}m</div>
                            <div class="stat-label">Còn lại</div>
                        </div>
                    </div>
                </div>
                
                <div class="progress-section">
                    <div class="progress-header">
                        <span>Tiến độ hôm nay</span>
                        <span>${Math.min(100, Math.round((today.totalMinutes / 120) * 100))}%</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" data-usage-progress></div>
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = html;
    }

    // ==================== UTILITY FUNCTIONS ====================

    addChartInteractivity(container) {
        const bars = container.querySelectorAll('.bar-fill');
        bars.forEach(bar => {
            bar.addEventListener('mouseenter', (e) => {
                this.showTooltip(e.target, e.target.dataset.tooltip);
            });
            
            bar.addEventListener('mouseleave', () => {
                this.hideTooltip();
            });
        });
    }

    showTooltip(element, text) {
        const tooltip = document.createElement('div');
        tooltip.className = 'chart-tooltip';
        tooltip.textContent = text;
        document.body.appendChild(tooltip);
        
        const rect = element.getBoundingClientRect();
        tooltip.style.left = rect.left + rect.width / 2 - tooltip.offsetWidth / 2 + 'px';
        tooltip.style.top = rect.top - tooltip.offsetHeight - 10 + 'px';
    }

    hideTooltip() {
        const tooltip = document.querySelector('.chart-tooltip');
        if (tooltip) {
            tooltip.remove();
        }
    }

    formatMinutes(minutes) {
        if (minutes < 60) {
            return `${minutes}m`;
        }
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
    }

    truncateText(text, maxLength) {
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }

    getActivityColor(index) {
        const colors = [
            '#6366f1', '#ec4899', '#10b981', '#f59e0b', 
            '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16'
        ];
        return colors[index % colors.length];
    }

    getTrendText(trend) {
        const texts = {
            'increasing': 'Tăng',
            'decreasing': 'Giảm',
            'stable': 'Ổn định'
        };
        return texts[trend] || 'Không xác định';
    }

    getConsistencyText(consistency) {
        const texts = {
            'high': 'Cao',
            'medium': 'Trung bình',
            'low': 'Thấp'
        };
        return texts[consistency] || 'Không xác định';
    }

    getProductivityScore(insights) {
        let score = 50; // Base score
        
        // Bonus for consistency
        if (insights.consistency === 'high') score += 20;
        else if (insights.consistency === 'medium') score += 10;
        
        // Bonus for positive trend
        if (insights.trend === 'increasing') score += 15;
        else if (insights.trend === 'stable') score += 5;
        
        // Bonus for reasonable daily average (2-4 hours)
        if (insights.averageDailyHours >= 2 && insights.averageDailyHours <= 4) {
            score += 15;
        }
        
        return Math.min(100, Math.max(0, score));
    }

    generateWeeklySummary(insights) {
        const summaries = [];
        
        if (insights.trend === 'increasing') {
            summaries.push('Bạn đang có xu hướng tích cực trong việc sử dụng thời gian.');
        } else if (insights.trend === 'decreasing') {
            summaries.push('Thời gian sử dụng có xu hướng giảm so với đầu tuần.');
        }
        
        if (insights.consistency === 'high') {
            summaries.push('Bạn có thói quen sử dụng rất đều đặn.');
        } else if (insights.consistency === 'low') {
            summaries.push('Thời gian sử dụng khá không đều giữa các ngày.');
        }
        
        if (insights.averageDailyHours > 3) {
            summaries.push('Mức độ tương tác cao, hãy nhớ nghỉ ngơi hợp lý.');
        } else if (insights.averageDailyHours < 1) {
            summaries.push('Có thể tăng thời gian tương tác để đạt hiệu quả tốt hơn.');
        }
        
        return summaries.join(' ') || 'Tiếp tục duy trì thói quen tốt!';
    }

    updateRealTimeStats() {
        this.renderRealTimeStats('realtime-stats');
    }

    loadAnalytics() {
        // Load all analytics components
        this.renderWeeklyChart('weekly-chart');
        this.renderDailyBreakdown('daily-breakdown');
        this.renderInsights('insights-panel');
        this.renderRealTimeStats('realtime-stats');
    }

    // ==================== PUBLIC API ====================

    refresh() {
        this.loadAnalytics();
    }

    exportData() {
        const data = {
            weekly: this.getWeeklyData(),
            daily: this.getDailyBreakdown(),
            insights: this.getProductivityInsights(),
            exportDate: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { 
            type: 'application/json' 
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `usage-analytics-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

// Initialize analytics
const usageAnalytics = new UsageAnalytics();

// Global access
window.usageAnalytics = usageAnalytics;

export default usageAnalytics;
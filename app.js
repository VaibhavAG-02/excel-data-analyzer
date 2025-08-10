// Excel Data Analyzer Application
class ExcelAnalyzer {
    constructor() {
        this.currentData = null;
        this.currentWorkbook = null;
        this.currentSheetName = null;
        this.initializeApplication();
        this.initializeEventListeners();
    }

    initializeApplication() {
        // Ensure all sections are hidden initially except upload
        document.getElementById('fileInfoSection').classList.add('hidden');
        document.getElementById('dataPreviewSection').classList.add('hidden');
        document.getElementById('analysisSection').classList.add('hidden');
        document.getElementById('progressContainer').classList.add('hidden');
        document.getElementById('errorMessage').classList.add('hidden');
    }

    initializeEventListeners() {
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        const downloadCsvBtn = document.getElementById('downloadCsvBtn');
        const newAnalysisBtn = document.getElementById('newAnalysisBtn');

        // File upload events
        uploadArea.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            fileInput.click();
        });
        
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.handleDragOver(e);
        });
        
        uploadArea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.handleDragLeave(e);
        });
        
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.handleDrop(e);
        });
        
        fileInput.addEventListener('change', this.handleFileSelect.bind(this));

        // Action buttons
        downloadCsvBtn.addEventListener('click', this.downloadCSV.bind(this));
        newAnalysisBtn.addEventListener('click', this.resetApplication.bind(this));
    }

    handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        document.getElementById('uploadArea').classList.add('dragover');
    }

    handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        // Only remove dragover if we're leaving the upload area completely
        if (!e.currentTarget.contains(e.relatedTarget)) {
            document.getElementById('uploadArea').classList.remove('dragover');
        }
    }

    handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        document.getElementById('uploadArea').classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.processFile(files[0]);
        }
    }

    handleFileSelect(e) {
        const files = e.target.files;
        if (files.length > 0) {
            this.processFile(files[0]);
        }
    }

    processFile(file) {
        // Validate file
        if (!this.validateFile(file)) {
            return;
        }

        this.showProgress();
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                this.parseExcelFile(e.target.result, file);
            } catch (error) {
                this.showError('Error reading file: ' + error.message);
                this.hideProgress();
            }
        };
        
        reader.onerror = () => {
            this.showError('Failed to read file');
            this.hideProgress();
        };
        
        reader.readAsArrayBuffer(file);
    }

    validateFile(file) {
        const validTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel'
        ];
        const validExtensions = ['.xlsx', '.xls'];
        
        const fileExtension = file.name.toLowerCase().substr(file.name.lastIndexOf('.'));
        const maxSize = 10 * 1024 * 1024; // 10MB

        if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
            this.showError('Please select a valid Excel file (.xlsx or .xls)');
            return false;
        }

        if (file.size > maxSize) {
            this.showError('File size exceeds 10MB limit');
            return false;
        }

        if (file.size === 0) {
            this.showError('The selected file is empty');
            return false;
        }

        return true;
    }

    parseExcelFile(arrayBuffer, file) {
        try {
            this.updateProgressText('Parsing Excel file...');
            this.currentWorkbook = XLSX.read(arrayBuffer, { type: 'array' });
            
            if (!this.currentWorkbook.SheetNames.length) {
                throw new Error('No worksheets found in the file');
            }

            this.updateProgressText('Processing data...');
            
            // Display file information
            this.displayFileInfo(file, this.currentWorkbook);
            
            // Load first sheet by default
            this.currentSheetName = this.currentWorkbook.SheetNames[0];
            this.loadSheet(this.currentSheetName);
            
            this.hideProgress();
            this.showSections();
        } catch (error) {
            this.showError('Error parsing Excel file: ' + error.message);
            this.hideProgress();
        }
    }

    displayFileInfo(file, workbook) {
        document.getElementById('fileName').textContent = file.name;
        document.getElementById('fileSize').textContent = this.formatFileSize(file.size);
        
        const sheetSelector = document.getElementById('sheetSelector');
        sheetSelector.innerHTML = '';
        
        workbook.SheetNames.forEach((sheetName, index) => {
            const tab = document.createElement('div');
            tab.className = `sheet-tab ${index === 0 ? 'active' : ''}`;
            tab.textContent = sheetName;
            tab.addEventListener('click', () => this.switchSheet(sheetName, tab));
            sheetSelector.appendChild(tab);
        });
    }

    switchSheet(sheetName, tabElement) {
        // Update active tab
        document.querySelectorAll('.sheet-tab').forEach(tab => tab.classList.remove('active'));
        tabElement.classList.add('active');
        
        // Load new sheet
        this.currentSheetName = sheetName;
        this.loadSheet(sheetName);
    }

    loadSheet(sheetName) {
        const worksheet = this.currentWorkbook.Sheets[sheetName];
        this.currentData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
        
        if (this.currentData.length === 0) {
            this.showError('The selected sheet is empty');
            return;
        }

        this.displayDataPreview();
        this.performAnalysis();
    }

    displayDataPreview() {
        const data = this.currentData;
        const headers = data[0] || [];
        const rows = data.slice(1);

        // Update summary
        document.getElementById('rowCount').textContent = rows.length;
        document.getElementById('colCount').textContent = headers.length;

        // Build table
        const tableHead = document.getElementById('tableHead');
        const tableBody = document.getElementById('tableBody');
        
        tableHead.innerHTML = '';
        tableBody.innerHTML = '';

        // Create header row
        const headerRow = document.createElement('tr');
        headers.forEach(header => {
            const th = document.createElement('th');
            th.textContent = header || 'Column';
            headerRow.appendChild(th);
        });
        tableHead.appendChild(headerRow);

        // Create data rows (show first 100 rows for performance)
        const displayRows = rows.slice(0, 100);
        displayRows.forEach(row => {
            const tr = document.createElement('tr');
            headers.forEach((_, colIndex) => {
                const td = document.createElement('td');
                td.textContent = row[colIndex] || '';
                tr.appendChild(td);
            });
            tableBody.appendChild(tr);
        });

        if (rows.length > 100) {
            const infoRow = document.createElement('tr');
            const infoCell = document.createElement('td');
            infoCell.colSpan = headers.length;
            infoCell.textContent = `... and ${rows.length - 100} more rows`;
            infoCell.style.textAlign = 'center';
            infoCell.style.fontStyle = 'italic';
            infoCell.style.color = 'var(--color-text-secondary)';
            infoRow.appendChild(infoCell);
            tableBody.appendChild(infoRow);
        }
    }

    performAnalysis() {
        if (!this.currentData || this.currentData.length < 2) {
            return;
        }

        const headers = this.currentData[0];
        const rows = this.currentData.slice(1);
        
        this.generateSummaryStatistics(headers, rows);
        this.generateDataQuality(headers, rows);
        this.generateVisualizations(headers, rows);
    }

    generateSummaryStatistics(headers, rows) {
        const statsContainer = document.getElementById('summaryStats');
        statsContainer.innerHTML = '';

        headers.forEach((header, colIndex) => {
            const columnData = rows.map(row => row[colIndex]).filter(val => val !== '' && val != null);
            const columnType = this.detectColumnType(columnData);
            
            const statItem = document.createElement('div');
            statItem.className = `stat-item ${columnType}-column`;
            
            let statsHTML = `<h4>${header || `Column ${colIndex + 1}`}</h4>`;
            
            if (columnType === 'numeric') {
                const stats = this.calculateNumericStats(columnData);
                statsHTML += `
                    <div class="stat-value">${stats.mean.toFixed(2)}</div>
                    <div class="stat-details">
                        <div class="stat-detail"><span>Count:</span><span>${stats.count}</span></div>
                        <div class="stat-detail"><span>Median:</span><span>${stats.median.toFixed(2)}</span></div>
                        <div class="stat-detail"><span>Std Dev:</span><span>${stats.stdDev.toFixed(2)}</span></div>
                        <div class="stat-detail"><span>Min:</span><span>${stats.min}</span></div>
                        <div class="stat-detail"><span>Max:</span><span>${stats.max}</span></div>
                        <div class="stat-detail"><span>Q1:</span><span>${stats.q1.toFixed(2)}</span></div>
                    </div>
                `;
            } else {
                const stats = this.calculateTextStats(columnData);
                statsHTML += `
                    <div class="stat-value">${stats.unique}</div>
                    <div class="stat-details">
                        <div class="stat-detail"><span>Count:</span><span>${stats.count}</span></div>
                        <div class="stat-detail"><span>Unique:</span><span>${stats.unique}</span></div>
                        <div class="stat-detail"><span>Most Common:</span><span>${stats.mostCommon}</span></div>
                        <div class="stat-detail"><span>Avg Length:</span><span>${stats.avgLength.toFixed(1)}</span></div>
                    </div>
                `;
            }
            
            statItem.innerHTML = statsHTML;
            statsContainer.appendChild(statItem);
        });
    }

    generateDataQuality(headers, rows) {
        const qualityContainer = document.getElementById('qualityMetrics');
        qualityContainer.innerHTML = '';

        // Overall completeness
        const totalCells = headers.length * rows.length;
        const filledCells = rows.reduce((acc, row) => {
            return acc + row.filter(cell => cell !== '' && cell != null).length;
        }, 0);
        const completeness = totalCells > 0 ? (filledCells / totalCells) * 100 : 0;

        // Missing values per column
        const missingByColumn = headers.map((header, colIndex) => {
            const columnData = rows.map(row => row[colIndex]);
            const missing = columnData.filter(val => val === '' || val == null).length;
            return { column: header, missing, percentage: rows.length > 0 ? (missing / rows.length) * 100 : 0 };
        });

        // Duplicate rows
        const duplicates = this.findDuplicateRows(rows);

        // Create quality items
        this.createQualityItem(qualityContainer, 'Data Completeness', `${completeness.toFixed(1)}%`, 
            `${filledCells} of ${totalCells} cells filled`, this.getQualityClass(completeness));
        
        this.createQualityItem(qualityContainer, 'Duplicate Rows', duplicates.length.toString(), 
            `${rows.length > 0 ? ((duplicates.length / rows.length) * 100).toFixed(1) : 0}% of total rows`, 
            duplicates.length === 0 ? 'excellent' : duplicates.length < rows.length * 0.05 ? 'good' : 'poor');
        
        this.createQualityItem(qualityContainer, 'Columns', headers.length.toString(), 
            `${headers.filter(h => h && h.trim()).length} named columns`, 'excellent');
        
        const avgMissing = missingByColumn.reduce((acc, col) => acc + col.percentage, 0) / (headers.length || 1);
        this.createQualityItem(qualityContainer, 'Avg Missing', `${avgMissing.toFixed(1)}%`, 
            'Average missing values per column', this.getQualityClass(100 - avgMissing));
    }

    generateVisualizations(headers, rows) {
        const chartsContainer = document.getElementById('chartsContainer');
        chartsContainer.innerHTML = '';

        // Generate charts for numeric columns
        const numericColumns = [];
        const categoricalColumns = [];

        headers.forEach((header, colIndex) => {
            const columnData = rows.map(row => row[colIndex]).filter(val => val !== '' && val != null);
            const columnType = this.detectColumnType(columnData);
            
            if (columnType === 'numeric' && columnData.length > 0) {
                numericColumns.push({ header, data: columnData.map(Number), index: colIndex });
            } else if (columnData.length > 0) {
                categoricalColumns.push({ header, data: columnData, index: colIndex });
            }
        });

        // Create histograms for numeric data
        numericColumns.slice(0, 4).forEach(column => {
            this.createHistogram(chartsContainer, column.header, column.data);
        });

        // Create bar charts for categorical data
        categoricalColumns.slice(0, 2).forEach(column => {
            this.createBarChart(chartsContainer, column.header, column.data);
        });

        // Create correlation matrix if we have multiple numeric columns
        if (numericColumns.length > 1) {
            this.createCorrelationMatrix(chartsContainer, numericColumns.slice(0, 5));
        }
    }

    createHistogram(container, title, data) {
        const chartItem = document.createElement('div');
        chartItem.className = 'chart-item';
        
        const canvas = document.createElement('canvas');
        chartItem.innerHTML = `
            <div class="chart-title">Distribution: ${title}</div>
            <div class="chart-container"></div>
        `;
        chartItem.querySelector('.chart-container').appendChild(canvas);
        container.appendChild(chartItem);

        // Calculate histogram bins
        const bins = this.createHistogramBins(data, 10);
        
        new Chart(canvas, {
            type: 'bar',
            data: {
                labels: bins.map(bin => `${bin.min.toFixed(1)}-${bin.max.toFixed(1)}`),
                datasets: [{
                    label: 'Frequency',
                    data: bins.map(bin => bin.count),
                    backgroundColor: '#1FB8CD',
                    borderColor: '#21828F',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Frequency'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Value Range'
                        }
                    }
                }
            }
        });
    }

    createBarChart(container, title, data) {
        const chartItem = document.createElement('div');
        chartItem.className = 'chart-item';
        
        const canvas = document.createElement('canvas');
        chartItem.innerHTML = `
            <div class="chart-title">Top Values: ${title}</div>
            <div class="chart-container"></div>
        `;
        chartItem.querySelector('.chart-container').appendChild(canvas);
        container.appendChild(chartItem);

        // Get top 10 most frequent values
        const frequency = {};
        data.forEach(value => {
            frequency[value] = (frequency[value] || 0) + 1;
        });
        
        const sortedEntries = Object.entries(frequency)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10);

        new Chart(canvas, {
            type: 'bar',
            data: {
                labels: sortedEntries.map(([label]) => label.toString().substring(0, 15)),
                datasets: [{
                    label: 'Count',
                    data: sortedEntries.map(([, count]) => count),
                    backgroundColor: '#FFC185',
                    borderColor: '#E6821F',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Count'
                        }
                    }
                }
            }
        });
    }

    createCorrelationMatrix(container, numericColumns) {
        if (numericColumns.length < 2) return;

        const chartItem = document.createElement('div');
        chartItem.className = 'chart-item';
        chartItem.style.gridColumn = '1 / -1'; // Span full width
        
        const canvas = document.createElement('canvas');
        chartItem.innerHTML = `
            <div class="chart-title">Correlation Matrix</div>
            <div class="chart-container"></div>
        `;
        chartItem.querySelector('.chart-container').appendChild(canvas);
        container.appendChild(chartItem);

        // Calculate correlation matrix
        const correlationData = [];
        const labels = numericColumns.map(col => col.header);
        
        for (let i = 0; i < numericColumns.length; i++) {
            for (let j = 0; j < numericColumns.length; j++) {
                const correlation = this.calculateCorrelation(numericColumns[i].data, numericColumns[j].data);
                correlationData.push({
                    x: j,
                    y: i,
                    v: correlation
                });
            }
        }

        new Chart(canvas, {
            type: 'scatter',
            data: {
                datasets: [{
                    label: 'Correlation',
                    data: correlationData,
                    backgroundColor: correlationData.map(point => {
                        const intensity = Math.abs(point.v);
                        const red = point.v > 0 ? Math.floor(255 * intensity) : 0;
                        const blue = point.v < 0 ? Math.floor(255 * intensity) : 0;
                        return `rgba(${red}, 0, ${blue}, ${intensity})`;
                    }),
                    pointRadius: 20
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            title: () => '',
                            label: (context) => {
                                const x = labels[context.parsed.x];
                                const y = labels[context.parsed.y];
                                const corr = correlationData[context.dataIndex].v;
                                return `${y} vs ${x}: ${corr.toFixed(3)}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        type: 'linear',
                        position: 'bottom',
                        min: -0.5,
                        max: numericColumns.length - 0.5,
                        ticks: {
                            stepSize: 1,
                            callback: (value) => labels[value] || ''
                        }
                    },
                    y: {
                        type: 'linear',
                        min: -0.5,
                        max: numericColumns.length - 0.5,
                        ticks: {
                            stepSize: 1,
                            callback: (value) => labels[value] || ''
                        }
                    }
                }
            }
        });
    }

    // Helper methods
    detectColumnType(data) {
        if (data.length === 0) return 'text';
        
        const numericCount = data.filter(val => !isNaN(Number(val)) && val !== '').length;
        const numericRatio = numericCount / data.length;
        
        return numericRatio > 0.8 ? 'numeric' : 'text';
    }

    calculateNumericStats(data) {
        const numbers = data.map(Number).filter(n => !isNaN(n));
        if (numbers.length === 0) return { count: 0, mean: 0, median: 0, stdDev: 0, min: 0, max: 0, q1: 0 };
        
        const sorted = [...numbers].sort((a, b) => a - b);
        const count = numbers.length;
        const sum = numbers.reduce((a, b) => a + b, 0);
        const mean = sum / count;
        
        const variance = numbers.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / count;
        const stdDev = Math.sqrt(variance);
        
        const median = count % 2 === 0 
            ? (sorted[count / 2 - 1] + sorted[count / 2]) / 2
            : sorted[Math.floor(count / 2)];
            
        const q1Index = Math.floor(count * 0.25);
        const q1 = sorted[q1Index];
        
        return {
            count,
            mean,
            median,
            stdDev,
            min: Math.min(...numbers),
            max: Math.max(...numbers),
            q1
        };
    }

    calculateTextStats(data) {
        const nonEmpty = data.filter(val => val && val.toString().trim());
        if (nonEmpty.length === 0) return { count: 0, unique: 0, mostCommon: '', avgLength: 0 };
        
        const frequency = {};
        let totalLength = 0;
        
        nonEmpty.forEach(val => {
            const str = val.toString();
            frequency[str] = (frequency[str] || 0) + 1;
            totalLength += str.length;
        });
        
        const mostCommon = Object.keys(frequency).reduce((a, b) => 
            frequency[a] > frequency[b] ? a : b);
            
        return {
            count: nonEmpty.length,
            unique: Object.keys(frequency).length,
            mostCommon: mostCommon.substring(0, 20),
            avgLength: totalLength / nonEmpty.length
        };
    }

    createHistogramBins(data, numBins) {
        const min = Math.min(...data);
        const max = Math.max(...data);
        const binWidth = (max - min) / numBins;
        
        const bins = [];
        for (let i = 0; i < numBins; i++) {
            bins.push({
                min: min + i * binWidth,
                max: min + (i + 1) * binWidth,
                count: 0
            });
        }
        
        data.forEach(value => {
            const binIndex = Math.min(Math.floor((value - min) / binWidth), numBins - 1);
            bins[binIndex].count++;
        });
        
        return bins;
    }

    calculateCorrelation(x, y) {
        if (x.length !== y.length || x.length === 0) return 0;
        
        const n = x.length;
        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = y.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((acc, val, i) => acc + val * y[i], 0);
        const sumXX = x.reduce((acc, val) => acc + val * val, 0);
        const sumYY = y.reduce((acc, val) => acc + val * val, 0);
        
        const numerator = n * sumXY - sumX * sumY;
        const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));
        
        return denominator === 0 ? 0 : numerator / denominator;
    }

    findDuplicateRows(rows) {
        const seen = new Set();
        const duplicates = [];
        
        rows.forEach((row, index) => {
            const rowKey = row.join('|');
            if (seen.has(rowKey)) {
                duplicates.push(index);
            } else {
                seen.add(rowKey);
            }
        });
        
        return duplicates;
    }

    createQualityItem(container, label, value, description, qualityClass) {
        const item = document.createElement('div');
        item.className = 'quality-item';
        item.innerHTML = `
            <div class="quality-score ${qualityClass}">${value}</div>
            <div class="quality-label">${label}</div>
            <div class="quality-description">${description}</div>
        `;
        container.appendChild(item);
    }

    getQualityClass(percentage) {
        if (percentage >= 90) return 'excellent';
        if (percentage >= 70) return 'good';
        return 'poor';
    }

    downloadCSV() {
        if (!this.currentData) return;
        
        const csv = this.currentData.map(row => 
            row.map(cell => `"${cell}"`).join(',')
        ).join('\n');
        
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.currentSheetName || 'data'}_analysis.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    updateProgressText(text) {
        document.getElementById('progressText').textContent = text;
    }

    showProgress() {
        document.getElementById('progressContainer').classList.remove('hidden');
        document.getElementById('progressFill').style.width = '0%';
        document.getElementById('progressText').textContent = 'Processing file...';
        
        // Animate progress
        setTimeout(() => {
            document.getElementById('progressFill').style.width = '30%';
        }, 100);
        setTimeout(() => {
            document.getElementById('progressFill').style.width = '70%';
        }, 500);
        setTimeout(() => {
            document.getElementById('progressFill').style.width = '100%';
        }, 800);
    }

    hideProgress() {
        setTimeout(() => {
            document.getElementById('progressContainer').classList.add('hidden');
            document.getElementById('progressFill').style.width = '0%';
        }, 200);
    }

    showSections() {
        document.getElementById('fileInfoSection').classList.remove('hidden');
        document.getElementById('dataPreviewSection').classList.remove('hidden');
        document.getElementById('analysisSection').classList.remove('hidden');
    }

    showError(message) {
        document.getElementById('errorText').textContent = message;
        document.getElementById('errorMessage').classList.remove('hidden');
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            document.getElementById('errorMessage').classList.add('hidden');
        }, 5000);
    }

    resetApplication() {
        // Reset data
        this.currentData = null;
        this.currentWorkbook = null;
        this.currentSheetName = null;
        
        // Reset file input
        document.getElementById('fileInput').value = '';
        
        // Hide sections
        document.getElementById('fileInfoSection').classList.add('hidden');
        document.getElementById('dataPreviewSection').classList.add('hidden');
        document.getElementById('analysisSection').classList.add('hidden');
        document.getElementById('progressContainer').classList.add('hidden');
        document.getElementById('errorMessage').classList.add('hidden');
        
        // Clear containers
        document.getElementById('summaryStats').innerHTML = '';
        document.getElementById('qualityMetrics').innerHTML = '';
        document.getElementById('chartsContainer').innerHTML = '';
        
        // Remove any drag over state
        document.getElementById('uploadArea').classList.remove('dragover');
    }
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ExcelAnalyzer();
});
/* app.js - Fixed version with working file browser */

class ExcelAnalyzer {
    constructor() {
        this.initializeElements();
        this.addEventListeners();
        this.initializeState();
    }

    initializeElements() {
        // Cache DOM elements
        this.uploadArea = document.getElementById('uploadArea');
        this.fileInput = document.getElementById('fileInput');
        this.progressContainer = document.getElementById('progressContainer');
        this.progressFill = document.getElementById('progressFill');
        this.progressText = document.getElementById('progressText');
        this.fileInfoSection = document.getElementById('fileInfoSection');
        this.dataPreviewSection = document.getElementById('dataPreviewSection');
        this.analysisSection = document.getElementById('analysisSection');
        this.errorMessage = document.getElementById('errorMessage');
        this.errorText = document.getElementById('errorText');
    }

    initializeState() {
        // Application state
        this.workbook = null;
        this.currentSheetName = null;
        this.currentData = [];
        this.charts = {}; // Store chart instances
    }

    addEventListeners() {
        // File upload click - Multiple approaches for reliability
        this.uploadArea.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Upload area clicked, triggering file input...');
            this.triggerFileInput();
        });

        // Also add click to the upload content specifically
        const uploadContent = this.uploadArea.querySelector('.upload-content');
        if (uploadContent) {
            uploadContent.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Upload content clicked, triggering file input...');
                this.triggerFileInput();
            });
        }

        // Drag and drop events
        ['dragenter', 'dragover'].forEach(eventName => {
            this.uploadArea.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.uploadArea.classList.add('dragover');
            });
        });

        ['dragleave', 'drop'].forEach(eventName => {
            this.uploadArea.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.uploadArea.classList.remove('dragover');
            });
        });

        // File drop handling
        this.uploadArea.addEventListener('drop', (e) => {
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                console.log('File dropped:', files[0].name);
                this.handleFileUpload(files[0]);
            }
        });

        // File input change
        this.fileInput.addEventListener('change', (e) => {
            const files = e.target.files;
            if (files.length > 0) {
                console.log('File selected:', files[0].name);
                this.handleFileUpload(files[0]);
            }
        });

        // Action buttons
        const downloadBtn = document.getElementById('downloadCsvBtn');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => this.downloadCSV());
        }

        const newAnalysisBtn = document.getElementById('newAnalysisBtn');
        if (newAnalysisBtn) {
            newAnalysisBtn.addEventListener('click', () => this.resetAnalysis());
        }

        // Sheet selector
        const sheetSelect = document.getElementById('sheetSelect');
        if (sheetSelect) {
            sheetSelect.addEventListener('change', (e) => {
                this.switchSheet(e.target.value);
            });
        }

        // Tab switching function
        window.showTab = (tabName) => {
            this.showTab(tabName);
        };
    }

    triggerFileInput() {
        // Multiple approaches to ensure file input is triggered
        try {
            // Method 1: Direct click
            this.fileInput.click();
            
            // Method 2: If direct click fails, use setTimeout
            setTimeout(() => {
                if (!this.fileInput.files || this.fileInput.files.length === 0) {
                    this.fileInput.focus();
                    this.fileInput.click();
                }
            }, 100);
            
        } catch (error) {
            console.error('Error triggering file input:', error);
            // Fallback: show alert to user
            alert('Please use drag and drop to upload your Excel file, or try refreshing the page.');
        }
    }

    async handleFileUpload(file) {
        console.log('Processing file:', file.name, 'Size:', file.size, 'Type:', file.type);

        // Validate file
        if (!this.validateFile(file)) {
            return;
        }

        // Show progress
        this.showProgress('Reading file...');

        try {
            // Read file as array buffer
            const arrayBuffer = await this.readFileAsArrayBuffer(file);
            
            this.updateProgress(30, 'Parsing Excel data...');

            // Parse Excel file
            this.workbook = XLSX.read(arrayBuffer, { type: 'array' });
            
            if (!this.workbook || !this.workbook.SheetNames || this.workbook.SheetNames.length === 0) {
                throw new Error('No valid sheets found in the Excel file');
            }

            this.currentSheetName = this.workbook.SheetNames[0];
            this.parseCurrentSheet();

            this.updateProgress(60, 'Analyzing data...');

            // Render all sections
            this.renderFileInfo(file);
            this.renderDataPreview();
            this.renderAnalysis();

            this.updateProgress(100, 'Complete!');
            
            // Hide progress after delay
            setTimeout(() => {
                this.hideProgress();
            }, 1000);

        } catch (error) {
            console.error('Error processing file:', error);
            this.hideProgress();
            this.showError(`Error processing file: ${error.message}`);
        }
    }

    validateFile(file) {
        // Check file type
        const validTypes = [
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ];
        
        const validExtensions = ['.xlsx', '.xls'];
        const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
        
        if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
            this.showError('Please upload a valid Excel file (.xlsx or .xls)');
            return false;
        }

        // Check file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
            this.showError('File size exceeds 10MB limit. Please use a smaller file.');
            return false;
        }

        return true;
    }

    readFileAsArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(new Error('Failed to read file'));
            reader.readAsArrayBuffer(file);
        });
    }

    parseCurrentSheet() {
        const sheet = this.workbook.Sheets[this.currentSheetName];
        this.currentData = XLSX.utils.sheet_to_json(sheet, { 
            header: 1, 
            defval: null,
            raw: false 
        });

        if (this.currentData.length === 0) {
            throw new Error('The selected sheet is empty');
        }
    }

    renderFileInfo(file) {
        // Update file information
        this.updateElement('fileName', file.name);
        this.updateElement('fileSize', this.formatFileSize(file.size));
        this.updateElement('fileType', file.type || 'Excel file');
        this.updateElement('sheetCount', this.workbook.SheetNames.length);
        this.updateElement('rowCount', Math.max(0, this.currentData.length - 1));
        this.updateElement('columnCount', this.currentData.length > 0 ? this.currentData[0].length : 0);
        
        // Count non-empty cells
        let nonEmptyCells = 0;
        this.currentData.forEach(row => {
            row.forEach(cell => {
                if (cell !== null && cell !== '' && cell !== undefined) {
                    nonEmptyCells++;
                }
            });
        });
        this.updateElement('cellCount', nonEmptyCells);

        // Setup sheet selector
        this.setupSheetSelector();

        // Show file info section
        this.fileInfoSection.classList.remove('hidden');
    }

    setupSheetSelector() {
        const sheetSelect = document.getElementById('sheetSelect');
        const sheetSelector = document.getElementById('sheetSelector');
        
        if (sheetSelect && this.workbook.SheetNames.length > 1) {
            // Clear existing options
            sheetSelect.innerHTML = '';
            
            // Add options for each sheet
            this.workbook.SheetNames.forEach(sheetName => {
                const option = document.createElement('option');
                option.value = sheetName;
                option.textContent = sheetName;
                if (sheetName === this.currentSheetName) {
                    option.selected = true;
                }
                sheetSelect.appendChild(option);
            });
            
            // Show sheet selector
            sheetSelector.classList.remove('hidden');
        } else if (sheetSelector) {
            // Hide sheet selector if only one sheet
            sheetSelector.classList.add('hidden');
        }
    }

    switchSheet(sheetName) {
        if (this.workbook && this.workbook.Sheets[sheetName]) {
            this.currentSheetName = sheetName;
            this.parseCurrentSheet();
            this.renderDataPreview();
            this.renderAnalysis();
        }
    }

    renderDataPreview() {
        const previewTable = document.getElementById('previewTable');
        if (!previewTable || this.currentData.length === 0) return;

        // Clear existing table
        previewTable.innerHTML = '';

        // Create table header
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        
        const headers = this.currentData[0] || [];
        headers.forEach((header, index) => {
            const th = document.createElement('th');
            th.textContent = header || `Column ${index + 1}`;
            headerRow.appendChild(th);
        });
        
        thead.appendChild(headerRow);
        previewTable.appendChild(thead);

        // Create table body (show first 50 rows)
        const tbody = document.createElement('tbody');
        const dataRows = this.currentData.slice(1, 51); // Skip header, show max 50 rows
        
        dataRows.forEach(row => {
            const tr = document.createElement('tr');
            headers.forEach((_, index) => {
                const td = document.createElement('td');
                const cellValue = row[index];
                td.textContent = cellValue !== null && cellValue !== undefined ? cellValue : '';
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });
        
        previewTable.appendChild(tbody);
        this.dataPreviewSection.classList.remove('hidden');
    }

    renderAnalysis() {
        if (this.currentData.length === 0) return;

        // Get headers and data
        const headers = this.currentData[0] || [];
        const dataRows = this.currentData.slice(1);

        // Analyze columns
        const columnStats = this.analyzeColumns(headers, dataRows);

        // Render summary statistics
        this.renderSummaryStats(columnStats);

        // Render column details
        this.renderColumnDetails(columnStats);

        // Render charts
        this.renderCharts(columnStats, dataRows);

        // Show analysis section
        this.analysisSection.classList.remove('hidden');
    }

    analyzeColumns(headers, dataRows) {
        const stats = [];

        headers.forEach((header, index) => {
            const columnData = dataRows.map(row => row[index]).filter(val => 
                val !== null && val !== undefined && val !== ''
            );
            
            const total = dataRows.length;
            const nonEmpty = columnData.length;
            const missing = total - nonEmpty;
            
            // Determine data type
            const numericValues = columnData.filter(val => !isNaN(parseFloat(val)));
            const isNumeric = numericValues.length > columnData.length * 0.8;
            
            let columnStat = {
                name: header || `Column ${index + 1}`,
                type: isNumeric ? 'Numeric' : 'Text',
                total: total,
                nonEmpty: nonEmpty,
                missing: missing,
                unique: new Set(columnData).size,
                missingPercent: ((missing / total) * 100).toFixed(1)
            };

            // Add numeric statistics if applicable
            if (isNumeric && numericValues.length > 0) {
                const numbers = numericValues.map(v => parseFloat(v)).sort((a, b) => a - b);
                columnStat.min = Math.min(...numbers);
                columnStat.max = Math.max(...numbers);
                columnStat.mean = (numbers.reduce((a, b) => a + b, 0) / numbers.length);
                columnStat.median = this.calculateMedian(numbers);
                columnStat.std = this.calculateStandardDeviation(numbers);
            } else if (!isNumeric && columnData.length > 0) {
                // Text statistics
                const frequencies = {};
                columnData.forEach(val => {
                    frequencies[val] = (frequencies[val] || 0) + 1;
                });
                const sortedFreq = Object.entries(frequencies).sort((a, b) => b[1] - a[1]);
                columnStat.mostCommon = sortedFreq.slice(0, 5);
            }

            stats.push(columnStat);
        });

        return stats;
    }

    calculateMedian(sortedNumbers) {
        const mid = Math.floor(sortedNumbers.length / 2);
        return sortedNumbers.length % 2 !== 0 ? 
            sortedNumbers[mid] : 
            (sortedNumbers[mid - 1] + sortedNumbers[mid]) / 2;
    }

    calculateStandardDeviation(numbers) {
        const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
        const variance = numbers.reduce((acc, num) => acc + Math.pow(num - mean, 2), 0) / numbers.length;
        return Math.sqrt(variance);
    }

    renderSummaryStats(columnStats) {
        const overviewStats = document.getElementById('overviewStats');
        const columnTypes = document.getElementById('columnTypes');

        if (overviewStats) {
            const totalColumns = columnStats.length;
            const numericColumns = columnStats.filter(stat => stat.type === 'Numeric').length;
            const textColumns = totalColumns - numericColumns;
            const totalMissingPercent = (columnStats.reduce((acc, stat) => acc + parseFloat(stat.missingPercent), 0) / totalColumns).toFixed(1);

            overviewStats.innerHTML = `
                <p><strong>Total Columns:</strong> ${totalColumns}</p>
                <p><strong>Data Rows:</strong> ${columnStats[0]?.total || 0}</p>
                <p><strong>Average Missing Data:</strong> ${totalMissingPercent}%</p>
                <p><strong>Data Quality Score:</strong> ${(100 - totalMissingPercent).toFixed(1)}%</p>
            `;
        }

        if (columnTypes) {
            const numericCount = columnStats.filter(stat => stat.type === 'Numeric').length;
            const textCount = columnStats.filter(stat => stat.type === 'Text').length;

            columnTypes.innerHTML = `
                <p><strong>Numeric Columns:</strong> ${numericCount}</p>
                <p><strong>Text Columns:</strong> ${textCount}</p>
                <div style="margin-top: 1rem;">
                    <div style="display: flex; gap: 1rem; align-items: center;">
                        <div style="width: 20px; height: 20px; background: #667eea;"></div>
                        <span>Numeric (${numericCount})</span>
                    </div>
                    <div style="display: flex; gap: 1rem; align-items: center; margin-top: 0.5rem;">
                        <div style="width: 20px; height: 20px; background: #f39c12;"></div>
                        <span>Text (${textCount})</span>
                    </div>
                </div>
            `;
        }
    }

    renderColumnDetails(columnStats) {
        const columnAnalysis = document.getElementById('columnAnalysis');
        if (!columnAnalysis) return;

        columnAnalysis.innerHTML = '';

        columnStats.forEach(stat => {
            const columnDiv = document.createElement('div');
            columnDiv.className = 'column-item';

            let detailsHtml = `
                <div class="column-header">
                    <span class="column-name">${stat.name}</span>
                    <span class="column-type">${stat.type}</span>
                </div>
                <div class="column-stats">
                    <div class="stat-item">
                        <span class="stat-label">Total</span>
                        <span class="stat-value">${stat.total}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Non-empty</span>
                        <span class="stat-value">${stat.nonEmpty}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Missing</span>
                        <span class="stat-value">${stat.missing} (${stat.missingPercent}%)</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Unique</span>
                        <span class="stat-value">${stat.unique}</span>
                    </div>
            `;

            if (stat.type === 'Numeric') {
                detailsHtml += `
                    <div class="stat-item">
                        <span class="stat-label">Min</span>
                        <span class="stat-value">${stat.min?.toFixed(2) || 'N/A'}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Max</span>
                        <span class="stat-value">${stat.max?.toFixed(2) || 'N/A'}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Mean</span>
                        <span class="stat-value">${stat.mean?.toFixed(2) || 'N/A'}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Median</span>
                        <span class="stat-value">${stat.median?.toFixed(2) || 'N/A'}</span>
                    </div>
                `;
            } else if (stat.mostCommon) {
                detailsHtml += `
                    <div class="stat-item" style="grid-column: span 2;">
                        <span class="stat-label">Most Common Values</span>
                        <div class="stat-value">
                            ${stat.mostCommon.map(([value, count]) => 
                                `<div>${value}: ${count}</div>`
                            ).join('')}
                        </div>
                    </div>
                `;
            }

            detailsHtml += `</div>`;
            columnDiv.innerHTML = detailsHtml;
            columnAnalysis.appendChild(columnDiv);
        });
    }

    renderCharts(columnStats, dataRows) {
        // Destroy existing charts
        Object.values(this.charts).forEach(chart => {
            if (chart && chart.destroy) {
                chart.destroy();
            }
        });
        this.charts = {};

        // Find first numeric column for histogram
        const numericColumn = columnStats.find(stat => stat.type === 'Numeric');
        if (numericColumn) {
            this.renderHistogram(numericColumn, dataRows);
        }

        // Find first text column for categorical chart
        const textColumn = columnStats.find(stat => stat.type === 'Text');
        if (textColumn) {
            this.renderCategoricalChart(textColumn, dataRows);
        }
    }

    renderHistogram(columnStat, dataRows) {
        const canvas = document.getElementById('histogramChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const columnIndex = this.currentData[0].indexOf(columnStat.name);
        
        if (columnIndex === -1) return;

        const values = dataRows
            .map(row => parseFloat(row[columnIndex]))
            .filter(val => !isNaN(val));

        if (values.length === 0) return;

        // Create histogram bins
        const min = Math.min(...values);
        const max = Math.max(...values);
        const binCount = Math.min(20, Math.ceil(Math.sqrt(values.length)));
        const binSize = (max - min) / binCount;
        
        const bins = [];
        const counts = new Array(binCount).fill(0);
        
        for (let i = 0; i < binCount; i++) {
            bins.push(min + i * binSize);
        }

        values.forEach(value => {
            const binIndex = Math.min(binCount - 1, Math.floor((value - min) / binSize));
            counts[binIndex]++;
        });

        this.charts.histogram = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: bins.map((bin, i) => {
                    const start = bin.toFixed(1);
                    const end = (bin + binSize).toFixed(1);
                    return `${start}-${end}`;
                }),
                datasets: [{
                    label: 'Frequency',
                    data: counts,
                    backgroundColor: '#667eea',
                    borderColor: '#4c63d2',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: `Distribution of ${columnStat.name}`
                    },
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
                            text: columnStat.name
                        }
                    }
                }
            }
        });
    }

    renderCategoricalChart(columnStat, dataRows) {
        const canvas = document.getElementById('categoricalChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const columnIndex = this.currentData[0].indexOf(columnStat.name);
        
        if (columnIndex === -1) return;

        const values = dataRows
            .map(row => row[columnIndex])
            .filter(val => val !== null && val !== undefined && val !== '');

        // Count frequencies
        const frequencies = {};
        values.forEach(val => {
            frequencies[val] = (frequencies[val] || 0) + 1;
        });

        // Sort by frequency and take top 10
        const sortedData = Object.entries(frequencies)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);

        if (sortedData.length === 0) return;

        this.charts.categorical = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: sortedData.map(item => item[0]),
                datasets: [{
                    label: 'Count',
                    data: sortedData.map(item => item[1]),
                    backgroundColor: '#f39c12',
                    borderColor: '#e67e22',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: `Top Values in ${columnStat.name}`
                    },
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
                    },
                    x: {
                        title: {
                            display: true,
                            text: columnStat.name
                        }
                    }
                }
            }
        });
    }

    showTab(tabName) {
        // Hide all tab contents
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });

        // Remove active class from all tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Show selected tab content
        const tabContent = document.getElementById(`${tabName}Tab`);
        if (tabContent) {
            tabContent.classList.add('active');
        }

        // Add active class to clicked tab button
        const tabButton = document.querySelector(`[onclick="showTab('${tabName}')"]`);
        if (tabButton) {
            tabButton.classList.add('active');
        }
    }

    downloadCSV() {
        if (!this.currentData || this.currentData.length === 0) {
            this.showError('No data available to download');
            return;
        }

        try {
            // Create CSV content
            const csvContent = this.currentData.map(row => 
                row.map(cell => {
                    // Escape quotes and wrap in quotes if contains comma or quote
                    const cellStr = String(cell || '');
                    if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
                        return `"${cellStr.replace(/"/g, '""')}"`;
                    }
                    return cellStr;
                }).join(',')
            ).join('\n');

            // Create and download file
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `${this.currentSheetName || 'data'}_analysis.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            this.showError('Error downloading CSV: ' + error.message);
        }
    }

    showProgress(message) {
        this.progressText.textContent = message;
        this.progressContainer.classList.remove('hidden');
        this.progressFill.style.width = '0%';
    }

    updateProgress(percent, message) {
        this.progressFill.style.width = `${percent}%`;
        if (message) {
            this.progressText.textContent = message;
        }
    }

    hideProgress() {
        this.progressContainer.classList.add('hidden');
    }

    showError(message) {
        this.errorText.textContent = message;
        this.errorMessage.classList.remove('hidden');
        
        // Auto-hide error after 10 seconds
        setTimeout(() => {
            this.errorMessage.classList.add('hidden');
        }, 10000);
    }

    updateElement(id, content) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = content;
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    resetAnalysis() {
        // Clear state
        this.workbook = null;
        this.currentSheetName = null;
        this.currentData = [];

        // Destroy charts
        Object.values(this.charts).forEach(chart => {
            if (chart && chart.destroy) {
                chart.destroy();
            }
        });
        this.charts = {};

        // Hide sections
        this.fileInfoSection.classList.add('hidden');
        this.dataPreviewSection.classList.add('hidden');
        this.analysisSection.classList.add('hidden');
        this.errorMessage.classList.add('hidden');
        this.hideProgress();

        // Reset file input
        this.fileInput.value = '';

        console.log('Analysis reset completed');
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing Excel Data Analyzer...');
    window.excelAnalyzer = new ExcelAnalyzer();
    console.log('Excel Data Analyzer initialized successfully');
});
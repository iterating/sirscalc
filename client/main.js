import { apiService } from './services/apiService.js';
import { ResultDisplay } from './components/ResultDisplay.js';
import { HistoryDisplay } from './components/HistoryDisplay.js';
import { SIRSViewModel } from './models/SIRSViewModel.js';

class SIRSCalculator {
    constructor() {
        this.form = document.getElementById('calculator-form');
        this.calculateButton = document.getElementById('calculate-button');
        this.resultDisplay = new ResultDisplay(document.getElementById('result'));
        this.historyDisplay = new HistoryDisplay(document.getElementById('history-list'));

        this.initializeEventListeners();
        this.loadHistory();
    }

    initializeEventListeners() {
        this.form.addEventListener('submit', this.handleSubmit.bind(this));
    }

    async handleSubmit(e) {
        e.preventDefault();
        this.calculateButton.disabled = true;
        this.calculateButton.textContent = 'Calculating...';
        this.resultDisplay.showLoading();

        try {
            const formData = new FormData(this.form);
            const data = SIRSViewModel.fromFormData(formData);
            const sirsData = new SIRSViewModel(data);
            sirsData.validate();

            const result = await apiService.calculateSIRS(data);
            this.resultDisplay.showResult(result);
            await this.loadHistory();
        } catch (error) {
            console.error('Calculation error:', error);
            this.resultDisplay.showError(error, () => this.handleSubmit(e));
        } finally {
            this.calculateButton.disabled = false;
            this.calculateButton.textContent = 'Calculate';
        }
    }

    async loadHistory() {
        try {
            this.historyDisplay.showLoading();
            const history = await apiService.getHistory();
            const historyModels = history.map(item => new SIRSViewModel(item));
            this.historyDisplay.showHistory(historyModels);
        } catch (error) {
            console.error('Error loading history:', error);
            this.historyDisplay.showError(error, () => this.loadHistory());
        }
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new SIRSCalculator();
});

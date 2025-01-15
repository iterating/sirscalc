export class ResultDisplay {
    constructor(container) {
        this.container = container;
    }

    showLoading() {
        this.container.innerHTML = '<div class="loading">Calculating...</div>';
    }

    showError(error, onRetry) {
        this.container.className = 'result criteria-not-met';
        this.container.innerHTML = `
            <div class="error">
                Error: ${error.message}
                <button class="retry-button">Retry</button>
            </div>
        `;
        this.container.querySelector('.retry-button').onclick = onRetry;
    }

    showResult(data) {
        this.container.className = 'result ' + (data.sirsMet ? 'criteria-met' : 'criteria-not-met');
        
        let criteriaHtml = '';
        for (const [key, details] of Object.entries(data.criteriaDetails)) {
            criteriaHtml += `
                <div class="criteria-item ${details.met ? 'met' : 'not-met'}">
                    <strong>${key.charAt(0).toUpperCase() + key.slice(1)}:</strong> ${details.value}
                    <br>
                    <small>${details.criterion} - ${details.met ? 'Criterion Met' : 'Criterion Not Met'}</small>
                </div>
            `;
        }

        this.container.innerHTML = `
            <h3>${data.sirsMet ? 'SIRS Criteria Met' : 'SIRS Criteria Not Met'}</h3>
            <div class="criteria-details">
                ${criteriaHtml}
            </div>
            <div class="summary">
                <strong>Criteria Met:</strong> ${data.criteriaCount}/4
            </div>
        `;
    }
}
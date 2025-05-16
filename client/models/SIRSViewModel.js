export class SIRSViewModel {
    constructor(data) {
        this.temperature = data.temperature;
        this.heartRate = data.heartRate;
        this.respiratoryRate = data.respiratoryRate;
        this.wbc = data.wbc;
        this.sirsMet = data.hasSIRS || data.sirsMet;
        this.criteriaCount = data.criteriaCount;
        this.criteriaDetails = data.criteriaDetails;
        this.createdAt = data.createdAt ? new Date(data.createdAt) : null;
    }

    static fromFormData(formData) {
        return {
            temperature: parseFloat(formData.get('temperature')),
            heartRate: parseInt(formData.get('heartRate')),
            respiratoryRate: parseInt(formData.get('respiratoryRate')),
            wbc: parseInt(formData.get('wbc'))
        };
    }

    validate() {
        if (Object.values(this).some(value => 
            value !== null && typeof value === 'number' && isNaN(value))) {
            throw new Error('All fields must be valid numbers');
        }
        return true;
    }
}

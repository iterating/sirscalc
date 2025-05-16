export const exportUtils = {
    toFHIR(data) {
        const timestamp = new Date().toISOString();
        return {
            resourceType: "Observation",
            status: "final",
            code: {
                coding: [{
                    system: "http://loinc.org",
                    code: "89545-0",
                    display: "SIRS Criteria Assessment"
                }]
            },
            effectiveDateTime: timestamp,
            valueBoolean: data.hasSIRS || data.sirsMet,
            component: Object.entries(data.criteriaDetails).map(([key, details]) => ({
                code: {
                    text: key
                },
                valueQuantity: {
                    value: details.value,
                    unit: details.criterion.split(' ')[1] || 'unit'
                }
            }))
        };
    },


    downloadFile(content, filename, type) {
        const blob = new Blob([JSON.stringify(content, null, 2)], { type: type });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
};

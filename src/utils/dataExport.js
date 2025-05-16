import moment from 'moment';

/**
 * Generates a unique ID for resource identifiers
 * @returns {string} A unique ID
 */
function generateUniqueId() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

/**
 * Exports data to FHIR R4 format with improved structure and metadata
 * @param {Object} data - The medical calculation data
 * @param {Object} [options] - Export options
 * @returns {Object} FHIR resource bundle
 */
function exportToFHIR(data, options = {}) {
    // Input validation
    if (!data || typeof data !== 'object') {
        throw new Error('Invalid data provided for FHIR export');
    }
    
    const currentDateTime = new Date().toISOString();
    const resourceId = options.resourceId || generateUniqueId();
    
    // Create a FHIR Bundle to contain all resources
    const bundle = {
        resourceType: "Bundle",
        type: "collection",
        id: generateUniqueId(),
        timestamp: currentDateTime,
        entry: []
    };
    
    // Add patient resource if patient data is available
    if (data.patientId) {
        const patientResource = {
            resourceType: "Patient",
            id: `patient-${data.patientId}`,
            identifier: [{
                system: options.patientIdSystem || "http://hospital.example.org/identifiers/patient",
                value: data.patientId
            }]
        };
        
        // Add patient name if available
        if (data.patientName) {
            const nameParts = data.patientName.split(' ');
            patientResource.name = [{
                use: "official",
                family: nameParts.length > 0 ? nameParts[0] : "",
                given: nameParts.length > 1 ? nameParts.slice(1) : []
            }];
        }
        
        // Add gender if available
        if (data.gender) {
            patientResource.gender = data.gender.toLowerCase();
        }
        
        // Add birth date if available
        if (data.dateOfBirth) {
            patientResource.birthDate = moment(data.dateOfBirth).format('YYYY-MM-DD');
        }

        // Add contact information if available
        if (data.phoneNumber) {
            patientResource.telecom = [{
                system: "phone",
                value: data.phoneNumber,
                use: "home"
            }];
        }

        // Add address if available
        if (data.address) {
            patientResource.address = [{
                text: data.address,
                use: "home"
            }];
        }
        
        bundle.entry.push({
            fullUrl: `urn:uuid:${patientResource.id}`,
            resource: patientResource
        });
    }

    // Add encounter if encounter data is available
    if (data.visitNumber) {
        const encounterResource = {
            resourceType: "Encounter",
            id: `encounter-${data.visitNumber}`,
            status: "finished",
            class: {
                system: "http://terminology.hl7.org/CodeSystem/v3-ActCode",
                code: data.patientClass || "AMB",
                display: data.patientClass === "I" ? "Inpatient" : "Ambulatory"
            },
            subject: data.patientId ? {
                reference: `Patient/patient-${data.patientId}`
            } : undefined
        };

        if (data.admitDateTime) {
            encounterResource.period = {
                start: moment(data.admitDateTime).toISOString()
            };
        }

        bundle.entry.push({
            fullUrl: `urn:uuid:${encounterResource.id}`,
            resource: encounterResource
        });
    }
    
    // Create main observation for calculator score
    const observationResource = {
        resourceType: "Observation",
        id: resourceId,
        status: "final",
        category: [{
            coding: [{
                system: "http://terminology.hl7.org/CodeSystem/observation-category",
                code: options.category || "survey",
                display: options.categoryDisplay || "Survey"
            }]
        }],
        code: {
            coding: [{
                system: options.codeSystem || "http://loinc.org",
                code: data.calculatorCode || "score",
                display: data.calculatorName || "Medical Calculator Score"
            }]
        },
        subject: data.patientId ? {
            reference: `Patient/patient-${data.patientId}`
        } : undefined,
        encounter: data.visitNumber ? {
            reference: `Encounter/encounter-${data.visitNumber}`
        } : undefined,
        effectiveDateTime: data.observationDateTime || currentDateTime,
        issued: currentDateTime,
        performer: data.performerId ? [{
            reference: `Practitioner/${data.performerId}`,
            display: data.performerName || ""
        }] : undefined,
        component: []
    };
    
    // Add total score if available
    if (data.score !== undefined) {
        observationResource.valueQuantity = {
            value: data.score,
            unit: data.scoreUnit || "score",
            system: "http://unitsofmeasure.org",
            code: data.scoreUnitCode || "{score}"
        };
        
        // Add interpretation if available
        if (data.scoreInterpretation) {
            observationResource.interpretation = [{
                coding: [{
                    system: "http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation",
                    code: data.scoreInterpretationCode || "IND",
                    display: data.scoreInterpretation
                }],
                text: data.scoreInterpretation
            }];
        }
    }

    // Add notes if available
    if (data.notes) {
        observationResource.note = [{
            text: data.notes
        }];
    }
    
    // Add components for each result with proper coding and handling of different value types
    Object.entries(data.results || {}).forEach(([key, value]) => {
        const component = {
            code: {
                coding: [{
                    system: options.componentCodeSystem || "http://loinc.org",
                    code: key.toLowerCase().replace(/\s+/g, '-'),
                    display: data.displayNames?.[key] || key
                }]
            }
        };
        
        // Handle different value types
        if (typeof value === 'number') {
            component.valueQuantity = {
                value: value,
                unit: data.units?.[key] || "unit",
                system: "http://unitsofmeasure.org",
                code: data.unitCodes?.[key] || "unit"
            };
        } else if (typeof value === 'boolean') {
            component.valueBoolean = value;
        } else if (value instanceof Date) {
            component.valueDateTime = value.toISOString();
        } else {
            component.valueString = value.toString();
        }
        
        // Add reference range if available
        if (data.referenceRanges && data.referenceRanges[key]) {
            component.referenceRange = [{
                text: data.referenceRanges[key]
            }];

            // Add low and high values if available in a structured format
            if (typeof data.referenceRanges[key] === 'object') {
                if (data.referenceRanges[key].low !== undefined) {
                    component.referenceRange[0].low = {
                        value: data.referenceRanges[key].low,
                        unit: data.units?.[key] || "unit"
                    };
                }
                if (data.referenceRanges[key].high !== undefined) {
                    component.referenceRange[0].high = {
                        value: data.referenceRanges[key].high,
                        unit: data.units?.[key] || "unit"
                    };
                }
            }
        }

        // Add interpretation if available
        if (data.abnormalFlags && data.abnormalFlags[key]) {
            let interpretationCode;
            
            // Map common HL7 abnormal flags to FHIR interpretation codes
            switch(data.abnormalFlags[key]) {
                case 'L': interpretationCode = 'L'; break; // Low
                case 'H': interpretationCode = 'H'; break; // High
                case 'LL': interpretationCode = 'LL'; break; // Critical low
                case 'HH': interpretationCode = 'HH'; break; // Critical high
                case 'N': interpretationCode = 'N'; break; // Normal
                default: interpretationCode = 'IND'; // Indeterminate
            }
            
            component.interpretation = [{
                coding: [{
                    system: "http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation",
                    code: interpretationCode,
                    display: data.abnormalFlagMeanings?.[data.abnormalFlags[key]] || data.abnormalFlags[key]
                }]
            }];
        }
        
        observationResource.component.push(component);
    });
    
    // Add observation to bundle
    bundle.entry.push({
        fullUrl: `urn:uuid:${resourceId}`,
        resource: observationResource
    });
    
    return bundle;
}

export { exportToFHIR };

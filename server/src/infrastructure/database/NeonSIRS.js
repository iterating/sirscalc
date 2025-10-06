import { neon } from '@neondatabase/serverless';
import ISIRSRepository from '../../domain/repositories/ISIRSRepository.js';
import SIRSCalculation from '../../domain/entities/SIRSCalculation.js';

class NeonSIRS extends ISIRSRepository {
    constructor() {
        super();
        const neonUrl = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;

        if (!neonUrl) {
            console.error('Missing Neon database URL environment variable:', { 
                hasUrl: !!neonUrl,
                envKeys: Object.keys(process.env)
            });
            throw new Error('Missing Neon database URL environment variable. Please check your configuration.');
        }

        console.log('Initializing Neon database connection');
        this.sql = neon(neonUrl);
    }

    async initialize() {
        try {
            await this.createTable();
            
            // Test the connection by running a simple query
            const result = await this.sql`SELECT 1 as test`;
            console.log('Neon connection test successful');
        } catch (error) {
            console.error('Database initialization error:', error);
            throw error;
        }
    }

    async createTable() {
        try {
            await this.sql`
                CREATE TABLE IF NOT EXISTS sirs_calculations (
                    id SERIAL PRIMARY KEY,
                    temperature DECIMAL(5,2) NOT NULL,
                    heart_rate INTEGER NOT NULL,
                    respiratory_rate INTEGER NOT NULL,
                    wbc INTEGER NOT NULL,
                    sirs_met BOOLEAN NOT NULL,
                    criteria_count INTEGER NOT NULL,
                    criteria_details JSONB NOT NULL,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                )
            `;
            console.log('SIRS table setup completed');
        } catch (error) {
            console.error('Error setting up table:', error);
            throw error;
        }
    }

    async save(sirsCalculation) {
        try {
            const calculationData = {
                temperature: sirsCalculation.temperature,
                heart_rate: sirsCalculation.heartRate,
                respiratory_rate: sirsCalculation.respiratoryRate,
                wbc: sirsCalculation.wbc,
                sirs_met: sirsCalculation.hasSIRS(),
                criteria_count: sirsCalculation.criteriaCount,
                criteria_details: JSON.stringify(sirsCalculation.criteriaDetails)
            };

            console.log('Saving calculation:', calculationData);

            const [data] = await this.sql`
                INSERT INTO sirs_calculations (
                    temperature, heart_rate, respiratory_rate, wbc, 
                    sirs_met, criteria_count, criteria_details
                ) VALUES (
                    ${calculationData.temperature},
                    ${calculationData.heart_rate},
                    ${calculationData.respiratory_rate},
                    ${calculationData.wbc},
                    ${calculationData.sirs_met},
                    ${calculationData.criteria_count},
                    ${calculationData.criteria_details}::jsonb
                )
                RETURNING *
            `;

            console.log('Calculation saved successfully:', data);

            return new SIRSCalculation(
                data.temperature,
                data.heart_rate,
                data.respiratory_rate,
                data.wbc,
                data.id,
                new Date(data.created_at)
            );
        } catch (error) {
            console.error('Error saving calculation:', error);
            throw error;
        }
    }

    async getById(id) {
        try {
            console.log('Fetching calculation by id:', id);

            const [data] = await this.sql`
                SELECT * FROM sirs_calculations WHERE id = ${id}
            `;

            if (!data) return null;

            console.log('Found calculation:', data);

            return new SIRSCalculation(
                data.temperature,
                data.heart_rate,
                data.respiratory_rate,
                data.wbc,
                data.id,
                new Date(data.created_at)
            );
        } catch (error) {
            console.error('Error fetching calculation:', error);
            throw error;
        }
    }

    async getRecentCalculations(limit = 10) {
        try {
            console.log('Fetching recent calculations, limit:', limit);

            const data = await this.sql`
                SELECT * FROM sirs_calculations 
                ORDER BY created_at DESC 
                LIMIT ${limit}
            `;

            console.log('Found calculations:', data?.length || 0);

            return data.map(item => new SIRSCalculation(
                item.temperature,
                item.heart_rate,
                item.respiratory_rate,
                item.wbc,
                item.id,
                new Date(item.created_at)
            ));
        } catch (error) {
            console.error('Error fetching calculations:', error);
            throw error;
        }
    }

    async deleteCalculation(id) {
        try {
            console.log('Deleting calculation:', id);

            await this.sql`
                DELETE FROM sirs_calculations WHERE id = ${id}
            `;

            console.log('Calculation deleted successfully');
        } catch (error) {
            console.error('Error deleting calculation:', error);
            throw error;
        }
    }

    async clearHistory() {
        try {
            console.log('Clearing all calculations');

            await this.sql`
                DELETE FROM sirs_calculations WHERE id > 0
            `;

            console.log('History cleared successfully');
        } catch (error) {
            console.error('Error clearing history:', error);
            throw error;
        }
    }
}

export default NeonSIRS;

import { Municipality } from '../domain/entities/municipality.entity.js';

export class MunicipalityService {
    constructor(municipalityRepository, userService) {
        this.municipalityRepository = municipalityRepository;
        this.userService = userService;
    }

    async createMunicipality(data) {
        try {
            // Municipality-specific checks
            if (!data.municipality_name) throw new Error("Missing required field: Municipality Name");
            if (!data.region_name) throw new Error("Missing required field: Region Name");
            if (!data.municipality_code) throw new Error("Missing required field: Municipality Code");
            if (!data.municipality_location) throw new Error("Missing required field: Municipality Location");

            // Step 1: Create User via UserService
            const user = await this.userService.createUser({
                user_email: data.user_email,
                user_password: data.user_password,
                user_phone: data.user_phone,
                user_role: 'municipality',
                isactive: true
            });

            // Step 2: Create Municipality entity linked to user_id
            const municipality = new Municipality({
                municipality_id: user.user_id,
                municipality_name: data.municipality_name,
                region_name: data.region_name,
                municipality_code: data.municipality_code,
                municipality_location: data.municipality_location,
                user: user
            });

            // Step 3: Persist via repository
            const createdMunicipality = await this.municipalityRepository.createMunicipality(municipality);
            return createdMunicipality.toDTO();
        } catch (err) {
            throw new Error(`Failed to create municipality: ${err.message}`);
        }
    }

    async getAllMunicipalities() {
        try {
            // Fetch all municipalities from repository
            const municipalities = await this.municipalityRepository.getAllMunicipalities();
            // Expose safe outward-facing data
            return municipalities.map(m => m.toDTO());
        } catch (err) {
            throw new Error(`Failed to fetch municipalities: ${err.message}`);
        }
    }

    async getMunicipalityById(municipality_id) {
        try {
            // Fetch municipality by ID
            const municipality = await this.municipalityRepository.getMunicipalityById(municipality_id);
            if (!municipality) return null; // Not found or inactive
            return municipality.toDTO();
        } catch (err) {
            throw new Error(`Failed to fetch municipality by ID: ${err.message}`);
        }
    }

    async getMunicipalitiesByName(municipality_name) {
        try {
            // Fetch municipalities by name (partial match)
            const municipalities = await this.municipalityRepository.getMunicipalitiesByName(municipality_name);
            if (!municipalities || municipalities.length === 0) return []; // None found or inactive
            return municipalities.map(m => m.toDTO());
        } catch (err) {
            throw new Error(`Failed to fetch municipalities by name: ${err.message}`);
        }
    }

    async getMunicipalityByRegion(region_name) {
        try {
            // Fetch municipalities by region
            const municipalities = await this.municipalityRepository.getMunicipalityByRegion(region_name);
            if (!municipalities || municipalities.length === 0) return []; // None found or inactive
            return municipalities.map(m => m.toDTO());
        } catch (err) {
            throw new Error(`Failed to fetch municipalities by region: ${err.message}`);
        }
    }

    async getMunicipalityByCode(municipality_code) {
        try {
            // Fetch municipality by unique code
            const municipality = await this.municipalityRepository.getMunicipalityByCode(municipality_code);
            if (!municipality) return null;
            return municipality.toDTO();
        } catch (err) {
            throw new Error(`Failed to fetch municipality by code: ${err.message}`);
        }
    }

    async getMunicipalityByLocation(municipality_location) {
        try {
            // Fetch municipality by spatial location (within radius)
            const municipality = await this.municipalityRepository.getMunicipalityByLocation(municipality_location);
            if (!municipality) return null;
            return municipality.toDTO();
        } catch (err) {
            throw new Error(`Failed to fetch municipality by location: ${err.message}`);
        }
    }

    async getMunicipalityByEmail(user_email) {
        try {
            // Fetch municipality by associated user email
            const municipality = await this.municipalityRepository.getMunicipalityByEmail(user_email);
            if (!municipality) return null;
            return municipality.toDTO();
        } catch (err) {
            throw new Error(`Failed to fetch municipality by email: ${err.message}`);
        }
    }

    async getMunicipalityByPhone(user_phone) {
        try {
            // Fetch municipality by associated user phone
            const municipality = await this.municipalityRepository.getMunicipalityByPhone(user_phone);
            if (!municipality) return null;
            return municipality.toDTO();
        } catch (err) {
            throw new Error(`Failed to fetch municipality by phone: ${err.message}`);
        }
    }

    async updateMunicipality(municipality_id, data) {
        try {
            // Update municipality fields
            const updatedMunicipality = await this.municipalityRepository.updateMunicipality(municipality_id, data);
            if (!updatedMunicipality) return null;
            return updatedMunicipality.toDTO();
        } catch (err) {
            throw new Error(`Failed to update municipality: ${err.message}`);
        }
    }

    async deactivateMunicipality(municipality_id) {
        try {
            // Deactivate municipality
            return await this.municipalityRepository.deactivateMunicipality(municipality_id);
        } catch (err) {
            throw new Error(`Failed to deactivate municipality: ${err.message}`);
        }
    }
}

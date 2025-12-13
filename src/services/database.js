import Dexie from 'dexie';

// Create database
const db = new Dexie('MnRDatabase');

// Define schema
db.version(1).stores({
    containers: '++id, containerNumber, liner, size, type, status, sequence, createdAt',
    surveys: '++id, surveyId, containerId, containerNumber, status, createdAt',
    eors: '++id, eorId, containerId, surveyId, status, totalCost, createdAt',
    repairOrders: '++id, roId, containerId, eorId, status, createdAt',
    shuntingRequests: '++id, containerId, status, createdAt',
    preInspections: '++id, containerId, status, scheduledDate, result, createdAt',
    stackingRequests: '++id, containerId, status, createdAt',
    auditLogs: '++id, entityType, entityId, action, user, timestamp',
    settings: 'key'
});

// Container operations
export const containerDB = {
    async getAll() {
        return await db.containers.toArray();
    },

    async getById(id) {
        return await db.containers.get(id);
    },

    async getByNumber(containerNumber) {
        return await db.containers.where('containerNumber').equals(containerNumber).first();
    },

    async add(container) {
        const id = await db.containers.add({
            ...container,
            sequence: container.sequence || 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });
        return { id, ...container };
    },

    async addBulk(containers) {
        const prepared = containers.map(c => ({
            ...c,
            sequence: c.sequence || 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }));
        return await db.containers.bulkAdd(prepared, { allKeys: true });
    },

    async update(id, changes) {
        await db.containers.update(id, {
            ...changes,
            updatedAt: new Date().toISOString()
        });
        return await db.containers.get(id);
    },

    async delete(id) {
        return await db.containers.delete(id);
    }
};

// Survey operations
export const surveyDB = {
    async getAll() {
        return await db.surveys.toArray();
    },

    async getById(id) {
        return await db.surveys.get(id);
    },

    async getBySurveyId(surveyId) {
        return await db.surveys.where('surveyId').equals(surveyId).first();
    },

    async getByContainerId(containerId) {
        return await db.surveys.where('containerId').equals(containerId).toArray();
    },

    async add(survey) {
        const id = await db.surveys.add({
            ...survey,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });
        return { id, ...survey };
    },

    async update(id, changes) {
        await db.surveys.update(id, {
            ...changes,
            updatedAt: new Date().toISOString()
        });
        return await db.surveys.get(id);
    }
};

// EOR operations
export const eorDB = {
    async getAll() {
        return await db.eors.toArray();
    },

    async getById(id) {
        return await db.eors.get(id);
    },

    async getByEorId(eorId) {
        return await db.eors.where('eorId').equals(eorId).first();
    },

    async add(eor) {
        const id = await db.eors.add({
            ...eor,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });
        return { id, ...eor };
    },

    async update(id, changes) {
        await db.eors.update(id, {
            ...changes,
            updatedAt: new Date().toISOString()
        });
        return await db.eors.get(id);
    }
};

// Repair Order operations
export const repairOrderDB = {
    async getAll() {
        return await db.repairOrders.toArray();
    },

    async getById(id) {
        return await db.repairOrders.get(id);
    },

    async add(ro) {
        const id = await db.repairOrders.add({
            ...ro,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });
        return { id, ...ro };
    },

    async update(id, changes) {
        await db.repairOrders.update(id, {
            ...changes,
            updatedAt: new Date().toISOString()
        });
        return await db.repairOrders.get(id);
    }
};

// Shunting operations
export const shuntingDB = {
    async getAll() {
        return await db.shuntingRequests.toArray();
    },

    async add(request) {
        const id = await db.shuntingRequests.add({
            ...request,
            createdAt: new Date().toISOString()
        });
        return { id, ...request };
    },

    async update(id, changes) {
        await db.shuntingRequests.update(id, changes);
        return await db.shuntingRequests.get(id);
    }
};

// Pre-Inspection operations
export const preInspectionDB = {
    async getAll() {
        return await db.preInspections.toArray();
    },

    async add(inspection) {
        const id = await db.preInspections.add({
            ...inspection,
            createdAt: new Date().toISOString()
        });
        return { id, ...inspection };
    },

    async update(id, changes) {
        await db.preInspections.update(id, changes);
        return await db.preInspections.get(id);
    }
};

// Stacking operations
export const stackingDB = {
    async getAll() {
        return await db.stackingRequests.toArray();
    },

    async add(request) {
        const id = await db.stackingRequests.add({
            ...request,
            createdAt: new Date().toISOString()
        });
        return { id, ...request };
    },

    async update(id, changes) {
        await db.stackingRequests.update(id, changes);
        return await db.stackingRequests.get(id);
    }
};

// Audit Log operations
export const auditLogDB = {
    async getAll() {
        return await db.auditLogs.orderBy('timestamp').reverse().toArray();
    },

    async add(log) {
        return await db.auditLogs.add({
            ...log,
            timestamp: new Date().toISOString()
        });
    },

    async getByEntity(entityType, entityId) {
        return await db.auditLogs
            .where(['entityType', 'entityId'])
            .equals([entityType, entityId])
            .toArray();
    },

    async search(filters) {
        let query = db.auditLogs.orderBy('timestamp').reverse();

        if (filters.entityType) {
            query = query.filter(log => log.entityType === filters.entityType);
        }
        if (filters.user) {
            query = query.filter(log => log.user === filters.user);
        }
        if (filters.action) {
            query = query.filter(log => log.action === filters.action);
        }
        if (filters.startDate) {
            query = query.filter(log => log.timestamp >= filters.startDate);
        }
        if (filters.endDate) {
            query = query.filter(log => log.timestamp <= filters.endDate);
        }

        return await query.toArray();
    }
};

// Settings operations
export const settingsDB = {
    async get(key) {
        const setting = await db.settings.get(key);
        return setting?.value;
    },

    async set(key, value) {
        await db.settings.put({ key, value });
    }
};

// Migration helper - import from localStorage
export async function migrateFromLocalStorage() {
    try {
        // Migrate containers
        const containers = JSON.parse(localStorage.getItem('mnr_containers') || '[]');
        if (containers.length > 0) {
            for (const c of containers) {
                const existing = await containerDB.getByNumber(c.containerNumber);
                if (!existing) {
                    await containerDB.add(c);
                }
            }
        }

        // Migrate surveys
        const surveys = JSON.parse(localStorage.getItem('mnr_surveys') || '[]');
        if (surveys.length > 0) {
            for (const s of surveys) {
                const existing = await surveyDB.getBySurveyId(s.surveyId || s.id);
                if (!existing) {
                    await surveyDB.add({ ...s, surveyId: s.surveyId || s.id });
                }
            }
        }

        // Migrate EORs
        const eors = JSON.parse(localStorage.getItem('mnr_eors') || '[]');
        if (eors.length > 0) {
            for (const e of eors) {
                const existing = await eorDB.getByEorId(e.eorId || e.id);
                if (!existing) {
                    await eorDB.add({ ...e, eorId: e.eorId || e.id });
                }
            }
        }

        // Migrate repair orders
        const repairOrders = JSON.parse(localStorage.getItem('mnr_repairOrders') || '[]');
        if (repairOrders.length > 0) {
            for (const r of repairOrders) {
                await repairOrderDB.add({ ...r, roId: r.roId || r.id });
            }
        }

        console.log('Migration from localStorage complete');
        return true;
    } catch (error) {
        console.error('Migration error:', error);
        return false;
    }
}

// Clear database (for testing)
export async function clearDatabase() {
    await db.containers.clear();
    await db.surveys.clear();
    await db.eors.clear();
    await db.repairOrders.clear();
    await db.shuntingRequests.clear();
    await db.preInspections.clear();
    await db.stackingRequests.clear();
    await db.auditLogs.clear();
}

export default db;

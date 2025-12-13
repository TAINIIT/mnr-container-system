/**
 * Firebase Data Service
 * Provides CRUD operations and real-time sync for all app data
 */
import { database, ref, onValue, set, push, get, update, remove, DEMO_MODE } from '../config/firebase';

// Storage keys for localStorage fallback
const STORAGE_KEYS = {
    containers: 'mnr_containers',
    eors: 'mnr_eors',
    surveys: 'mnr_surveys',
    repairOrders: 'mnr_repair_orders',
    washingOrders: 'mnr_washing_orders',
    shunting: 'mnr_shunting',
    preinspections: 'mnr_preinspections',
    stacking: 'mnr_stacking',
    auditLogs: 'mnr_audit_logs',
    users: 'mnr_users',
    config: 'mnr_config',
    groups: 'mnr_groups',
    screens: 'mnr_screens',
    codes: 'mnr_codes',
    chats: 'mnr_chats'
};

/**
 * Generic Firebase CRUD operations
 */
class FirebaseDataService {
    /**
     * Get all items from a collection
     * @param {string} path - Firebase path (e.g., 'containers', 'eors')
     * @returns {Promise<Array>} Array of items
     */
    static async getAll(path) {
        if (DEMO_MODE) {
            return this.getFromLocalStorage(path);
        }

        try {
            const dataRef = ref(database, path);
            const snapshot = await get(dataRef);
            if (snapshot.exists()) {
                const data = snapshot.val();
                return Object.entries(data).map(([key, value]) => ({
                    ...value,
                    _firebaseKey: key
                }));
            }
            return [];
        } catch (error) {
            console.error(`Firebase getAll error for ${path}:`, error);
            return this.getFromLocalStorage(path);
        }
    }

    /**
     * Get a single item by ID
     * @param {string} path - Firebase path
     * @param {string} id - Item ID
     * @returns {Promise<Object|null>} Item or null
     */
    static async getById(path, id) {
        if (DEMO_MODE) {
            const items = this.getFromLocalStorage(path);
            return items.find(item => item.id === id) || null;
        }

        try {
            const items = await this.getAll(path);
            return items.find(item => item.id === id) || null;
        } catch (error) {
            console.error(`Firebase getById error for ${path}/${id}:`, error);
            return null;
        }
    }

    /**
     * Create a new item
     * @param {string} path - Firebase path
     * @param {Object} data - Item data (should include 'id' field)
     * @returns {Promise<Object>} Created item
     */
    static async create(path, data) {
        const item = {
            ...data,
            createdAt: data.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        if (DEMO_MODE) {
            const items = this.getFromLocalStorage(path);
            items.push(item);
            this.saveToLocalStorage(path, items);
            return item;
        }

        try {
            const itemRef = ref(database, `${path}/${item.id}`);
            await set(itemRef, item);
            console.log(`🔥 Created ${path}/${item.id}`);
            return item;
        } catch (error) {
            console.error(`Firebase create error for ${path}:`, error);
            // Fallback to localStorage
            const items = this.getFromLocalStorage(path);
            items.push(item);
            this.saveToLocalStorage(path, items);
            return item;
        }
    }

    /**
     * Update an existing item
     * @param {string} path - Firebase path
     * @param {string} id - Item ID
     * @param {Object} updates - Fields to update
     * @returns {Promise<Object>} Updated item
     */
    static async update(path, id, updates) {
        const updatedData = {
            ...updates,
            updatedAt: new Date().toISOString()
        };

        if (DEMO_MODE) {
            const items = this.getFromLocalStorage(path);
            const index = items.findIndex(item => item.id === id);
            if (index !== -1) {
                items[index] = { ...items[index], ...updatedData };
                this.saveToLocalStorage(path, items);
                return items[index];
            }
            return null;
        }

        try {
            const itemRef = ref(database, `${path}/${id}`);
            await update(itemRef, updatedData);
            console.log(`🔥 Updated ${path}/${id}`);
            return { id, ...updatedData };
        } catch (error) {
            console.error(`Firebase update error for ${path}/${id}:`, error);
            return null;
        }
    }

    /**
     * Delete an item
     * @param {string} path - Firebase path
     * @param {string} id - Item ID
     * @returns {Promise<boolean>} Success status
     */
    static async delete(path, id) {
        if (DEMO_MODE) {
            const items = this.getFromLocalStorage(path);
            const filtered = items.filter(item => item.id !== id);
            this.saveToLocalStorage(path, filtered);
            return true;
        }

        try {
            const itemRef = ref(database, `${path}/${id}`);
            await remove(itemRef);
            console.log(`🔥 Deleted ${path}/${id}`);
            return true;
        } catch (error) {
            console.error(`Firebase delete error for ${path}/${id}:`, error);
            return false;
        }
    }

    /**
     * Save entire collection (batch save)
     * @param {string} path - Firebase path
     * @param {Array} items - Array of items
     * @returns {Promise<boolean>} Success status
     */
    static async saveAll(path, items) {
        if (DEMO_MODE) {
            this.saveToLocalStorage(path, items);
            return true;
        }

        try {
            const dataRef = ref(database, path);
            const dataObject = {};
            items.forEach(item => {
                if (item.id) {
                    dataObject[item.id] = item;
                }
            });
            await set(dataRef, dataObject);
            console.log(`🔥 Saved all ${path} (${items.length} items)`);
            return true;
        } catch (error) {
            console.error(`Firebase saveAll error for ${path}:`, error);
            this.saveToLocalStorage(path, items);
            return false;
        }
    }

    /**
     * Subscribe to real-time updates
     * @param {string} path - Firebase path
     * @param {Function} callback - Callback function (receives array of items)
     * @returns {Function} Unsubscribe function
     */
    static subscribe(path, callback) {
        if (DEMO_MODE) {
            // For demo mode, just call callback with current data
            callback(this.getFromLocalStorage(path));

            // Listen for storage events (cross-tab sync)
            const storageKey = STORAGE_KEYS[path] || `mnr_${path}`;
            const handleStorage = (e) => {
                if (e.key === storageKey && e.newValue) {
                    try {
                        callback(JSON.parse(e.newValue));
                    } catch (err) {
                        console.error('Storage parse error:', err);
                    }
                }
            };
            window.addEventListener('storage', handleStorage);
            return () => window.removeEventListener('storage', handleStorage);
        }

        console.log(`🔥 Subscribing to ${path}...`);
        const dataRef = ref(database, path);

        const unsubscribe = onValue(dataRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const items = Object.entries(data).map(([key, value]) => ({
                    ...value,
                    _firebaseKey: key
                }));
                console.log(`🔥 ${path}: Received ${items.length} items`);
                callback(items);
            } else {
                callback([]);
            }
        }, (error) => {
            console.error(`Firebase subscribe error for ${path}:`, error);
            callback(this.getFromLocalStorage(path));
        });

        return unsubscribe;
    }

    /**
     * LocalStorage helpers
     */
    static getFromLocalStorage(path) {
        const key = STORAGE_KEYS[path] || `mnr_${path}`;
        try {
            const stored = localStorage.getItem(key);
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            console.error(`LocalStorage read error for ${key}:`, e);
            return [];
        }
    }

    static saveToLocalStorage(path, data) {
        const key = STORAGE_KEYS[path] || `mnr_${path}`;
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (e) {
            console.error(`LocalStorage write error for ${key}:`, e);
        }
    }

    /**
     * Generate unique ID
     */
    static generateId(prefix = '') {
        return `${prefix}${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}

export default FirebaseDataService;
export { STORAGE_KEYS };

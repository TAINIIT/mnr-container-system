/**
 * Script to find missing translation keys across all language files
 * Uses English (en.json) as the base reference
 */

const fs = require('fs');
const path = require('path');

const i18nDir = path.join(__dirname, 'src/i18n');
const languages = ['en', 'vi', 'ms', 'ko', 'zh', 'pt'];

// Load all language files
const translations = {};
languages.forEach(lang => {
    const filePath = path.join(i18nDir, `${lang}.json`);
    try {
        translations[lang] = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (e) {
        console.error(`Error loading ${lang}.json:`, e.message);
        translations[lang] = {};
    }
});

// Get all keys from a nested object
function getAllKeys(obj, prefix = '') {
    let keys = [];
    for (const key in obj) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
            keys = keys.concat(getAllKeys(obj[key], fullKey));
        } else {
            keys.push(fullKey);
        }
    }
    return keys;
}

// Get all English keys as reference
const enKeys = getAllKeys(translations.en);
console.log(`\n📊 Translation Analysis`);
console.log(`========================`);
console.log(`English (base): ${enKeys.length} keys\n`);

// Check each language for missing keys
const missingByLang = {};
languages.filter(l => l !== 'en').forEach(lang => {
    const langKeys = getAllKeys(translations[lang]);
    const missing = enKeys.filter(key => !langKeys.includes(key));
    missingByLang[lang] = missing;

    console.log(`${lang.toUpperCase()}: ${langKeys.length} keys (${missing.length} missing)`);
    if (missing.length > 0 && missing.length <= 50) {
        console.log(`   Missing: ${missing.slice(0, 10).join(', ')}${missing.length > 10 ? '...' : ''}`);
    }
});

// Find keys that exist in other languages but not in English
console.log(`\n📝 Keys to add to each language file:\n`);

// Generate addition suggestions for each language
languages.filter(l => l !== 'en').forEach(lang => {
    const missing = missingByLang[lang];
    if (missing.length > 0) {
        console.log(`\n--- ${lang.toUpperCase()} (${missing.length} missing) ---`);
        missing.forEach(key => {
            // Get the English value for this key
            const keys = key.split('.');
            let value = translations.en;
            for (const k of keys) {
                value = value?.[k];
            }
            console.log(`  "${key}": "${value || '???'}"`);
        });
    }
});

// Summary
console.log(`\n\n📈 SUMMARY`);
console.log(`==========`);
let totalMissing = 0;
languages.filter(l => l !== 'en').forEach(lang => {
    const count = missingByLang[lang].length;
    totalMissing += count;
    const status = count === 0 ? '✅' : '⚠️';
    console.log(`${status} ${lang.toUpperCase()}: ${count} missing keys`);
});
console.log(`\nTotal missing translations: ${totalMissing}`);

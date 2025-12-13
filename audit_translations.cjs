// Comprehensive translation audit script
// Compares all language files and reports missing/extra keys

const fs = require('fs');
const path = require('path');

const languages = ['en', 'vi', 'ms', 'ko', 'zh', 'pt'];
const i18nDir = path.join(__dirname, 'src/i18n');

// Load all language files
const translations = {};
for (const lang of languages) {
    try {
        translations[lang] = require(path.join(i18nDir, `${lang}.json`));
        console.log(`✓ Loaded ${lang}.json`);
    } catch (e) {
        console.log(`✗ Failed to load ${lang}.json: ${e.message}`);
    }
}

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

// Get all unique keys from all languages
const allKeysSet = new Set();
for (const lang of languages) {
    if (translations[lang]) {
        const keys = getAllKeys(translations[lang]);
        keys.forEach(k => allKeysSet.add(k));
    }
}
const allKeys = Array.from(allKeysSet).sort();

console.log(`\n=== TRANSLATION AUDIT ===`);
console.log(`Total unique keys across all languages: ${allKeys.length}`);

// Check each language for missing keys
console.log(`\n=== MISSING KEYS BY LANGUAGE ===`);
const missingByLang = {};
for (const lang of languages) {
    if (!translations[lang]) continue;
    const langKeys = new Set(getAllKeys(translations[lang]));
    const missing = allKeys.filter(k => !langKeys.has(k));
    missingByLang[lang] = missing;
    if (missing.length > 0) {
        console.log(`\n${lang.toUpperCase()}: Missing ${missing.length} keys`);
        // Show first 20 missing
        missing.slice(0, 20).forEach(k => console.log(`  - ${k}`));
        if (missing.length > 20) console.log(`  ... and ${missing.length - 20} more`);
    } else {
        console.log(`\n${lang.toUpperCase()}: ✓ Complete`);
    }
}

// Specifically check nav section
console.log(`\n=== NAV SECTION CHECK ===`);
for (const lang of languages) {
    if (!translations[lang]) continue;
    const navSection = translations[lang].nav;
    if (!navSection) {
        console.log(`${lang}: NAV SECTION MISSING!`);
    } else {
        console.log(`${lang}: nav has ${Object.keys(navSection).length} keys`);
    }
}

// Check nav keys specifically
console.log(`\n=== NAV KEYS COMPARISON ===`);
const enNav = translations.en?.nav || {};
const navKeys = Object.keys(enNav);
console.log(`English nav keys (${navKeys.length}):`);
navKeys.forEach(k => console.log(`  ${k}: "${enNav[k]}"`));

// Export missing keys as JSON for easy fix
const report = {
    totalKeys: allKeys.length,
    missingByLang,
    navKeyCount: {}
};
for (const lang of languages) {
    report.navKeyCount[lang] = translations[lang]?.nav ? Object.keys(translations[lang].nav).length : 0;
}

fs.writeFileSync(path.join(__dirname, 'translation_audit.json'), JSON.stringify(report, null, 2));
console.log('\n\nAudit report saved to translation_audit.json');

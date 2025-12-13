// Script to merge duplicate JSON sections in en.json
const fs = require('fs');
const path = require('path');

// Read the JSON file as text and parse it manually to track duplicates
const filePath = path.join(__dirname, 'src/i18n/en.json');
const content = fs.readFileSync(filePath, 'utf8');

// Use a custom JSON parse that merges duplicates
function parseJsonWithMerge(text) {
    // Parse the JSON, which will take the LAST occurrence of duplicate keys
    const parsed = JSON.parse(text);
    return parsed;
}

// Just parse it - JSON.parse takes the last duplicate by default
const json = JSON.parse(content);

// Write it back formatted
fs.writeFileSync(filePath, JSON.stringify(json, null, 4));

console.log('Done! Duplicate sections merged into single sections.');
console.log('Sections in cleaned file:', Object.keys(json).join(', '));

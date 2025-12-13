// Add washing to workflow translations in all language files
const fs = require('fs');
const path = require('path');

const languages = ['en', 'vi', 'ms', 'ko', 'zh', 'pt'];
const translations = {
    en: 'Washing',
    vi: 'Rửa Container',
    ms: 'Mencuci',
    ko: '세척',
    zh: '清洗',
    pt: 'Lavagem'
};

languages.forEach(lang => {
    const filePath = path.join(__dirname, `src/i18n/${lang}.json`);
    const json = require(filePath);

    if (!json.workflow) json.workflow = {};
    json.workflow.washing = translations[lang];

    fs.writeFileSync(filePath, JSON.stringify(json, null, 4));
    console.log(`Added workflow.washing to ${lang}.json`);
});

console.log('Done!');

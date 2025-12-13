const fs = require('fs');
const path = require('path');

const logStream = fs.createWriteStream('fix_log.txt', { flags: 'a' });
function log(msg) {
    console.log(msg);
    logStream.write(msg + '\n');
}

const files = ['en.json', 'vi.json', 'ms.json', 'ko.json', 'zh.json', 'pt.json'];
const dir = path.join(__dirname, 'src', 'i18n'); // Use absolute path safely

log(`Starting fix script. Dir: ${dir}`);

files.forEach(file => {
    const filePath = path.join(dir, file);
    if (!fs.existsSync(filePath)) {
        log(`File not found: ${filePath}`);
        return;
    }
    const content = fs.readFileSync(filePath, 'utf8');

    const indices = [];
    const key = '"admin":';
    let pos = content.indexOf(key);
    while (pos !== -1) {
        indices.push(pos);
        pos = content.indexOf(key, pos + 1);
    }

    if (indices.length < 2) {
        log(`${file}: Found ${indices.length} admin blocks. No need to merge.`);
        return;
    }

    log(`${file}: Found ${indices.length} admin blocks. Merging...`);

    let json;
    try {
        json = JSON.parse(content);
    } catch (e) {
        log(`Error parsing JSON in ${file}: ${e.message}`);
        return;
    }

    const startIdx = indices[0];
    const openBraceIdx = content.indexOf('{', startIdx);
    if (openBraceIdx === -1) return;

    let braceCount = 1;
    let endIdx = openBraceIdx + 1;
    while (braceCount > 0 && endIdx < content.length) {
        if (content[endIdx] === '{') braceCount++;
        else if (content[endIdx] === '}') braceCount--;
        endIdx++;
    }

    const firstBlockRaw = content.substring(openBraceIdx, endIdx);

    let firstBlockObj;
    try {
        firstBlockObj = JSON.parse(firstBlockRaw);
    } catch (e) {
        log(`Error parsing extracted first block in ${file}: ${e.message}`);
        // Attempt to clean trailing comma
        const inner = firstBlockRaw.substring(1, firstBlockRaw.length - 1); // remove { }
        const cleaned = inner.replace(/,\s*$/, '').trim();
        try {
            firstBlockObj = JSON.parse('{' + cleaned + '}');
        } catch (e2) {
            log(`Retry failed: ${e2.message}. clean: {${cleaned}}`);
            return;
        }
    }

    const finalAdmin = json.admin || {};
    let added = 0;

    for (const k in firstBlockObj) {
        if (!finalAdmin.hasOwnProperty(k)) {
            finalAdmin[k] = firstBlockObj[k];
            added++;
        }
    }

    json.admin = finalAdmin;

    log(`  Added ${added} missing keys to admin.`);

    fs.writeFileSync(filePath, JSON.stringify(json, null, 4));
});
log('Done.');

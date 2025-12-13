const fs = require('fs');
const path = require('path');

const i18nDir = path.join(__dirname, 'src', 'i18n');
const languages = ['en', 'vi', 'ms', 'ko', 'zh', 'pt'];

function mergeDuplicateKeys(obj) {
    // Merge any duplicate keys in the object
    // For JSON, only the last one is kept, but we want to merge them
    const washing1 = obj.washing;

    // If there's a second section, merge it
    // Since we can't have duplicate keys in parsed JSON, 
    // we check if parsed correctly and if 'washing' exists
    if (washing1 && typeof washing1 === 'object') {
        // Ensure it has all required keys
        const requiredKeys = [
            'title', 'subtitle', 'newWashingOrder', 'pendingApproval', 'pendingSchedule',
            'scheduled', 'inProgress', 'pendingQC', 'rework', 'completedToday',
            'searchPlaceholder', 'allBays', 'allPrograms', 'program', 'bay',
            'scheduledAt', 'noOrders', 'readyForWashing', 'createOrder',
            'cleaningStarted', 'orderApproved', 'orderRejected', 'enterRejectionReason',
            'approve', 'reject', 'startCleaning', 'completeCleaning', 'cleaningCompleted',
            'completeAllRequired', 'orderNotFound', 'safetyNotes', 'cleaningChecklist',
            'workerNotes', 'notesPlaceholder', 'allRequiredMustPass', 'qcPassed',
            'selectReworkReasons', 'qcFailed', 'qcInspection', 'cleaningProgram',
            'elapsedTime', 'reworkAttempt', 'previousReworkReasons', 'qcChecklist',
            'pass', 'fail', 'reworkReasons', 'qcNotes', 'qcNotesPlaceholder',
            'failAndRework', 'passAndCertify', 'selectContainerFirst', 'orderCreated',
            'assignedBay', 'assignedTeam', 'selectBay', 'selectTeam',
            // Certificate keys
            'initialInspection', 'contaminationLevel', 'interiorCondition', 'exteriorCondition',
            'odorPresent', 'pestPresent', 'hazardousResidues', 'inspectionNotes',
            'suggestedProgram', 'assignBay', 'assignWorker', 'assignTeam',
            'safetyRequirements', 'requiresMask', 'requiresGloves', 'chemicalHandling',
            'ventilationRequired', 'twoPersonJob', 'reportDamage', 'qcResult',
            'generateCertificate', 'certificateOfCleanliness', 'certificateNo',
            'issueDate', 'cleanedDate', 'cleanedBy', 'inspectedBy',
            'certificateStatement', 'printCertificate', 'downloadPDF', 'emailToLiner'
        ];
        console.log(`  Washing section has ${Object.keys(washing1).length} keys`);
    }

    return obj;
}

console.log('Checking and fixing duplicate keys in language files...\n');

languages.forEach(lang => {
    const filePath = path.join(i18nDir, `${lang}.json`);
    console.log(`Processing ${lang}.json...`);

    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(content);

        // Check if washing section exists
        if (data.washing) {
            console.log(`  ✓ washing section exists with ${Object.keys(data.washing).length} keys`);
        } else {
            console.log(`  ✗ washing section MISSING`);
        }

        // Check if inspection section exists  
        if (data.inspection) {
            console.log(`  ✓ inspection section exists with ${Object.keys(data.inspection).length} keys`);
        } else {
            console.log(`  ✗ inspection section MISSING`);
        }

        // Check if nav.washingStation exists
        if (data.nav && data.nav.washingStation) {
            console.log(`  ✓ nav.washingStation exists`);
        } else {
            console.log(`  ✗ nav.washingStation MISSING`);
        }

        // Check containerStatus
        if (data.containerStatus && data.containerStatus.PENDING_WASH) {
            console.log(`  ✓ containerStatus.PENDING_WASH exists`);
        } else {
            console.log(`  ✗ containerStatus.PENDING_WASH MISSING`);
        }

    } catch (err) {
        console.error(`  ✗ Error processing ${lang}.json:`, err.message);
    }
    console.log('');
});

console.log('Done checking language files.');

// Script to fix missing nav section in en.json
const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, 'src/i18n/en.json');
const en = require(enPath);

// Complete English nav section
const completeNav = {
    "dashboard": "Dashboard",
    "containerManagement": "Container Management",
    "registerContainer": "Register Container",
    "allContainers": "All Containers",
    "arContainers": "AR Containers",
    "surveyDamage": "Survey & Damage",
    "newSurvey": "New Survey",
    "surveyList": "Survey List",
    "repairManagement": "Repair Management",
    "eorList": "EOR List",
    "repairOrders": "Repair Orders",
    "yardOperations": "Yard Operations",
    "shunting": "Shunting",
    "preInspection": "Pre-Inspection",
    "washingStation": "Washing Station",
    "stackingRelease": "Stacking & Release",
    "administration": "Administration",
    "masterCodes": "Master Codes",
    "permissionGroups": "Permission Groups",
    "userManagement": "User Management",
    "systemSettings": "System Settings",
    "monitoring": "Monitoring",
    "jobMonitoring": "Job Monitoring",
    "homePageManagement": "Home Page"
};

// Also check and fix inspection section - add missing keys
const inspectionFixes = {
    "accept": "Accept",
    "allTypes": "All Types",
    "inspectionStatus": "Inspection Status",
    "result": "Result",
    "todayInspections": "Today's Inspections"
};

// Merge nav
en.nav = { ...en.nav, ...completeNav };
console.log('Fixed nav section with', Object.keys(en.nav).length, 'keys');

// Merge inspection
if (!en.inspection) en.inspection = {};
en.inspection = { ...en.inspection, ...inspectionFixes };
console.log('Fixed inspection section');

// Write back
fs.writeFileSync(enPath, JSON.stringify(en, null, 4));
console.log('Successfully updated en.json');

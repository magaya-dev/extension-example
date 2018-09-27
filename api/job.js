
const path = require('path');
const fs = require('fs');
const hyperion = require('@magaya/hyperion-express-middleware').hyperion(process.argv, '');

function getFrequencyFactor(frequency) {
    const seconds = 1000;
    if (frequency === 'minutes')
        return seconds * 60;

    if (frequency === 'hours')
        return seconds * 3600;

    return seconds; // default to seconds
}

function getScheduleConfig() {
    const filename = path.join(__dirname, '../config.json');
    if (!fs.existsSync(filename)) {
        return {
            repeat : 1,
            frequency : 'minutes'
        };
    }

    return JSON.parse(fs.readFileSync(filename, 'utf8'));
}

function doWork() {
    console.log(hyperion.dbx.Accounting.Invoice.ListByTime.Count);
    console.log(`background process executed at ${new Date()}`);
}

function enqueueWork() {
    const configJson = getScheduleConfig();
    const time = configJson.repeat * getFrequencyFactor(configJson.frequency);
    setTimeout(function () {
        doWork();
        enqueueWork();
    }, time);
}

enqueueWork();
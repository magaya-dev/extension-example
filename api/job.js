
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

async function doWork() {
    const list = hyperion.dbx.Accounting.Invoice.ListByTime;

    const startDate = new Date(2018, 7, 1);
    const invoices = await hyperion.algorithm.select(hyperion.dbx.using(list).from(startDate), 1).where(current => true).project(invoice => invoice);
    
    if (!invoices)
        return;

    for (let invoice of invoices) {
        let editedInvoice = await hyperion.dbw.edit(invoice);

        const readyToTransmit = editedInvoice.CustomFields['ready_to_transmit'];
        if (!readyToTransmit) {
            editedInvoice.CustomFields['ready_to_transmit'] = true;
        }
        else {
            editedInvoice.CustomFields['transmitted'] = true;
        }
        
        const runDate = new Date();

        editedInvoice.CustomFields['last_process_date'] = runDate;

        await hyperion.dbw.save(editedInvoice);

        let charges = invoice.Charges;
        await hyperion.algorithm.forEach(hyperion.dbx.using(charges)).callback(charge => {
            console.log(charge);
        });
    }

    console.log(`background process executed at ${new Date()}`);
}

function enqueueWork() {
    const configJson = getScheduleConfig();
    const time = configJson.repeat * getFrequencyFactor(configJson.frequency);
    setTimeout(async function () {
        await doWork();
        enqueueWork();
    }, time);
}

enqueueWork();
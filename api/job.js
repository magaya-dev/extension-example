
const path = require('path');
const hyperion = require('@magaya/hyperion-express-middleware').hyperion(process.argv, '');
const configJob = require(path.join(__dirname, './config-job'));

function getFrequencyFactor(frequency) {
    const seconds = 1000;
    if (frequency === 'minutes')
        return seconds * 60;

    if (frequency === 'hours')
        return seconds * 3600;

    return seconds; // default to seconds
}

async function doWork() {
    const list = hyperion.dbx.Accounting.Invoice.ListByTime;

    const startDate = new Date(2018, 7, 1);
    const lastRecords = 10;
    const invoices = await hyperion.algorithm.select(hyperion.dbx.using(list).from(startDate), lastRecords).where(current => current.DbClassType === 6).project(invoice => invoice);
    
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

async function enqueueWork() {
    const configJson = await configJob.getConfig();
    const time = configJson.repeat * getFrequencyFactor(configJson.frequency);
    setTimeout(async function () {
        await doWork();
        enqueueWork();
    }, time);
}

enqueueWork();
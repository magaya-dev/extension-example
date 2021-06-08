const fs = require('fs');
const moment = require('moment');
const path = require('path');
const util = require('util');
const fsWriteFile = util.promisify(fs.writeFile);
const fsMkDir = util.promisify(fs.mkdir);

async function downloadAttachment(hyperion, attatchment, attachmentsFolder) {
    let attPath = path.join(attachmentsFolder, `${attatchment.Name}.${attatchment.Extension}`);
    const writableStream = fs.createWriteStream(attPath);
    await hyperion.algorithm.streamAttachmentContent(attatchment, writableStream);
    writableStream.end();
}

function getDate(date) {
    const format = 'YYYY-MM-DD';
    if (!date) {
        return moment().format(format);
    }

    return moment(date).format(format);
}

function getItemsList(transaction) {
    if (!transaction) {
        return null;
    }

    if (transaction.PackingList && transaction.PackingList.Items) {
        return transaction.PackingList.Items;
    }
    
    return transaction.Items;
}

function getStatus(status) {
    let code = status;
    let description = 'Empty';
    switch (status) {
        case 0:
            {
                description = 'OnHand';
                break;
            }
        case 1:
            {
                description = 'InProcess';
                break;
            }
        case 2:
            {
                description = 'InTransit';
                break;
            }

        case 3:
            {
                description = 'AtDestination';
                break;
            }

        case 4:
            {
                description = 'Delivered';
                break;
            }
        case 6:
            {
                description = 'Arriving';
                break;
            }
        case 7:
            {
                description = 'Pending';
                break;
            }
        case 5:
        default:
            {
                code = 5;
                description = 'Empty';
                break;
            }
    }

    return `<Code>${code}</Code><Description>${description}</Description>`;
}

async function getOrderLines(hyperion, transaction) {
    let data = '';
    let itemsList = getItemsList(transaction);
    if (itemsList) {
        await hyperion.algorithm.forEach(hyperion.dbx.using(itemsList))
        .callback(item => {
            data += `<OrderLine>
                            <LineNumber>${item.WHRItemID}</LineNumber>
                            <AdditionalInformation></AdditionalInformation>
                            <AdditionalTerms></AdditionalTerms>
                            <Product>
                                <Code>${item.Description}</Code>
                                <Description>${item.Description}</Description>
                            </Product>
                            <PackageQty>${item.Pieces}</PackageQty>
                            <PackageType>${(item.Package) ? item.Package.Name.substring(0, 3) : ""}</PackageType>
                            <PackageHeight>${item.Height.magnitude}</PackageHeight>
                            <PackageLength>${item.Length.magnitude}</PackageLength>
                            <PackageWidth>${item.Width.magnitude}</PackageWidth>
                            <PackageLengthUnit>
                                <Code>${item.Length.unitSymbol}</Code>
                            </PackageLengthUnit>
                            <SpecialInstructions>${item.Notes}</SpecialInstructions>
                            <Volume>${item.Volume.magnitude}</Volume>
                            <VolumeUnit>
                                <Code>${item.Volume.unitSymbol}</Code>
                                <Description>${item.Volume.unitSymbol}</Description>
                            </VolumeUnit>
                            <Weight>${item.Weight.magnitude}</Weight>
                            <WeightUnit>
                                <Code>${item.Weight.unitSymbol}</Code>
                                <Description>${item.Weight.unitSymbol}</Description>
                            </WeightUnit>
                        </OrderLine>`;
        });
    }

    return `<OrderLineCollection>${data}</OrderLineCollection>`;
}

async function getOrder(hyperion, transaction) {
    let order = `<UniversalShipment xmlns="http://www.cargowise.com/Schemas/Universal/2011/11" version="1.1">
    <Shipment>
        <BookingConfirmationReference>${transaction.SupplierPONumber}</BookingConfirmationReference>
        <InvoiceNumber>${transaction.SupplierInvoiceNumber}</InvoiceNumber>
        <Order>
            <OrderNumber>${transaction.Number}</OrderNumber>
            <Status>
            ${getStatus(transaction.Status)}
            </Status>
            <Currency></Currency>
            <IncoTerm></IncoTerm>
            <TransportMode></TransportMode>
            <ContainerMode></ContainerMode>
            ${await getOrderLines(hyperion, transaction)}
        </Order>
        <DateCollection>
            <OrderDate>${getDate(transaction.CustomFields.order_date)}</OrderDate>
            <PickUpDate>${getDate(transaction.CustomFields.mag_pickup_date)}</PickUpDate>
            <ArrivalDate>${getDate(transaction.CustomFields.mag_arrival_date)}</ArrivalDate>
            <DepartureDate>${getDate(transaction.CustomFields.departure_date)}</DepartureDate>
        </DateCollection>
        <OrganizationAddressCollection>
            <BuyerAddress>
                <OrganizationCode>${(transaction.Consignee) ? transaction.Consignee.AccountNumber : ''}</OrganizationCode>
            </BuyerAddress>
            <SupplierAddress>
                <OrganizationCode>${(transaction.Shipper) ? transaction.Shipper.AccountNumber : ''}</OrganizationCode>
            </SupplierAddress>
        </OrganizationAddressCollection>
    </Shipment>
</UniversalShipment>`;
    return order;
}

async function getAttachmentsFromItems(hyperion, obj) {
    let itemsList = getItemsList(obj);
    if (!itemsList) {
        return [];
    }

    let items = await hyperion.algorithm.collect(hyperion.dbx.using(itemsList)).where(i => true);
    let result = [];
    for (const item of items) {
        let attachments = await getAttachmentsFromObject(hyperion, item);
        result = result.concat(attachments);
    }

    return result;
}

async function getAttachmentsFromObject(hyperion, obj) {
    if (!obj.Attachments) {
        return [];
    }

    return await hyperion.algorithm.collect(hyperion.dbx.using(obj.Attachments)).where(i => true);
}

async function getAttachments(hyperion, dataFolder, desiredClassType, startDate, endDate) {
    const logListByTime = hyperion.dbx.Log.ListByTime;
    let results = new Map();

    if (!startDate) {
        startDate = new Date(2021, 0, 1);
    }
    if (!endDate) {
        endDate = new Date();
    }

    // iterate thru all the elements in the log, starting from the desired date
    await hyperion.algorithm.forEach(hyperion.dbx.using(logListByTime).from(startDate).to(endDate))
        .callback(record => {
            if (!record.Object) { // no object recorded in the log
                return;
            }

            if (record.Object.DbClassType !== desiredClassType) { // not the type we're looking for
                return;
            }

            if (record.EntryType !== hyperion.dbx.Log.EntryType.Creation && record.EntryType !== hyperion.dbx.Log.EntryType.Edition) {
                return;
            }

            if (results.has(record.Object.GUID)) { // already collected object
                return;
            }

            // store the data we need
            results.set(record.Object.GUID, {
                guid: record.Object.GUID,
                createdOn: new Date(record.Object.CreatedOn),
                Object: record.Object
            });
        });

    for (const entry of results.entries()) {
        const currentTransaction = entry[1].Object;
        const transactionData = await getOrder(hyperion, currentTransaction);
        const transactionNumber = `WHR_${currentTransaction.Number.toUpperCase()}`;
        let dataPath = path.join(dataFolder, `${transactionNumber}.xml`);
        await fsWriteFile(dataPath, transactionData);

        let attachments = await getAttachmentsFromObject(hyperion, currentTransaction);
        let itemsAttachments = await getAttachmentsFromItems(hyperion, currentTransaction);
        attachments = attachments.concat(itemsAttachments);

        if (!attachments || attachments.length === 0) {
            continue;
        }

        const attachmentsFolder = path.join(dataFolder, transactionNumber);
        if (!fs.existsSync(attachmentsFolder)) {
            await fsMkDir(attachmentsFolder);
        }
        for (const attatchment of attachments) {
            try {
                await downloadAttachment(hyperion, attatchment, attachmentsFolder);
            } catch (error) {
                console.log(error);
            }
        }
    }
    console.log('ended');
}

module.exports = (dependencies) => {
    const _hyperion = dependencies.hyperion;
    const _dataFolder = dependencies.dataFolder;

    return {
        getWarehouseReceiptsAttachments: async () => {
            const desiredClassType = _hyperion.dbx.Common.DbClassType.WarehouseReceipt;
            const folder = path.join(_dataFolder, 'attachments');
            if (!fs.existsSync(folder)) {
                await fsMkDir(folder);
            }
            await getAttachments(_hyperion, folder, desiredClassType);
        }
    };
};
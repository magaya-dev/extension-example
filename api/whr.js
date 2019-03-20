const fs = require('fs');
const path = require('path');

function transformWhr(whr) {
    if (!whr)
        return {};

    return {
        GUID : whr.GUID,
        Number : whr.Number
    };
}


module.exports = {
    getWhrItemCount : async (whrGuid, dbx, algorithm) => {
        const list = dbx.Warehousing.WarehouseReceipt.ListByGuid;

        // find the desired item asynchronously
        const found = await algorithm.find(dbx.using(list))
            .where(function (whr) {
                return whr.GUID === whrGuid;
            });

        // once the search is complete, return the proper result
        if (!found)
            return 0;

        return found.Items.Count;
    },

    findWhr : async function(whrGuid, dbx, algorithm) {
        const list = dbx.Warehousing.WarehouseReceipt.ListByGuid;

        // find the desired item asynchronously
        const found = await algorithm.find(dbx.using(list))
            .where(function (whr) {
                return whr.GUID === whrGuid;
            });

        return found;
    },

    getWhr : async function(whrGuid, dbx, algorithm) {
        let whr = await this.findWhr(whrGuid, dbx, algorithm);

        // once the search is complete, return the proper result
        return transformWhr(whr);
    },

    getWhrAttachments : async function(whrGuid, dbx, algorithm) {
        let whr = await this.findWhr(whrGuid, dbx, algorithm);

        // once the search is complete, return the proper result
        let result = transformWhr(whr);
        let attachments = [];
        // if there are attachments, iterate thru all of them
        if (whr.Attachments) {
            await algorithm.forEach(dbx.using(whr.Attachments)).callback(att => {
                attachments.push({
                    id : att.id,
                    name : att.Name,
                    extension : att.Extension,
                    isImage : (att.IsOtherDocument === 0)
                });
            });
        }
        result.Attachments = attachments;

        return result;
    },

    saveWhrAttachment : async function(whrGuid, request, file) {
        if (!file)
            return { success : false, error : 'Invalid file'};

        let filename = file.path;
        if (!fs.existsSync(filename))
            return { success : false, error : 'Invalid file'};

        let newFilename = path.join(file.destination, file.originalname);
        fs.renameSync(filename, newFilename);

        const dbx = request.dbx;                // hyperion namespaces
        const algorithm = request.algorithm;    // hyperion algorithms
        const dbw = request.dbw;                // hyperion write access

        const whrList = dbx.Warehousing.WarehouseReceipt.ListByGuid;

        const whr = await algorithm.find(dbx.using(whrList).from(whrGuid)).where(i => {
            return true;
        });

        if (!whr) {
            // remove file
            await fs.unlink(newFilename);
            
            return { success : false, error : 'Warehouse Receipt does not exist'};
        }

        try {
            let edited = dbx.edit(whr);

            let att = new request.dbx.DbClass.Attachment(newFilename);
            dbx.insert(edited.Attachments, att);

            await dbw.save(edited);

            // remove file
            await fs.unlink(newFilename);
        }
        catch (ex) {
            // remove file
            await fs.unlink(newFilename);

            return { success : false, error : 'Unexpected error'};
        }

        return { success : true };
    },

    getWhrAttachment: async function(whrGuid, attachmentId, dbx, algorithm, response) {
        const startTime = new Date();
        let whr = await this.findWhr(whrGuid, dbx, algorithm);
        if (!whr.Attachments) {
            response.end();
            return;
        }

        // find the correct attachment by ID
        let attachment = await algorithm.find(dbx.using(whr.Attachments)).where(current => {
            return current.id === attachmentId;
        });

        if (!attachment){
            response.end();
            return;
        }

        // send the time it took to retrieve the attachment
        const endTime = new Date();
        response.setHeader('X-Response-Time', endTime.getTime()-startTime.getTime());
        // stream the attachment content back to the caller
        algorithm.streamAttachmentContent(attachment, response).then(_ => response.end());
    },

    saveCustomFields : async function(whrGuid, data, dbx, dbw, algorithm) {
        // find the Warehouse Receipt by GUID
        let whr = await this.findWhr(whrGuid, dbx, algorithm);

        if (!whr) {
            return {
                error : 'Could not find the WHR',
                success : false
            };
        }

        // mark the Warehouse Receipt for edition
        let editWhr = await dbw.edit(whr);
        // set the value of the Custom Field
        editWhr.CustomFields['test_from_api'] = data.customField;

        try {
            // save the modified Warehouse Receipt to the database
            await dbw.save(editWhr);

            // if everything went OK, then return success
            return {
                success: true
            };
        }
        catch (error) {
            // if an unexpected error ocurred, return failure
            return {
                error,
                success : false
            };
        }
    }
};
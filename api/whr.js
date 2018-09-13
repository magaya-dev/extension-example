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

    saveCustomFields : async function(whrGuid, data, dbx, algorithm) {
        // find the Warehouse Receipt by GUID
        let whr = await this.findWhr(whrGuid, dbx, algorithm);

        if (!whr) {
            return {
                error : 'Could not find the WHR',
                success : false
            };
        }

        // mark the Warehouse Receipt for edition
        let editWhr = await dbx.edit(whr);
        // set the value of the Custom Field
        editWhr.CustomFields['test_from_api'] = data.customField;

        // save the modified Warehouse Receipt to the database
        await dbx.save(editWhr);

        return {
            success: true
        };
    }
};
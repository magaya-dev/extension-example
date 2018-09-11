
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
    }
};
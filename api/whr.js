
module.exports = {
    getWhrItemCount : async (number, dbx, algorithm) => {
        const list = dbx.Warehousing.WarehouseReceipt.ListByNumber;

        // find the desired item asynchronously
        const found = await algorithm.find(dbx.using(list))
            .where(function (whr) {
                return whr.Number === number;
            });

        // once the search is complete, return the proper result
        if (!found)
            return 0;

        return found.Items.Count;
    }
};
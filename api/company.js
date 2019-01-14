
module.exports = {
    getCompanyInfo : async function(dbx) {
        return {
            name : dbx.Company.Name,
            networkId : dbx.Company.NetworkID
        };
    }
}
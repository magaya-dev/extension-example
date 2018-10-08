function getDate(value) {
    if (!value) // if no value is specified, get today's date
        return new Date();

    return new Date(value);
}

module.exports = {
    getList : async (dbx, algorithm, startDate, endDate) => {
        const list = dbx.Accounting.Invoice.ListByTime;

        let start = getDate(startDate);
        let end = getDate(endDate);

        try {
            const invoices = await algorithm.transform(dbx.using(list).from(start).to(end)).callback(invoice => {
                return {
                    number : invoice.Number,
                    type : invoice.DbClassType === 6 ? 'Invoice' : 'CreditMemo',
                    to : invoice.EntityName,
                    amount : invoice.TotalAmount.toString()
                }
            });
            return invoices;
        }
        catch (error) {
            return [];
        }
    }
};
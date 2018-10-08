function displayNoRecords() {
    let table = document.getElementById('table-body');
    table.innerHTML = '<tr><td colspan="4">No records to show, selected dates and filter the list.</td></tr>';
}

function getQueryString() {
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;

    let result = 'invoices';
    if (startDate) {
        result += `?startDate=${startDate}`;
    }

    if (endDate) {
        if (result === 'invoices')
            result += '?';
        else
            result += '&';

        result += `endDate=${endDate}`;
    }

    return result;
}

function displayInvoices(list) {
    if (!list || list.length === 0) {
        displayNoRecords();
        return;
    }

    let table = document.getElementById('table-body');
    table.innerHTML = '';
    list.forEach(element => {
        let tr = document.createElement('tr');
        tr.innerHTML = `<th scope="row">${element.number}</th><td>${element.type}</td><td>${element.to}</td><td>${element.amount}</td>`;

        table.appendChild(tr);
    });
}

function filter(){
    addLoading('loader-container');

    fetch(getQueryString()).then(response => {
        return response.json();
    }).then(result => {
        removeLoading();
        displayInvoices(result);
    }).catch(error => {
        removeLoading();
        console.log(error);
    });
}

displayNoRecords();
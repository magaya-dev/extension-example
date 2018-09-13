
let saveButton = document.getElementById('save-btn');
let cfForm = document.getElementById('cf-form');
let cfInput = document.getElementById('cf-input');

function displayWhrData(whr) {
    let dataSection = document.getElementById('data-container');

    let element = createDiv();
    element.innerHTML = `WHR Number: ${whr.Number}`;

    dataSection.appendChild(element);
}

function displayErrorMessage(message) {
    let dataSection = document.getElementById('info-container');
    let element = createDiv();
    element.innerHTML = `Error: ${message}`;
    dataSection.appendChild(element);
}

function submitValues(e) {
    e.preventDefault();

    let cfValue = cfInput.value;
    if (!cfValue) {
        cfInput.focus();
        return;
    }

    saveButton.disabled = true;
    fetch(`whr/${guid}/customfields`, {
        method: 'POST',
        body: JSON.stringify({
            customField : cfValue
        }),
        headers:{
            'Content-Type': 'application/json'
        }
    }).then(response => {
        return response.json();
    }).then(saveResult => {
        saveButton.disabled = false;
        if (!saveResult.success) {
            displayErrorMessage(saveResult.error);
            return;
        }
    
        alert('Custom Field saved successfully!');
        cfInput.value = '';
        cfInput.focus();
    })
    .catch(result => {
        saveButton.disabled = false;
        console.log(result);
    });
}

function loadWhrData() {
    addLoading('info-container');
    
    fetch(`whr/${guid}`).then(response => {
        return response.json();
    }).then(result => {
        removeLoading();
        displayWhrData(result);
    }).catch(error => {
        removeLoading();
        console.log(error);
    });
}

const guid = getUrlParameter('whr');
loadWhrData();

cfForm.onsubmit = submitValues;
cfInput.focus();
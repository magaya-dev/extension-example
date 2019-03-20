let attachmentform = document.getElementById('attachment-form');
let submitButton = document.getElementById('btn-submit');
const guid = getUrlParameter('whr');

function displaySuccess() {
    alert('Attachment successfully saved');
    let attFile = document.getElementById('attachment');
    attFile.value = '';
}

function displayError(error) {
    alert(error);
}

attachmentform.onsubmit = function(e) {
    e.preventDefault();

    let attFile = document.getElementById('attachment');
    if (attFile.files.length == 0) {
        displayError('No file has been selected');
        return;
    }
    
    var formData = new FormData();
    formData.append('attachment', attFile.files[0]);

    const options = {
        method: 'POST',
        body: formData
      };
        
    submitButton.disabled = true;
    fetch(`whr/${guid}/attachments`, options).then(response => response.json())
    .then(response => {
        submitButton.disabled = false;
        if (response && response.success)
            displaySuccess();
        else {
            displayError(response.error);
        }
        console.log(response);
    }).catch(error => {
        submitButton.disabled = false;
        displayError(error);
    });
}

function displayWhrData(whr) {
    let dataSection = document.getElementById('data-container');

    let element = createDiv();
    element.innerHTML = `WHR Number: ${whr.Number}`;
    dataSection.appendChild(element);
}

function loadWhrData() {
    addLoading('info-container');
    
    fetch(`whr/${guid}/attachments`).then(response => {
        return response.json();
    }).then(result => {
        removeLoading();
        displayWhrData(result);
    }).catch(error => {
        removeLoading();
        console.log(error);
    });
}

loadWhrData();
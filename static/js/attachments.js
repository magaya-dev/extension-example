function displayAttachments(dataSection, whr) {
    if (whr.Attachments.length === 0) {
        let attElement = createDiv();
        attElement.innerHTML = `There are no attachments`;
        dataSection.appendChild(attElement);
        return;
    }
    
    for (let attachment of whr.Attachments) {
        let attachmentLink = `whr/${guid}/attachment/${attachment.id}`;
        if (attachment.isImage) {
            let img = document.createElement('img');
            img.src = attachmentLink;
            img.classList.add('d-block');
            img.classList.add('mx-auto');

            dataSection.appendChild(img);
        }
        else {
            let p = document.createElement('p');
            p.innerHTML = `<a href="${attachmentLink}">${attachment.name}</a>`;
            dataSection.appendChild(p);
        }
        console.log(attachment);
    }
}

function displayWhrData(whr) {
    let dataSection = document.getElementById('data-container');

    let element = createDiv();
    element.innerHTML = `WHR Number: ${whr.Number}`;
    dataSection.appendChild(element);

    displayAttachments(dataSection, whr);
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

const guid = getUrlParameter('whr');
loadWhrData();
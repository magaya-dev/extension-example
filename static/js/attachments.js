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

const btnPdf = document.getElementById('btn-pdf');
btnPdf.onclick = function() {
    btnPdf.style.visibility = 'hidden';

    let pdf = new jsPDF('p', 'pt', 'letter');

    // source can be HTML-formatted string, or a reference
    // to an actual DOM element from which the text will be scraped.
    let source = document.getElementById('main');

    // we support special element handlers. Register them with jQuery-style
    // ID selector for either ID or node name. ("#iAmID", "div", "span" etc.)
    // There is no support for any other type of selectors
    // (class, of compound) at this time.
    let specialElementHandlers = {
        // element with id of "bypass" - jQuery style selector
        '#bypassme': function(element, renderer)
        {
            // true = "handled elsewhere, bypass text extraction"
            return true;
        }
    };

    let margins = {
        top: 80,
        bottom: 60,
        left: 40,
        width: 522
    };
    // all coords and widths are in jsPDF instance's declared units
    // 'inches' in this case
    pdf.fromHTML
    (
        source, // HTML string or DOM elem ref.
        margins.left, // x coord
        margins.top, // y coord
        {
            'width': margins.width, // max width of content on PDF
            'elementHandlers': specialElementHandlers
        },
        function (dispose) 
        {
            // dispose: object with X, Y of the last line add to the PDF
            // this allow the insertion of new lines after html
            pdf.save('Mypdf.pdf');
            btnPdf.style.visibility = 'visible';
        }, margins
    )
}
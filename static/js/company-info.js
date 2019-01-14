function getCompanyLogo(networkId) {
    if (!networkId)
        return;

    // get the latest logo for that networkId
    fetch(`https://docs.magaya.net/api/logos/url/${networkId}`).then(response => {
        return response.json();
    }).then(url => {
        if (!url) // if there is no logo, exit
            return;

        // display the logo in a img element
        let logoElem = document.getElementById("company-logo");
        logoElem.src = url;

        // display the img container if it was hidden
        let logoHolder = document.getElementById("logo-holder");
        logoHolder.classList.remove("d-none");
    });
}

function loadCompanyInfo() {
    fetch('./company-info/').then(response => {
        return response.json();
    }).then(json => {
        removeLoadingById("configLoader");

        let nameElem = document.getElementById("company-name");
        nameElem.innerHTML = `<strong>Name:</strong> ${json.name}`;

        let contentElem = document.getElementById("info-holder");
        contentElem.classList.remove("d-none");

        getCompanyLogo(json.networkId);
    });
}
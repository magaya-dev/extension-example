function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    var results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
};

function createDiv() {
    let element = document.createElement('div');
    element.classList.add('align-self-center');

    return element;
}

function addLoading(sectionId) {
    let mainSection = document.getElementById(sectionId);
    let element = createDiv();
    element.id = 'loading-img';
    element.classList.add('text-center');
    element.classList.add('mt-5');

    let loading = document.createElement('img');
    loading.src = './images/loading.gif';

    element.appendChild(loading);
    mainSection.appendChild(element);
}

function removeLoadingById(id) {
    let loading = document.getElementById(id);
    loading.remove();
}

function removeLoading() {
    removeLoadingById('loading-img');
}
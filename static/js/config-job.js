function stopProcess() {
    fetch('./stop-process/').then(response => {
        return response.json();
    }).then(result => {
        if (result.success) {
            alert('Background process stopped.');
        }
        else {
            alert('Something went wrong!');
        }
    });
}

function saveConfig() {
    var repeatElem = document.getElementById("repeat");
    var frequencyElem = document.getElementById("frequency");
    var json = {
        "repeat" : repeatElem.value,
        "frequency" : frequencyElem.value
    };

    fetch('./config-process/', {
        method: 'POST',
        headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
        },
        body: JSON.stringify(json)
    }).then(() => {
        alert('Configuration saved');
    });
}

function loadConfig() {
    fetch('./config-process/').then(response => {
        return response.json();
    }).then(json => {
        var repeatElem = document.getElementById("repeat");
        repeatElem.value = json.repeat;

        var frequencyElem = document.getElementById("frequency");
        frequencyElem.value = json.frequency;

        removeLoadingById("configLoader");

        var contentElem = document.getElementById("config-form");
        contentElem.classList.remove("d-none");
    });
}
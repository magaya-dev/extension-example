const path = require('path');
const fs = require('fs');
const util = require('util');

const fsReadFile = util.promisify(fs.readFile);

async function getScheduleConfig() {
    const filename = path.join(__dirname, '../config.json');
    if (!fs.existsSync(filename)) {
        return {
            repeat : 1,
            frequency : 'minutes'
        };
    }

    const content = await fsReadFile(filename, 'utf8');
    return JSON.parse(content);
}

module.exports = {
    getConfig : async function () {
        return await getScheduleConfig();
    }
}
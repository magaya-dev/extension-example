// helper package for parsing command arguments
const { program } = require('commander');
const packageJson = require('./package.json');
// require the config helper
const fsHelper = require('@magaya/extension-fs-helper');
// require the hyperion middleware
const hyperionMiddleware = require('@magaya/hyperion-express-middleware');
// create the hyperion middleware for express.js, pass the required arguments to connect to the database
// the second parameter contains the unique identifier of the extension connecting to the database
// it can also mean including specialized APIs like the one for LiveTrack Mobile (magaya-ltm)
const apiKey = '<YOUR-API-KEY-HERE>';
const middleware = hyperionMiddleware.middleware(process.argv, {
    'clientId' : 'magaya-example',
    'apiKey' : apiKey
});
// require the express framework and create an instance of it
const express = require('express');
const app = express();
// helper for paths
const path = require('path');
// helper for filesystem
const fs = require('fs');
// require our setup helper functions
const setup = require(path.join(__dirname, 'api/setup'));
// require our Warehouse Receipts API
const whr = require(path.join(__dirname, 'api/whr'));
// require our Invoices API
const invoice = require(path.join(__dirname, 'api/invoice'));
// require our Company API
const company = require(path.join(__dirname, 'api/company'));
// require our Configuration API
const configJob = require(path.join(__dirname, 'api/config-job'));
// require our FTP API
const ftp = require(path.join(__dirname, 'api/ftp'));
// requite helper package to deal with files sent from the client
const multer  = require('multer');
const uploadsFolder = path.join(__dirname, 'uploads');
const upload = multer({ dest: uploadsFolder });

program.version(packageJson.version)
    .option('-p, --port <n>', 'running port', parseInt)
    .option('-r, --root <value>', 'startup root for api')
    .option('-s, --service-name <value>', 'name for service')
    .option('-g, --gateway', 'dictates if we should be through gateway')
    .option('-i, --network-id <n>', 'magaya network id', parseInt)
    .option('-c, --connection-string <cs>', 'connection endpoint for database')
    .option('--no-daemon', 'pm2 no daemon option')
    .parse(process.argv);

const options = program.opts();
if (!options.port) {
    console.log('Must submit port on which to listen...');
    process.exit(1);
} else if (!options.root) {
    console.log('Must submit root...');
    process.exit(1);
}

// retrieve the config folder for this instance of the extension
const configFolder = fsHelper.GetExtensionDataFolder({
    "company": "magaya",
    "name": "example"
}, options.networkId);

const configFile = path.join(configFolder, 'config.json');
// save a configuration file in the proper folder
const configJson = {
    "value" : 123
};
// write the configuration to the filesystem
fs.writeFileSync(configFile, JSON.stringify(configJson), 'utf8');

const spawn = require('child_process').spawn;
const childProcess = spawn('node', ['./api/job.js'].concat(process.argv));

childProcess.on('exit', function(){
  console.log('Background process exited.');
});
// get notified when the background process outputs something
childProcess.stdout.on('data', function (data) {
  console.log('stdout: ' + data);
});
// get notified when there is an error in the background process
childProcess.stderr.on('data', function (data) {
  console.log('stderr: ' + data);
});

// create an instance of hyperion (no middleware) with the same connection to the database
const hyperion = hyperionMiddleware.hyperion(process.argv,'magaya-example');
const { getWarehouseReceiptsAttachments } = require('./api/long-job')({hyperion, dataFolder: configFolder});
getWarehouseReceiptsAttachments();

// setup the extension with required data, notice this occurs at the application startup, not thru a web request
setup.createCustomFieldDefinitions(hyperion);

// apply the middleware in the application
app.use(middleware);
// apply other helper middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// serve the static content under the root path
app.use(`${options.root}/`, express.static(path.join(__dirname, 'static')));

// define a route that can be consumed from a web browser
app.get(`${options.root}/test`, async (request, response) => {
    const dbx = request.dbx;                // hyperion namespaces
    const algorithm = request.algorithm;    // hyperion algorithms
    const api = request.api;                // api functions

    response.send('Success!!');
});

app.get(`${options.root}/whr/:guid`, async (request, response) => {
    const result = await whr.getWhr(request.params.guid, request.dbx, request.algorithm);
    // send the response to the browser
    response.json(result);
});

app.post(`${options.root}/whr/:guid/customfields`, upload.none(), async (request, response) => {
    const result = await whr.saveCustomFields(request.params.guid, request.body, request.dbx, request.dbw, request.algorithm);
    // send the response to the browser
    response.json(result);
});

app.get(`${options.root}/whr/:guid/items`, async (request, response) => {
    // invoke an asynchronous method and wait for it's return value
    const count = await whr.getWhrItemCount(request.params.guid, request.dbx, request.algorithm);
    // send the response to the browser
    response.json({
        whrs : count
    });
});

app.get(`${options.root}/whr/:guid/attachments`, async (request, response) => {
    const result = await whr.getWhrAttachments(request.params.guid, request.dbx, request.algorithm);
    // send the response to the browser
    response.json(result);
});

app.post(`${options.root}/whr/:guid/attachments`, upload.single('attachment'), async (request, response) => {
    const result = await whr.saveWhrAttachment(request.params.guid, request, request.file);
    // send the response to the browser
    response.json(result);
});

app.get(`${options.root}/whr/:guid/attachment/:id`, async (request, response) => {
    whr.getWhrAttachment(request.params.guid, parseInt(request.params.id), request.dbx, request.algorithm, response);
});

app.get(`${options.root}/invoices`, async (request, response) => {
    const results = await invoice.getList(request.dbx, request.algorithm, request.query.startDate, request.query.endDate);
    response.json(results);
});

app.get(`${options.root}/company-info`, async (request, response) => {
    response.json(await company.getCompanyInfo(request.dbx));
});

// get the current background job configuration
app.get(`${options.root}/config-process`, async (request, response) => {
    const config = await configJob.getConfig();
    response.json(config);
});

// save the background job configuration
app.post(`${options.root}/config-process`, upload.none(), function (request, response) {
    const configPath = path.join(__dirname, 'config.json');

    configJob.saveConfig(configPath, request.body);
    response.json({result: 'OK'});
});

// create an endpoint to stop the background process
app.get(`${options.root}/stop-process`, async function (request, response) {
    childProcess.kill();
    response.json({success: true});
});

// test FTP connection
app.get(`${options.root}/test-ftp`, async function (request, response) {
    ftp.testConnection(response);
});

// start your application in the port specified
app.listen(options.port, () => {
    console.log(`Server started on port ${options.port}...`);
});
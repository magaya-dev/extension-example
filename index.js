// helper package for parsing command arguments
const program = require('commander');
const packageJson = require('./package.json');
// require the hyperion middleware
const hyperionMiddleware = require('@magaya/hyperion-express-middleware');
// create the hyperion middleware for express.js, pass the required arguments to connect to the database
// the second parameter is optional, if you specify it it will include specialized APIs like the one for LiveTrack Mobile (ltm)
const middleware = hyperionMiddleware.middleware(process.argv,'');
// require the express framework and create an instance of it
const express = require('express');
const app = express();
// helper for paths
const path = require('path');
// helper package to get the body of requests
const bodyParser = require("body-parser");
// require our setup helper functions
const setup = require(path.join(__dirname, 'api/setup'));
// require our Warehouse Receipts API
const whr = require(path.join(__dirname, 'api/whr'));
// require our Configuration API
const configJob = require(path.join(__dirname, 'api/config-job'));
// require our FTP API
const ftp = require(path.join(__dirname, 'api/ftp'));

program.version(packageJson.version)
    .option('-p, --port <n>', 'running port', parseInt)
    .option('-r, --root <value>', 'startup root for api')
    .option('-s, --service-name <value>', 'name for service')
    .option('-g, --gateway', 'dictates if we should be through gateway')
    .option('-i, --network-id <n>', 'magaya network id', parseInt)
    .option('--connection-string <value>', 'connection endpoint for database')
    .parse(process.argv);

if (!program.port) {
    console.log('Must submit port on which to listen...');
    process.exit(1);
} else if (!program.root) {
    console.log('Must submit root...');
    process.exit(1);
}

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
const hyperion = hyperionMiddleware.hyperion(process.argv,'');

// setup the extension with required data, notice this occurs at the application startup, not thru a web request
setup.createCustomFieldDefinitions(hyperion);

// apply the middleware in the application
app.use(middleware);
// applye other hepler middlewares
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// serve the static content under the root path
app.use(`${program.root}/`, express.static(path.join(__dirname, 'static')));

// define a route that can be consumed from a web browser
app.get(`${program.root}/test`, (request, response) => {
    const dbx = request.dbx;                // hyperion namespaces
    const algorithm = request.algorithm;    // hyperion algorithms
    const api = request.api;                // api functions
 
    response.send('Success!!');
});

app.get(`${program.root}/whr/:guid`, async (request, response) => {
    const result = await whr.getWhr(request.params.guid, request.dbx, request.algorithm);
    // send the response to the browser
    response.json(result);
});

app.post(`${program.root}/whr/:guid/customfields`, async (request, response) => {
    const result = await whr.saveCustomFields(request.params.guid, request.body, request.dbx, request.dbw, request.algorithm);
    // send the response to the browser
    response.json(result);
});

app.get(`${program.root}/whr/:guid/items`, async (request, response) => {
    // invoke an asynchronous method and wait for it's return value
    const count = await whr.getWhrItemCount(request.params.guid, request.dbx, request.algorithm);
    // send the response to the browser
    response.json({
        whrs : count
    });
});

// get the current background job configuration
app.get(`${program.root}/config-process`, async (request, response) => {
    const config = await configJob.getConfig();
    response.json(config);
});

// create an endpoint to stop the background process
app.get(`${program.root}/stop-process`, async function (request, response) {
    childProcess.kill();
    response.json({success: true});
});

// test FTP connection
app.get(`${program.root}/test-ftp`, async function (request, response) {
    ftp.testConnection(response);
});

// start your application in the port specified
app.listen(program.port, () => {
    console.log(`Server started on port ${program.port}...`);
});
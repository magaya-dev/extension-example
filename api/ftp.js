const FtpClient = require('ftp');

const HOST = 'ftp.test.com';
const PORT = 21;
const USER = 'user@test.com';
const PASS = '123456';

module.exports = {
    testConnection : async function (response) {
        try {
            const client = new FtpClient();
            client.on('ready', function() {
                console.log('connection ready');
    
                client.list(function(err, list) {
                    if (err) throw err;
                    
                    // close connection to the FTP
                    client.end();
                    // return the list of items in the root folder
                    response.json(list);
                  });
                
            });
    
            client.on('connect', function() {
                console.log('connected to FTP');
            });
            
            // if connecting to a secure FTP, specify the secure options
            client.connect({
                host: HOST,
                user: USER,
                password: PASS,
                port: PORT,
                secure : true,
                secureOptions: { rejectUnauthorized: false }
            });
        }
        catch (error) {
            response.json(error);
        }
    }
}
import Server from 'bare-server-node';
import https from 'https';
import nodeStatic from 'node-static';
import dotenv from 'dotenv';
dotenv.config();
const bare = new Server('/bare/', '');
import * as fs from 'fs';

const serve = new nodeStatic.Server('static/');
const fakeServe = new nodeStatic.Server('BlacklistServe/');

const server = https.createServer();

function setup(domains) {
        for (const domain of domains)
                server.addContext(domain, {
                        key: fs.readFileSync(`/etc/letsencrypt/live/${domain}/privkey.pem`, 'utf8'),
                        cert: fs.readFileSync(`/etc/letsencrypt/live/${domain}/cert.pem`, 'utf8')
                });
}

const domains = ['development.lucidofficial.xyz'];

setup(domains);

server.on('request', (request, response) => {

  var BlacklistedIPs = process.env.BlacklistedIPs || "18.237.145.219,34.213.241.18,54.184.142.71,34.219.54.89,52.13.31.12,52.89.157.185,34.208.60.206,3.80.101.141,54.90.242.158,54.172.185.65,3.83.250.144,18.209.180.25,54.167.181.168,54.166.136.197, 52.207.207.52,54.252.242.153,3.104.121.59,34.253.198.121,63.33.56.11,34.250.114.219,54.171.251.199";
    let blacklist = BlacklistedIPs.split(",");
    var getClientIp = function (req) {
        var ipAddress = request.headers['x-forwarded-for'] || request.connection.remoteAddress;
        if (!ipAddress) {
            return '';
        }

        if (ipAddress.substr(0, 7) == "::ffff:") {
            ipAddress = ipAddress.substr(7)
        } return ipAddress;
    };

    // if the users ip is blacklisted, then we will serve the blacklisted dir

    var ipAddress = getClientIp(request);
    if (blacklist.includes(ipAddress)) {
        console.log(`[-] ${ipAddress} Tried entering main site but is blacklisted`);
        fakeServe.serve(request, response);
    }
    else {
        if (bare.route_request(request, response))
            return true;

        serve.serve(request, response);
    }
});

server.on('upgrade', (req, socket, head) => {
    if (bare.route_upgrade(req, socket, head))
        return;
    socket.end();
});


server.listen(process.env.PORT || 8080);

const http = require('http');
const fs = require('fs');
const opn = require('opn');

// hosts in C:\Windows\System32\drivers\etc
// 127.0.0.1 test-company.com

const services = [
   { html: './trac.html', baseUrl: '/trac', redirectUrl: '/trac/ticket/123' },
   { html: './bugzilla.html', baseUrl: '/bugzilla', redirectUrl: '/bugzilla/show_bug.cgi?id=234' },
   { html: './index.html', baseUrl: '', redirectUrl: '/' }
]
for (const service of services) {
    service.html = fs.readFileSync(service.html, { encoding: 'utf8', flag: 'r' });
}

function onRequest(request, response) {
    
    for (const service of services) {
        if (request.url === service.redirectUrl) {
            response.writeHead(200, { 'Context-Type': 'text/html' });
            response.write(service.html);
            response.end();
            return;
        }
    }
    
    for (const service of services) {
        if (request.url.replace(/\/$/, '') === service.baseUrl) {
            response.writeHead(302, { 'Location': service.redirectUrl });
            response.end();
            return;
        }
    }
    
    response.writeHead(404);
    response.write('404');    
    response.end();
}
http.createServer(onRequest).listen(2000);

console.log('Open in browser: http://localhost:2000');
console.log('Press Ctrl+C to stop');
opn('http://localhost:2000');

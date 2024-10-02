const http = require('http');
const fs = require('fs');
const opn = require('opn');

const html = fs.readFileSync('./issue.html', { encoding: 'utf8', flag: 'r' });

function onRequest(request, response) {
    if (request.url === '/favicon.ico') {
        response.writeHead(404);
    } else if (request.url === '/issue/123') {
        response.writeHead(200, {"Context-Type": "text/html"});
        response.write(html);
    } else {
        response.writeHead(302, { 'Location': '/issue/123' });
    }
    response.end();
}
http.createServer(onRequest).listen(2000);

console.log('Open in browser: http://localhost:2000');
console.log('Press Ctrl+C to stop');
opn('http://localhost:2000');

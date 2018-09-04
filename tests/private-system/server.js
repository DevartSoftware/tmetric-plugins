const express = require('express');
const opn = require('opn');

let app = express();

app.get('/', function (req, res) {
    res.redirect('/issue/123');
}).get('/issue/123', (req, res) => {
    res.sendFile('./issue.html', { root : __dirname});
});

app.listen(2000, function () {
    console.log('Open in browser: http://localhost:2000');
    console.log('Press Ctrl+C to stop');
    opn('http://localhost:2000');
});
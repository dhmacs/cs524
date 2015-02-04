/**
 * @author Massimo De Marchi
 * @created 1/28/15.
 */
var express = require('express');
var app = express();
var mysql = require('mysql');
var connection = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : 'root',
    database : 'ctafeed_db',
    port : '8889'
});

app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    next();
});

app.get('/', function(req,res){
    res.send("hi");
});

app.get('/api/trips/:time', function(req,res){
    res.send(req.params.time);
});

app.get('/routes', function(req,res){
    connection.query('SELECT * from Routes', function(err, rows) {
        res.send(rows);
    });
});


app.listen(3000);
console.log('listening on port 3000');
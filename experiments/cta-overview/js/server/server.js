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

var printTime = function(date) {
    return date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();
};

app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    next();
});

app.get('/', function(req,res){
    res.send("hi");
});


app.get('/api/trips/:time', function(req,res){
    var time = req.params.time;

    var r = /([0-9][0-9]):([0-9][0-9]):([0-9][0-9])/;

    var results = time.match(r);

    var timeRequested = new Date();
    timeRequested.setHours(results[1]);
    timeRequested.setMinutes(results[2]);
    timeRequested.setSeconds(results[3]);

    var timeFrame = {
      start: new Date(timeRequested.getTime() - 60000 * 30),
        end: new Date(timeRequested.getTime() + 60000 * 60)
    };

    var query =
        'SELECT t.trip_id, s.stop_lat, s.stop_lon, st.arrival_time, st.departure_time, st.stop_sequence, t.route_id, r.route_type, r.route_color ' +
        'FROM trips as t ' +
        'INNER JOIN stop_times as st ON st.trip_id = t.trip_id ' +
        'INNER JOIN stops as s ON s.stop_id = st.stop_id ' +
        'INNER JOIN routes as r ON r.route_id = t.route_id ' +
        'WHERE st.departure_time > TIME("' + printTime(timeFrame.start) +'") and st.departure_time <= TIME("' +
        printTime(timeFrame.end) +'")  and t.end_time > TIME("' + printTime(timeRequested) +'") ' +
        'ORDER BY st.departure_time';

    var trips = {};
    console.time("query");
    connection.query(query, function(err, rows) {
        console.timeEnd("query");
        console.time("feed dictionary");
        rows.forEach(function(row) {
            var tripId = row["trip_id"];
            if(trips[tripId] === undefined) {
                trips[tripId] = {};
                trips[tripId].ns = [];
            }

            results = row["arrival_time"].match(r);
            var arrivalTime = new Date();
            arrivalTime.setHours(results[1]);
            arrivalTime.setMinutes(results[2]);
            arrivalTime.setSeconds(results[3]);

            results = row["departure_time"].match(r);
            var departureTime = new Date();
            departureTime.setHours(results[1]);
            departureTime.setMinutes(results[2]);
            departureTime.setSeconds(results[3]);

            trips[tripId].routeID = row["route_id"];
            trips[tripId].type = row["route_type"];
            trips[tripId].color = row["route_color"];
            trips[tripId].ns.push({
                lat: row["stop_lat"],
                lon: row["stop_lon"],
                arr: arrivalTime.getTime(),
                dep: departureTime.getTime()
                //seq: row["stop_sequence"]
            });
        });
        console.timeEnd("feed dictionary");

        console.time("filter");
        for(var key in trips) {
            var i = 0;
            while(
                i < trips[key].ns.length -1 &&
                trips[key].ns[i].dep < timeRequested.getTime() &&
                trips[key].ns[i +1].dep < timeRequested.getTime())
            {
                i++;
            }

            trips[key].ns.splice(0, i);
            if(trips[key].ns.length < 2) {
                delete trips[key];
            }
        }
        console.timeEnd("filter");

        res.send(trips);
    });
});

app.get('/routes', function(req,res){
    connection.query('SELECT * from Routes', function(err, rows) {
        res.send(rows);
    });
});


app.listen(3000);
console.log('listening on port 3000');
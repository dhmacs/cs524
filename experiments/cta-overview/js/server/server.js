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

var csv = require("fast-csv");
var _ = require("underscore");
var ds = require("./ds.js");

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
    //console.log(macs);
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

app.get('/api/stops/:id/:time', function(req,res){
    var graph = app.locals.ctaGraph;
    var trips = app.locals.trips;
    var routes = app.locals.routes;

    var id = req.params.id;
    var time = req.params.time;
    console.log("TIME= " + time);

    var r = /([0-9][0-9]):([0-9][0-9]):([0-9][0-9])/;
    var results = time.match(r);
    var timeRequested = ds.timeToSeconds(parseInt(results[1]), parseInt(results[2]), parseInt(results[3]));
    var interval = {
        start: timeRequested,
        duration: ds.timeToSeconds(0, 15, 0) // 15 minutes
    };

    console.time("acc");

    var availableTripsIds = getAvailableTripsIds(id, interval);
    var result = {};

    console.log(availableTripsIds);

    availableTripsIds.forEach(function(tripId) {
        result[tripId] = _.extend({}, trips[tripId]);
        console.log("\n\n--------");
        console.log(result);

        result[tripId]["stops"].forEach(function(stop) {
            var node = graph.getNodeData(stop["stopId"]);
            stop.lat = node.stopLatitude;
            stop.lon = node.stopLongitude;

            stop.transfers = [];
            var transferInterval = {
                start: ds.timeToSeconds(stop["arrivalTime"]["hh"], stop["arrivalTime"]["mm"], stop["arrivalTime"]["ss"]),
                duration: ds.timeToSeconds(0, 15, 0)
            };
            if(transferInterval.start > interval.start) {
                var availableTransfers = _.filter(getAvailableTripsIds(stop["stopId"], transferInterval), function(id) {
                    return id != tripId;
                });

                availableTransfers.forEach(function(transferId) {
                    if(result[transferId] == undefined) {
                        result[transferId] = _.extend({}, trips[transferId]);
                        result[transferId]["stops"].forEach(function(stop) {
                            var node = graph.getNodeData(stop["stopId"]);
                            stop.lat = node.stopLatitude;
                            stop.lon = node.stopLongitude;
                        });
                    }
                });
                stop.transfers = stop.transfers.concat(availableTransfers);
            }
        });
    });

    res.send(result);
});

/**
 *
 * @param nodeId
 * @param interval @{start: numberOfSeconds, duration: numberOfSeconds}
 */
var getAvailableTripsIds = function(nodeId, interval) {
    var graph = app.locals.ctaGraph;

    var ids = [];

    console.log(interval);

    var neighbors = graph.getNeighbors(nodeId);
    console.log("neighbors= " + neighbors);
    neighbors.forEach(function(neighborId) {
        _.filter(graph.getEdges(nodeId, neighborId), function(edge) {
            // Departure time from nodeId should be within the interval
            var departureTimeInSeconds = ds.timeToSeconds(edge.fromTime.hh, edge.fromTime.mm, edge.fromTime.ss);
            return departureTimeInSeconds >= interval.start && departureTimeInSeconds < (interval.start + interval.duration);
        }).forEach(function(edge) {
            console.log(edge);
            ids.push(edge.tripId);
        });
    });

    return ids;
};



app.listen(3000);
console.log('listening on port 3000');


var loadRoutes = function() {
    var routes = app.locals.routes;
    csv
        .fromPath("data/routes.csv", {headers: true})
        .on("data", function(row){
            var routeId = row["route_id"];
            if(routes[routeId] == undefined) {
                routes[routeId] = {};
            }
            routes[routeId].shortName = row["route_short_name"];
            routes[routeId].longName = row["route_long_name"];
            routes[routeId].type = parseInt(row["route_type"]);
            routes[routeId].color = row["route_color"];
            routes[routeId].textColor = row["route_text_color"];
            //console.log(app.locals.routes);
        })
        .on("end", function(){
            console.log("done");
        });
};

var loadTrips = function() {
    var trips = app.locals.trips;
    csv
        .fromPath("data/trips.csv", {headers: true})
        .on("data", function(row){

            var tripId = row["trip_id"];
            if(trips[tripId] == undefined) {
                trips[tripId] = {};
                trips[tripId].stops = [];
            }
            trips[tripId].routeId = row["route_id"];
            trips[tripId].serviceId = row["service_id"];
            trips[tripId].directionId = parseInt(row["direction_id"]);
            trips[tripId].blockId = row["block_id"];
            trips[tripId].shapeId = row["shape_id"];
            trips[tripId].direction = row["direction"];
            trips[tripId].wheelchairAccessible = parseInt(row["wheelchair_accessible"]);
        })
        .on("end", function(){
            console.log("done trips.csv");
        });
};

var loadStopTimes = function() {
    var trips = app.locals.trips;
    csv
        .fromPath("data/stop_times.csv", {headers: true, ignoreEmpty: true})
        .on("data", function(row){

            var tripId = row["trip_id"];
            if(trips[tripId] == undefined) {
                trips[tripId] = {};
                trips[tripId].stops = [];
            }
            var r = /([0-9][0-9]):([0-9][0-9]):([0-9][0-9])/;
            var arrival = row["arrival_time"].match(r);
            var departure = row["departure_time"].match(r);

            if(row["arrival_time"] == "") {
                console.log(row["arrival_time"]);
            }

            var trip = {
                arrivalTime: {hh: parseInt(arrival[1]), mm: parseInt(arrival[2]), ss: parseInt(arrival[3])},
                departureTime: {hh: parseInt(departure[1]), mm: parseInt(departure[2]), ss: parseInt(departure[3])},
                stopId: row["stop_id"],
                stopSequence: parseInt(row["stop_sequence"]),
                pickupType: parseInt(row["pickup_type"])
                //shapeDistanceTraveled: parseInt(row["shape_dist_traveled"])
            };
            var insertIndex = _.sortedIndex(trips[tripId].stops, trip, 'stopSequence');
            trips[tripId].stops.splice(insertIndex, 0, trip);
        })
        .on("end", function(){
            var graph = app.locals.ctaGraph;
            console.time("proc");
            for(var tripId in trips) {
                var trip = trips[tripId].stops;
                for(var i = 0; i < trip.length -1; i++) {
                    graph.setEdge(trip[i].stopId, trip[i +1].stopId, {
                        tripId: tripId,
                        toTime: trip[i +1].arrivalTime,
                        fromTime: trip[i].departureTime,
                        pickupType: trip[i].pickupType
                    });
                }
            }
            console.timeEnd("proc");
            console.log("done stop_times.csv");
            loadTrips();
        });
};

var loadStops = function() {
    var graph = app.locals.ctaGraph;
    csv
        .fromPath("data/stops.csv", {headers: true})
        .on("data", function(row){
            graph.addNode(row["stop_id"], {
                stopName: row["stop_name"],
                stopDescription: row["stop_desc"],
                stopLatitude: row["stop_lat"],
                stopLongitude: row["stop_lon"]
            });
        })
        .on("end", function(){
            console.log("done stops.csv");
        });
};

var loadData = function() {
    app.locals.ctaGraph = ds.Graph();
    app.locals.trips = {};
    app.locals.routes = {};
    loadStops();
    loadStopTimes();
    loadRoutes();
} ();
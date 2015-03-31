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

app.get('/api/stops/:id', function(req,res) {
    var graph = app.locals.ctaGraph;
    var id = req.params.id;
    var data = graph.getNodeData(id);
    res.send(data);
});

app.get('/api/stops/:lat/:lon/:radius', function(req,res){
    var graph = app.locals.ctaGraph;

    var lat = req.params.lat;
    var lon = req.params.lon;
    var radius = req.params.radius;

    var result = {};

    var stopIds = graph.getNodesIds();
    stopIds.forEach(function(stopId) {
        var stopData = graph.getNodeData(stopId);
        var delta = {
            lat: Math.abs(stopData.stopLatitude - lat),
            lon: Math.abs(stopData.stopLongitude - lon)
        };

        delta.x = (delta.lat * 40008000) / 360;
        delta.y = (delta.lon * 40075160 * Math.cos(lat) / 360);

        var distance = Math.sqrt(Math.pow(delta.x, 2) + Math.pow(delta.y, 2));

        //var delta = Math.sqrt(Math.pow(stopData.stopLatitude - lat, 2) + Math.pow(stopData.stopLongitude - lon, 2));
        if(distance < radius) {
            console.log(delta.lat + " " + delta.lon);
            result[stopId] = stopData;
        }
    });

    res.send(result);
});

app.get('/api/stops/:lat/:lon/:radius/:time/:seconds/:walkingspeed', function(req,res){
    var result;

    console.log("\nNEW REQUEST\n");
    var time = req.params.time;
    var timeInterval = ds.secondsToTime(req.params.seconds);

    var r = /([0-9][0-9]):([0-9][0-9]):([0-9][0-9])/;
    var results = time.match(r);
    var departureTime = {
        hh: parseInt(results[1]),
        mm: parseInt(results[2]),
        ss: parseInt(results[3])
    };

    var walkingSpeed = parseFloat(req.params.walkingspeed);

    var lat = req.params.lat;
    var lon = req.params.lon;
    var radius = req.params.radius;

    var departureOptions = {
        area: {
            center: {lat: lat, lon: lon},
            radius: radius,
            walkingSpeed: walkingSpeed
        },
        timeRange: {
            start: {
                hh: departureTime.hh,
                mm: departureTime.mm,
                ss: departureTime.ss
            },
            duration: {
                hh: timeInterval.hh,
                mm: timeInterval.mm,
                ss: timeInterval.ss
            }
        }
    };
    var transferOptions = {
        radius: 200,
        maxTransferTime: {
            hh: 0,
            mm: 10,
            ss: 0
        }
    };
    var selectionOptions = {
        maxNumberOfSameRouteAndDirectionTrips: 1
    };


    result = findFeasibleRides(departureOptions, transferOptions, selectionOptions, 2);

    res.send(result);
});

/*
 * @locationA {lat, lon}
 * @locationB {lat, lon}
 */
var distance = function(locationA, locationB) {
    var delta = {
        lat: Math.abs(locationA.lat - locationB.lat),
        lon: Math.abs(locationA.lon - locationB.lon)
    };

    delta.x = (delta.lat * 40008000) / 360;
    delta.y = (delta.lon * 40075160 * Math.cos(locationA.lat) / 360);

    return Math.sqrt(Math.pow(delta.x, 2) + Math.pow(delta.y, 2));
};

/*
 *
 * return []
 */
var findTripsIds = function(area, timeRange) {
    var graph = app.locals.ctaGraph;

    var result = [];

    // Get all stops ids
    var allStopsIds = graph.getNodesIds();

    // Filter stops outside the area of interest
    var stopsIdsInArea = allStopsIds.filter(function(stopId) {
        var stop = graph.getNodeData(stopId);
        return distance({lat: stop.stopLatitude, lon: stop.stopLongitude}, area.center) <= area.radius;
    });

    // Get available trips
    var availableTrips = stopsIdsInArea.reduce(function(previousValue, currentStopId) {
        var neighborsIds = graph.getNeighbors(currentStopId);
        var tripIds = neighborsIds.map(function(currentNeighborId) {
            // Return an Array of trip Ids for the current currentStopId-currentNeighborId pair
            return graph.getEdges(currentStopId, currentNeighborId)
                .filter(function(edge) {
                    var departure = ds.timeToSeconds(edge.fromTime.hh, edge.fromTime.mm, edge.fromTime.ss);
                    var minTime = ds.timeToSeconds(timeRange.start.hh, timeRange.start.mm, timeRange.start.ss);
                    var maxTime = minTime + ds.timeToSeconds(timeRange.duration.hh, timeRange.duration.mm, timeRange.duration.ss);

                    var stop = graph.getNodeData(currentStopId);
                    var distanceFromOrigin = distance({lat: stop.stopLatitude, lon: stop.stopLongitude}, area.center);
                    var walkTime = distanceFromOrigin / area.walkingSpeed;

                    return departure > (minTime + walkTime) && departure <= maxTime;
                }).map(function(edge) {
                    return edge.tripId;
                });
        }).reduce(function(pValue, cValue) {
            return pValue.concat(cValue);
        }, []);

        return previousValue.concat(tripIds);
    }, []);

    availableTrips.forEach(function(tripId) {
        if(result.every(function(id) {
                return id != tripId
            }))
        {
            result.push(tripId);
        }
    });

    return result;
};

var findClosestStopIndex = function (tripId, location) {
    var trips = app.locals.trips;
    var graph = app.locals.ctaGraph;

    var prevStop, currentStop;

    // Reduce to min index
    return trips[tripId].stops.reduce(function(previousValue, currentValue, index, array) {
        prevStop = graph.getNodeData(array[previousValue].stopId);
        currentStop = graph.getNodeData(array[index].stopId);

        if(distance({lat:prevStop.stopLatitude, lon:prevStop.stopLongitude}, location) >
            distance({lat:currentStop.stopLatitude, lon:currentStop.stopLongitude}, location)) {
            return index;
        } else return previousValue;
    }, 0);
};

/*
 * Recursive algorithm to find feasible rides within a maximum number of transfers
 *
 * @departureOptions {
 *      area: {
 *          center: {lat, lon},
 *          radius
 *      },
 *      timeRange: {
 *          start: {
 *              hh,
 *              mm,
 *              ss
 *          },
 *          duration: {
 *              hh,
 *              mm,
 *              ss
 *          }
 *      }
 * }
 * @transferOptions {
 *      radius,
 *      maxTransferTime: {
 *              hh,
 *              mm,
 *              ss
 *          }
 * }
 * @selectionOptions {
 *      maxNumberOfSameRouteAndDirectionTrips
 * }
 * @maxNumberOfTransfers
 */
var findFeasibleRides = function(departureOptions, transfersOptions, selectionOptions, maxNumberOfTransfers) {
    var graph = app.locals.ctaGraph;
    var trips = app.locals.trips;
    var routes = app.locals.routes;

    var result = {};

    var routesSelected = {};

    if(maxNumberOfTransfers == 0)
        return {};

    /**/
    var nearbyTripsIds = findTripsIds(departureOptions.area, departureOptions.timeRange);
    nearbyTripsIds.forEach(function(tripId) {
        var routeId = trips[tripId].routeId;
        var directionId = trips[tripId].directionId;
        if(routesSelected[routeId] == undefined) {
            routesSelected[routeId] = {};
        }
        if(routesSelected[routeId][directionId] == undefined) {
            routesSelected[routeId][directionId] = 1;
        } else if(routesSelected[routeId][directionId] <= selectionOptions.maxNumberOfSameRouteAndDirectionTrips) {
            result[tripId] = _.extend({}, trips[tripId]);   // The purpose of this instruction is to clone trips[tripId]
            result[tripId].closestStopIndex = findClosestStopIndex(tripId, departureOptions.area.center);
            result[tripId].hop = 0;
            result[tripId].type = routes[result[tripId].routeId].type;
            if(result[tripId].type == 1) {
                result[tripId].color = routes[result[tripId].routeId].color;
            }

            result[tripId].stops.forEach(function(stop, i) {
                var stopData = graph.getNodeData(stop.stopId);
                result[tripId].stops[i].lat = stopData.stopLatitude;
                result[tripId].stops[i].lon = stopData.stopLongitude;
            });

            routesSelected[routeId][directionId]++;
        }
    });

    if(maxNumberOfTransfers == 1) {
        return result;
    }

    // Find trips within departure area
    for(var tripId in result) {
        //var closestStopIndex = findClosestStopIndex(tripId, location);
        for(var i = result[tripId].closestStopIndex; i < trips[tripId].stops.length; i++) {
            var stop = graph.getNodeData(result[tripId].stops[i].stopId);
            var depOptions = {
                area: {
                    center: {
                        lat: stop.stopLatitude,
                        lon: stop.stopLongitude
                    },
                    radius: transfersOptions.radius,
                    walkingSpeed: departureOptions.area.walkingSpeed
                },
                timeRange: {
                    start: result[tripId].stops[i].arrivalTime,
                    duration: transfersOptions.maxTransferTime
                }
            };
            var transfers = findFeasibleRides(depOptions, transfersOptions, selectionOptions, maxNumberOfTransfers -1);
            result[tripId].stops[i].transfers = [];
            for(var transferId in transfers) {
                // TODO: Check route duplicates
                var routeId = trips[transferId].routeId;
                var directionId = trips[transferId].directionId;
                if(routesSelected[routeId] == undefined) {
                    routesSelected[routeId] = {};
                }
                if(routesSelected[routeId][directionId] == undefined) {
                    routesSelected[routeId][directionId] = 1;
                } else if(routesSelected[routeId][directionId] <= selectionOptions.maxNumberOfSameRouteAndDirectionTrips) {
                    transfers[transferId].hop++;
                    result[tripId].stops[i].transfers.push({
                        tripId: transferId,
                        stopIndex: transfers[transferId].closestStopIndex
                    });

                    // Add transfer to result
                    if(result[transferId] == undefined) {
                        /*if(transferId == "46081413704") {
                            console.log("A");
                        }*/
                        result[transferId] = _.extend({}, transfers[transferId]);
                    } else {
                        /*if(transferId == "46081413704") {
                            console.log("B");
                        }*/
                        result[transferId].closestStopIndex =
                            result[transferId].closestStopIndex < transfers[transferId].closestStopIndex ?
                                result[transferId].closestStopIndex : transfers[transferId].closestStopIndex;
                    }
                    routesSelected[routeId][directionId]++;
                }
            }
        }
    }

    return result;
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
                stopLatitude: parseFloat(row["stop_lat"]),
                stopLongitude: parseFloat(row["stop_lon"])
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
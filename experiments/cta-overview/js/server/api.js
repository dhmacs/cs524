/**
 * @author Massimo De Marchi
 * @created 1/28/15.
 */
var express = require('express');
var app = express();


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


app.get('/api/trips/:lat/:lon/:radius/:dayofweek/:time/:seconds/:walkingspeed', function(req,res){
    var result;

    console.log("\nNEW REQUEST\n");
    var time = req.params.time;

    var weekDays = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
    var dayOfWeek = weekDays[parseInt(req.params["dayofweek"])];
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
            },
            dayOfWeek: dayOfWeek
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

    // Remove reduntant trips
    var trips = app.locals.trips;
    var routesSelected = {};

    var tripToRemove = [];

    for(var tripId in result) {
        var routeId = trips[tripId].routeId;
        var directionId = trips[tripId].directionId;

        if(routesSelected[routeId] == undefined) {
            routesSelected[routeId] = {};
        }
        if(routesSelected[routeId][directionId] == undefined) {
            routesSelected[routeId][directionId] = [];
        }

        var sortedIndex = _.sortedIndex(routesSelected[routeId][directionId], tripId, function(id) {
            var time = trips[id].stops[0].arrivalTime;
            return ds.timeToSeconds(time.hh, time.mm, time.ss);
        });

        routesSelected[routeId][directionId].splice(sortedIndex, 0, tripId);

        if(routesSelected[routeId][directionId].length > selectionOptions.maxNumberOfSameRouteAndDirectionTrips) {
            tripToRemove.push(routesSelected[routeId][directionId].pop());
        }
    }

    tripToRemove.forEach(function(id) {
        delete result[id];
    });

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
    var calendar = app.locals.calendar;
    var trips = app.locals.trips;

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

                    /*
                    if(calendar[trips[edge.tripId]["serviceId"]][timeRange.dayOfWeek]) {
                        console.log(edge.fromTime.hh + ":" + edge.fromTime.mm + ":" + edge.fromTime.ss
                        + " / " + trips[edge.tripId]["routeId"]
                        + " = " +calendar[trips[edge.tripId]["serviceId"]][timeRange.dayOfWeek]);
                    }*/
                    return calendar[trips[edge.tripId]["serviceId"]][timeRange.dayOfWeek] && departure > (minTime + walkTime) && departure <= maxTime;
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

var findClosestStopIndex = function (tripId, departureOptions) {
    var trips = app.locals.trips;
    var graph = app.locals.ctaGraph;

    var location = departureOptions.area.center;

    var interval = departureOptions.timeRange.start;
    var time = ds.timeToSeconds(interval.hh, interval.mm, interval.ss);

    var prevStop, currentStop;

    // Reduce to min index
    var relevantStops = trips[tripId].stops
        .filter(function(stop) {
            var stopTime = ds.timeToSeconds(stop.departureTime.hh, stop.departureTime.mm, stop.departureTime.ss);
            return stopTime > time;
        });
    var startIndex = relevantStops[0].stopSequence -1;
    return relevantStops.reduce(function(previousValue, currentValue, index, array) {
        prevStop = graph.getNodeData(trips[tripId].stops[previousValue].stopId);
        currentStop = graph.getNodeData(array[index].stopId);

        if(distance({lat:prevStop.stopLatitude, lon:prevStop.stopLongitude}, location) >
            distance({lat:currentStop.stopLatitude, lon:currentStop.stopLongitude}, location)) {
            return array[index].stopSequence-1;//index;
        } else return previousValue;
    }, startIndex);
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

    if(maxNumberOfTransfers == 0)
        return {};

    /**/
    var nearbyTripsIds = findTripsIds(departureOptions.area, departureOptions.timeRange);
    nearbyTripsIds.forEach(function(tripId) {
        var closestStopIndex = findClosestStopIndex(tripId, departureOptions);

        if(closestStopIndex < (trips[tripId].stops.length -1)) {
            result[tripId] = {};// JSON.parse(JSON.stringify(trips[tripId]));//_.extendOwn({}, trips[tripId]);   // The purpose of this instruction is to clone trips[tripId]

            // Trip property
            result[tripId].routeId = JSON.parse(JSON.stringify(trips[tripId].routeId));
            result[tripId].routeLongName = JSON.parse(JSON.stringify(routes[result[tripId].routeId].longName));
            result[tripId].direction = JSON.parse(JSON.stringify(trips[tripId].direction));
            result[tripId].stops = JSON.parse(JSON.stringify(trips[tripId].stops));

            // Derived properties
            result[tripId].closestStopIndex = closestStopIndex;
            result[tripId].hop = 0;
            result[tripId].type = JSON.parse(JSON.stringify(routes[result[tripId].routeId].type));
            if(result[tripId].type == 1) {
                result[tripId].color = routes[result[tripId].routeId].color;
            }

            result[tripId].stops.forEach(function(stop, i) {
                var stopData = graph.getNodeData(stop.stopId);
                result[tripId].stops[i].lat = stopData.stopLatitude;
                result[tripId].stops[i].lon = stopData.stopLongitude;
                result[tripId].stops[i].name = stopData.stopName;
            });
        }
    });

    if(maxNumberOfTransfers == 1) {
        return result;
    }

    // Find trips within departure area
    for(var tripId in result) {
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
                    duration: transfersOptions.maxTransferTime,
                    dayOfWeek: departureOptions.timeRange.dayOfWeek
                }
            };
            var transfers = findFeasibleRides(depOptions, transfersOptions, selectionOptions, maxNumberOfTransfers -1);
            result[tripId].stops[i].transfers = [];
            // TODO: (idea) Make transfers a dictionary indexed on trip Id, each item containing stop index ?
            for(var transferId in transfers) {
                transfers[transferId].hop++;
                result[tripId].stops[i].transfers.push({
                    tripId: transferId,
                    stopIndex: transfers[transferId].closestStopIndex
                });

                // Add transfer to result
                if(result[transferId] == undefined) {
                    result[transferId] = transfers[transferId];
                } else {
                    result[transferId].closestStopIndex =
                        result[transferId].closestStopIndex < transfers[transferId].closestStopIndex ?
                            result[transferId].closestStopIndex : transfers[transferId].closestStopIndex;
                }
            }
        }
    }

    return result;
};


app.set('port', process.env.PORT || 3000);
app.listen(app.get('port'));
// app.listen(3000);
console.log('listening on port ' + app.get('port'));


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

var loadCalendar = function() {
    var calendar = app.locals.calendar;
    csv
        .fromPath(__dirname + "/data/calendar.csv", {headers: true})
        .on("data", function(row){
            var serviceId = row["service_id"];
            calendar[serviceId] = {};
            calendar[serviceId].mon = parseInt(row["monday"]);
            calendar[serviceId].tue = parseInt(row["tuesday"]);
            calendar[serviceId].wed = parseInt(row["wednesday"]);
            calendar[serviceId].thu = parseInt(row["thursday"]);
            calendar[serviceId].fri = parseInt(row["friday"]);
            calendar[serviceId].sat = parseInt(row["saturday"]);
            calendar[serviceId].sun = parseInt(row["sunday"]);
        })
        .on("end", function(){
            console.log("done calendar.csv");
        });
};

var loadData = function() {
    app.locals.ctaGraph = ds.Graph();
    app.locals.trips = {};
    app.locals.routes = {};
    app.locals.calendar = {};
    loadStops();
    loadStopTimes();
    loadRoutes();
    loadCalendar();
} ();
/**
 * @class CTAModel
 * @description
 *
 * @author Massimo De Marchi
 * @created 1/26/15.
 */
function CTAModel() {
    /*---------------- PRIVATE ATTRIBUTES ----------------*/
    var self = this;

    var _trips = {};

    /*------------------ PUBLIC METHODS ------------------*/


    /**
     *
     * @param time
     * @returns {Array}
     */
    this.getTripsId = function(time) {

        return [];
    };

    /**
     *
     * @param tripId
     * @returns {string}
     */
    this.getRouteName = function(tripId) {
        return "";
    };

    /**
     *
     * @param tripId
     * @returns {{lat: number, lng: number}}
     */
    this.getTripPosition = function(tripId) {

        return {
            lat: 0,
            lng: 0
        };
    };

    /*------------------ PRIVATE METHODS -----------------*/
    /*
    var loadRoutes = function(callback) {
        d3.csv("data/routes.csv", function(csv) {
            csv.forEach(function(entry) {

            });

            callback(null, null);
        });
    };

    var loadStopTimes = function(callback) {
        d3.csv("data/stop_times.csv", function(csv) {
            _stopTimes = csv;
            callback(null, null);
        });
    };

    var loadTrips = function(callback) {
        d3.csv("data/trips.csv", function(csv) {

            csv.forEach(function(entry) {
                var routeId = entry["route_id"];
                if(_routes[routeId] === undefined) {
                    _routes[routeId] = {};
                }

                if(_routes[routeId]["trips"] === undefined) {
                    _routes[routeId].trips = [];
                }

                _routes[routeId].trips.push({
                    tripId: entry["trip_id"]
                });
            });


            callback(null, null);
        });
    };*/

    var loadData = function() {
        // Load routes
        /*
        d3.csv("data/stop_times.csv", function(csv) {
            var timeRegexp = /([0-9][0-9]):([0-9][0-9]):([0-9][0-9])$/;
*/
            /*
            csv.forEach(function(entry) {
                var tripId = entry["trip_id"];

                if(_trips[tripId] === undefined) {
                    _trips[tripId] = [];
                }
*/
                /*
                var arrivalTimeRes = entry["arrival_time"].match(timeRegexp);
                var arrivalTime = new Date();
                arrivalTime.setHours(arrivalTimeRes[1]);
                arrivalTime.setMinutes(arrivalTimeRes[2]);
                arrivalTime.setSeconds(arrivalTimeRes[3]);
                var departureTimeRes = entry["departure_time"].match(timeRegexp);
                var departureTime = new Date();
                departureTime.setHours(departureTimeRes[1]);
                departureTime.setMinutes(departureTimeRes[2]);
                departureTime.setSeconds(departureTimeRes[3]);
                */
            /*
                _trips[tripId].push({
                    arrivalTime: entry["arrival_time"],
                    departureTime: departureTime,
                    stopId: entry["stop_id"],
                    stopSequence: entry["stop_sequence"]
                });
            });*/
        /*
            _trips = csv;

            preprocessing();
        });*/
    };

    var init = function () {
        loadData();
        /*
        queue()
            .defer(loadRoutes)
            //.defer(loadStopTimes)
            .defer(loadTrips)
            .awaitAll(function() {
                preprocessing();
            });*/
    }();




    var preprocessing = function() {
        /*
        _trips.forEach(function(trip) {
            var arrivalTime = trip["arrival_time"].split(":");
            var arrival = new Date();
            arrival.setHours(parseInt(arrivalTime[0]));
            arrival.setMinutes(parseInt(arrivalTime[1]));
            arrival.setSeconds(parseInt(arrivalTime[2]));
            trip.arrival_time = arrival;
        });*/

        console.log("preproc");
        god = _trips;
    };
}
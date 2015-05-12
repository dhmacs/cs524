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

    var _trips = null;
    var _requesting;

    var _updateTimer;
    var _updateIntervalMillis = 60000; // Update every minute

    var _maximumTransferTime = 15 * 60; // 15 minutes

    /*------------------ PUBLIC METHODS ------------------*/
    /**
     *
     */
    this.startUpdates = function() {
        self.updateData();
        _updateTimer = setInterval(self.updateData, _updateIntervalMillis);
    };

    /**
     *
     */
    this.stopUpdates = function() {
        clearInterval(_updateTimer);
    };

    /**
     *
     * @returns {*}
     */
    this.getTrips = function() {
        return _trips;
    };

    /**
     *
     * @returns {*}
     */
    this.getMaximumTransferTime = function() {
        return _maximumTransferTime;
    };

    /**
     * Returns the Public Transport System centroid
     */
    this.getCentroid = function() {
        return {
            lat: 41.875021,
            lon: -87.685250
        };
    };

    /**
     * Return trips geographical boundaries at a certain time
     * @param time
     * @returns {*}
     */
    this.getBoundaries = function(time) {
        console.log(time);
        var boundaries = null;

        if(_trips != null) {
            for(var tripId in _trips) {
                var trip = _trips[tripId];
                var lastStopIndex = Utils.cta.getLastStopIndex(time, trip["stops"]);
                if(lastStopIndex != -1) {
                    var previous = {
                        lat: trip["stops"][lastStopIndex +1]["lat"],
                        lon: trip["stops"][lastStopIndex +1]["lon"]
                    };
                    var next = {
                        lat: trip["stops"][lastStopIndex +1]["lat"],
                        lon: trip["stops"][lastStopIndex +1]["lon"]
                    };
                    var stopBoundaries = {
                        minLat: previous.lat < next.lat ? previous.lat : next.lat,
                        minLon: previous.lon < next.lon ? previous.lon : next.lon,
                        maxLat: previous.lat > next.lat ? previous.lat : next.lat,
                        maxLon: previous.lon > next.lon ? previous.lon : next.lon
                    };
                    if(boundaries == null) {
                        boundaries = stopBoundaries;
                    } else {
                        boundaries = {
                            minLat: stopBoundaries.minLat < boundaries.minLat ? stopBoundaries.minLat : boundaries.minLat,
                            minLon: stopBoundaries.minLon < boundaries.minLon ? stopBoundaries.minLon : boundaries.minLon,
                            maxLat: stopBoundaries.maxLat > boundaries.maxLat ? stopBoundaries.maxLat : boundaries.maxLat,
                            maxLon: stopBoundaries.maxLon > boundaries.maxLon ? stopBoundaries.maxLon : boundaries.maxLon
                        };
                    }
                }
            }
        }

        return boundaries;
    };

    this.updateData = function() {
        var requestLocation = __model.getWayFindingModel().getOriginLocation();
        var time = Utils.cta.secondsToHhMmSs(__model.getWayFindingModel().getDepartureTime());
        var request = "http://127.0.0.1:3000/api/trips/" + requestLocation.lat + "/" + requestLocation.lon;//41.869621/-87.648757/500/";

        // Nearby radius
        request += "/" + __model.getWayFindingModel().getNearbyMaximumRadius() + "/";
        request += __model.getWayFindingModel().getDepartureDay() + "/";

        request +=
            (time.hh < 10 ? "0" : "") + time.hh + ":" +
            (time.mm < 10 ? "0" : "") + time.mm + ":" +
            (time.ss < 10 ? "0" : "") + time.ss;

        request += "/" + __model.getWayFindingModel().getMaximumWaitingTime();
        request += "/" + __model.getWayFindingModel().getWalkingSpeed();

        console.log("REQUEST: " + request);
        console.time("RequestTime");
        d3.json(request, function(json) {
            console.timeEnd("RequestTime");
            _trips = json;
            __notificationCenter.dispatch(Notifications.CTA.TRIPS_UPDATED);
        });
    };

    /*------------------ PRIVATE METHODS -----------------*/
    var init = function () {
        _requesting = false;
    }();
}
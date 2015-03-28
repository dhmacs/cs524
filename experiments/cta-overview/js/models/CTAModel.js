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

    /*
    this.getTrips = function(time, handler) {
        if(_trips == null) {
            var request = "http://127.0.0.1:3000/api/stops/6627/";

            request +=
             (time.getHours() < 10 ? "0" : "") + time.getHours() + ":" +
             (time.getMinutes() < 10 ? "0" : "") + time.getMinutes() + ":" +
             (time.getSeconds() < 10 ? "0" : "") + time.getSeconds();

            console.log("REQUEST: " + request);
            d3.json(request, function(json) {
                _trips = json;
                handler(json);
            });
        } else {
            handler(_trips);
        }
    };*/

    this.updateData = function() {
        var requestLocation = __model.getLocationModel().getLocation();
        var time = Utils.now();
        var request = "http://127.0.0.1:3000/api/stops/" + requestLocation.lat + "/" + requestLocation.lon + "/500/";//41.869621/-87.648757/500/";


        request +=
            (time.getHours() < 10 ? "0" : "") + time.getHours() + ":" +
            (time.getMinutes() < 10 ? "0" : "") + time.getMinutes() + ":" +
            (time.getSeconds() < 10 ? "0" : "") + time.getSeconds();
        //request += "13:15:00";

        request += "/15"; // 15 minutes

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
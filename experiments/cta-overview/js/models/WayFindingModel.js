/**
 * @class WayFindingModel
 * @description
 *
 * @author Massimo De Marchi
 * @created 3/29/15.
 */
function WayFindingModel() {
    /*---------------- PRIVATE ATTRIBUTES ----------------*/
    var self = this;

    var _originLocation = {
        lat: 0,
        lon: 0
    };
    var _nearbyMaximumRadius = 400; // meters
    var _maximumWaitingTime = Utils.toSeconds(0, 15, 0);
    var _walkingSpeed = 0; // m/s
    var _lookAheadTime = Utils.toSeconds(1, 0, 0); // Seconds
    var _maximumTransferWalkingTime = Utils.toSeconds(0, 10, 0); // Seconds

    /*------------------ PUBLIC METHODS ------------------*/
    /**
     *
     * @param lat
     * @param lon
     */
    this.setOriginLocation = function(lat, lon) {
        _originLocation.lat = lat;
        _originLocation.lon = lon;
    };

    /**
     *
     * @returns {{lat: number, lon: number}}
     */
    this.getOriginLocation = function() {
        return _originLocation;
    };

    /**
     *
     * @param seconds
     */
    this.setMaximumWaitingTime = function(seconds) {
        _maximumWaitingTime = seconds;
    };

    /**
     *
     * @returns {Number}
     */
    this.getMaximumWaitingTime = function() {
        return _maximumWaitingTime;
    };

    /**
     *
     * @returns {Number}
     */
    this.getDepartureTime = function() {
        return Utils.nowToSeconds();
    };

    /**
     * Returns day of the week (sunday=0, monday=1, ...)
     * @returns {number}
     */
    this.getDepartureDay = function() {
        return 1;//(new Date()).getDay();
    };

    /**
     *
     * @param speed
     */
    this.setWalkingSpeed = function(speed) {
        _walkingSpeed = speed;
    };

    /**
     *
     * @returns {number}
     */
    this.getWalkingSpeed = function() {
        return _walkingSpeed;
    };

    /**
     *
     */
    this.setLookAheadTime = function(seconds) {
        _lookAheadTime = seconds;
    };

    /**
     *
     * @returns {*}
     */
    this.getLookAheadTime = function() {
        return _lookAheadTime;
    };

    /**
     *
     * @param meters
     */
    this.setNearbyMaximumRadius = function(meters) {
        _nearbyMaximumRadius = meters;
    };

    /**
     *
     * @returns {number}
     */
    this.getNearbyMaximumRadius = function() {
        return _nearbyMaximumRadius;
    };

    /**
     *
     * @param seconds
     */
    this.setMaximumTransferWalkingTime = function(seconds) {
        _maximumTransferWalkingTime = seconds;
    };

    /**
     *
     * @returns {*}
     */
    this.getMaximumTransferWalkingTime = function() {
        return _maximumTransferWalkingTime;
    };

    /*------------------ PRIVATE METHODS -----------------*/
    var init = function () {

    }();
}
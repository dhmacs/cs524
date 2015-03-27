/**
 * @class LocationModel
 * @description
 *
 * @author Massimo De Marchi
 * @created 3/26/15.
 */
function LocationModel() {
    /*---------------- PRIVATE ATTRIBUTES ----------------*/
    var self = this;

    var _location = {};

    /*------------------ PUBLIC METHODS ------------------*/
    /**
     *
     * @param lat
     * @param lon
     */
    this.setLocation = function(lat, lon) {
        _location.lat = lat;
        _location.lon = lon;
    };

    /**
     *
     * @returns {{}}
     */
    this.getLocation = function() {
        return _location;
    };

    /*------------------ PRIVATE METHODS -----------------*/
    var init = function () {

    }();
}
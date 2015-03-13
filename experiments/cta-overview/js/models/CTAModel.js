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

    /*------------------ PUBLIC METHODS ------------------*/


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
    };

    /*------------------ PRIVATE METHODS -----------------*/
    var init = function () {
        _requesting = false;
    }();
}
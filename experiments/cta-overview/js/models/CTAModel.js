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


    this.getTrips = function(time, handler) {
        var request = "http://127.0.0.1:3000/api/trips/";
        request +=
            (time.getHours() < 10 ? "0" : "") + time.getHours() + ":" +
            (time.getMinutes() < 10 ? "0" : "") + time.getMinutes() + ":" +
            (time.getSeconds() < 10 ? "0" : "") + time.getSeconds();

        d3.json(request, function(json) {
            handler(json);
        });
    };

    /*------------------ PRIVATE METHODS -----------------*/
    var init = function () {

    }();
}
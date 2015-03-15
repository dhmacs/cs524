/**
 * @class CTAVisualizationApp
 * @description
 *
 * @author Massimo De Marchi
 * @created 1/23/15.
 */
function CTAVisualizationApp() {
    /*---------------- PRIVATE ATTRIBUTES ----------------*/
    var self = this;

    var _windowController;

    /*------------------ PUBLIC METHODS ------------------*/



    /*------------------ PRIVATE METHODS -----------------*/
    var init = function () {
        var body = d3.select("body");
        body
            .style("width", "100%")
            .style("height", "100%");
        __model = new AppModel();
        __notificationCenter = new NotificationCenter();
        _windowController = new UIWindowController(body.node());
    }();
}

var __model;
var __notificationCenter;
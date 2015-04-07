/**
 * @class UIWindowController
 * @description
 *
 * @htmlContainer an html node that represents the application window (e.g. body element)
 *
 * @author Massimo De Marchi
 * @created 1/24/15.
 */
function UIWindowController(htmlContainer) {
    UIViewController.call(this, new UIView(htmlContainer));
    /*---------------- PRIVATE ATTRIBUTES ----------------*/
    var self = this;

    /*------------------ PUBLIC METHODS ------------------*/

    /**
     * @override returns the application model
     * @returns {*}
     */
    this.getModel = function() {
        return __model;
    };


    /*------------------ PRIVATE METHODS -----------------*/
    var init = function () {
        // Initialize model
        self.getView().addClass("ui-window-controller");

        var mapVC = new UIMapViewController();
        mapVC.getView().getD3Layer().style("position", "absolute");
        mapVC.getView().getD3Layer().style("top", "0px");
        mapVC.getView().getD3Layer().style("left", "0px");
        mapVC.getView().getD3Layer().style("width", "80vw");

        var timesTableVC = new UITimesTableViewController();
        timesTableVC.getView().getD3Layer().style("position", "absolute");
        timesTableVC.getView().getD3Layer().style("top", "0px");
        timesTableVC.getView().getD3Layer().style("right", "0px");
        timesTableVC.getView().getD3Layer().style("width", "20vw");
        timesTableVC.getView().getD3Layer().style("height", "100vh");

        var animationTimeVC = new UIAnimationTimeViewController();
        animationTimeVC.getView().getD3Layer().style("position", "absolute");
        animationTimeVC.getView().getD3Layer().style("bottom", "0px");
        animationTimeVC.getView().getD3Layer().style("left", "0px");
        animationTimeVC.getView().getD3Layer().style("width", "120px");
        animationTimeVC.getView().getD3Layer().style("height", "120px");

        // Add controllers
        self.add(mapVC);
        self.add(timesTableVC);
        self.add(animationTimeVC);
    }();
}

Utils.extend(UIWindowController, UIViewController);
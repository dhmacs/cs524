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

        self.add(new UIMapViewController());
    }();
}

Utils.extend(UIWindowController, UIViewController);
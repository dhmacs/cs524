/**
 * @class UISideInfoBarViewController
 * @description
 *
 * @author Massimo De Marchi
 * @created 3/20/15.
 */
function UISideInfoBarViewController() {
    UIViewController.call(this);

    /*---------------- PRIVATE ATTRIBUTES ----------------*/
    var self = this;

    /*------------------ PUBLIC METHODS ------------------*/


    /*------------------ PRIVATE METHODS -----------------*/
    var init = function () {
        self.getView().addClass("UISideInfoBarViewController");
        self.getView().setBackgroundColor("rgba(0,0,0,0.8)");
    }();
}

Utils.extend(UISideInfoBarViewController, UIViewController);
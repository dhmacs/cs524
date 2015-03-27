/**
 * @class UIAnimationTimeViewController
 * @description
 *
 * @author Massimo De Marchi
 * @created 3/20/15.
 */
function UIAnimationTimeViewController() {
    UIViewController.call(this, new UIView(document.createElement('div')));

    var _timeParagraph;

    /*---------------- PRIVATE ATTRIBUTES ----------------*/
    var self = this;

    /*------------------ PUBLIC METHODS ------------------*/
    this.timeUpdate = function() {
        var time = __model.getAnimationModel().getTime();

        var hours = Math.floor(time / 3600) + "";
        hours = hours.length < 2 ? "0" + hours : hours;

        time = time % 3600;
        var minutes = Math.floor(time/60) + "";
        minutes = minutes.length < 2 ? "0" + minutes : minutes;

        _timeParagraph.html(hours + ":" + minutes);
    }

    /*------------------ PRIVATE METHODS -----------------*/
    var init = function () {
        var div = self.getView().getD3Layer();
        //div.style("background-color", "#fff");
        div.style("padding-left", "20px");
        _timeParagraph = div.append("p");
        //_timeParagraph.style("padding-bottom", "0px");
        //_timeParagraph.style("margin-bottom", "10px");
        _timeParagraph.style("font-size", "50px");
        //_timeParagraph.style("font-family", "HelveticaNeue-Light");
        _timeParagraph.style("font-family", "Open Sans");
        _timeParagraph.style("font-weight", "300");
        _timeParagraph.style("color", "rgba(0,0,0,0.7)");

        __notificationCenter.subscribe(self, self.timeUpdate, Notifications.Animation.ANIMATION_STEP);
    }();
}

Utils.extend(UIAnimationTimeViewController, UIViewController);
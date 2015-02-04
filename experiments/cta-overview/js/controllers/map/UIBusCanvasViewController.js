/**
 * @class UIBusCanvasViewController
 * @description
 *
 * @author Massimo De Marchi
 * @created 1/26/15.
 */
function UIBusCanvasViewController() {
    UIMapCanvasViewController.call(this);

    /*---------------- PRIVATE ATTRIBUTES ----------------*/
    var self = this;

    /*------------------ PUBLIC METHODS ------------------*/
    /**
     * @override
     */
    var super_viewDidAppear = self.viewDidAppear;
    this.viewDidAppear = function() {
        // Call super
        super_viewDidAppear.call(self);

        // Draw stuff

         self.getView().getD3Layer()
         .append("circle")
         .attr("cx", self.project(41.870558, -87.625534).x)
         .attr("cy", self.project(41.870558, -87.625534).y)
         .attr("r", 10);

/*
         self.getView().getD3Layer()
         .append("circle")
         .attr("cx", map.project([map.getBounds().getNorth(), map.getBounds().getEast()]).x - _canvasFrame.x)//map.project([41.870558, -87.625534]).x)
         .attr("cy", map.project([map.getBounds().getNorth(), map.getBounds().getEast()]).y - _canvasFrame.y)//[41.876795, -87.731782]).y)
         .attr("r", 10);
*/
    };


    /*------------------ PRIVATE METHODS -----------------*/
    var init = function () {

    }();
}

Utils.extend(UIBusCanvasViewController, UIMapCanvasViewController);
/**
 * @class UIAnimationTimeViewController
 * @description
 *
 * @author Massimo De Marchi
 * @created 3/20/15.
 */
function UIAnimationTimeViewController() {
    UIViewController.call(this);


    /*---------------- PRIVATE ATTRIBUTES ----------------*/
    var self = this;

    var _radialProgressBar;
    var _arc;

    var _timeLabel;

    /*------------------ PUBLIC METHODS ------------------*/
    this.timeUpdate = function() {
        var time;

        // Displacement
        time = __model.getAnimationModel().getElapsedTime();
        var duration = __model.getAnimationModel().getDuration();
        _timeLabel.text(Utils.cta.secondsToHhMmSs(time).mm);

        _radialProgressBar.attr("d", _arc(time/duration));
    };

    /*------------------ PRIVATE METHODS -----------------*/
    var init = function () {
        var svg = self.getView().getD3Layer();
        self.getView().setViewBox(0, 0, 100, 100);

        svg.attr("viewBox");

        var g = svg.append("g").attr("transform", "translate(50,50)");
        g.append("circle")
            .attr("cx", 0)
            .attr("cy", 0)
            .attr("r", 40)
            .style("fill", "#000");

        _arc = d3.svg.arc()
            .startAngle(0 * (Math.PI/180))
            .endAngle(function(d) {
                return d * 360 * (Math.PI/180);
            })
            .innerRadius(34)
            .outerRadius(40.1);

        _radialProgressBar = g.append("path")
            .attr("d", _arc(0))
            .style("fill", "#1ABC9C");

        _timeLabel = g.append("text")
            .attr("x", 0)
            .attr("y", 0)
            .attr("dy", 10)
            .attr("text-anchor", "middle")
            .style("fill", "#D7D7D7")
            .style("font-family", "Helvetica Neue")
            .style("font-weight", "100")
            .style("font-size", 30);

        g.append("text")
            .attr("x", 0)
            .attr("y", 25)
            .attr("dy", 0)
            .attr("text-anchor", "middle")
            .style("fill", "#9B9B9B")
            .style("font-family", "Helvetica Neue")
            .style("font-weight", "100")
            .style("font-size", 14)
            .text("min");


        __notificationCenter.subscribe(self, self.timeUpdate, Notifications.Animation.ANIMATION_STEP);
    }();
}

Utils.extend(UIAnimationTimeViewController, UIViewController);
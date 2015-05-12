/**
 * @class UITimesTableViewController
 * @description
 *
 * @author Massimo De Marchi
 * @created 4/5/15.
 */
function UITimesTableViewController() {
    UIViewController.call(this);

    /*---------------- PRIVATE ATTRIBUTES ----------------*/
    var self = this;

    var _incomingVehicles = [];

    // UI
    var _digitalClock;

    /*------------------ PUBLIC METHODS ------------------*/
    this.dataUpdated = function() {
        var trips = __model.getCTAModel().getTrips();

        _incomingVehicles = [];
        for(var tripId in trips) {
            var trip = trips[tripId];

            if(trip["hop"] == 0) {
                var insertionIndex = _.sortedIndex(_incomingVehicles, trip, function(a) {
                    return Utils.cta.toSeconds(a["stops"][a["closestStopIndex"]]["arrivalTime"]);
                });
                _incomingVehicles.splice(insertionIndex, 0,trip);
            }
        }
    };

    this.tick = function() {
        var now = Utils.now();
        var nowSec = Utils.nowToSeconds();

        updateClock(now);

        var timeTable = {
            x: 10,
            y: 50,
            entry: {
                height: 50,
                icon: {
                    height: 50,
                    width: 50
                },
                padding: {
                    left: 0,
                    top: 8
                },
                labels: {
                    padding: {
                        left: 10,
                        top: 10
                    }
                }
            }
        };

        var svg = self.getView().getD3Layer();
        var gVehicles = svg.selectAll(".trip").data(_incomingVehicles);

        gVehicles.select(".estimated-time")
            .text(function(trip) {
                var stopTime = Utils.cta.toSeconds(trip["stops"][trip["closestStopIndex"]]["arrivalTime"]);
                var timeLeft = Math.floor((stopTime - nowSec) / 60);
                return (timeLeft > 0 ? timeLeft  + " min" : "now");
            });

        gVehicles.select(".line-color")
            .style("fill", function(trip) {
                return (trip["color"] != undefined ? "#" + trip["color"] : __model.getThemeModel().busColor());
            });

        gVehicles.select(".route-id")
            .text(function(trip) {
                return trip["routeId"];
            });

        gVehicles.select(".stop-name")
            .text(function(trip) {
                return trip["stops"][trip["closestStopIndex"]]["name"];
            });

        gVehicles.select(".direction")
            .text(function(trip) {
                return trip["direction"] + " on " + trip["routeLongName"];
            });

        // Enter
        var gVehiclesNew = gVehicles.enter()
            .append("g")
            .classed("trip", true)
            .attr("transform", function (d, i) {
                var entryVerticalSpace = timeTable.entry.padding.top + timeTable.entry.height;
                return "translate("+ timeTable.x + "," + (timeTable.y + entryVerticalSpace * i + timeTable.entry.padding.top) + ")";
            });

        // Rounded rect
        gVehiclesNew
            .append("rect")
            .classed("line-color", true)
            .attr("x", "0")
            .attr("y", "0")
            .attr("height", timeTable.entry.icon.height + "px")
            .attr("width", timeTable.entry.icon.width + "px")
            .attr("rx", "10px")
            .attr("ry", "10px")
            .style("fill", function(trip) {
                return (trip["color"] != undefined ? "#" + trip["color"] : __model.getThemeModel().busColor());
            });

        // Route Id
        gVehiclesNew
            .append("text")
            .classed("route-id", true)
            .attr("x", (timeTable.entry.icon.width / 2) + "px")
            .attr("y", (timeTable.entry.icon.height / 2) + "px")
            .attr("dy", "0.4em")
            .attr("text-anchor", "middle")
            .style("fill", "#fff")
            .style("font-family", "Helvetica Neue")
            .style("font-weight", "100")
            .style("font-size", "24px")
            .text(function(trip) {
                return trip["routeId"];
            });

        // TOWARD label
        gVehiclesNew
            .append("text")
            .classed("direction", true)
            .attr("x", (timeTable.entry.icon.width + timeTable.entry.labels.padding.left) + "px")
            .attr("y", "10px")
            .attr("dy", "0.4em")
            .attr("text-anchor", "left")
            .style("fill", "#D7D7D7")
            .style("font-family", "Helvetica Neue")
            .style("font-weight", "100")
            .style("font-size", "12px");

        // DUE IN label
        gVehiclesNew
            .append("text")
            .attr("x", (timeTable.entry.icon.width + timeTable.entry.labels.padding.left) + "px")
            .attr("y", (timeTable.entry.icon.height /2) + "px")
            .attr("dy", "0.4em")
            .attr("text-anchor", "left")
            .style("fill", "#D7D7D7")
            .style("font-family", "Helvetica Neue")
            .style("font-weight", "100")
            .style("font-size", "16px")
            .text("Due in");

        gVehiclesNew
            .append("text")
            .classed("estimated-time", true)
            .attr("x", (timeTable.entry.icon.width + timeTable.entry.labels.padding.left +60) + "px")
            .attr("y", (timeTable.entry.icon.height /2) + "px")
            .attr("dy", "0.4em")
            .attr("text-anchor", "left")
            .style("fill", "#fff")
            .style("font-family", "Helvetica Neue")
            .style("font-weight", "300")
            .style("font-size", "16px")
            .text(function(trip) {
                var stopTime = Utils.cta.toSeconds(trip["stops"][trip["closestStopIndex"]]["arrivalTime"]);
                var timeLeft = Math.floor((stopTime - nowSec) / 60);
                return (timeLeft > 0 ? timeLeft  + " min" : "now");
            });

        // AT label
        gVehiclesNew
            .append("text")
            .attr("x", (timeTable.entry.icon.width + timeTable.entry.labels.padding.left) + "px")
            .attr("y", (timeTable.entry.icon.height -10) + "px")
            .attr("dy", "0.4em")
            .attr("text-anchor", "left")
            .style("fill", "#D7D7D7")
            .style("font-family", "Helvetica Neue")
            .style("font-weight", "100")
            .style("font-size", "12px")
            .text("At");

        gVehiclesNew
            .append("text")
            .classed("stop-name", true)
            .attr("x", (timeTable.entry.icon.width + timeTable.entry.labels.padding.left +20) + "px")
            .attr("y", (timeTable.entry.icon.height -10) + "px")
            .attr("dy", "0.4em")
            .attr("text-anchor", "left")
            .style("fill", "#D7D7D7")
            .style("font-family", "Helvetica Neue")
            .style("font-weight", "300")
            .style("font-size", "12px")
            .text(function(trip) {
                return trip["stops"][trip["closestStopIndex"]]["name"];
            });


        // Exit
        gVehicles.exit().transition().duration(1000).style("opacity", "0").remove();

    };


    /*------------------ PRIVATE METHODS -----------------*/
    var updateClock = function(time) {
        _digitalClock.text(
            time.getHours() + ":" +
            (time.getMinutes() < 10 ? "0" : "") + time.getMinutes()// + ":" +
            //(time.getSeconds() < 10 ? "0" : "") + time.getSeconds()
        );
    };

    var init = function () {
        self.getView().addClass("ui-times-table-view-controller");
        self.getView().getD3Layer().style("background-color", "#1C1C1C");
        var svg = self.getView().getD3Layer();

        // Add clock
        _digitalClock =
            svg
                .append("text")
                .attr("x", "50%")
                .attr("y", "10px")
                .attr("dy", "1em")
                .attr("text-anchor", "middle")
                .style("fill", "#fff")
                .style("font-family", "Helvetica Neue")
                .style("font-weight", "100")
                .style("font-size", "30px");

        svg.append("rect")
            .attr("x", 0)
            .attr("x", 0)
            .attr("width", "100%")
            .attr("height", 6)
            .style("fill", "#1ABC9C");

        __notificationCenter.subscribe(self, self.dataUpdated, Notifications.CTA.TRIPS_UPDATED);
        window.setInterval(self.tick, 1000);
    }();
}

Utils.extend(UITimesTableViewController, UIViewController);
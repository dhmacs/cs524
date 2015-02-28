/**
 * @class UIBusCanvasViewController
 * @description
 *
 * @author Massimo De Marchi
 * @created 1/26/15.
 */
function UIBusCanvasViewController() {
    UIMapSVGViewController.call(this);

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
        //debugger;
        //self.getView().setBackgroundColor("#fff");
        self.getView().getD3Layer()
            .append("rect")
            .attr("width", "100%")
            .attr("height", "100%")
            .style("fill", "#fff")
            .style("opacity", "0.8");

        self.getModel().getCTAModel().getTrips(new Date(), function(json) {
            console.log("ok");

            //animation(json);
            //lineAnimation(json);
            //textAnimation(json);
            busNumbers(json);
            busTrajectories(json);
        });
    };


    /*------------------ PRIVATE METHODS -----------------*/
    var init = function () {
    }();

    var animation = function(json) {
        var speedFactor = 5;
        var data = d3.values(json);

        var vehicles = self.getView().getD3Layer().selectAll(".vehicle").data(data);

        console.time("draw");
        vehicles = vehicles.enter()
            .append("circle")
            .attr("cx", function(d) {
                return self.project(d["ns"][0]["lat"], d["ns"][0]["lon"]).x;
            })
            .attr("cy", function(d) {
                return self.project(d["ns"][0]["lat"], d["ns"][0]["lon"]).y;
            })
            .attr("r", function(d) {
                //d.current = 0;
                if(d["type"] == 3) {
                    return 1;
                } else {
                    return 2;
                }
            })
            .attr("fill", function(d) {
                return "#" + (d.color != "" ? d.color : "3182bd");
            })
            .attr("opacity", function(d) {
                var now = Date.now();
                return d["ns"][0]["dep"] > now ? 0 : 1;
            });

        vehicles.each(function(d, i) {
            var vehicle = d3.select(this);

            var j = 0;

            vehicle = vehicle.transition()
                .delay(function(d) {
                    var now = Date.now();
                    if(d["ns"][0]["dep"] > now) {
                        return (d["ns"][0]["dep"] - now) /speedFactor;
                    }
                    return 0;
                })
                .duration(function(d, i) {
                    return (d["ns"][j +1]["arr"] - d["ns"][j]["dep"]) / speedFactor;
                })
                .attr("cx", function(d, i) {
                    return self.project(d["ns"][j +1]["lat"], d["ns"][j +1]["lon"]).x;
                })
                .attr("cy", function(d, i) {
                    return self.project(d["ns"][j +1]["lat"], d["ns"][j +1]["lon"]).y;
                })
                .attr("opacity", function(d) {
                    if(j == d["ns"].length -2) {
                        return 0;
                    }
                    return 1;
                })
                .remove();

            for(j = 1; j < (d["ns"].length -1); j++) {
                vehicle = vehicle.transition()
                    .duration(function(d, i) {
                        return (d["ns"][j +1]["arr"] - d["ns"][j]["dep"]) / speedFactor;
                    })
                    .attr("cx", function(d, i) {
                        return self.project(d["ns"][j +1]["lat"], d["ns"][j +1]["lon"]).x;
                    })
                    .attr("cy", function(d, i) {
                        return self.project(d["ns"][j +1]["lat"], d["ns"][j +1]["lon"]).y;
                    })
                    .attr("opacity", function(d) {
                        if(j == d["ns"].length -2) {
                            return 0;
                        }
                        return 1;
                    })
                    .remove();
            }
        });
        console.timeEnd("draw");
    };





    var lineAnimation = function(json) {
        var data = d3.values(json);

        var line = d3.svg.line()
            //.interpolate("cardinal")
            .x(function(d,i) {return self.project(d["lat"], d["lon"]).x;})
            .y(function(d) {return self.project(d["lat"], d["lon"]).y;});

        var lines = self.getView().getD3Layer().selectAll(".line").data(data);

        lines = lines.enter()
            .append("path")
            .classed("line", true)
            .attr("fill", "none")
            .attr("stroke-width", "0.5")
            .attr("stroke", function (d) {
                return "#" + (d.color != "" ? d.color : "3182bd");
            })
            .attr("d", function(d) {
                return line(d["ns"]);
            });

        //var totalLength =  lines.node().getTotalLength();

        lines
            .attr("stroke-dasharray", function(d) {
                return this.getTotalLength() + " " + this.getTotalLength();
            })
            .attr("stroke-dashoffset", function(d) {
                return this.getTotalLength();
            })
            .transition()
            .duration(function(d) {
                return (d["ns"][d["ns"].length -1]["arr"] - d["ns"][0]["dep"]) / 10;
            })
            .ease("linear")
            .attr("stroke-dashoffset", 0)
            .attr("opacity", "0.2");
    };



    var busNumbers = function(json) {
        var data = d3.values(json);
        var speedup = 30;

        var vehicles = self.getView().getD3Layer().selectAll(".vehicle").data(data);

        vehicles = vehicles.enter()
            .append("text")
            .attr("x", function(d) {
                return self.project(parseFloat(d["stops"][0]["lat"]), parseFloat(d["stops"][0]["lon"])).x;
            })
            .attr("y", function(d) {
                return self.project(parseFloat(d["stops"][0]["lat"]), parseFloat(d["stops"][0]["lon"])).y;
            })
            .attr("text-anchor", "middle")
            .attr("dy", "0.5em")
            .text(function(d) {
                return d["routeId"];
            })
            .attr("fill", function(d) {
                return "#" + (d.color != "" ? d.color : "3182bd");
            })
            .attr("font-size", "4px")
            .style("opacity", "0");

        var now = new Date();
        now = Utils.toSeconds(now.getHours(), now.getMinutes(), now.getSeconds());
        vehicles = vehicles.transition()
            .delay(function(d) {
                var stopTimeInSeconds =
                    Utils.toSeconds(
                        d["stops"][0]["departureTime"]["hh"],
                        d["stops"][0]["departureTime"]["mm"],
                        d["stops"][0]["departureTime"]["ss"]
                    );

                if(now < stopTimeInSeconds) {
                    return ((now - stopTimeInSeconds) * 1000) / speedup;
                }

                return 0;
                /*
                var nextStopTimeInSeconds;

                do {
                    stopTimeInSeconds =
                        Utils.toSeconds(
                            d["stops"][s]["departureTime"]["hh"],
                            d["stops"][s]["departureTime"]["mm"],
                            d["stops"][s]["departureTime"]["ss"]
                        );
                    nextStopTimeInSeconds =
                        Utils.toSeconds(
                            d["stops"][s +1]["arrivalTime"]["hh"],
                            d["stops"][s +1]["arrivalTime"]["mm"],
                            d["stops"][s +1]["arrivalTime"]["ss"]
                        );
                } while(now >= stopTimeInSeconds && now < nextStopTimeInSeconds);*/
            })
            .style("opacity", "1");

        vehicles.each(function(d) {
            var vehicle = d3.select(this);

            var s = -1;
            var stopTimeInSeconds;
            var nextStopTimeInSeconds;

            do {
                s++;
                stopTimeInSeconds =
                    Utils.toSeconds(
                        d["stops"][s]["departureTime"]["hh"],
                        d["stops"][s]["departureTime"]["mm"],
                        d["stops"][s]["departureTime"]["ss"]
                    );
                nextStopTimeInSeconds =
                    Utils.toSeconds(
                        d["stops"][s +1]["arrivalTime"]["hh"],
                        d["stops"][s +1]["arrivalTime"]["mm"],
                        d["stops"][s +1]["arrivalTime"]["ss"]
                    );
            } while(now >= stopTimeInSeconds && now < nextStopTimeInSeconds);

            while(s < d["stops"].length -1) {

                stopTimeInSeconds =
                    Utils.toSeconds(
                        d["stops"][s]["departureTime"]["hh"],
                        d["stops"][s]["departureTime"]["mm"],
                        d["stops"][s]["departureTime"]["ss"]
                    );
                nextStopTimeInSeconds =
                    Utils.toSeconds(
                        d["stops"][s +1]["arrivalTime"]["hh"],
                        d["stops"][s +1]["arrivalTime"]["mm"],
                        d["stops"][s +1]["arrivalTime"]["ss"]
                    );

                vehicle = vehicle.transition()
                    .duration(function() {
                        return ((nextStopTimeInSeconds - stopTimeInSeconds) * 1000) / speedup;
                    })
                    .attr("x", function() {
                        return self.project(d["stops"][s +1]["lat"], d["stops"][s +1]["lon"]).x;
                    })
                    .attr("y", function() {
                        return self.project(d["stops"][s +1]["lat"], d["stops"][s +1]["lon"]).y;
                    });

                s++;
            }
        });
    };

    var busTrajectories = function(json) {
        var data = d3.values(json);

        var line = d3.svg.line();
        line
            .x(function(d) {
                return self.project(parseFloat(d["lat"]), parseFloat(d["lon"])).x;
            })
            .y(function(d) {
                return self.project(parseFloat(d["lat"]), parseFloat(d["lon"])).y;
            });

        var trajectories = self.getView().getD3Layer().selectAll(".trajectory").data(data);

        trajectories.enter()
            .append("path")
            .classed("trajectory", true)
            .attr("d", function(d) {
                return line(d["stops"]);
            })
            .attr("fill", "none")
            .attr("stroke-width", "0.5")
            .attr("stroke", function (d) {
                return "#" + (d.color != "" ? d.color : "3182bd");
            });
    };


    var textAnimation = function(json) {

        var data = d3.values(json);

        var vehicles = self.getView().getD3Layer().selectAll(".vehicle").data(data);

        console.time("draw");
        vehicles = vehicles.enter()
            .append("text")
            .attr("x", function(d) {
                return self.project(d["stops"][0]["lat"], d["stops"][0]["lon"]).x;
            })
            .attr("y", function(d) {
                return self.project(d["stops"][0]["lat"], d["stops"][0]["lon"]).y;
            })
            .attr("text-anchor", "middle")
            .attr("dy", "0.5em")
            .text(function(d) {
                return d["routeID"];
            })
            .attr("fill", function(d) {
                return "#" + (d.color != "" ? d.color : "3182bd");
            })
            .attr("font-size", "4px")
            .attr("opacity", function(d) {
                return 0;
            });

        vehicles.each(function(d, i) {
            var vehicle = d3.select(this);

            var j = 0;

            vehicle = vehicle.transition()
                .delay(function(d) {
                    var now = Date.now();
                    now = Utils.toSeconds(now.getHours(), now.getMinutes(), now.getSeconds());
                    if(now > Utils.toSeconds(d["stops"][0]["departureTime"]["hh"], d["stops"][0]["departureTime"]["mm"], d["stops"][0]["departureTime"]["ss"])) {
                        return ((d["stops"][0]["departureTime"] - now) *1000) / 60;
                    }
                    /*
                    if(d["stops"][0]["dep"] > now) {
                        return (d["stops"][0]["dep"] - now) /60;
                    }*/
                    return 0;
                })
                .duration(function(d, i) {
                    return ((d["stops"][j +1]["arrivalTime"] - d["stops"][j]["departureTime"]) *1000) / 60;
                })
                .attr("x", function(d, i) {
                    return self.project(d["stops"][j +1]["lat"], d["stops"][j +1]["lon"]).x;
                })
                .attr("y", function(d, i) {
                    return self.project(d["stops"][j +1]["lat"], d["stops"][j +1]["lon"]).y;
                })
                .attr("opacity", function(d) {
                    if(j == d["stops"].length -2) {
                        return 0;
                    }
                    return 1;
                })
                .remove();

            for(j = 1; j < (d["stops"].length -1); j++) {
                vehicle = vehicle.transition()
                    .duration(function(d, i) {
                        return (d["stops"][j +1]["arr"] - d["stops"][j]["dep"]) / 30;
                    })
                    .attr("x", function(d, i) {
                        return self.project(d["stops"][j +1]["lat"], d["stops"][j +1]["lon"]).x;
                    })
                    .attr("y", function(d, i) {
                        return self.project(d["stops"][j +1]["lat"], d["stops"][j +1]["lon"]).y;
                    })
                    .attr("opacity", function(d) {
                        //return 1;
                        if(j == d["stops"].length -2) {
                            return 0;
                        }
                        return 1;
                    })
                    .remove();
            }
        });
        console.timeEnd("draw");
    };
}

Utils.extend(UIBusCanvasViewController, UIMapSVGViewController);
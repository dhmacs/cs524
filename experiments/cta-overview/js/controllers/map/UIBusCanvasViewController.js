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

    var _data;
    var _animationTime;
    var _animationEndTime;

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

        d3.json("http://127.0.0.1:3000/api/stops/6627/", function(json) {
            var proj = self.project(json["stopLatitude"], json["stopLongitude"]);
            self.getView().getD3Layer()
                .append("circle")
                .attr("cx", proj.x)
                .attr("cy", proj.y)
                .attr("r", "2");
        });

        self.getModel().getCTAModel().getTrips(new Date(), function(json) {
            console.log("ok");
            _data = json;
            //animation(json);
            //lineAnimation(json);
            //textAnimation(json);
            //busNumbers(json);
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


    /**
     * OLD line animation
     * @param json
     */
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

    var getLastStopIndex = function(time, stops) {
        var s = 0;
        var stopTimeInSeconds;

        while(s < stops.length) {
            stopTimeInSeconds =
                Utils.toSeconds(
                    stops[s]["arrivalTime"]["hh"],
                    stops[s]["arrivalTime"]["mm"],
                    stops[s]["arrivalTime"]["ss"]
                );
            if(time < stopTimeInSeconds) {
                return s -1;
            }
            s++;
        }

        return -1;
    };

    var busNumbers = function(json) {
        var data = d3.values(json);

        var speedup = 30;

        var now = new Date();
        console.log("NOW=" + now);
        //now = Utils.toSeconds(now.getHours(), now.getMinutes(), now.getSeconds());
        now = Utils.toSeconds(12, 15, 0);

        var vehicles = self.getView().getD3Layer().selectAll(".vehicle").data(data);

        vehicles.enter()
            .append("text")
            .classed("vehicle", true)
            .attr("text-anchor", "middle")
            .attr("dy", "0.5em")
            .text(function(d) {
                return d["routeId"];
            })
            .attr("fill", function(d) {
                return "#3182bd";//"#" + (d.color != "" ? d.color : "3182bd");
            })
            .attr("font-size", "4px")
            .each(function(vehicleData) {
                var vehicle = d3.select(this);
                var lastStopIndex = getLastStopIndex(now, vehicleData["stops"]);
                var stopTimeInSeconds;
                var projection;

                // Initialize vehicles positions
                if(lastStopIndex == -1) {
                    stopTimeInSeconds = Utils.toSeconds(
                        vehicleData["stops"][0]["departureTime"]["hh"],
                        vehicleData["stops"][0]["departureTime"]["mm"],
                        vehicleData["stops"][0]["departureTime"]["ss"]
                    );
                    projection = self.project(
                        parseFloat(vehicleData["stops"][0]["lat"]),
                        parseFloat(vehicleData["stops"][0]["lon"])
                    );
                    vehicle = vehicle
                        .attr("x", function() {
                            return projection.x;
                        })
                        .attr("y", function() {
                            return projection.y;
                        })
                        .style("opacity", "0");
                    vehicle = vehicle.transition()
                        .delay(function() {
                            return ((now - stopTimeInSeconds) * 1000) / speedup;
                        })
                        .style("opacity", "1");

                    lastStopIndex = 0;
                } else {
                    var next = vehicleData["stops"][lastStopIndex +1]["arrivalTime"];
                    next = Utils.toSeconds(next.hh, next.mm, next.ss);
                    var previous = vehicleData["stops"][lastStopIndex]["departureTime"];
                    previous = Utils.toSeconds(previous.hh, previous.mm, previous.ss);
                    var delta = (now - previous) / (next - previous);
                    var lat = d3.interpolateNumber(
                        parseFloat(vehicleData["stops"][lastStopIndex]["lat"]),
                        parseFloat(vehicleData["stops"][lastStopIndex +1]["lat"])
                    )(delta);
                    var lon = d3.interpolateNumber(
                        parseFloat(vehicleData["stops"][lastStopIndex]["lon"]),
                        parseFloat(vehicleData["stops"][lastStopIndex +1]["lon"])
                    )(delta);

                    projection = self.project(lat, lon);
                    vehicle = vehicle
                        .attr("x", function() {
                            return projection.x;
                        })
                        .attr("y", function() {
                            return projection.y;
                        });
                }

                while(lastStopIndex < vehicleData["stops"].length -1) {
                    projection = self.project(
                        parseFloat(vehicleData["stops"][lastStopIndex +1]["lat"]),
                        parseFloat(vehicleData["stops"][lastStopIndex +1]["lon"])
                    );
                    vehicle = vehicle.transition()
                        .duration(function() {
                            var next = vehicleData["stops"][lastStopIndex +1]["arrivalTime"];
                            next = Utils.toSeconds(next.hh, next.mm, next.ss);
                            var previous = vehicleData["stops"][lastStopIndex]["departureTime"];
                            previous = Utils.toSeconds(previous.hh, previous.mm, previous.ss);
                            return ((next - previous) * 1000) / speedup;
                        })
                        .attr("x", function() {
                            return projection.x;
                        })
                        .attr("y", function() {
                            return projection.y;
                        });
                    lastStopIndex++;
                }

            });
    };

    var busTrajectories = function(json) {
        //var data = d3.values(json);

        _animationTime = Utils.toSeconds(12, 15, 0);//Utils.nowToSeconds();
        _animationEndTime = _animationTime + Utils.toSeconds(1, 0, 0) /*1 hour*/;
        d3.timer(function() {
            update();
            draw();
        });
        /*
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
                return "#3182bd"; //+ (d.color != "" ? d.color : "3182bd");
            });*/
    };

    var update = function() {
        _animationTime += 10;
        if(_animationTime >= _animationEndTime) {
            _animationTime = Utils.toSeconds(12, 15, 0);//Utils.nowToSeconds();
            _animationEndTime = _animationTime + Utils.toSeconds(1, 0, 0);
            var svg = self.getView().getD3Layer();
            svg.selectAll(".trail").remove();
        }
    };

    var draw = function() {
        var svg = self.getView().getD3Layer();
        var vehiclesData = d3.values(_data);
        vehiclesData.forEach(function(vehicleData) {
            var previousStopIndex = getLastStopIndex(_animationTime, vehicleData["stops"]);
            if(previousStopIndex > -1) {
                // Compute next stop time in seconds
                var next = vehicleData["stops"][previousStopIndex +1]["arrivalTime"];
                next = Utils.toSeconds(next.hh, next.mm, next.ss);

                // Compute previous stop time in seconds
                var previous = vehicleData["stops"][previousStopIndex]["departureTime"];
                previous = Utils.toSeconds(previous.hh, previous.mm, previous.ss);

                // Compute time passed from the previous stop
                var delta = (_animationTime - previous) / (next - previous);
                var lat = d3.interpolateNumber(
                    parseFloat(vehicleData["stops"][previousStopIndex]["lat"]),
                    parseFloat(vehicleData["stops"][previousStopIndex +1]["lat"])
                )(delta);
                var lon = d3.interpolateNumber(
                    parseFloat(vehicleData["stops"][previousStopIndex]["lon"]),
                    parseFloat(vehicleData["stops"][previousStopIndex +1]["lon"])
                )(delta);

                var projection = self.project(lat, lon);

                svg.append("circle")
                    .classed("trail", true)
                    .attr("cx", projection.x)
                    .attr("cy", projection.y)
                    .attr("r", 1.2)
                    .style("fill", "#3182bd")
                    .style("opacity", 1)
                    .transition()
                    .duration(1000)
                    .ease("cubic")
                    .attr("r", 1)
                    .style("opacity", 0.1);
                    //.remove();
            }
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
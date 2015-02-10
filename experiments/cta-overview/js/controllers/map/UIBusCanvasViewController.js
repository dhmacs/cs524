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
        //debugger;
        //self.getView().setBackgroundColor("#fff");
        self.getView().getD3Layer()
            .append("rect")
            .attr("width", "100%")
            .attr("height", "100%")
            .style("fill", "#fff")
            .style("opacity", "0.8");

        this.getModel().getCTAModel().getTrips(new Date(), function(json) {
            console.log("ok");

            animation(json);
            lineAnimation(json);
            //textAnimation(json);

        });
    };


    /*------------------ PRIVATE METHODS -----------------*/
    var init = function () {
    }();

    var animation = function(json) {
        var speedFactor = 1;
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






    var textAnimation = function(json) {

        var data = d3.values(json);

        var vehicles = self.getView().getD3Layer().selectAll(".vehicle").data(data);

        console.time("draw");
        vehicles = vehicles.enter()
            .append("text")
            .attr("x", function(d) {
                return self.project(d["ns"][0]["lat"], d["ns"][0]["lon"]).x;
            })
            .attr("y", function(d) {
                return self.project(d["ns"][0]["lat"], d["ns"][0]["lon"]).y;
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
                    if(d["ns"][0]["dep"] > now) {
                        return (d["ns"][0]["dep"] - now) /60;
                    }
                    return 0;
                })
                .duration(function(d, i) {
                    return (d["ns"][j +1]["arr"] - d["ns"][j]["dep"]) / 60;
                })
                .attr("x", function(d, i) {
                    return self.project(d["ns"][j +1]["lat"], d["ns"][j +1]["lon"]).x;
                })
                .attr("y", function(d, i) {
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
                        return (d["ns"][j +1]["arr"] - d["ns"][j]["dep"]) / 30;
                    })
                    .attr("x", function(d, i) {
                        return self.project(d["ns"][j +1]["lat"], d["ns"][j +1]["lon"]).x;
                    })
                    .attr("y", function(d, i) {
                        return self.project(d["ns"][j +1]["lat"], d["ns"][j +1]["lon"]).y;
                    })
                    .attr("opacity", function(d) {
                        //return 1;
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
}

Utils.extend(UIBusCanvasViewController, UIMapCanvasViewController);
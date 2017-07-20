var duration = 750;
//var tree_heigh =  50;
var COLORS_ORIGIN = [
    '#1f77b4',
    '#aec7e8',
    '#ff7f0e',
    '#ffbb78',
    '#2ca02c',
    '#98df8a',
    '#d62728',
    '#ff9896',
    '#9467bd',
    '#c5b0d5',
    '#8c564b',
    '#c49c94',
    '#e377c2',
    '#f7b6d2',
    '#bcbd22',
    '#dbdb8d',
    '#17becf',
    '#9edae5'
];

var color_origin = ["red", "blue", "green"];

var DrawNode_Preview = function (dragListener) {
    var _this = this;
    this.drawHighlightRect = new DrawHighlightRect_Preview();
    this.drawBar = new DrawBar_Preview();
    this.createNodes = function (nodes,highlightIndex) {
        return nodes.enter().append("g")
            // .call(dragListener.dragListener)
            .attr("class", function (d) {
                if (d.isRest) {
                    return "node";
                }
                return "node";
            })
            .attr("id", function (d) {
                treeCutList[highlightIndex].push(d.Id);
                return "node" + d.Id;
            })
            .attr("transform", function (d) {
                if (!d.parent) {
                    return "translate(" + d.y0 + "," + d.x0 + ")";
                }
                var parent = d.parent;
                while (!d3.selectAll("#node" + parent.Id)[0].length) {
                    if (!parent.parent) {
                        return "translate(" + parent.y0 + "," + parent.x0 + ")";
                    }
                    parent = parent.parent;
                }
                return "translate(" + parent.y + "," + parent.x + ")";
            });
    }
    this.updateNodes = function (nodes, draggingNode) {
        return nodes
        //.transition()
        //.duration(duration)
            .attr("transform", function (d) {
                if (draggingNode && draggingNode === d) {
                    return "translate(" + d.y0 + "," + d.x0 + ")";
                }
                return "translate(" + d.y + "," + d.x + ")";
            });
    }
};
var DrawHighlightRect_Preview = function () {
    var _this = this;
    this.createHighlightRects = function (nodes) {
        // nodes.append("rect")
        //     .attr("class", "nodeRect show")
        //     .attr("rx", 2)
        //     .attr("ry", 2)
        // ;
    }
    this.updateHighlightRects = function (nodes) {
        // nodes.select("rect.nodeRect")
        //     .attr("x", function (d) {
        //         return 0;
        //     })
        //     .attr("y", function (d) {
        //         var text = $("#node" + d.Id + " .nodeText");
        //         //return -(text.height() / 2) -18;
        //         return -3;
        //     })
        //     .attr("height", function (d) {
        //         var text = $("#node" + d.Id + " .nodeText");
        //         //return text.width() + 10;
        //         return 6;
        //     })
        //     .attr("width", function (d) {
        //         var text = $("#node" + d.Id + " .nodeText");
        //         //return text.height() + 3;
        //         return 7;
        //     });
        // // nodes.select("rect.nodeRect")
        // //     .filter(".highlight")
        // //     .transition()
        // //     .duration(2000)
        // //     .attr("class","nodeRect show");
        // nodes.exit().remove();
    };
};

var drawGrayBar = 1;
var DrawBar_Preview = function() {
    var _this = this;
    this.createBars = function(nodes) {
        //return;
        nodes.append("g")
            .attr("class", "bar-chart");
        nodes.each(function (n) {
            if (n.status != "reserve") {
                d3.select(this).append("rect");
                return;
            }
            var _n = d3.select(this).select("g.bar-chart");
            var Rect = _n.selectAll("rect")
                // .data([1,0.5,2,0.5])
            .data( [get_current_focused_class(), n.data_count[get_current_focused_class()], -1, ( sum(n.data_count) - n.data_count[get_current_focused_class()] ) / 8 ])
               // .data([get_current_focused_class(), n.data_count[get_current_focused_class()], 2, n.data_count[2], 3, n.data_count[3]])
                .enter()
                .append("rect")
                .attr("class", function (d, i) {
                    if (i % 2 === 0) {
                        return "bar-frame";
                    }
                    else {
                        return "bar-fill";
                    }
                })
                .attr("rx", 1)
                .attr("ry", 1);
        });
    };
    this.updateBars = function(nodes,colors) {
        //return;
        var max_high = 8;
        var top = 7;
        var sum = function (arr){
            var _s = 0;
            for (var i = 0; i < arr.length; i ++) {
                _s += arr[i];
            }
            return _s || 0;
        };
        nodes.select("g.bar-chart")
            .each(function (n, j) {
                if (n.status != "reserve") {
                    d3.select(this).append("rect")
                        .attr("x", 0)
                        .attr("y", -0.5)
                        .attr("height", 1)
                        .attr("width", 7)
                        .attr("stroke-width", 0)
                        //.attr("stroke", "gray")
                        .attr("fill", "#c5c5c5");
                    return;
                }
                var _n = d3.select(this);
                var fill_color;
                var stroke_color;
                _n.selectAll("rect")
                    .attr("x", function (d, i) {
                        if (i % 2 === 0) {
                            return 0;
                        }
                        else {
                            return top - d * top;
                        }
                    })
                    .attr("y", function (d, i) {
                        if (!n.parent) {
                            return -3 + 3 * Math.floor(i / 2);
                        }
                        return -3 + 3 * Math.floor( i / 2 );
                    })
                    .attr("height", "2px")
                    .attr("width", function (d, i) {
                        if (i % 2 === 0) {
                            return top;
                        }
                        else {
                            return Math.round(top * d);
                        }
                    })
                    .attr("stroke-width", function (d, i) {
                        if (i % 2 === 0) {
                            return 0.6;
                        }
                        else {
                            return 0;
                        }
                    })
                    .attr("stroke", function (d, i) {
                        if( i < 2 ) {
                            return color_manager.get_color(get_current_focused_class());
                        }
                        else{
                            return "gray";
                        }

                    })
                    .attr("fill", function (d, i) {
                        if( i < 2 ) {
                            return color_manager.get_color(get_current_focused_class());
                        }
                        else{
                            return "gray";
                        }
                    })
                    .attr("fill-opacity", function (d, i) {
                        if (i % 2 === 0) {
                            return 0;
                        }
                        else {
                            return 1;
                        }
                    })
            });
    };
};


var DrawLink_Preview = function () {
    var _this = this;
    var diagonal = d3.svg.diagonal()
        .projection(function (d) {
            return [d.y, d.x];
        })
        ;
    this.createLinks = function (link, links, draggingNode) {
        link.enter().insert("path", "g")
            .attr("class", "link")
            .attr("id", function (d, i) {
                return "link" + links[i].target.Id + "-" + links[i].source.id;
            })
            .attr("d", function (d, i) {
                var parent = links[i].source;
                while (!d3.selectAll("#node" + parent.Id)[0].length) {
                    if (parent.parent) {
                        parent = parent.parent;
                    } else {
                        break;
                    }
                }
                var o = {
                    x: parent.x0 || 0,
                    y: parent.y0 || 0
                };
                return diagonal({
                    source: o,
                    target: o
                });
            });
    }
    this.removeLinks = function (links, nodes) {
        links.exit().transition()
            .duration(duration)
            .style("opacity", 0)
            .remove();
    }


    this.updateLinks = function (links, draggingNode, colors, nodes, tree_height,treeIndex) {
        var sum = function (arr){
            var _s = 0;
            for (var i = 0; i < arr.length; i ++) {
                _s += arr[i];
            }
            return _s || 0;
        };
        d3.selectAll(".restlink-Listgroup"+treeIndex)
            .each(function (g, j) {
                var group = d3.select(this);
                var links = group.selectAll("path.restlink");
                links = links.data([1]);
                links.enter()
                    .append("path");
                links
                    .attr("class", function (d, i) {
                        return "restlink rl-" + i;
                    })
                    .style('stroke', g.status == "cutted" ? "#c5c5c5" : "gray")
                    .style('stroke-width', "1px")
                    .style("opacity",function(d,i){
                        return 1;
                    })
                    .attr("d", function (d, i) {
                        if (g.parent == null) return;
                        var text = $("#node" + g.parent.Id + " .nodeText");
                        if ((g.parent.x - g.x ) < 0) {
                            var x_start = 0;
                            var y_start = 0;
                            var x_end = g.parent.x - g.x ;
                            var y_end = - tree_height;
                            var x_start_control = x_start;
                            var y_start_control =  - tree_height / 2;
                            var x_end_control = x_end;
                            var y_end_control = - tree_height / 2;
                        }
                        else {
                            var x_start = 0;
                            var y_start = 0;
                            var x_end = g.parent.x - g.x ;
                            var y_end = - tree_height;
                            var x_start_control = x_start;
                            var y_start_control =  - tree_height / 2 ;
                            var x_end_control = x_end;
                            var y_end_control = -tree_height / 2;
                        }
                        return "M" + y_end + "," + x_end + "C" + y_end_control + "," + x_end_control + " " + y_start_control + "," + x_start_control + " " + y_start + "," + x_start ;
                    });
                links.exit().remove();
            });
    }

    this.showRestLinks = function (nodes, treeIndex) {
        nodes.append("g")
            .attr("class", "restlink-Listgroup"+treeIndex)
            .attr("id", function (n, i) {
                return "rl-group-" + n.id;
            });
        nodes
            .each(function (n) {
                var d = n;
                var node = d3.select(this);
                var restLinks = node.selectAll("path.restlink").data(n.lineNum_splits || []);
                restLinks.enter()
                    .append("path");
                restLinks
                    .attr("class", function (d, i) {
                        return "restlink rl-" + i.toString();
                    })
                    .attr("d", function (d1) {
                        if (d.parent == null) return;
                        var s = {
                            x: d.parent.x - d.x,
                            y: d.parent.y + 5 - d.y
                        };
                        return diagonal({
                            source: s,
                            target: s
                        });
                    });
            });
    }
};
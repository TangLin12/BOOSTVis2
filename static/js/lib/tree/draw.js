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
var DRAW_BAR = 0;
var SHOW_SPILT_VALUT = 1;

var MAX_TEXT_LENGTH = 8;

var MIN_PRECISION = 0.0000001;

var color_origin = ["red", "blue", "green"];
var thisNode;
var DrawNode = function (dragListener) {
    var _this = this;
    this.drawConnectRect = new DrawConnectRect(dragListener);
    this.drawNodeLabel = new DrawNodeLabel(dragListener);
    this.drawHighlightRect = new DrawHighlightRect();
    this.drawPin = new DrawPin();
    this.drawDepthNode = new DrawDepthNode();
    this.drawRestNode = new DrawRestNode(dragListener);
    this.drawBar = new DrawBar();
    this.createNodes = function (nodes) {
        return nodes.enter().append("g")
            .call(dragListener.dragListener)
            .attr("class", function (d) {
                if (d.isRest) {
                    return "node";
                }
                return "node";
            })
            .attr("id", function (d) {
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
            })
            .on('mousedown', dragListener.dragTimerStart)
            .on('mousemove', dragListener.dragTimerStop)
            .on('mouseup', dragListener.dragTimerStop);
    };
    this.exitNodes = function(nodes){
        return nodes.exit();
    }
    this.updateNodes = function (nodes, draggingNode) {
        return nodes
        .transition()
        .duration(duration)
            .attr("transform", function (d) {
                if (draggingNode && draggingNode === d) {
                    return "translate(" + d.y0 + "," + d.x0 + ")";
                }
                return "translate(" + d.y + "," + d.x + ")";
            });
    }
};
var DrawConnectRect = function (dragListener) {
    var _this = this;
    this.creatRects = function (nodes) {
        nodes.append("rect")
            .attr('class', 'ghostCircle')
            .attr("width", 120)
            .attr("height", 70)
            .attr("y", -35)
            .attr("opacity", 0)
            .style("fill", "red")
            .attr('pointer-events', 'mouseover')
            .on("mouseover", dragListener.overCircle)
            .on("mouseout", dragListener.outCircle);
    }
};
var DrawNodeLabel = function (dragListener) {
    var _this = this;
    var start_center_align = -23;
    this.creatLabels = function (nodes) {
        nodes.select("text.nodeText").remove();
        nodes.append("text")
            .each(function(t) {
                var textNode = d3.select(this);
                textNode
                .attr('class', 'nodeText')
                // .transition()
                // .duration(duration)
                    .attr("x", -22)
                    .attr("y", "-1.0em")
                    .attr("transform", "rotate(-90)")
                    .attr("text-anchor", "start")
                    .style("fill", "rgb(85,85,85)")
                    .style("fill-opacity", 1)
                    // .on("mouseover", _this.showLeafInfo)
                    // .on("mouseout", _this.hideLeafInfo)
                    .selectAll("tspan")
                    .data(function (d) {
                        if (d.isRest) {
                            return [];
                        }
                        if (d.isLeaf) {
                            return SHOW_SPILT_VALUT === 1 ? [parseFloat(d.label).toPrecision()] : ( d.nodeData["leaf-value"] > 0 ? "+" : "-" );
                        } else {
                            return [d.label + ( SHOW_SPILT_VALUT === 1 ? "<" + String(d.nodeData["threshold"]) : "" )];
                        }
                        //return d.label;
                    })
                    .enter()
                    .append("tspan")
                    .attr("x",function(d){
                        if( ! t.parent ) return 0;
                        return -t.parent.x + t.x;
                    })
                    // -12 : set the start point of the animation is centered on the rectangle
                    .attr("y",function(d){
                        if( ! t.parent ) return start_center_align;
                        return t.parent.y - t.y + start_center_align;
                    })
            });
    };
    this.updateLabels = function (nodes,top_level) {
        nodes
            .select("text.nodeText")
            .each(function(t) {
                var textNode = d3.select(this);
                textNode
                    .attr('class', 'nodeText')
                    // .transition()
                    // .duration(duration)
                    .attr("x", -22)
                    .attr("y", "-1.0em")
                    .attr("transform", "rotate(-90)")
                    .attr("text-anchor", "start")
                    .style("fill", "rgb(85,85,85)")
                    .style("fill-opacity", 1)
                    // .on("mouseover", _this.showLeafInfo)
                    // .on("mouseout", _this.hideLeafInfo)
                    .selectAll("tspan")
                    .transition()
                    .duration(function(d){
                        if( top_level === 0 ){
                            return 0;
                        }
                        return duration;
                    })
                    .delay(function (d, i) {
                        if( top_level != undefined ){
                            if( top_level > 0 ){
                                return duration * ( t.level -1 - top_level ) * delayMultiple + duration;
                            }
                            return 0;
                        }
                        return (duration) * ( t.level - 1 ) * delayMultiple;
                    })
                    .attr("y", start_center_align )
                    .attr("x", 0)
                    .attr("dy", function (d) {
                        if (SHOW_SPILT_VALUT === 1) {
                            return "3.2em";
                        }
                        else {
                            return "2.2em";
                        }
                    })
                    .attr("style", function (d) {
                        if (SHOW_SPILT_VALUT === 1) {
                            return "font-size:12px";
                        }
                        else {
                            return "font-size:12px";
                        }
                    })
                    .attr("dx", 0)
                    .text(function (d) {
                        d = d.slice(0, Math.min(d.length, MAX_TEXT_LENGTH));
                        //eliminate situation where d is "+" "-" or d is a feature name
                        if (d.length > 2 && d.search("F") < 0 && Math.abs(parseFloat(d)) < MIN_PRECISION) {
                            // because positive number with form "x.xxxxx" and positive number with form "-x.xxxxx"
                            return d.slice(0, d[0] === '-' ? 4 : 3);
                        }
                        return d;
                    })
                    .attr("text-anchor", "middle");
            });
    };

};
var DrawHighlightRect = function () {
    var _this = this;
    this._node = null;
    this.createHighlightRects = function (nodes) {
        _this._node = nodes;
        nodes.select("rect.nodeRect").remove();
        nodes.append("rect")
            .attr("class", "nodeRect show")
            .attr("rx", 10)
            .attr("ry", 10)
            .on("click", function (d) {
                clicked_node = d;
                console.log(d.raw_splits.join(" "), d.splits.join(" "), d.intra_splits1.join(" "));
            })
            .attr("x",function(d){
                if( ! d.parent ) {
                    var text = $("#node" + d.Id + " .nodeText");
                    return Number(text.attr("x")) + 22;
                }
                return d.parent.y - d.y + 12;
            })
            .attr("y",function(d){
                if ( ! d.parent ) return -27;
                return d.parent.x - d.x;
            })
            .attr("height",function(d){
                if( ! d.parent ) return TREE_NODERECT_WIDTH;
                return 0;
            })
            .attr("width",function(d){
                if( ! d.parent ) return TREE_NODERECT_HEIGHT;
                return 0;
            });
        if( SHOW_SPILT_VALUT != 1 ) {
            nodes.select("rect.nodeRect")
                .on("mouseover",_this.showLeafInfo)
                .on("mouseout",_this.hideLeafInfo);
            console.log("get function");
        }
        else{
            nodes.select("rect.nodeRect")
                .on("mouseover", function(){})
                .on("mouseover", function(){});
        }
    }
    this.updateHighlightRects = function (nodes, top_level) {
        nodes.select("rect.nodeRect")
            .transition()
            .duration(function(d){
                if( top_level === 0 ){
                    return 0;
                }
                return duration;
            })
            .delay(function (d, i) {
                if( top_level != undefined ){
                    if( top_level > 0 ){
                        return duration * ( d.level -1 - top_level ) * delayMultiple + duration;
                    }
                    return 0;
                }
                return (duration) * ( d.level - 1 ) * delayMultiple;
            })
            .attr("x", function (d) {
                var text = $("#node" + d.Id + " .nodeText");
                return Number(text.attr("x")) + 22;
            })
            .attr("y", function (d) {
                var text = $("#node" + d.Id + " .nodeText");
                //return -(text.height() / 2) -18;
                return -27;
            })
            .attr("height", function (d) {
                var text = $("#node" + d.Id + " .nodeText");
                //return text.width() + 10;
                return TREE_NODERECT_WIDTH;
            })
            .attr("width", function (d) {
                var text = $("#node" + d.Id + " .nodeText");
                //return text.height() + 3;
                return TREE_NODERECT_HEIGHT;
            });
        // nodes.select("rect.nodeRect")
        //     .filter(".highlight")
        //     .transition()
        //     .duration(2000)
        //     .attr("class","nodeRect show");
        // nodes.exit().remove();
    };

    this.showLeafInfo = function(s) {
        if( s.isLeaf ) {
            s.isLeaf = false;
            s.tempNode = true;
            _this._node
                .each(function (D) {
                    var _thisNode = d3.select(this);
                    _thisNode.select("text.nodeText").select("tspan")
                        .data(function (n) {
                            if (D.isRest) {
                                return [];
                            }
                            if (D.isLeaf) {
                                return D.nodeData["leaf-value"] > 0 ? "+" : "-";
                            }
                            else {
                                // if (D.label === s.label && ( D.tempNode || D.tempNode === false )) {
                                //     return D.nodeData["threshold"];
                                // }
                                return  D.tempNode === true ? [parseFloat(D.label).toPrecision()] : D.label ;
                            }
                        })
                        .text(function (d) {
                            return d.slice( 0, Math.min(d.length, MAX_TEXT_LENGTH) );
                        })
                        .attr("x",0)
                        .attr("style", function (d) {
                            // d = n[0];
                            if (d.search("F") != 0 && d != "+" && d != "-") {
                                return "font-size:8px";
                            }
                            else {
                                return "font-size:12px";
                            }
                        })
                        .attr("dy", function (d) {
                            if (d.search("F") != 0 && d != "+" && d != "-") {
                                return "3.2em";
                            }
                            else {
                                return "2.2em";
                            }
                        })
                        .attr("dx", 0)
                        .style("text-anchor","middle");
                });
        }
        else{
            _this._node
                .each(function(D){
                    var _thisNode = d3.select(this);
                    _thisNode
                        .select("text.nodeText").select("tspan")
                        .data(function(n){
                            if (D.isRest) {
                                return [];
                            }
                            if (D.isLeaf) {
                                return D.nodeData["leaf-value"] > 0 ? "+" : "-";
                            }
                            else {
                                if (D.id === s.id) {
                                    return [ String(D.nodeData["threshold"])] ;
                                 }
                                return [D.label];
                            }
                        })
                        .text(function(d){
                            return d;
                        })
                        .style("text-anchor","middle");
                });
        }
    };
    this.hideLeafInfo = function (s) {
        if( s.isLeaf !=true && s.tempNode && s.tempNode == true){
            s.isLeaf = true;
            s.tempNode = false;
        }
        _this._node
            .each(function(D){
                var _thisNode = d3.select(this);
                _thisNode.select("text.nodeText").select("tspan")
                    .data(function (n) {
                        if (D.isRest) {
                            return [];
                        }
                        if (D.isLeaf) {
                            return D.nodeData["leaf-value"] > 0 ? "+" : "-";
                        }
                        else {
                            return D.label;
                        }
                    })
                    .text(function(d){
                        return d;
                    })
                    .attr("x", 0)
                    .attr("style","font-size:12px")
                    .attr("dy","2.2em")
                    .attr("dx",0)
                    .style("text-anchor","middle");
            });
    };
};
var DrawPin = function () {
    var _this = this;
    this.createPins = function (nodes, treeCut) {
        // nodes.append("svg")
        //     .attr("class", "nodeSvg")
        //     .append("image")
        //     .attr("class", "svgIcon")
        //     .attr("xlink:href", "/static/img/office-push-pin.svg")
        //     .on("click", function (node) {
        //         if (d3.select("#node" + node.Id).select(".svgIcon")[0][0]) {
        //             d3.select("#node" + node.Id).select(".svgIcon").attr("class", "svgIconShow");
        //             treeCut.pin(node, true);
        //         } else if (d3.select("#node" + node.Id).select(".svgIconShow")[0][0]) {
        //             d3.select("#node" + node.Id).select(".svgIconShow").attr("class", "svgIcon");
        //             treeCut.pin(node, false);
        //         }
        //     })
        //     .on("mouseover", function (node) {
        //         d3.select("#node" + node.Id).select(".svgIcon").attr("xlink:href", "/static/img/office-push-pin-black.svg");
        //     })
        //     .on("mouseout", function (node) {
        //         d3.select("#node" + node.Id).select(".svgIcon").attr("xlink:href", "/static/img/office-push-pin.svg");
        //     });
    }
    this.updatePins = function (nodes) {
        // nodes.select("svg.nodeSvg")
        //     .attr("x", function (d) {
        //         var text = $("#node" + d.Id + " .nodeText");
        //         return Number(text.attr("x")) + text.width();
        //     })
        //     .attr("y", function (d) {
        //         var text = $("#node" + d.Id + " .nodeText");
        //         return -(text.height() / 2) - 4;
        //     })
        //     .style("display", function (d) {
        //         return d.isRest ? "none" : "block";
        //     });
    }
};

var drawGrayBar = 1;
var DrawBar = function() {
    var _this = this;
    this.createBars = function(nodes) {
        if( drawGrayBar == 0) {
            nodes.append("g")
                .attr("class", "bar-chart");
            nodes.each(function (n) {
                var _n = d3.select(this).select("g.bar-chart");
                var Rect = _n.selectAll("rect")
                // .data( [get_current_focused_class(), n.data_count[get_current_focused_class()], -1, ( sum(n.data_count) - n.data_count[get_current_focused_class()] ) / 8 ])
                    .data([get_current_focused_class(), n.data_count[get_current_focused_class()], 2, n.data_count[2], 3, n.data_count[3]])
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
                    .attr("rx", 3)
                    .attr("ry", 3);
            });
        }
        else{
            nodes.append("g")
                .attr("class", "bar-chart");
            nodes.each(function (n) {
                var _n = d3.select(this).select("g.bar-chart");
                var Rect = _n.selectAll("rect")
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
                    .attr("rx", 3)
                    .attr("ry", 3);
            });
        }
    };
    this.updateBars = function(nodes,colors) {
        var max_high = 16;
        var top = 18;
        var max_length = 26;
        var sum = function (arr){
            var _s = 0;
            for (var i = 0; i < arr.length; i ++) {
                _s += arr[i];
            }
            return _s || 0;
        };
        if( drawGrayBar == 0) {
            nodes.select("g.bar-chart")
                .each(function (n, j) {
                    var _n = d3.select(this);
                    var fill_color;
                    var stroke_color;
                    _n.selectAll("rect")
                        .attr("x", function (d, i) {
                            if (i % 2 === 0) {
                                return top - 15;
                            }
                            else {
                                var temp = top - Math.round(d * 15);
                                if(  Math.abs(temp - top) < 1.1 ) {
                                    return top - 2;
                                }
                                return temp;
                            }
                        })
                        .attr("y", function (d, i) {
                            if (!n.parent) {
                                return -28 - 8 * Math.floor(i / 2);
                            }
                            if (n.parent.children.indexOf(n) === 1) {
                                return 22 + 8 * Math.floor(i / 2);
                            }
                            else {
                                return -28 - 8 * Math.floor(i / 2);
                            }
                        })
                        .attr("height", "6px")
                        .attr("width", function (d, i) {
                            if (i % 2 === 0) {
                                return 15;
                            }
                            else {
                                var temp =  Math.round(15 * d);
                                if( Math.abs(temp) < 1.1 ){
                                    return 2;
                                }
                                return temp;
                            }
                        })
                        .attr("stroke-width", function (d, i) {
                            if (i % 2 === 0) {
                                return 1;
                            }
                            else {
                                return 0;
                            }
                        })
                        .attr("stroke", function (d, i) {
                            // if( i < 2 ) {
                            //     return color_manager.get_color(get_current_focused_class());
                            // }
                            // else{
                            //     return "gray";
                            // }
                            if (i % 2 == 0) {
                                stroke_color = d;
                                return color_manager.get_color(d);
                            }
                            else
                                return color_manager.get_color(stroke_color);

                        })
                        .attr("fill", function (d, i) {
                            // if( i < 2 ) {
                            //     return color_manager.get_color(get_current_focused_class());
                            // }
                            // else{
                            //     return "gray";
                            // }
                            if (i % 2 == 0) {
                                fill_color = d;
                                return color_manager.get_color(d);
                            }
                            else
                                return color_manager.get_color(fill_color);
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
        }
        else{
            nodes.select("g.bar-chart")
                .each(function (n, j) {
                    var _n = d3.select(this);
                    var fill_color;
                    var stroke_color;
                    _n.selectAll("rect")
                        .attr("x", function (d, i) {
                            if (i % 2 === 0) {
                                return top - 15;
                            }
                            else {
                                var temp = top - Math.round(d * 15);
                                if(  Math.abs(temp - top) < 1.1 ) {
                                    return top - 2;
                                }
                                return temp;
                            }
                        })
                        .attr("y", function (d, i) {
                            if (!n.parent) {
                                return -30 - 8 * Math.floor(i / 2);
                            }
                            if (n.parent.children.indexOf(n) === 1) {
                                return 22 + 8 * Math.floor(i / 2);
                            }
                            else {
                                return -30 - 8 * Math.floor(i / 2);
                            }
                        })
                        .attr("height", "8px")
                        .attr("width", function (d, i) {
                            if (i % 2 === 0) {
                                return 15;
                            }
                            else {
                                var temp =  Math.round(15 * d);
                                if( Math.abs(temp) < 1.1 ){
                                    return 2;
                                }
                                return temp;
                            }
                        })
                        .attr("stroke-width", function (d, i) {
                            if (i % 2 === 0) {
                                return 1;
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
                        .attr("opacity",function(d,i){
                            if( DRAW_BAR === 1){
                                return 1;
                            }
                            else{
                                return 0;
                            }
                        })
                });
        }
    };
};
var DrawDepthNode = function () {
    var _this = this;
    this.createDepthNodes = function (nodes) {
        //     nodes.append("path")
        //         .attr('class', 'nodeDepth')
        //         .style("opacity", 0);
    }
    this.updateDepthNodes = function (nodes) {
        // nodes.select("path.nodeDepth")
        //     .attr("d", function (d) {
        //         var radiu = 5;
        //         var text = $("#node" + d.Id + " .nodeText");
        //         var startX = text.width() + Number(text.attr("x")) + 5;
        //         var len = (d.getDepth()) * radiu;
        //         var x1 = startX + len * 0.5, x2 = len + startX - len * 0.5, x3 = len + startX;
        //         return "M" + startX + " 0 C" + x1 + " 0 " + x2 + " -" + radiu + " " + x3 + " -" + radiu + " A" + radiu + " " + radiu + " 0 1 1 " + x3 + " " + radiu + " C" + x2 + " " + radiu + " " + x1 + " 0 " + startX + " 0 Z";
        //     })
        //     .style("opacity", function (d) {
        //         return 0;
        //         //return (d.allChildren && d.allChildren.length > 0 && (!d.myChildren || d.myChildren.length === 0)) ? 1 : 0;
        //     });
    }
};

var DrawRestNode = function (dragListener) {
    var _this = this;
    this.createRestNodes = function (nodes) {
        // nodes.filter(".rest").append("ellipse")
        //     .attr('class', 'nodeRest')
        //     .attr("cx", 13)
        //     .attr("rx", 6)
        //     .attr("ry", function (d) {
        //         return 0;
        //     });
    }
    this.updateRestNode = function (nodes) {
        // nodes.select(".nodeRest")
        //     .attr("ry", function (d) {
        //         return 6 + Math.log10(d.restChildrenCnt) * 6;
        //     })
        //     .attr("fill", function (d) {
        //         var parent = d;
        //         while (parent.parent) {
        //             parent = parent.parent;
        //         }
        //         var tmp = parseInt((1 - (d.restDocumentCnt / parent.documentCnt)) * 100) + 85;
        //         return "rgb(" + tmp + "," + tmp + "," + tmp + ")";
        //     });
    }
};

var DrawLink = function () {
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
        // link
        //     .attr("d", function (d) {
        //         if (draggingNode && draggingNode === d.target) {
        //             return null;
        //         }
        //         var text = $("#node" + d.source.Id + " .nodeText");
        //         var o = {
        //             x: d.source.x,
        //             y: d.source.y + text.width() + Number(text.attr("x")) + 25//labelwidth
        //         };
        //         return diagonal({
        //             source: o,
        //             target: d.target
        //         });
        //     })
        //     .transition()
        //     .duration(duration)
        //     .style("opacity", 0)
        // ;
    }
    this.updateLinks1 = function (links, draggingNode, time_length) {
        links.transition()
            .duration(duration)
            .attr("d", function (d) {
                if (draggingNode && draggingNode === d.target) {
                    return null;
                }
                var text = $("#node" + d.source.Id + " .nodeText");
                var o = {
                    x: d.source.x,
                    y: d.source.y + text.width() + Number(text.attr("x")) + 5//labelwidth
                };
                return diagonal({
                    source: o,
                    target: d.target
                });
            });
        var j = 0;
        // var bias = new Array(3000);
        // for (; j < 3000; j++) {
        //     bias[j] = 0;
        // }
        for (j = 0; j < time_length; j++) {
            d3.selectAll(".restlink.rl_" + j.toString())
                .transition()
                .duration(duration)
                .style("opacity", function (d) {
                    return 1;
                })
                .style('stroke', color_origin[j])
                .style('stroke-width', function (d) {
                    //return (parseInt(d.splits[j]*10)+1).toString() + "px";
                    //"+1" in case that line width is less than one and would not be draw in screen
                    return ( scaleSplit(d.intra_splits[j]) ).toString() + "px";
                })
                .attr("d", function (d, i) {
                    bias[i] = bias[i] + scaleSplit(d.intra_splits[j]);
                    //console.log(bias[i]);
                    //console.log(d.splits);
                    if (d.parent == null) return;
                    var text = $("#node" + d.parent.Id + " .nodeText");
                    if ((d.parent.x - d.x ) < 0) {
                        var t = {
                            x: 0 + bias[i] - scaleSplit(d.intra_splits[j]) / 2,
                            y: 0
                        };
                        var s = {
                            x: d.parent.x - d.x + bias[i] - scaleSplit(d.intra_splits[j]) / 2,
                            y: d.parent.y + text.width() + Number(text.attr("x")) + 5 - d.y
                        };
                        return diagonal({
                            source: s,
                            target: t
                        });
                    }
                    else {
                        var t = {
                            x: 0 - bias[i] + scaleSplit(d.intra_splits[j]) / 2,
                            y: 0
                        };
                        var s = {
                            x: d.parent.x - d.x - bias[i] + scaleSplit(d.intra_splits[j]) / 2,
                            y: d.parent.y + text.width() + Number(text.attr("x")) + 5 - d.y
                        };
                        return diagonal({
                            source: s,
                            target: t
                        });
                    }
                });
        }
        /*
         d3.selectAll(".restlink.bottom")
         .transition()
         .duration(duration)
         .style('stroke','blue')
         .style('stroke-width','2px')
         .attr("d", function (d) {
         if (d.parent == null) return;
         var text = $("#node" + d.parent.Id + " .nodeText");
         var t = {
         x: -2,
         y: 0
         };
         var s = {
         x: d.parent.x - d.x - 2,
         y: d.parent.y + text.width() + Number(text.attr("x")) + 5 - d.y
         };
         return diagonal({
         source: s,
         target: t
         });
         });
         d3.selectAll(".restlink.middle")
         .transition()
         .duration(duration)
         .style('stroke','green')
         .style('stroke-width','2px')
         .attr("d", function (d) {
         if (d.parent == null) return;
         var text = $("#node" + d.parent.Id + " .nodeText");
         var t = {
         x: 0,
         y: 0
         };
         var s = {
         x: d.parent.x - d.x ,
         y: d.parent.y + text.width() + Number(text.attr("x")) + 5 - d.y
         };
         return diagonal({
         source: s,
         target: t
         });
         });
         */
    }
    this.removeLinks = function (links, nodes) {
        links.exit().transition()
            .duration(duration)
            .style("opacity", 0)
            //.attr("d", function (d) {
            //    var parent = d.source;
            //    while (nodes.indexOf(parent) < 0) {
            //        parent = parent.parent;
            //    }
            //    var o = {
            //        x: parent.x,
            //        y: parent.y
            //    };
            //    return diagonal({
            //        source: o,
            //        target: o
            //    });
            //})
            .remove();
    }

    this.createMoreLinksByCluster = function (nodes, nth) {
        nodes.append("path")
            .attr("class", function (d) {
                return "restlink rl_" + nth;
            })
            .attr("d", function (d) {
                if (d.parent == null) return;
                var text = $("#node" + d.parent.Id + " .nodeText");
                var s = {
                    x: d.parent.x - d.x,
                    y: d.parent.y + text.width() + Number(text.attr("x")) + 5 - d.y
                };
                return diagonal({
                    source: s,
                    target: s
                });
            })
        ;

        //var bias = new Array(3000);
        //for (var j = 0; j < 3000; j++) {
        //    bias[j] = 0;
        //}
        d3.selectAll(".restlink.rl_" + nth.toString())
            .transition()
            .duration(duration)
            .style('stroke', color_origin[j])
            .style('stroke-width', function (d) {
                return (parseInt(d.target.splits[nth - 1] * 10) + 1).toString() + "px";
            })
            .attr("d", function (d1, i) {
                var d = d1.target;
                bias[i] = bias[i] + scaleSplit(d.intra_splits[nth - 1]) / 2;
                //console.log(bias[i]);
                //console.log(d.splits);
                if (d.parent == null) return;
                var text = $("#node" + d.parent.Id + " .nodeText");
                if ((d.parent.x - d.x ) < 0) {
                    var t = {
                        x: 0 + bias[i] - scaleSplit(d.intra_splits[nth - 1]) / 2,
                        y: 0
                    };
                    var s = {
                        x: d.parent.x - d.x + bias[i] - scaleSplit(d.intra_splits[nth - 1]) / 2,
                        y: d.parent.y + text.width() + Number(text.attr("x")) + 5 - d.y
                    };
                    return diagonal({
                        source: s,
                        target: t
                    });
                }
                else {
                    var t = {
                        x: 0 - bias[i] + scaleSplit(d.intra_splits[nth - 1]) / 2,
                        y: 0
                    };
                    var s = {
                        x: d.parent.x - d.x - bias[i] + scaleSplit(d.intra_splits[nth - 1]) / 2,
                        y: d.parent.y + text.width() + Number(text.attr("x")) + 5 - d.y
                    };
                    return diagonal({
                        source: s,
                        target: t
                    });
                }
            });
    };

    this.updateLinks = function (links, draggingNode, colors, nodes, tree_height,top_level ) {
        //console.log( "tree_height " + tree_height);
        // if( first_flag === 1 ){
        //     first_flag = 0;
        //     return;
        // }
        links
            .attr("d", function (d) {
                if (draggingNode && draggingNode === d.target) {
                    return null;
                }
                var text = $("#node" + d.source.Id + " .nodeText");
                var o = {
                    x: d.source.x,
                    y: d.source.y + text.width() + Number(text.attr("x")) + 25//labelwidth
                };
                return diagonal({
                    source: o,
                    target: d.target
                });
            })
            .transition()
            .duration(duration)
            .style("opacity", 0)
        ;
        var sum = function (arr) {
            var _s = 0;
            for (var i = 0; i < arr.length; i++) {
                _s += arr[i];
            }
            return _s || 0;
        };

        function weight(i, len, diff, width) {
            if (_.max(width) < 4) {
                return ( i - ( len - 1 ) / 2.0 ) * diff * 0.01 * ( 1 - Math.pow(diff / 500, 0.2) );
                // return 0;
            }
            return ( i - ( len - 1 ) / 2.0 ) * diff * 0.026 * ( 1 - Math.pow(diff / 500, 0.5) ) * ( 1 + (width[i] - 1) * 0.2 );
        }

        //function stroke_width(input) {
        //    if (input < 0.01) {
        //        return 0;
        //    }
        //    else if (input < 0.025) {
        //        return 1;
        //    }
        //    else {
        //        return scaleSplit(input);
        //    }
        //}

        var stroke_width = 1;

        return nodes
            .select("g.restlink-group")
            .each(function (g, j) {
                var group = d3.select(this);
                var links = group.selectAll("path.restlink");
                // links = links.data(g.lineNum_splits || []);
                // links.enter()
                //     .append("path");
                // if ( g.level != level ) return;
                if( 1 ) {
                    links = links
                        .transition()
                        .duration(function (d) {
                            if (top_level === 0) {
                                return duration;
                            }
                            //console.log(duration);
                            return duration;
                        })
                        .delay(function (d, i) {
                            if (top_level != undefined) {
                                if (top_level > 0) {
                                    return duration * ( g.level - 1 - top_level ) * delayMultiple + duration;
                                }
                                return 0;
                            }
                            return (duration) * ( g.level - 1 ) * delayMultiple;
                        });
                }
                    links
                    .attr("class", function (d, i) {
                        return "restlink rl-" + i;
                    })
                    .style('stroke', function (d, i) {
                        if (i === (g.lineNum_splits.length - 1)) {
                            return "gray";
                        }
                        return colors[g.color_index[i]];
                    })
                    .style('stroke-width', stroke_width + "px")
                    .style("opacity", function (d, i) {
                        if (i === ( g.lineNum_splits.length - 1)) {
                            if (DRAW_BAR != 1) {
                                return (1 - i) / 2.0;
                            }
                            else {
                                return 1;
                            }
                        }
                        if (DRAW_BAR === 1) {
                            return 0;
                        }
                        else {
                            return 1;
                        }
                    })
                    .attr("d", function (d, i) {
                        if (g.parent == null) return;
                        if (DRAW_BAR != 1) {
                            var text = $("#node" + g.parent.Id + " .nodeText");
                            if ((g.parent.x - g.x ) < 0) {
                                var x_start = i * stroke_width + 0.5 - g.color_index.length / 2;
                                var y_start = 0;
                                var x_end = g.parent.x - g.x + i * stroke_width + 0.5 + ( sum(g.parent.lineWidth_splits) / 2 - sum(g.lineWidth_splits)  );
                                var y_end = -tree_height;
                                var x_start_control = x_start;
                                var y_start_control = -tree_height / 2 - weight(i, g.splits.length, Math.abs(x_start - x_end), g.lineNum_splits);
                                var x_end_control = x_end;
                                var y_end_control = -tree_height / 2 - weight(i, g.splits.length, Math.abs(x_start - x_end), g.lineNum_splits);
                            }
                            else {
                                var x_start = +i * stroke_width + 0.5 - sum(g.lineWidth_splits) / 2;
                                var y_start = 0;
                                var x_end = g.parent.x - g.x + i * stroke_width + 0.5 - sum(g.parent.lineWidth_splits) / 2;
                                var y_end = -tree_height;
                                var x_start_control = x_start;
                                var y_start_control = -tree_height / 2 + weight(i, g.splits.length, Math.abs(x_start - x_end), g.lineNum_splits);
                                var x_end_control = x_end;
                                var y_end_control = -tree_height / 2 + weight(i, g.splits.length, Math.abs(x_start - x_end), g.lineNum_splits);
                            }
                            //console.log("node" + g.id + ": M" + y_end + "," + x_end + "C" + y_end_control + "," + x_end_control + " " + y_start_control + "," + x_start_control + " " + y_start + "," + x_start );
                            return "M" + y_end + "," + x_end + "C" + y_end_control + "," + x_end_control + " " + y_start_control + "," + x_start_control + " " + y_start + "," + x_start;
                        }
                        else {
                            var x_start = 0;
                            var y_start = 0;
                            var x_end = g.parent.x - g.x;
                            var y_end = -tree_height;
                            var x_start_control = x_start;
                            var y_start_control = -tree_height / 2;
                            var x_end_control = x_end;
                            var y_end_control = -tree_height / 2;
                            return "M" + y_end + "," + x_end + "C" + y_end_control + "," + x_end_control + " " + y_start_control + "," + x_start_control + " " + y_start + "," + x_start;
                        }
                    })
                    // .transition()
                    // .duration(duration)
                    // .attr("d",function(d,i){
                    //     return "M" + 0 + "," + 0 + "C" + 0 + "," + 0 + " " + 0 + "," + 0 + " " + 0 + "," + 0;
                    // })
                ;
            });
    };

    this.showRestLinks = function (nodes) {
        nodes.append("g")
            .attr("class", "restlink-group")
            .attr("id", function (n, i) {
                return "rl-group-" + n.id;
            });
        nodes
            .each(function (n) {
                //if( n.lineWidth_splits.length < 2 ) console.log("only one line" + n.Id );
                var d = n;
                var node = d3.select(this).select("g.restlink-group");
                var restLinks = node.selectAll("path.restlink").data(n.lineNum_splits || []);
                restLinks.enter()
                    .append("path");
                restLinks
                    .attr("class", function (d, i) {
                        return "restlink rl-" + i.toString();
                    })
                    .attr("d", function (d1) {
                        if (d.parent == null) return;
                        //var text = $("#node" + d.parent.Id + " .nodeText");
                        var s = {
                            x: d.parent.x - d.x,
                            y: d.parent.y + 12 - d.y
                        };
                        return diagonal({
                            source: s,
                            target: s
                        });
                    });
                restLinks.exit().remove();
            });
    };
}


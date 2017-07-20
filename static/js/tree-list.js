/**
 * Created by Derek Xiao on 2017/5/4.
 */
/**
 * Created by Derek Xiao on 2017/3/17.
 */
var treeCutList = [];
function TreeList(container) {
    var that = this;
    var bbox = container.node().getBoundingClientRect();
    that.container = container;
    that.container
        .transition()
        .duration(500)
        .style("opacity", 0);
    that.bbox = bbox;
    that.cell_count = 5;
    that.scrollbar_height = 10;
    that.single_tree_height = that.bbox.height - that.scrollbar_height - 10;
    that.resultTrees = [];
    that.container.selectAll(".tree-thumb")
        .transition()
        .duration(300)
        .style("margin-left", 0)
        .remove();
    //that.container.selectAll("div").remove();
    //that.title = that.container.append("div");
    //that.title.append("text")
    //    .text("Tree Cluster")
    //    .style("padding-left", "0.3%")
    //    .style("font-size", 11 + "px");
}

TreeList.prototype._expand2level = function (root, level) {
    var selectionArr = [];
    var traversal = function (r) {
        if (r) {
            if (r.level == level) {
                selectionArr.push(r);
            } else {
                if (r.C) {
                    traversal(r.C[0]);
                    traversal(r.C[1]);
                }
            }
        }
    };
    traversal(root);
    return selectionArr;
};

TreeList.prototype.highlight_representative_tree = function (tree_index, class_) {
    var that = this;
    d3.selectAll(".tree-thumb").style("background-color", null);
    var t = d3.select(".tree-thumb#tree-thumb-" + class_ + "-" + tree_index);
    if (t.node()) {
        t.style("background-color", "#f5f5f5");
    }
};

TreeList.prototype._expand = function( root ){
    var selectionArr = [];
    var traversal_all = function( r ) {
        if( r.C ){
            traversal_all(r.C[0]);
            traversal_all(r.C[1]);
        }
        else{
            if( r.level <= 8 )
                selectionArr.push(r);
        }
    };
    traversal_all(root);
    return selectionArr;
};

TreeList.prototype._leafnode_range = function (tree, max_level) {
    var leafnode_min = Number.MAX_VALUE;
    var leafnode_max = Number.MIN_VALUE;
    var all_position = [];
    var traversal = function (r, position, width) {
        if (r.C) {
            traversal(r.C[0], position - width / 4, width / 2);
            traversal(r.C[1], position + width / 4, width / 2);
        } else {
            leafnode_max = Math.max(leafnode_max, position);
            leafnode_min = Math.min(leafnode_min, position);
            all_position.push(position);
        }
    };

    var d = Math.pow(2, max_level + 1);
    traversal(tree, 0, d);
    return [leafnode_min, leafnode_max];
};

TreeList.prototype.show_tree_list = function (class_) {
    //if (cluster_number == undefined) {
    //    cluster_number = 5;
    //}
    var tree_index = CLASSIFIER_CLUSTERING_RES["medoids"];
    var avg_tree_size = CLASSIFIER_CLUSTERING_RES["cluster_average_tree_size"];
    var tree_counts = CLASSIFIER_CLUSTERING_RES["cluster_inst_set"].map(function (c) { return c.length; });
    var that = this;
    that.focused_class = class_;
    that.resultTrees = [];
    that.container
        .transition()
        .duration(500)
        .style("opacity", 1);
    that.container.selectAll(".tree-thumb")
        .transition()
        .duration(300)
        .attr("width", 0)
        .remove();
    that.single_tree_width = that.bbox.width / that.cell_count - 2;
    list_tree_translateY = that.single_tree_width / 2;
    that.params = {
        "viewerWidth": that.single_tree_width,
        "viewerHeight": that.single_tree_height,
        "translateX": 30,
        "translateY": that.single_tree_width / 2,
        "nodeHeight" : that.single_tree_height / 20,
        "nodeSize": [1, 1.25],
        "type": "Result",
        "tree-depth": 12,
        "Margin" : 20
    };
    var color = color_manager.get_color(class_);
    var padding_left = 0;
    var padding_right = padding_left;
    var view_width = that.single_tree_width - (padding_left + padding_right);
    var translateX = 30;
    treeCutList = [];
    var projection;

    var update_list = function () {
        if (tree_index.length > that.cell_count) {
            that.container.style("overflow-x", "scroll");
            that.single_tree_height = that.bbox.height - that.scrollbar_height - 10;
        } else {
            that.container.style("overflow-x", "hidden");
            that.single_tree_height = that.bbox.height - 10;
        }


        var traversal = function (r, callback) {
            callback(r);
            if (r.C) {
                r.C.forEach(function (c) {
                    traversal(c, callback);
                });
            }
        };


        for (var tree_list_index = 0; tree_list_index < tree_index.length; tree_list_index ++) {
            treeCutList.push([]);
            var svg = that.container.append("svg").attr("id", "tree-thumb-" + class_ + "-" + tree_index[ tree_list_index ])
                .style("padding-left", padding_left)
                .style("overflow", "visible")
                .attr("width", that.single_tree_width)
                .attr("height", that.single_tree_height)
                .attr("class", "tree-thumb")
                .on("click", function (d) {
                    var self = d3.select(this);
                    var iteration = self.attr("id").split("-")[3] - 0;
                    show_tree_classifier(iteration, class_);
                    treesize_barchart.render_tree_size_bar_chart_with_highlights(class_, iteration);
                });
            var o_svg = svg;
            if (tree_list_index != 0) {
                svg.style("border-style", "groove")
                    .style("border-width", "0 0 0 1px")
                    .style("border-color", "grey");
            } else {
                svg.style("margin-left", "0.5%");
            }
            var o_svg = svg;

            that.get_ploted_node(tree_index, class_, tree_list_index, view_width, o_svg );

            var svg = o_svg
                .append("g").attr("class","resultTree_3")
                .style("pointer-events", "none")
                .attr("transform", "translate(" + [0, 30] + ")scale(" + 1 + ")rotate(90)");
            var tree = TREE_CLASSIFIERS[CLASS_COUNT * tree_index[ tree_list_index ] + class_];
            var selectionArr = that._expand2level(tree, 4);
            var max_level = init_tree_level(tree, 0);
            that.params["tree-depth"] = max_level;
            that.params["translateX"] = 30;
            that.params["translateY"] = view_width / 2;
            var margin_bottom = 10;

            var cut_list = treeCutList[ tree_list_index ];
            traversal(tree, function (r) {
                if (cut_list.indexOf(r["i"]) != -1) {
                    r.status = "reserve";
                } else {
                    r.status = "cutted";
                }
            });

            var cutted_count = 0;
            var reserve_count = 0;
            traversal(tree, function (r) {
                if (r.level == max_level) {
                    if (r.status == "reserve") {
                        reserve_count ++;
                    } else {
                        cutted_count ++;
                    }
                }
            });

            if (tree_list_index == 0) {
                that.params["nodeHeight"] = Math.min(1.5, (view_width) / (cutted_count + reserve_count * 2) / 3);
                //console.log(that.params["nodeHeight"]);
                that.params["nodeWidth"] = (that.single_tree_height - that.params["translateX"] - margin_bottom) / (max_level);
            }
            var layout = new TreeLayout(svg, that.params, function (a, b) {
                if (a.status == "reserve" && b.status == "reserve") {
                    return 10;
                } else if (a.status != "reserve" && b.status != "reserve") {
                    return 1.5;
                }
                return 6;
            });

            layout.layoutTreeWithSelectionArr(tree, selectionArr, true, true);

            var instance_dist = that.get_instance_dist(tree_index[ tree_list_index ]);

            var data_distribution_on_nodes = that.get_all_data_distribution(tree_index[tree_list_index], that.focused_class);
            layout.add_data_distribution_on_nodes(data_distribution_on_nodes);

            var nodes = layout.tree.nodes(layout.root);
            var node_x = nodes.map(function (n) { return n.x; });
            var x_max = _.max(node_x);
            var x_min = _.min(node_x);
            //console.log(x_min, x_max);

            if (projection == undefined) {
                projection = d3.scale.linear().domain([x_min, x_max])
                    .range([3, view_width - 3]);
            }

            var domain = projection.domain();
            if (domain[1] - domain[0] < x_max - x_min) {
                projection = d3.scale.linear().domain([x_min, x_max])
                    .range([3, view_width - 3]);
            }

            layout.applyCluster_Preview(instance_dist, color, tree_list_index , function (nodes) {
                nodes.forEach(function (n) {
                    n.x = projection(n.x);
                })
            });
            console.log(x_min, x_max, projection(x_min), projection(x_max));

            var nodes = layout.tree.nodes(layout.root);
            var node_x = nodes.map(function (n) { return n.x; });
            var x_max = _.max(node_x);
            var x_min = _.min(node_x);
            console.log(x_min, x_max, projection(x_min), projection(x_max));
            var scale_x = 1;

            svg.attr("transform", "translate(" + [
                    (projection((x_min + x_max) / 2)) + that.single_tree_width / 2,
                    that.params["translateX"]
                ] + ")rotate(90)scale(1," + scale_x + ")");

            o_svg.append("text")
                .text("avg size: " + Math.floor(avg_tree_size[ tree_list_index ]))
                .attr("x", 1 - padding_left)
                .attr("y", 10)
                .attr("fill", "grey")
                .attr("font-family", "sans-serif")
                .attr("font-size", 11 + "px");
            o_svg.append("text")
                .text("count: " + tree_counts[i])
                .attr("fill", "grey")
                .attr("x", 1 - padding_left)
                .attr("y", 25)
                .attr("font-family", "sans-serif")
                .attr("font-size", 11 + "px");
        }
    };

    var need_to_load = [];
    for (var i = 0; i < tree_index.length; i ++) {
        var ti = tree_index[i] * CLASS_COUNT + class_;
        if (TREE_CLASSIFIERS[ti]) continue;
        need_to_load.push(ti);
    }
    if (need_to_load.length) {
        var loading = add_loading_circle(that.container);
        d3.json("/api/get-classifiers-set" + PARAMS + "&index=" + need_to_load.join("-"))
            .get(function (error, data) {
                var trees = data["trees"];
                var index = data["index"];
                //update(tree, index);
                for (var i = 0; i < index.length; i ++) {
                    TREE_CLASSIFIERS[index[i]] = trees[i];
                }
                d3.text("/api/model-raw-indices" + PARAMS + "&index=" + need_to_load.join("-"))
                    .get(function (error, data) {
                        var splits = data.split("|");
                        for (var i = 0; i < splits.length; i ++) {
                            ALL_TREES[need_to_load[i]] = parse_single_classifier(splits[i]);
                        }
                        update_list();
                        remove_loading_circle(that.container);
                    })
            });
    } else {
        update_list();
    }
};

TreeList.prototype.get_other_class_distribution = function (all, focused_class) {
    var other_distribution = [];
    var class_count = all.length;
    var data_count = all[focused_class].length;
    for (var i = 0; i < data_count; i ++) {
        var sum = 0;
        for (var j = 0; j < class_count; j ++) {
            if (j == focused_class) continue;
            sum += all[j][i];
        }
        other_distribution[i] = sum;
    }
    return other_distribution;
};

TreeList.prototype.get_instance_dist = function (iteration) {
    var that = this;
    var instances = _.filter(_.map(TRUE_LABELS, function (l, i) {
        return l == that.focused_class ? i : -1;
    }), function (l, i) {
        return l != -1;
    });
    var count = calculate_instance_count_on_nodes2(iteration, this.focused_class, instances);
    var count_on_leaves = count["inst_count_on_leaves"].splice(1);
    var count_on_internal = count["inst_count_on_internals"];
    return count_on_internal.concat(count_on_leaves);
};


TreeList.prototype.get_all_data_distribution = function (iteration, class_label) {
    var that = this;

    var instance_set = [];
    for (var k = 0; k < CLASS_COUNT; k++) {
        instance_set[k] = [];
    }

    for (var i = 0; i < INSTANCE_COUNT; i++) {
        instance_set[TRUE_LABELS[i]].push(i);
    }

    var class_distribution = [];

    for (k = 0; k < CLASS_COUNT; k++) {
        var res = calculate_instance_count_on_nodes2(iteration, class_label, instance_set[k]);
        var count_on_leaves = res['inst_count_on_leaves'].splice(1);
        var count_on_internals = res['inst_count_on_internals'];
        class_distribution[k] = count_on_internals.concat(count_on_leaves);
    }

    return class_distribution;
};

TreeList.prototype.get_ploted_node = function(tree_index, class_, tree_list_index, view_width, Svg, color ){
    var svg = Svg.append('g').attr("class","resultTree_tmp");
    var that = this;
    var tree = TREE_CLASSIFIERS[CLASS_COUNT * tree_index[tree_list_index] + class_];
    var max_level = init_tree_level(tree, 0);
    var selectionArr = that._expand2level(tree, 4);
    var params = {
        "viewerWidth": that.single_tree_width,
        "viewerHeight": that.single_tree_height,
        "translateX": 30,
        "translateY": view_width / 2,
        "nodeHeight" : that.single_tree_height / 20,
        "nodeSize": [1, 1.25],
        "type": "Result",
        "tree-depth": max_level,
        "Margin" : 20
    };
    var color = color_manager.get_color(class_);

    var layout = new TreeLayout(svg, params);
    layout.layoutTreeWithSelectionArr(tree, selectionArr, true);

    var data_distribution_on_nodes = that.get_all_data_distribution(tree_index[ tree_list_index ], that.focused_class);
    layout.add_data_distribution_on_nodes(data_distribution_on_nodes);

    var instance_dist = that.get_instance_dist(tree_index[ tree_list_index ]);

    layout.calculate_DOI_and_perfrom_treecut(instance_dist, color, tree_list_index );

    node = layout.tree.nodes( layout.root );
    console.log("tree size::" + node.length);
    for( var n = 0; n < node.length; n++ ){
        treeCutList[tree_list_index].push(node[n].Id);
    }

};
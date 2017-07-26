/**
 * Created by Derek Xiao on 2017/2/26.
 */


function TreeInspector_svg(container) {
    var that = this;
    var bbox = container.node().getBoundingClientRect();
    that.bbox = bbox;
    container.select("#tree-svg").remove();
    that.container = container;
    that.container
        .transition()
        .duration(500)
        .style("opacity", 0);
    that.baseSvg = container.append("svg")
        .attr("id", "tree-svg")
        .attr("version", "1.1")
        .attr("xmlns", "http://www.w3.org/2000/svg");
    that.height = WINDOW_HEIGHT * 0.588;
    that.translateY = bbox.width / 2;//200
    that.translateX = 10;//bbox.width / 2;
    that.params = {
        "viewerWidth": bbox.width,
        "viewerHeight": bbox.height,
        "translateX": that.translateX,
        "translateY": that.translateY,
        "type": "Result",
        "tree-depth": 12
    };

    that.zoom = d3.behavior.zoom()
        .scaleExtent([0.1, 10])
        .on("zoom", that.zoomed);

    that.zoomed = function () {
        var t = d3.event.translate;
        that.holder.attr("transform", "translate(" + [t[0] + that.translateX, t[1]] + ")scale(" + d3.event.scale + ")rotate(90)");
    };
    that.baseSvg.call(that.zoom);

    that.holder = that.baseSvg.attr("width", bbox.width)
        .attr("height", bbox.height)
        .attr("class", "overlay")
        .append("g").attr("class", "resultTree");
    //.call(that.zoom);
    that.resultTree = new TreeLayout(that.holder, that.params);
    that.iteration = 0;
    that.class_ = 0;
    that.cluster_history = [];
    that.calculate_all_instance = false;
}

TreeInspector_svg.prototype._expand2level = function (root, level) {
    var selectionArr = [];
    var traversal = function (r) {
        if (r) {
            if (r.level == level) {
                selectionArr.push(r);
            } else {
                if (r.Children) {
                    traversal(r.Children[0]);
                    traversal(r.Children[1]);
                }
            }
        }
    };
    traversal(root);
    return selectionArr;
};

TreeInspector_svg.prototype.clear_clusters = function () {
    this.cluster_history = [];
    this.resultTree.clearClusters();
    //this.resultTree.update();
    this.draw_tree(this.iteration || 0, get_current_focused_class());
    feature_matrix.render_feature_ranking();
};

TreeInspector_svg.prototype.get_all_data_distribution = function (iteration, class_label) {
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

TreeInspector_svg.prototype.draw_next_tree = function () {
    var that = this;
    if (typeof that.iteration != "undefined" && typeof that.class_ != "undefined") {
        if (that.iteration + 1 == ITERATION_COUNT) {
            return;
        }
        that.draw_tree(that.iteration + 1, that.class_);
        //that.draw_next_tree(that.iteration - 2);
    }
};

TreeInspector_svg.prototype.draw_prev_tree = function () {
    var that = this;
    if (typeof that.iteration != "undefined" && typeof that.class_ != "undefined") {
        if (that.iteration == 0) {
            return;
        }
        that.draw_tree(that.iteration - 1, that.class_);
    }
};

TreeInspector_svg.prototype.draw_tree = function (iteration, class_) {
    var that = this;
    that.container
        .transition()
        .duration(500)
        .style("opacity", 1);
    that.container
        .attr("data-hint", "classifier structure")
        .attr("data-position", "top");
    that.baseSvg.select(".resultTree").remove();
    clear_tree_view_header_indicator();
    that.holder = that.baseSvg
        .append("g").attr("class", "resultTree");
    //.call(that.zoom);
    //that.params["tree-depth"] = TREE_MAX_DEPTH;

    var update = function (tree, tree_index) {
        that.calculate_all_instance = false;
        TREE_CLASSIFIERS[tree_index] = tree;
        var max_level = init_tree_level(tree, 0);
        var selectionArr = that._expand2level(tree, 4);
        that.params["tree-depth"] = Math.min(max_level, SHOW_MAX_DEPTH);
        //console.log(max_level);
        that.resultTree = new TreeLayout(that.holder, that.params);
        // that.holder.attr("transform", "translate(" + [that.translateX, 0] + ")scale(" + 1 + ")rotate(90)");
        that.holder.attr("transform", "translate(" + [that.translateY, that.translateX] + ")rotate(90)");
        that.iteration = iteration;
        that.class_ = class_;
        that.baseSvg.on("click", function () {
            //save_tree2local(that.iteration, that.class_);
        });

        that.resultTree.layoutTreeWithSelectionArr(tree, selectionArr, true);
        update_tree_view_header_indicator(iteration, class_);

        if (is_instance_mode() == true) {
            return;
        }

        if (that.cluster_history.length > 0) {
            if (!that.calculate_all_instance) {
                var data_distribution_on_nodes = that.get_all_data_distribution(that.iteration, that.class_);
                that.resultTree.add_data_distribution_on_nodes(data_distribution_on_nodes);
            }
            for (var i = 0; i < that.cluster_history.length; i ++) {
                var record = that.cluster_history[i];
                that.plot_cluster(record.cluster, color_manager.get_color(record.label));
            }
        } else {
            try {
                var data_distribution_on_nodes = that.get_all_data_distribution(that.iteration, that.class_);
                that.resultTree.add_data_distribution_on_nodes(data_distribution_on_nodes);
                that.plot_all_instances(data_distribution_on_nodes, class_);
                that.calculate_all_instance = true;
            } catch (err) {}
        }
    };
    var tree_index = CLASS_COUNT * iteration + class_;
    if (TREE_CLASSIFIERS[tree_index]) {
        if (ALL_TREES[tree_index]) {
            update(TREE_CLASSIFIERS[tree_index], tree_index);
        } else {
            var loading = add_loading_circle(that.container);
            d3.text("/api/model-raw-index" + PARAMS + "&index=" + tree_index, function (data) {
                var tree_info = parse_single_classifier(data);
                ALL_TREES[tree_index] = tree_info;
                update(TREE_CLASSIFIERS[tree_index], tree_index);
                d3.select(loading).remove();
            });
        }
    } else {
        var loading = add_loading_circle(that.container);
        d3.json("/api/get-classifier-index" + PARAMS + "&index=" + tree_index)
            .get(function (error, data) {
                var tree = data["tree"];
                var index = data["index"];
                if (ALL_TREES[tree_index]) {
                    update(tree, index);
                } else {
                    d3.text("/api/model-raw-index" + PARAMS + "&index=" + tree_index, function (data) {
                        var tree_info = parse_single_classifier(data);
                        ALL_TREES[tree_index] = tree_info;
                        update(tree, index);
                        remove_loading_circle(that.container);
                        //d3.select(loading).remove();
                    });
                }
            });
    }
};

TreeInspector_svg.prototype.plot_all_instances = function (data_distribution, focused_class) {
    var that = this;

    var focus_distribution = data_distribution[focused_class];
    var other_distribution = [];
    for (var i = 0; i < data_distribution[focused_class].length; i++) {
        other_distribution[i] = 0;
    }
    for (var c = 0; c < CLASS_COUNT; c++) {
        if (c != focused_class) {
            for (i = 0; i < data_distribution[c].length; i++) {
                other_distribution[i] += data_distribution[c][i];
            }
        }
    }

    that.resultTree.applyCluster(focus_distribution, color_manager.get_color(focused_class));
    that.resultTree.applyCluster(other_distribution, color_manager.get_noob_color1(), true);
};

TreeInspector_svg.prototype.plot_cluster = function (cluster, color) {
    var count = calculate_instance_count_on_nodes2(this.iteration, this.class_, cluster);
    var count_on_leaves = count["inst_count_on_leaves"].splice(1);
    var count_on_internal = count["inst_count_on_internals"];
    this.resultTree.applyCluster(count_on_internal.concat(count_on_leaves), color);
};

TreeInspector_svg.prototype.update_cluster_information = function () {
    var that = this;

    that.cluster_history = [];
    that.resultTree.clearClusters();

    for (var j = 0; j < confidence_lines.cluster_label_set.length; j++) {
        var cluster = confidence_lines.clusters[confidence_lines.cluster_label_set[j]][confidence_lines.cluster_id_set[j]];
        var label = SELECTED_CLASSES[confidence_lines.cluster_label_set[j]];

        that.plot_cluster(cluster, color_manager.get_color(label));

        that.cluster_history.push({
            "cluster": cluster,
            "label": label
        });
    }
};

TreeInspector_svg.prototype.add_cluster = function (cluster, label) {
    var that = this;

    that.cluster_history.push({
        "cluster" : cluster,
        "label" : label
    });
};
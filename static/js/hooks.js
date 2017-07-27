/**
 * Created by Derek Xiao on 2017/2/8.
 */

var show_tree_classifier = function (iteration, class_) {
    class_ = class_ || confidence_lines.focused_class;
    iteration = Math.max(iteration, 0);
    iteration = Math.min(iteration, ITERATION_COUNT - 1);
    tree_inspector.draw_tree(iteration, class_);
    tree_list_highlight(iteration, class_);
};

var recluster_tree_classifier = function (number) {
    console.log("recluster", number);
    CLASSIFIER_CLUSTER_NUMBER = number;
    confidence_lines.perform_advanced_clustering_on_trees(confusion_matrix.reverse_ranking[confidence_lines.focused_class]);
};

// add by Changjian, this funcion
var clear_tree_view_header_indicator = function () {
    if (!USING_CLASSIFIER) {
        return;
    }
    $("#tree-iteration-indicator").val("-1");
    $("#tree-class-indicator").text("-");
};

var update_tree_view_header_indicator = function (iteration, class_) {
    if (!USING_CLASSIFIER) {
        return;
    }
    $("#tree-iteration-indicator").val((iteration - - 1));
    $("#tree-class-indicator").text("C" + (class_ - - 1))
        .css("color", "grey");
};

var is_instance_mode = function () {
    if (confidence_lines == undefined) {
        return false;
    }
    return (confidence_lines.activated == true
                    && confidence_lines.mode == confidence_lines.instanceMode);
};

var confidence_lines_label_length = function () {
    if (confidence_lines) {
        return confidence_lines.cluster_label_set.length;
    } else {
        return 0;
    }
};

var tree_list_highlight = function (tree_index, class_) {
    if (!USING_CLASSIFIER) {
        return;
    }
    tree_list.highlight_representative_tree(tree_index, class_);
};

var get_current_focused_class = function () {
    if (confidence_lines) {
        return confidence_lines.focused_class;
    } else {
        return -1;
    }
};

var focus_on_class = function (focused_class) {
    if (USING_CLASSIFIER) {
        // add by Changjian, 2017/7/18
        tree_list.show_tree_list(focused_class);
    }
    class_selector.highlight_class(confusion_matrix.reverse_ranking[focused_class]);
};

var confidence_lines_mousedown = function (e) {
    var loc = windowToCanvas(this, e.clientX, e.clientY);
    e.preventDefault();
    confidence_lines.canvas_mousedown(loc, this);
};

var confidence_lines_mousemove = function (e) {
    var loc = windowToCanvas(this, e.clientX, e.clientY);
    e.preventDefault();
    confidence_lines.canvas_mousemove(loc, this);
};

var confidence_lines_mouseout = function (e) {
    confidence_lines.canvas_mouseout();
};

var click_class = function (label) {
    confidence_lines.focused_class = label;
    confidence_lines.get_instance_line_chart(label);
    feature_matrix.render_feature_ranking();
    $("#self-column-3").css("opacity", 1);

    // add by Changjian,
    if (USING_CLASSIFIER) {
        treesize_barchart.render_tree_size_bar_chart(label);
        tree_inspector.clear_clusters();
    }
};

var add_loading_circle = function (container, min_gap) {
    var elem = d3.select(".origin-holder>.preloader-wrapper").node().cloneNode(true);
    var bbox = container.node().getBoundingClientRect();
    container.node().append(elem);
    var gap = Math.min(bbox.width, bbox.height) * 0.02;
    if (min_gap == undefined) {
        min_gap = 18;
    }
    if (gap < min_gap) {
        gap = min_gap;
    }
    d3.select(elem)
        .style("position", "fixed")
        .style("top", (bbox.top + gap))
        .style("left", bbox.left + gap);
    return elem;
};

var remove_loading_circle = function (container) {
    container.selectAll(".preloader-wrapper").remove();
};

var add_options = function (target, options) {
    var select = document.getElementById(target);

    for (var i = 0; i < options.length; i++){
        var opt = document.createElement('option');
        opt.value = options[i];
        opt.innerHTML = options[i];
        select.appendChild(opt);
    }
}

var window_resize = function (width, height) {
    confusion_matrix.resize();
    confidence_lines.resize();
    feature_matrix.resize();
};
var show_positive_instances_link = function() {
    var nodes = tree_inspector.resultTree.baseSvg.selectAll('.node');
    nodes.each(function(n,i){
        var node = d3.select(this);
        var links = node.selectAll("path.restlink");
        links.style("opacity",function(d,j){
            if( j != ( n.lineNum_splits.length - 1) ){
                return 1;
            }
            else{
                return -1;
            }
        });
    });
};


var hide_positive_instance_link = function(){
    // var nodes = tree_inspector.resultTree.baseSvg.selectAll('.node');
    // nodes.each(function(n,i){
    //     var node = d3.select(this);
    //     var links = node.selectAll("path.restlink");
    //     links.style("opacity",function(d,j){
    //         if(  j != ( n.lineNum_splits.length - 1) ) {
    //             if (n.color_index[j] != n.color_index[n.color_index.length - 1]) {
    //                 return 0;
    //             }
    //             else {
    //                 return 1;
    //             }
    //         }
    //         else{
    //             return -1;
    //         }
    //     });
    // });
    // tree_inspector.resultTree.clearClusters();
    var focused_class = get_current_focused_class();
    var split_colors = tree_inspector.resultTree.split_colors;
    tree_inspector.resultTree.split_colors = [];
    for( var i = 0; i < split_colors.length; i++ ){
        if( split_colors[i] != color_manager.get_color(focused_class) ){
            tree_inspector.resultTree.split_colors.push(split_colors[i]);
        }
    }
    for( var n = 0; n < tree_inspector.resultTree.treeNodeDic.length; n++ ){
        var tmp_raw_splits = tree_inspector.resultTree.treeNodeDic[n].raw_splits;
        tree_inspector.resultTree.treeNodeDic[n].raw_splits = [];
        for( var i = 0; i < split_colors.length; i++ ){
            if( split_colors[i] != color_manager.get_color(focused_class) ){
                tree_inspector.resultTree.treeNodeDic[n].raw_splits.push( tmp_raw_splits[i]);
            }
        }
    }
    tree_inspector.resultTree.applyCluster();
};


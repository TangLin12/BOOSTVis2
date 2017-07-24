/**
 * Created by Derek Xiao on 2017/2/8.
 */

var on_timepoint_highlight = function (p) {
    $("#iteration-indicator").text(p);
    navigation.on_instance_timepoint_highlight(p);
};

var show_tree_classifier = function (iteration, class_) {
    class_ = class_ || confidence_lines.focused_class;
    iteration = Math.max(iteration, 0);
    iteration = Math.min(iteration, ITERATION_COUNT - 1);
    tree_inspector.draw_tree(iteration, class_);
    tree_list_highlight(iteration, class_);
    //  edit by Changjian, 17/7/18
    // it concerns navigation which is not involved in  this edition.
    // on_timepoint_highlight(iteration);
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
    return (confidence_lines.activated == true
                    && confidence_lines.mode == confidence_lines.instanceMode);
};

var get_current_focused_class = function () {
    return confidence_lines.focused_class;
};

var tree_list_highlight = function (tree_index, class_) {
    if (!USING_CLASSIFIER) {
        return;
    }
    tree_list.highlight_representative_tree(tree_index, class_);
};

var focus_on_class = function (focused_class) {
    if (USING_CLASSIFIER) {
        // add by Changjian, 2017/7/18
        tree_list.show_tree_list(focused_class);
    }
    class_selector.highlight_class(confusion_matrix.reverse_ranking[focused_class]);
};

var click_class = function (label) {
    confidence_lines.focused_class = label;
    confidence_lines.get_instance_line_chart(label);
    feature_matrix.render_feature_ranking();

    // add by Changjian,
    if (USING_CLASSIFIER) {
        treesize_barchart.render_tree_size_bar_chart(label);
        tree_inspector.clear_clusters();
    }
};

var retrieve_posterior = function (class_, callback) {
    console.log("request posterior", class_);
    if (POSTERIOR_ALL[class_]) {
        callback(POSTERIOR_ALL[class_]);
    } else {
        var task = "/api/posterior-by-class" + PARAMS + "&class_=" + class_;
        var oReq = new XMLHttpRequest();
        oReq.open("GET", task, true);
        oReq.responseType = "arraybuffer";
        oReq.setRequestHeader("cache-control", "no-cache");

        oReq.onload = function (oEvent) {
            var arrayBuffer = oReq.response;
            if (arrayBuffer) {
                var byteArray = new Float32Array(arrayBuffer);

                POSTERIOR_ALL[class_] = byteArray;

                callback(POSTERIOR_ALL[class_]);
            }
        };
        oReq.send(null);
    }
};

// add by Changjian , 2017/7/13
var retrieve_clustering = function( class_, callback){
    console.log("request clustering", class_);
    if ( CLUSTERING_ALL[class_]){
        callback( CLUSTERING_ALL[class_]);
    }
    else{
        var task = '/api/clustering-by-class' + PARAMS + "&class_=" + class_;
        var oReq = new XMLHttpRequest();
        oReq.open( "GET", task, true);
        oReq.responseType = "arraybuffer";
        oReq.setRequestHeader("cache-control", "no-cache");
        oReq.onload = function(oEvent){
            var arrayBuffer = oReq.response;
            if( arrayBuffer){
                var byteArray = new Float32Array(arrayBuffer);
                CLUSTERING_ALL[class_] = byteArray;
                callback( POSTERIOR_ALL[class_]);
            }
        };
        oReq.send(null);
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

function add_options(target, options) {
    var select = document.getElementById(target);

    for (var i = 0; i < options.length; i++){
        var opt = document.createElement('option');
        opt.value = options[i];
        opt.innerHTML = options[i];
        select.appendChild(opt);
    }
}

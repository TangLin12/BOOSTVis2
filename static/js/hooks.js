/**
 * Created by Derek Xiao on 2017/2/8.
 */

var recluster_tree_classifier = function (number) {
    console.log("recluster", number);
    CLASSIFIER_CLUSTER_NUMBER = number;
    confidence_lines.perform_advanced_clustering_on_trees(confusion_matrix.reverse_ranking[confidence_lines.focused_class]);
};

var is_instance_mode = function () {
    return (confidence_lines.activated == true
                    && confidence_lines.mode == confidence_lines.instanceMode);
};

var get_current_focused_class = function () {
    return confidence_lines.focused_class;
};

var focus_on_class = function (focused_class) {
    class_selector.highlight_class(confusion_matrix.reverse_ranking[focused_class]);
};

var check_loading_status = function () {
    var all_loaded = true;
    for (var key in LOADING_STATUS) {
        if (LOADING_STATUS[key] != 1) {
            all_loaded = false;
            return;
        }
    }
    preloader.hide();
};

var update_clustering_K = function (focused_class) {
    CLUSTERING_K = [];
    for (var i = 0; i < SELECTED_CLASSES.length; i++) {
        CLUSTERING_K[i] = CLUSTERING_K_MATRIX[focused_class][SELECTED_CLASSES[i]];
    }
};

var click_class = function (label) {
    confidence_lines.focused_class = label;
    // clearup

    //tree_inspector.draw_tree(0, label);
    update_clustering_K(label);
    confidence_lines.get_instance_line_chart(label);
    feature_matrix.render_feature_ranking();
    //tree_list_update(SELECTED_CLASSES[i]);
    switch_to_confidence_lines();
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
            LOADING_STATUS["posterior"] = 1;
            check_loading_status();
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
            LOADING_STATUS["clustering"] = 1;
            //TODO:
            check_loading_status();
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

function switch_to_confusion_matrix() {
    //$('#conf-mat').css('display', 'block');
    //$('#confidence-lines').css('display', 'none');
    //$('#back-button').css('display', 'none');
    confusion_matrix.container.attr("data-hint", "click one strip to investigate the class")
        .attr("data-position", "right");
    confidence_lines.container.attr("data-hint", null)
        .attr("data-position", "right");
}

function switch_to_confidence_lines() {
    //$('#conf-mat').css('display', 'none');
    $('#confidence-lines').css('display', 'block');
    //$('#back-button').css('display', 'inline');
    confusion_matrix.container
        .attr("data-hint", null)
        .attr("data-position", null);
    confidence_lines.container.attr("data-hint", "click one bar on the right to investigate the cluster")
        .attr("data-position", "right");
    d3.select("#self-column-3")
        .style("opacity", 1);
    d3.select("#self-column-2")
        .style("opacity", 1);
}

function add_switch_events_for_class_view() {
    $('#back-button').on('mouseover', function() {
        $(this).css({
            'color': 'black',
            'cursor': 'pointer'
        });
    }).on('mouseout', function() {
        $(this).css('color', 'gray');
    }).click(function() {
        confidence_lines.activated = false;
        switch_to_confusion_matrix();
        //navigation.dehighlight_class();
    });
}

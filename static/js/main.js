/**
 * Created by Derek Xiao on 2016/12/7.
 */

var preloader = new PreLoader();

// vis components
var class_selector, feature_matrix, confusion_matrix, confidence_lines, tree_inspector, tree_list, treesize_barchart;


var load_data = function () {
    console.log("loading data");
    var PARAMS = "?dataset=" + DATASET + "&setname=" + SETNAME;
    var manifest_node = new RequestNode(SERVER_BASE_URL + MANIFEST_API + PARAMS, manifest_handler, "json", "GET");
    var confusion_matrix_node = new RequestNode(SERVER_BASE_URL + CONFUSION_MATRIX_API + PARAMS, confusion_matrix_handler, "json", "GET");
    confusion_matrix_node.depend_on(manifest_node);
    var feature_importance_node = new RequestNode(SERVER_BASE_URL + FEATURE_IMPORTANCE_API + PARAMS, feature_importance_handler, "arraybuffer", "GET");
    feature_importance_node.depend_on(manifest_node);
    var cluster_result_node = new RequestNode(SERVER_BASE_URL + CLUSTER_RESULT_API + PARAMS, cluster_result_handler, "json", "GET");
    cluster_result_node.depend_on(manifest_node);
    manifest_node.notify();
};

$(document).ready(function () {
    var last_resize_time = Date.now();
    $(window).resize(function () {
        var cur_time = Date.now();
        if (cur_time > last_resize_time + REFRESH_PERIOD) {
            window_resize(window.innerWidth, window.innerHeight);
            last_resize_time = cur_time;
        } else {
            //last_resize_time += REFRESH_PERIOD;
        }
    });

    var loading_button = d3.select('#load-dataset');

    loading_button.on("click", function () {
        DATASET = document.getElementById(DATASET_SELECTOR).value;
        SETNAME = document.getElementById(SETNAME_SELECTOR).value;
        load_data();
    });

    var metadata_node = new RequestNode(SERVER_BASE_URL + METADATA_API, function (r) {
        metadata_handler(r, function () {
            new RequestNode(SERVER_BASE_URL + SETNAME_API + "?dataset=" + DATASET,
                function (r) {
                    setname_handler(r, function () {
                        loading_button.node().click();
                    });
                }, "json", "GET").notify();
        });
    }, "json", "GET");

    metadata_node.notify();

    $(".hide-positive-instance-link").click(function () {
        hide_positive_instance_link();
    });

    //loading_button.node().click();
});

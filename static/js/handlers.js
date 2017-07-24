/**
 * Created by Derek Xiao on 7/21/2017.
 */

var update_globals = function (manifest) {
    var feature_count = manifest["feature_count"] - 0;
    ITERATION_COUNT = manifest["iteration_count"] - 0;
    FEATURE_COUNT = feature_count;
    manifest["class_label"].forEach(function (l) {
        ALL_CLASSES.push(l - 0);
    });
    if (SETNAME == "train") {
        ENDPOINTS = manifest["endpoints_train"];
    } else {
        ENDPOINTS = manifest["endpoints_valids"][SETNAME];
    }
    SEGMENT_COUNT = ENDPOINTS.length;
    CLASS_COUNT = ALL_CLASSES.length;
    SELECTED_CLASSES = SELECTED_CLASSES.filter(function (c) {
        return c < CLASS_COUNT;
    });
};

var render_vis_components = function () {
    color_manager = new ColorManager(SELECTED_CLASS_MAX, AVAILABLE_COLORS);
    class_selector = new ClassSelector(d3.select("#class-selector-container"));
    color_manager.assign(SELECTED_CLASSES);
    feature_matrix = new FeatureMatrix(d3.select("#feature-mat"));
    confusion_matrix = new FlowingConfusionMatrix(d3.select("#conf-mat"));
    confidence_lines = new ConfidenceLines(d3.select("#confidence-lines"));

    if (USING_CLASSIFIER) {
        //add by Changjian, tree view
        tree_inspector = new TreeInspector_svg(d3.select("#tree-inspector"));
        tree_list = new TreeList(d3.select("#representative-trees"));
        treesize_barchart = new TreesizeBarchart(d3.select("#tree-size-barchart"));
    }
};

var metadata_handler = function (dataset_list, callback) {
    if (dataset_list.length == 0) {
        console.log("no datasets");
        return;
    }
    add_options(DATASET_SELECTOR, dataset_list);
    DATASET = document.getElementById(DATASET_SELECTOR).value;
    if (callback) {
        callback();
    }
};

var setname_handler = function (result, callback) {
    if (result["status"] == "failure") {
        console.log(result["message"]);
        return;
    }
    add_options(SETNAME_SELECTOR, result["set_names"]);
    SETNAME = document.getElementById(SETNAME_SELECTOR).value;
    if (callback) {
        callback();
    }
};

var manifest_handler = function (manifest) {
    clear_globals();
    update_globals(manifest);
    render_vis_components();
};

var confusion_matrix_handler = function (confusion_matrix_data) {
    var confusion_matrix_last_iteration = confusion_matrix_data[confusion_matrix_data.length - 1];
    var precision_values = get_precision_values(confusion_matrix_last_iteration);
    var sort_index = precision_values.map(function (p, i) {
        return [i, p];
    })
        .sort(function (a, b) {
            return a[1] - b[1];
        })
        .map(function (p, i) {
            return p[0]; // index: ranking, value: class-label
        });

    class_selector.update(color_manager, sort_index);
    confusion_matrix.set_matrix_data(confusion_matrix_data, sort_index);
    confusion_matrix.set_selected_classes(SELECTED_CLASSES);
    confusion_matrix.set_segment_count(SEGMENT_COUNT);
    confusion_matrix.set_endpoints_data(ENDPOINTS);
    confusion_matrix.render_view();
};

var feature_importance_handler = function (importance) {
    FEATURE_IMPORTANCE = new Float32Array(importance);
};

var cluster_result_handler = function (cluster_result) {
    CONFIDENT_LINES_CLUSTER_RESULT_ALL = cluster_result;
};
/**
 * Created by Derek Xiao on 2016/12/7.
 */

var preloader = new PreLoader();

// vis components
var class_selector, feature_matrix, confusion_matrix, confidence_lines,tree_inspector, tree_list, treesize_barchart ;

var clear_globals = function () {
    TREE_INFO_LIGHTGBM = [];
    ALL_CLASSES = [];
    SELECTED_MATRICES = [];
    ENDPOINTS = [];
    RAW_FEATURES = [];
    TRUE_LABELS = [];
    FEATURE_INFO_LIGHTGBM = [];
    TREE_DATA_DISTRIBUTION = [];
    SELECTED_CLASSES = [0, 1, 2, 3, 4, 5, 6, 7, 8];
    CLASSIFIER_CLUSTER_NUMBER = 0;
    CLUSTERING_K = [];
    CLASSIFIER_CLUSTERING_RES_ALL = [];
    AVAILABLE_COLORS = [];
    for (var i = 0; i < SELECTED_CLASS_MAX; i++) {
        AVAILABLE_COLORS.push([COLORS_ORIGIN[i * 2], COLORS_ORIGIN[i * 2 + 1]]);
    }
    for (var key in LOADING_STATUS) {
        LOADING_STATUS[key] = 0;
    }
    for (var key in LOADED) {
        LOADED[key] = 0;
    }
    fr_pos = 0;
    TREE_CLASSIFIERS = [];
    POSTERIOR_ALL = [];
    FEATURE_IMPORTANCE = null;
    TREE_SIZE = null;
    CONFIDENT_LINES_CLUSTER_RESULT_ALL = [];
};

var load_data = function (dataset, settype) {
    var params = "?dataset=" + dataset + "&is_train=" + (settype == "train" ? "1" : "0");
    PARAMS = params;
    color_manager = new ColorManager(SELECTED_CLASS_MAX, AVAILABLE_COLORS);

    if (confidence_lines && confidence_lines.activated) {
        switch_to_confusion_matrix();
        console.log("switch back to confusion matrix");
    }

    d3.json("/api/manifest" + params, function (manifest) {
        clear_globals();

        var feature_count = manifest["feature_count"] - 0;
        ITERATION_COUNT = manifest["iteration_count"] - 0;
        FEATURE_COUNT = feature_count;
        manifest["class_label"].split(",").forEach(function (l) {
            ALL_CLASSES.push(l - 0);
        });
        CLASS_COUNT = ALL_CLASSES.length;
        SELECTED_CLASSES = SELECTED_CLASSES.filter(function (c) {
            return c < CLASS_COUNT;
        });
        CLASSIFIER_CLUSTERING_RES_ALL = d3.range(0, CLASS_COUNT).map(function () {
            return {};
        });
        CLUSTERING_ALL_INSTANCES = false;

        var endpoints_field = settype == "train" ? "endpoints" : "endpoints_valid";
        if (manifest[endpoints_field]) {
            manifest[endpoints_field].split(",").forEach(function (l) {
                ENDPOINTS.push(l - 0);
            });
        }

        class_selector = new ClassSelector(d3.select("#class-selector-container"));
        color_manager.assign(SELECTED_CLASSES);
        feature_matrix = new FeatureMatrix(d3.select("#feature-mat"));
        confusion_matrix = new FlowingConfusionMatrix(d3.select("#conf-mat"));
        confidence_lines = new ConfidenceLines(d3.select("#confidence-lines"));
        //add by Changjian, tree view
        tree_inspector = new TreeInspector_svg(d3.select("#tree-inspector"));
        tree_list = new TreeList(d3.select("#representative-trees"));
        treesize_barchart = new TreesizeBarchart(d3.select("#tree-size-barchart"));

        d3.json("/api/confusion_matrix" + params)
            .get(function (error, data) {

                var precision_values = get_precision_values(data[data.length - 1]);
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
                confusion_matrix.set_matrix_data(data, sort_index);
                confusion_matrix.set_selected_classes(SELECTED_CLASSES);
                confusion_matrix.set_segment_count(SEGMENT_COUNT);
                confusion_matrix.set_endpoints_data(ENDPOINTS);
                confusion_matrix.render_view();
                add_switch_events_for_class_view();
            });

        d3.json("/api/predicted-label" + params, function (data) {
            confidence_lines.predicted_labels = data;
        });

        d3.json("/api/feature-importance-tree-size" + params, function (data) {
            TREE_SIZE = data.tree_size;
            FEATURE_IMPORTANCE = data.feature_importance;
        });

        JSZipUtils.getBinaryContent("/api/feature-raw-zipped" + params, function(err, data) {
            if(err) {
                throw err;
            }
            JSZip.loadAsync(data).then(function (zip) {
                var filename = SETTYPE == "train" ? "feature-raw" : "feature-raw-valid";
                return zip.file(filename).async("string");
            }).then(function (text) {
                var data_str = text.split('_');
                RAW_FEATURES = eval(data_str[0]);
                TRUE_LABELS = eval(data_str[1]);
                INSTANCE_COUNT = TRUE_LABELS.length;
            });
        });

        // add by Changjian, 2017/7/18
        // loading classifier clustering results
        d3.json("/api/classifier-clustering-result" + PARAMS)
            .get(function (error, data) {
                //console.log(error, data);
                if (data) {
                    //CLASSIFIER_CLUSTERING_RES_ALL = [];
                    CLASSIFIER_CLUSTER_NUMBER = data[0]["cluster_size"].length;
                    for (var i = 0; i < CLASS_COUNT; i ++) {
                        CLASSIFIER_CLUSTERING_RES_ALL[i] = {};
                        CLASSIFIER_CLUSTERING_RES_ALL[i][CLASSIFIER_CLUSTER_NUMBER] = data[i];
                    }
                } else {
                    CLASSIFIER_CLUSTER_NUMBER = 5;
                }
                preloader.load_representative_trees(function () {

                    //preloader.load_instance_timepoint(ENDPOINTS, navigation);
                });
                //request_binary("/api/classifier-distance" + PARAMS, function (data1) {
                //    CLASSIFIER_DISTANCE_ALL = data1;
                //});
            });

        //add by Changjian, 2017/7/14
        d3.json("/api/perform-clustering-request" + params,function(data){
            null;
        });
    });
};

$(document).ready(function () {

    if (WINDOW_WIDTH < 1204) {
        d3.select(".help-button").text("?");
        d3.select("label[for=set-select]").text("");
    }

    var frame_selector = d3.select("#framework-select");
    var set_selector = d3.select("#set-select");
    var loading_button = d3.select('#load-dataset');

    loading_button.on("click", function () {
        var n = frame_selector.node();
        var framework = n.options[n.selectedIndex].value;
        DATASET = framework;
        TREE_MAX_DEPTH = framework.split("-")[2];
        IS_XGBOOST_FRAMEWORK = framework.split("-")[0] == "xgboost";
        var n1 = set_selector.node();
        SETTYPE = n1.options[n1.selectedIndex].value;
        load_data(framework, SETTYPE);
    });

    var cluster_number_input = $("#cluster-number");
    $("#cluster-number-confirm").click(function () {
        recluster_tree_classifier(cluster_number_input.val() - 0);
    });

    $(".hide-positive-instance-link").click(function () {
        hide_positive_instance_link();
    });

    loading_button.node().click();
});

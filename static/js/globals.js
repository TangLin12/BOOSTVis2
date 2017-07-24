/**
 * Created by Derek Xiao on 2016/12/7.
 */

var WINDOW_HEIGHT = window.innerHeight - 40;
var WINDOW_WIDTH = window.innerWidth;
WINDOW_HEIGHT = window.outerHeight;

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

var PARAMS = null;

var CLASS_COUNT = null;
var ITERATION_COUNT = null;
var FEATURE_COUNT = null;
var INSTANCE_COUNT = null;

var SELECTED_MATRICES = [];

var SEGMENT_COUNT = 25;
var ENDPOINTS = [];
var RAW_FEATURES = [];
var TRUE_LABELS = [];

var EXECUTE_CLASSIFIER_CLUSTERING = true;
var CLASSIFIER_CLUSTERING_K = 5; //9; //16;
var CLASSIFIER_CLUSTERING_RES = null;

var TREE_INFO_LIGHTGBM = [];
var FEATURE_INFO_LIGHTGBM = [];
var ALL_TREES = [];

var TREE_DATA_DISTRIBUTION = [];

var SELECTED_CLASS_MAX = 9;
var CLASSIFIER_CLUSTER_NUMBER = 0;

var AVAILABLE_COLORS = [];
for (var i = 0; i < SELECTED_CLASS_MAX; i ++) {
    AVAILABLE_COLORS.push([COLORS_ORIGIN[i * 2], COLORS_ORIGIN[i * 2 + 1]]);
}
var SELECTED_CLASSES = [];
var CLUSTERING_K = [];
var CLUSTERING_ALL_INSTANCES;
var ALL_CLASSES = [];
var color_manager;

var DATASET, SETNAME;

var TREE_CLASSIFIERS;

var tree_list_padding = 7.3;
var mini_tree_left_margin = 5;
var mini_tree_rightmost = 0;
var draw_tree_list_now = false;
var list_tree_translateY = 0;
var TREE_NODERECT_HEIGHT = 20;
var TREE_NODERECT_WIDTH = 55;
var SHOW_MAX_DEPTH = 14;


var CLASSIFIER_CLUSTERING_RES_ALL;
var CLASSIFIER_KEYMAP = {
    "C": "Children",
    "i": "Id",
    "f": "split-feature",
    "g": "split-gain",
    "t": "threshold",
    "V": "internal-value",
    "c": "internal-count",
    "v": "leaf-value",
    "d": "leaf-count"
};
var CLASSIFIER_KEYMAP_REVERSED = {
    "Children": "C",
    "Id": "i",
    "split-feature": "f",
    "split-gain": "g",
    "threshold": "t",
    "internal-value": "V",
    "internal-count": "c",
    "leaf-value": "v",
    "leaf-count": "d"
};

var POSTERIOR_ALL = {};
var CLUSTERING_ALL = {};
var FEATURE_IMPORTANCE = null;
var TREE_SIZE = null;
var CONFIDENT_LINES_CLUSTER_RESULT_ALL = [null,null,null,null,null,null,null,null,null];
var CLASSIFIER_DISTANCE_ALL = [];

var clicked_node = null;

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
    TREE_CLASSIFIERS = [];
    POSTERIOR_ALL = [];
    FEATURE_IMPORTANCE = null;
    TREE_SIZE = null;
    CONFIDENT_LINES_CLUSTER_RESULT_ALL = [];
};

/*
    URL settings
 */

var SERVER_IP = "localhost";
var SERVER_PORT = 8083;
var SERVER_BASE_URL = "http://" + SERVER_IP + ":" + SERVER_PORT;
var METADATA_API = "/api/query-dataset";
var SETNAME_API = "/api/query-set-names";
var MANIFEST_API = "/api/manifest";
var CONFUSION_MATRIX_API = "/api/confusion-matrix";
var FEATURE_IMPORTANCE_API = "/api/feature-importance";
var TREESIZE_API = "/api/tree-size";
var CLUSTER_RESULT_API = "/api/cluster-result";

/*
    DOM id configuration
 */

var DATASET_SELECTOR = "dataset-select";
var SETNAME_SELECTOR = "set-select";

/*
    vis status
 */

var USING_CLASSIFIER = false;
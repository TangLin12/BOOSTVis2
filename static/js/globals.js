/**
 * Created by Derek Xiao on 2016/12/7.
 */

var WINDOW_HEIGHT = window.innerHeight - 40;
var WINDOW_WIDTH = window.innerWidth;
WINDOW_HEIGHT = window.outerHeight;

var COLOR_GENERATOR = d3.scale.category20();
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

var IS_XGBOOST_FRAMEWORK = false;

var TREE_INFO_LIGHTGBM = [];
var FEATURE_INFO_LIGHTGBM = [];
var ALL_TREES = [];
var FEATURE_INFO_XGBOOST = [];

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

var INFORMATION_GAIN = 1;
var APPEARING_TIMES = 2;
var IMPORTANCE_TYPE = INFORMATION_GAIN;

var ISDEBUG = true;

var STOP_METRICS = [
    //"accuracy-test",
    //"accuracy-train",
    //"margin_mean_test",
    //"margin_mean_train",
    "margin_variance_test",
    "margin_variance_train",
    "training's multi_logloss",
    "valid_1's multi_logloss"
];

var DATASET, SETTYPE;

var TREE_CLASSIFIERS;

var TREE_MAX_DEPTH;


var CLUSTERING_K_MATRIX = [
    [0, 8, 8, 4, 0, 0, 0, 0, 0],
    [0, 8, 4, 4, 0, 0, 0, 0, 0],
    [0, 4, 8, 4, 2, 2, 0, 0, 0],
    [0, 8, 8, 4, 0, 0, 0, 0, 0],
    [0, 8, 8, 4, 0, 0, 0, 0, 0],
    [0, 8, 8, 4, 0, 0, 0, 0, 0],
    [0, 8, 8, 4, 0, 0, 0, 0, 0],
    [0, 8, 8, 4, 0, 0, 0, 0, 0],
    [0, 8, 8, 4, 0, 0, 0, 0, 0]
];

var tree_list_padding = 7.3;
var mini_tree_left_margin = 5;

var mini_tree_rightmost = 0;
var draw_tree_list_now = false;
var list_tree_translateY = 0;

var TREE_NODERECT_HEIGHT = 20;
var TREE_NODERECT_WIDTH = 55;
var SHOW_MAX_DEPTH = 14;
//var CLASSIFIER_DISTANCE_ALL = [];
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

var duration = 500;
var delayMultiple = 0.4;
var LOADING_STATUS = {
    "classifier": 0,
    "model": 0,
    "feature": 0,
    "posterior": 0,
    "tsne": 0,
    "clustering": 0
};

var LOADING_WORKLOAD_RATIO = {
    "classifier": 0.75,
    "model": 0.25,
    "feature": 0.17,
    "posterior": 0.83,
    "tsne": 0.88,
    "clustering": 0.12
};

var LOADED = {
    "classifier": 0,
    "model": 0,
    "feature": 0,
    "posterior": 0,
    "tsne": 0,
    "clustering": 0
};

var POSTERIOR_ALL = {};

var FEATURE_IMPORTANCE = null;
var TREE_SIZE = null;

var CONFIDENT_LINES_CLUSTER_RESULT_ALL = [];

var CLASSIFIER_DISTANCE_ALL = [];

var clicked_node = null;
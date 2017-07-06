/**
 * Created by Junlin Liu on 17/3/17.
 */

var rawdata_processor_for_lightGBM = function (data, NClass, NIteration) {

    var lines = data.split('\n');
    var tree_count = 0;
    TREE_INFO_LIGHTGBM = [];

    for (var i = 0; i < NIteration; i++) {
        var vec = [];
        TREE_INFO_LIGHTGBM.push(vec);
    }

    for (var l = 0; l < lines.length; l++) {
        var str = lines[l];
        if (tree_count >= NClass * NIteration) break;
        if (str.startsWith('Tree') == true) {
            var class_label = tree_count % NClass;
            var iteration = Math.floor(tree_count / NClass);

            var tree = {};
            tree['internal_parent'] = [];

            while (true) {
                l++;
                str = lines[l];
                if (str.includes('=') == false) {
                    break;
                }

                var partition = str.split('=');
                var node_info = partition[1].split(' ');

                if (str.startsWith('num_leaves') == true) {
                    tree['num_leaves'] = parseInt(partition[1]);
                    tree['num_internals'] = tree['num_leaves'] - 1;
                } else if (str.startsWith('split_feature') == true) {
                    tree['split_feature'] = [];
                    for (i = 0; i < tree['num_internals']; i++) {
                        tree['split_feature'].push(parseInt(node_info[i]));
                    }
                } else if (str.startsWith('split_gain') == true) {
                    tree['split_gain'] = [];
                    for (i = 0; i < tree['num_internals']; i++) {
                        tree['split_gain'].push(parseFloat(node_info[i]));
                    }
                } else if (str.startsWith('threshold') == true) {
                    tree['threshold'] = [];
                    for (i = 0; i < tree['num_internals']; i++) {
                        tree['threshold'].push(parseFloat(node_info[i]));
                    }
                } else if (str.startsWith('left_child') == true) {
                    tree['left_child'] = [];
                    for (i = 0; i < tree['num_internals']; i++) {
                        var p = parseInt(node_info[i]);
                        tree['left_child'].push(p);
                        if (p >= 0) {
                            tree['internal_parent'][p] = i;
                        }
                    }
                } else if (str.startsWith('right_child') == true) {
                    tree['right_child'] = [];
                    for (i = 0; i < tree['num_internals']; i++) {
                        p = parseInt(node_info[i]);
                        tree['right_child'].push(p);
                        if (p >= 0) {
                            tree['internal_parent'][p] = i;
                        }
                    }
                } else if (str.startsWith('leaf_parent') == true) {
                    tree['leaf_parent'] = [];
                    for (i = 0; i < tree['num_leaves']; i++) {
                        tree['leaf_parent'].push(parseInt(node_info[i]));
                    }
                } else if (str.startsWith('leaf_value') == true) {
                    tree['leaf_value'] = [];
                    for (i = 0; i < tree['num_leaves']; i++) {
                        tree['leaf_value'].push(parseFloat(node_info[i]))
                    }
                } else if (str.startsWith('leaf_count') == true) {
                    tree['leaf_count'] = [];
                    for (i = 0; i < tree['num_leaves']; i++) {
                        tree['leaf_count'].push(parseInt(node_info[i]));
                    }
                } else if (str.startsWith('internal_values') == true) {
                    tree['internal_value'] = [];
                    for (i = 0; i < tree['num_internals']; i++) {
                        tree['internal_value'].push(parseFloat(node_info[i]));
                    }
                } else if (str.startsWith('internal_count') == true) {
                    tree['internal_count'] = [];
                    for (i = 0; i < tree['num_internals']; i++) {
                        tree['internal_count'].push(parseInt(node_info[i]));
                    }
                }
            }

            TREE_INFO_LIGHTGBM[iteration].push(tree);
            tree_count++;
        }
    }

};

function calculate_feature_info_lightGBM () {

    FEATURE_INFO_LIGHTGBM = [];

    for (var t = 0; t < ITERATION_COUNT; t++) {

        var vec_t = [];

        for (var c = 0; c < CLASS_COUNT; c++) {

            var vec_c = [];
            var tree_info = TREE_INFO_LIGHTGBM[t][c];
            var total_count = tree_info['internal_count'][0];

            for (var i = 0; i < tree_info['num_internals']; i++) {
                var feature_id = tree_info['split_feature'][i];
                var gain = tree_info['split_gain'][i];
                var count = tree_info['internal_count'][i];

                var importance_value = 0;
                if (IMPORTANCE_TYPE == INFORMATION_GAIN) {
                    importance_value = gain * (count / total_count);
                } else if (IMPORTANCE_TYPE == APPEARING_TIMES) {
                    importance_value = 1;
                }

                var left_child = tree_info['left_child'][i];
                var right_child = tree_info['right_child'][i];
                var left_count = (left_child >= 0) ?
                    tree_info['internal_count'][left_child] : tree_info['leaf_count'][-left_child - 1];
                var right_count = (right_child >= 0) ?
                    tree_info['internal_count'][right_child] : tree_info['leaf_count'][-right_child - 1];
                var size_ratio = left_count / (left_count + right_count);

                //if (isNaN(size_ratio) && t == 0) {
                //    console.log(left_child, right_child, left_count, right_count);
                //}

                var info = {
                    'feature_id' : feature_id,
                    'importance_value' : importance_value,
                    'size_ratio' : size_ratio,
                    'self_size' : tree_info['internal_count'][i]
                };

                vec_c.push(info);
            }

            //var max_importance = 0;
            //for (i = 0; i < vec_c.length; i++) {
            //    if (vec_c[i]['importance_value'] > max_importance) {
            //        max_importance = vec_c[i]['importance_value'];
            //    }
            //}
            //for (i = 0; i < vec_c.length; i++) {
            //    vec_c[i]['importance_value'] = Math.log(vec_c[i]['importance_value'])
            //                                    / Math.log(max_importance);
            //}

            vec_t.push(vec_c);
        }

        FEATURE_INFO_LIGHTGBM.push(vec_t);
    }

}

function recalculate_internal_count_for_xgboost() {

    console.log('Recalculating internal count for xgboost...');

    for (var t = 0; t < ITERATION_COUNT; t++) {
        for (var c = 0; c < CLASS_COUNT; c++) {
            var tree_info = TREE_INFO_LIGHTGBM[t][c];
            var num_internals = tree_info['num_internals'];
            var num_leaves = tree_info['num_leaves'];
            for (var i = 0; i < num_internals; i++) {
                tree_info['internal_count'][i] = 0;
            }
            for (i = 0; i < num_leaves; i++) {
                tree_info['leaf_count'][i] = 0;
            }
            for (var j = 0; j < INSTANCE_COUNT; j++) {
                var p = 0;
                while (true) {
                    if (p < 0) {
                        tree_info['leaf_count'][-p - 1]++;
                        break;
                    }
                    tree_info['internal_count'][p]++;
                    if (RAW_FEATURES[j][tree_info['split_feature'][p]] < tree_info['threshold'][p]) {
                        p = tree_info['left_child'][p];
                    } else {
                        p = tree_info['right_child'][p];
                    }
                }
            }
        }
    }

    console.log('Recalculated.');

}

function save_feature_importance_and_tree_size () {
    console.log('Begin caching...');

    var feature_importance = [];
    for (var c = 0; c < CLASS_COUNT; c++) {
        feature_importance[c] = [];
        var imp = feature_matrix.get_average_feature_importance2(c);
        for (var i = 0; i < FEATURE_COUNT; i++) {
            feature_importance[c][i] = imp[i].toFixed(2);
        }
    }

    var tree_size = [];
    for (c = 0; c < CLASS_COUNT; c++) {
        tree_size[c] = [];
        for (i = 0; i < ITERATION_COUNT; i++) {
            tree_size[c][i] = TREE_INFO_LIGHTGBM[i][c]['num_internals'] + TREE_INFO_LIGHTGBM[i][c]['num_leaves'];
        }
    }

    console.save({
        'feature_importance' : feature_importance,
        'tree_size' : tree_size
    }, 'importance_and_size.txt');

    console.log('Cached');
}




function save_data_for_clustering () {


    console.save({
        'TREE_INFO_LIGHTGBM' : TREE_INFO_LIGHTGBM
    }, 'TREE_INFO_LIGHTGBM.txt');



    console.log('Getting tree data distribution...');

    var tree_data_distribution = [];
    for (var k = 0; k < CLASS_COUNT; k++) {
        console.log('Current class is ' + k);
        var distribution = [];
        for (var i = 0; i < ITERATION_COUNT; i++) {
            distribution[i] = tree_inspector.get_all_data_distribution(i, k);
        }
        tree_data_distribution[k] = distribution;
    }

    console.log('Got tree data distribution.');

    TREE_DATA_DISTRIBUTION = tree_data_distribution;

    console.save({
        'TREE_DATA_DISTRIBUTION' : TREE_DATA_DISTRIBUTION
    }, 'TREE_DATA_DISTRIBUTION.txt');

}

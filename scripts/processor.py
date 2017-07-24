import numpy as np
import json
import math
from os.path import join, exists
from scripts import algorithm
from scripts import config

from sklearn.metrics import confusion_matrix
from scripts import helper
from scripts import clustering

from abc import ABC

class AbstractProcessor(ABC):
    model = None
    train_set = None
    valid_sets = None
    params = {}
    data_root = ""

    # meta data
    class_count = 0
    data_count = 0
    iteration_count = 0
    class_label = []
    feature_count = 0
    endpoints_train = []
    endpoints_valids = {}

    # info to be stored
    confusion_matrices_train = []
    confusion_matrices_valids = {}
    train_accuracy_list = []
    valids_accuracy_list = {}

    def __init__(self, m, train, valids, params, data_root):
        self.model = m
        self.train_set = train
        self.valid_sets = valids
        self.params = params
        self.data_root = data_root

    def get_manifest(self):
        return {
            "class_count": self.class_count,
            "data_count": self.data_count,
            "iteration_count": self.iteration_count,
            "class_label": self.class_label,
            "feature_count": self.feature_count,
            "endpoints_train": self.endpoints_train,
            "endpoints_valids": self.endpoints_valids,
            "set_names": ["train"] + list(self.valid_sets.keys())
        }

    def predict_one_iteration(self, data, num_iteration):
        # leave for child class
        return []

    def predict(self, data, num_iteration):
        # leave for child class
        return []

    def get_confusion_matrix(self, prediction_scores, true_label):
        # decision = np.argmax(prediction_scores, axis=1)
        decision = helper.prob2decision(prediction_scores)
        return confusion_matrix(true_label, decision)

    # add by Shouxing, 2017 / 7 / 20
    def pre_split_features(self, feature_raw: np.array, bin_count: int, set_name):
        '''This function generates split values of all features, given a count of bins.

        :param feature_raw: n-d array of feature values, n is number of instances and d is number of features.
        :param bin_count: the expect number of bins.

        :return: none
        '''
        bin_values = []
        bin_widths = []
        data = np.transpose(feature_raw)
        for x in data:
            dic = algorithm.split_feature(x, bin_count)
            bin_values.append(dic['bin_value'])
            bin_widths.append(dic['bin_width'])
        np.save(join(self.data_root, 'features_split_values_' + str(set_name)), np.array(bin_values))
        np.save(join(self.data_root, 'features_split_widths_' + str(set_name)), np.array(bin_widths))

    def get_prediction_score(self, set_name, data_count, class_count, timepoints):
        scores = np.zeros(shape=(len(timepoints), data_count, class_count))
        for i, t in enumerate(timepoints):
            scores[i] = np.load(join(self.data_root, set_name + "-prediction-score", "iteration-" + str(t) + ".npy"))
        print(scores.shape)
        return np.swapaxes(scores, 1, 0)

    def calculate_prediction_score_all_iterations(self, data, model, class_count, iteration):
        pass

    def importance_and_treesize(self, model_file, iteration_count, class_count, feature_count):
        pass

    def process_dataset(self, set, set_name):
        set_root = join(self.data_root, set_name + "-prediction-score")
        helper.create_folder(set_root)
        data_count = set["X"].shape[0]
        prediction_score = np.zeros((data_count, self.class_count))
        confusion_matrices = []

        scores = self.calculate_prediction_score_all_iterations(set["X"], self.model, self.class_count, self.iteration_count)

        for i in range(self.iteration_count):
            prediction_score += scores[:, i * self.class_count: (i * self.class_count + self.class_count)]
            softmax_score = helper.softmax(prediction_score)
            np.save(join(set_root, "iteration-" + str(i) + ".npy"), softmax_score)
            confusion_matrix = self.get_confusion_matrix(softmax_score, set["y"])
            confusion_matrices.append(confusion_matrix)

        key_timepoints = algorithm.time_series_segmentation(confusion_matrices, config.SEGMENT_COUNT)
        scores = self.get_prediction_score(set_name, data_count, self.class_count, key_timepoints)
        decision_last_iteration = helper.prob2decision(prediction_score)
        cluster_result = clustering.instance_clustering(
            self.class_count,
            scores,
            set,
            decision_last_iteration
        )
        helper.save_json(cluster_result, join(self.data_root, "clustering_result_" + set_name + ".json"))
        self.pre_split_features(set["X"], config.FEATURE_BIN_COUNT, set_name)
        self.pre_split_features(set["X"], config.FEATURE_BIN_COUNT)

        np.save(join(self.data_root, "feature-raw-" + set_name + ".npy"), set["X"])
        np.save(join(self.data_root, "label-" + set_name + ".npy"), set["y"])
        np.save(join(self.data_root, "confusion_matrix_" + set_name + ".npy"), confusion_matrices)

        return confusion_matrices, key_timepoints

    def process(self):
        helper.create_folder(self.data_root)

        self.model.save_model(join(self.data_root, "model"))

        with open(join(self.data_root, "model")) as model_file:
            parse_result = self.importance_and_treesize(model_file, self.iteration_count, self.class_count, self.feature_count)
            helper.save_binary(np.array(parse_result["feature_importance"]), join(self.data_root, "feature_importance.bin"))
            helper.save_binary(np.array(parse_result["tree_size"]), join(self.data_root, "tree_size.bin"))

        self.confusion_matrices_train, self.endpoints_train = self.process_dataset(self.train_set, "train")
        self.endpoints_valids = {}
        for valid in self.valid_sets:
            self.confusion_matrices_valids[valid], self.endpoints_valids[valid] = self.process_dataset(self.valid_sets[valid], valid)

        helper.save_json(self.get_manifest(), join(self.data_root, "manifest"))

    def start_server(self):
        # TODO
        pass

class LightGBMProcess(AbstractProcessor):
    def __init__(self, m, train, valids, params, data_root):
        super().__init__(m, train, valids, params, data_root)
        self.iteration_count = params["num_boost_round"]
        self.data_count, self.feature_count = train["X"].shape
        labels = train["y"]
        self.class_label = np.unique(labels)
        self.class_count = len(self.class_label)
        self.class_label = self.class_label.tolist()

    def importance_and_treesize(self, model_file, iteration_count, class_count, feature_count):
        feature_gains = []
        tree_size = []
        for i in range(class_count):
            feature_gains.append([0] * feature_count)
            tree_size.append([0] * iteration_count)

        normalizer = iteration_count * class_count
        lines = model_file.readlines()
        line_pos = 0
        cur_class = 0
        cur_iteration = 0
        is_metadata = True
        features = None
        feature_gain = None
        while line_pos < len(lines):
            # used to skip metadata
            line = lines[line_pos]
            if is_metadata and line.startswith("Tree=0"):
                is_metadata = False
            if is_metadata:
                line_pos += 1
                continue

            if line.startswith("Tree="):
                t = line.replace("\n", "").replace("Tree=", "")
                t = int(t)
                cur_class = t % class_count
                cur_iteration = int((t - cur_class) / class_count)
            elif line.startswith("num_leaves="):
                num_leaves = line.replace("num_leaves=", "").replace("\n", "")
                tree_size[cur_class][cur_iteration] = math.pow(int(num_leaves), 1)
            elif line.startswith("split_feature="):
                features = line.replace("split_feature=", "") \
                    .replace("\n", "").split(" ")
            elif line.startswith("split_gain="):
                feaure_gain = line.replace("split_gain=", "").replace("\n", "").split(" ")
                for j, f in enumerate(features):
                    g = float(feaure_gain[j])
                    feature_gains[cur_class][int(f)] += g / normalizer

            line_pos += 1
        return {
            "feature_importance": feature_gains,
            "tree_size": tree_size
        }


    def calculate_prediction_score_all_iterations(self, data, model, class_count, iteration):
        import time
        start = time.time()
        leaf_ids = model.predict(data, pred_leaf=True)
        leaf_id_max = np.max(leaf_ids, axis=0) # iteration * class_count
        leaf_values = []
        for t in range(iteration):
            for i in range(class_count):
                tree_id = t * self.class_count + i
                values = np.zeros(shape=(leaf_id_max[i] + 1))
                for leaf_id in range(leaf_id_max[i]):
                    values[leaf_id] = self.model.get_leaf_output(tree_id, leaf_id)
                leaf_values.append(values)

        scores_all_iterations = np.zeros_like(leaf_ids, dtype=np.float16)
        for i in range(data.shape[0]):
            for t in range(iteration):
                for j in range(class_count):
                    tree_id = j + t * class_count
                    scores_all_iterations[i][tree_id] = leaf_values[tree_id][leaf_ids[i][tree_id]]

        print(scores_all_iterations.shape)
        print(time.time() - start)
        return scores_all_iterations

    def predict(self, data, num_iteration):
        # print("lightgbm predict")
        return self.model.predict(data, num_iteration=num_iteration)


class XGBoostProcess(AbstractProcessor):

    def predict(self, data, num_iteration):
        # TODO
        pass

    # return prediction scores
    def predict_one_iteration(self, data, iteration):
        # TODO
        pass
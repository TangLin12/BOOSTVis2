import numpy as np
from os.path import join
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
    def pre_split_features(self, feature_raw: np.array, bin_count: int):
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
        np.save(join(self.data_root, 'features_split_values'), np.array(bin_values))
        np.save(join(self.data_root, 'features_split_widths'), np.array(bin_widths))

    def get_prediction_score(self, set_name, data_count, class_count, timepoints):
        scores = np.zeros(shape=(len(timepoints), data_count, class_count))
        for i, t in enumerate(timepoints):
            scores[i] = np.load(join(self.data_root, set_name + "-prediction-score", "iteration-" + str(t) + ".npy"))
        print(scores.shape)
        return np.swapaxes(scores, 1, 0)

    def process_dataset(self, set, set_name):
        set_root = join(self.data_root, set_name + "-prediction-score")
        helper.create_folder(set_root)
        data_count = set["X"].shape[0]
        prediction_score = np.zeros((data_count, self.class_count))
        confusion_matrices = []
        for i in range(self.iteration_count):
            prediction_score = self.predict(set["X"], i)
            np.save(join(set_root, "iteration-" + str(i) + ".npy"), prediction_score)
            confusion_matrix = self.get_confusion_matrix(prediction_score, set["y"])
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
        self.pre_split_features(set["X"], config.FEATURE_BIN_COUNT)
        return confusion_matrices, key_timepoints

    def process(self):
        helper.create_folder(self.data_root)

        self.model.save_model(join(self.data_root, "model"))

        np.save(join(self.data_root, "feature-raw-" + "train.npy"), self.train_set)

        self.confusion_matrices_train, self.endpoints_train = self.process_dataset(self.train_set, "train")
        np.save(join(self.data_root, "confusion_matrix_train.npy"), self.confusion_matrices_train)
        self.endpoints_valids = {}
        for valid in self.valid_sets:
            self.confusion_matrices_valids[valid], self.endpoints_valids[valid] = self.process_dataset(self.valid_sets[valid], valid)
            np.save(join(self.data_root, "confusion_matrix_" + valid + ".npy"), self.confusion_matrices_valids[valid])
            np.save(join(self.data_root, "feature-raw-" + valid + ".npy"), self.valid_sets[valid])

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

    def predict(self, data, num_iteration):
        # print("lightgbm predict")
        return self.model.predict(data, num_iteration=num_iteration)

    # return prediction scores
    def predict_one_iteration(self, data, iteration):
        # d = self.model.predict(data, num_iteration=iteration, pred_leaf=True)
        # self.model.get_leaf_output(1)
        # TODO: this is a temporary implementation
        if iteration == 0:
            return self.predict(data, iteration)
        else:
            return self.predict(data, iteration) - self.predict(data, iteration - 1)

class XGBoostProcess(AbstractProcessor):

    def predict(self, data, num_iteration):
        # TODO
        pass

    # return prediction scores
    def predict_one_iteration(self, data, iteration):
        # TODO
        pass
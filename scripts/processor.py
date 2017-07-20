import lightgbm as lgb
import numpy as np
from . import algorithm
from . import config
from . import datasets

from os import makedirs
from os.path import exists, join

class AbstractProcessor(object):
    model = None
    train_set = None
    valid_sets = None
    params = {}

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

    def __init__(self, m, train, valids, params):
        self.model = m
        self.train_set = train
        self.valid_sets = valids
        self.params = params

    def get_manifest(self):
        return {
            "class_count": self.class_count,
            "data_count": self.data_count,
            "iteration_count": self.iteration_count,
            "class_label": self.class_label,
            "feature_count": self.feature_count,
            "endpoints_train": self.endpoints_train,
            "endpoints_valids": self.endpoints_valids
        }

    def _create_folder(self, d):
        if not exists(d):
            makedirs(d)
        pass

    # return prediction scores
    def predict_one_iteration(self, data, num_iteration):
        # TODO
        pass

    def predict(self, data, num_iteration):
        # TODO
        print("abstract predict")
        pass

    def get_confusion_matrix(self, prediction_scores):
        # TODO
        pass

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
        np.save('features_split_values', np.array(bin_values))
        np.save('features_split_widths', np.array(bin_widths))
        # TODO to get the directory path



    def process_dataset(self, dataset):
        prediction_score = np.zeros((self.data_count, self.class_count))
        confusion_matrices = []
        for i in range(self.iteration_count):
            prediction_score = self.predict(dataset, i)
            confusion_matrix = self.get_confusion_matrix(prediction_score)
            confusion_matrices.append(confusion_matrix)

        key_timepoints = algorithm.time_series_segmentation(self.confusion_matrices_train, config.SEGMENT_COUNT)
        return key_timepoints

    def process(self):
        self.endpoints_train = self.process_dataset(self.train_set)

        self.endpoints_valids = {}
        for valid in self.valid_sets:
            self.endpoints_valids[valid] = self.process_dataset(self.valid_sets[valid])

    def start_server(self):
        # TODO
        pass


class LightGBMProcess(AbstractProcessor):

    def __init__(self, m, train, valids, params):
        super().__init__(m, train, valids, params)
        self.iteration_count = params["num_iterations"]
        self.feature_count = train.num_feature()
        self.data_count = train.num_data()
        labels = train.get_label()
        self.class_label = np.unique(labels)
        self.class_count = len(self.class_label)

    def predict(self, data, num_iteration):
        print("lightgbm predict")
        return self.model.predict(data, num_iteration=num_iteration)

    # return prediction scores
    def predict_one_iteration(self, data, iteration):
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


def LightGBMTest():
    dataset = datasets.load_digits()
    lgb_train = lgb.Dataset(dataset["train"]["X"], dataset["train"]["y"])
    lgb_valid = lgb.Dataset(dataset["valid"]["X"], dataset["valid"]["y"])
    params = {
        "tree_learner": "serial",
        "is_train_metric": False,
        "metric": ["multi_logloss", "multi_error"],
        'task': 'train',
        'max_depth': 4,
        'num_leaves': 50,
        'learning_rate': 0.1,
        'num_iterations': 100,
        'boosting_type': 'gbdt',
        'objective': 'multiclass',
        'min_data_in_leaf': 5,
        'num_class': 10,
        'nthread': -1,
        'seed': 777
    }
    booster = lgb.train(params, lgb_train, num_boost_round=params["num_iterations"], valid_sets=[lgb_train, lgb_valid], valid_names=["train", "valid"])
    l = LightGBMProcess(booster, lgb_train, {
        "valid": lgb_valid
    }, params)


if __name__ == '__main__':
    LightGBMTest()

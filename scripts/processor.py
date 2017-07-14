import lightgbm as lgb
import numpy as np
from . import algorithm
from . import config


class AbstractProcessor(object):
    model = None
    train_set = None
    valid_sets = None
    params = {}

    # info to be stored
    confusion_matrices_train = []
    confusion_matrices_valids = []
    train_accuracy_list = []
    valids_accuracy_list = []

    # settings
    iteration_count = 0

    def __init__(self, m, train, valids, params):
        # TODO
        pass

    def get_manifest(self):
        # TODO
        pass
        return {}

    def _create_folder(self, dir):
        # TODO
        pass

    # return prediction scores
    def predict_one_iteration(self, iteration):
        # TODO
        pass

    def predict(self, num_iteration):
        # TODO
        print("abstract predict")
        pass

    def get_confusion_matrix(self, prediction_scores):
        # TODO
        pass

    def process(self):
        # TODO
        prediction_score = np.zeros((0, 0))
        for i in range(self.iteration_count):
            prediction_score_single = self.predict_one_iteration(i)
            prediction_score += prediction_score_single
            confusion_matrix = self.get_confusion_matrix(prediction_score)
            self.confusion_matrices_train.append(confusion_matrix)

        key_timepoints = algorithm.time_series_segmentation(self.confusion_matrices_train, config.SEGMENT_COUNT)
        pass

    def start_server(self):
        # TODO
        pass


class LightGBMProcess(AbstractProcessor):

    def predict(self, num_iteration):
        # TODO
        print("lightgbm predict")
        pass

    # return prediction scores
    def predict_one_iteration(self, iteration):
        # TODO
        pass


class XGBoostProcess(AbstractProcessor):

    def predict(self, num_iteration):
        # TODO
        pass

    # return prediction scores
    def predict_one_iteration(self, iteration):
        # TODO
        pass


if __name__ == '__main__':
    l = LightGBMProcess(None, None, None, None)
    l.predict(1)

import numpy as np
from os import makedirs
from os.path import exists
import shutil

import lightgbm as lgb
import numpy as np
from sklearn.metrics import accuracy_score, confusion_matrix

#from logger import Logger
from .config import *
import pandas

import scipy as sp
import configparser


def get_posterior_all(identifier):
    dataset_root = join(RESULT_ROOT, identifier)
    config = configparser.ConfigParser()
    config.read(join(dataset_root, "manifest"))
    manifest = config["DEFAULT"]
    iteration_count = int(manifest["iteration_count"])
    class_count = int(manifest["class_count"])
    data_count = int(manifest["data_count"])
    posterior_folder = join(dataset_root, "posterior_full_train")

    training_label = np.loadtxt(join(dataset_root, "training_label"), dtype=np.uint16)

    posterior_all = np.zeros((iteration_count, data_count, class_count))
    starts = np.arange(0, iteration_count, POSTERIOR_SPLIT_SIZE)
    for t in starts:
        posterior_split = np.load(join(posterior_folder, str(t) + "-" + str(t + 9) + ".npy"))
        for i in range(len(posterior_split)):
            posterior_all[t + i] = posterior_split[i]

    return posterior_all


def prob2decision(pred):
    result = np.zeros(pred.shape)
    for i in range(pred.shape[0]):
        decision = np.argmax(pred[i])
        result[i, decision] = 1
    return result


from sklearn.metrics import log_loss


def compare_2_results(gt_path, pred_path):
    gt = pandas.read_csv(gt_path, sep=',').as_matrix()[:, 1:]
    pred = pandas.read_csv(pred_path, sep=',').as_matrix()[:, 1:]
    # loss = logloss1(gt, pred)
    from scipy.stats import entropy
    dist = []
    for p, q in zip(pred, gt):
        dist.append(entropy(p, q))
    print(sum(dist), np.mean(dist))


if __name__ == '__main__':
    gt_path = join(RESULT_ROOT, "1_random_forest_benchmark.csv")
    target = "lightgbm-otto-8-0.1-800"
    pred_path = join(*[RESULT_ROOT, target, "predict.csv"])
    compare_2_results(gt_path, pred_path)

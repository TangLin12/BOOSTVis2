import math
import numpy as np
import pandas as pd

from sklearn import datasets
from sklearn.model_selection import train_test_split
from sklearn.model_selection import StratifiedShuffleSplit
from .config import *


def create_valid(X, y, test_size=0.33, random_state=42):
	X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=test_size, random_state=random_state)
	return {
		"train": {
			"X": X_train,
			"y": y_train
		},
		"valid": {
			"X": X_test,
			"y": y_test
		}
	}


def load_digits():
	digits = datasets.load_digits(return_X_y=True)
	return create_valid(digits.data, digits.target)


def load_hastie(n_samples=12000, random_state=1):
	data, label = datasets.make_hastie_10_2(n_samples=n_samples, random_state=random_state)
	split = math.floor(n_samples * 0.2)
	return {
		"training": (data[0: -split], label[0: -split]),
		"testing": (data[-split:], label[-split:])
	}

def load_otto():
	dataset_path = join(*[DATASET_ROOT, "Otto"])
	converter = {
		"target": lambda x: int(x.replace("Class_", "")) - 1
	}
	use_cols = ["feat_" + str(i) for i in range(1, 94)]
	use_cols.append("target")
	full = pd.read_csv(join(dataset_path, "train.csv"), sep=',', converters=converter, usecols=use_cols)

	full_mat = full.as_matrix()
	y = full_mat[:, -1]
	X = full_mat[:, 0:-1]

	sampling_ratio = 0.8
	sss = StratifiedShuffleSplit(n_splits=1, train_size=sampling_ratio, test_size=1 - sampling_ratio,
								 random_state=TSNE_SAMPLE_SEED)
	for train_index, test_index in sss.split(X, y):
		X_train = X[train_index]
		y_train = y[train_index]
		X_test = X[test_index]
		y_test = y[test_index]
		return {
			"training": (X_train, y_train),
			"testing": (X_test, y_test)
		}


def load_waveform():
	dataset_path = join(*[DATASET_ROOT, "Waveform2"])
	full = pd.read_csv(join(dataset_path, "waveform-+noise.data.csv"), sep=',', header=None)

	full_mat = full.as_matrix()
	y = full_mat[:, -1]
	X = full_mat[:, 0:-1]

	print(X.shape, y.shape)

	sampling_ratio = 0.8
	sss = StratifiedShuffleSplit(n_splits=1, train_size=sampling_ratio, test_size=1 - sampling_ratio,
								 random_state=TSNE_SAMPLE_SEED)
	for train_index, test_index in sss.split(X, y):
		X_train = X[train_index]
		y_train = y[train_index]
		X_test = X[test_index]
		y_test = y[test_index]
		return {
			"training": (X_train, y_train),
			"testing": (X_test, y_test)
		}



if __name__ == "__main__":
	pass

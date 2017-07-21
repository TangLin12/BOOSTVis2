import sys
import os
from os.path import join
import pandas as pd

from sklearn import datasets
from sklearn.model_selection import train_test_split

current_module = sys.modules[__name__]
PROJECT_ROOT = os.path.dirname(current_module.__file__)
DATASET_ROOT = join(PROJECT_ROOT, "data")

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


def load_toy1():
	# load or create your dataset
	print('Load data...')
	df_train = pd.read_csv('data/multiclass_classification/multiclass.train', header=None, sep='\t')
	df_test = pd.read_csv('data/multiclass_classification/multiclass.test', header=None, sep='\t')

	y_train = df_train[0].values
	y_test = df_test[0].values
	X_train = df_train.drop(0, axis=1).values
	X_test = df_test.drop(0, axis=1).values
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
	return create_valid(digits[0], digits[1])

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
	return create_valid(X, y)

def load_toy():
	dataset_path = join(*[DATASET_ROOT, "Otto_toy"])
	converter = {
		"target": lambda x: int(x.replace("Class_", "")) - 1
	}
	use_cols = ["feat_" + str(i) for i in range(1, 94)]
	use_cols.append("target")
	full = pd.read_csv(join(dataset_path, "train.csv"), sep=',', converters=converter, usecols=use_cols)

	full_mat = full.as_matrix()
	y = full_mat[:, -1]
	X = full_mat[:, 0:-1]
	return create_valid(X, y)

if __name__ == '__main__':
	load_toy1()
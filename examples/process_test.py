import numpy as np
import lightgbm as lgb
from os.path import join
import pandas as pd
import os
from scripts.processor import *
import pandas as pd
import os
from os.path import join
from sklearn.model_selection import StratifiedShuffleSplit

def load_otto():
	dataset_path = join(os.getcwd(), 'Otto')
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
								 random_state=1224)
	for train_index, test_index in sss.split(X, y):
		X_train = X[train_index]
		y_train = y[train_index]
		X_test = X[test_index]
		y_test = y[test_index]

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

from sklearn.model_selection import StratifiedShuffleSplit

def load_toy1() -> object:
	# load or create your dataset
	print('Load data...')
	df_train = pd.read_csv('multiclass_classification/multiclass.train', header=None, sep='\t')
	df_test = pd.read_csv('multiclass_classification/multiclass.test', header=None, sep='\t')

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


def LightGBMTest():
	dataset = load_toy1()
	label = dataset["train"]["y"]
	lgb_train = lgb.Dataset(dataset["train"]["X"], dataset["train"]["y"])
	lgb_valid = lgb.Dataset(dataset["valid"]["X"], dataset["valid"]["y"])

	num_train, num_feature = dataset["train"]["X"].shape

	feature_name = ['feature_' + str(col) for col in range(num_feature)]
	params = {
		'boosting_type': 'gbdt',
		'objective': 'multiclass',
		'metric': 'mlogloss',
		'num_leaves': 31,
		'learning_rate': 0.05,
		'feature_fraction': 0.9,
		'bagging_fraction': 0.8,
		'bagging_freq': 5,
		'verbose': 0,
		'num_boost_round': 200,
		'num_class': len(np.unique(label))
	}

	booster = lgb.train(params,
				lgb_train,
				num_boost_round=params['num_boost_round'],
				valid_sets=[lgb_valid],  # eval training data
				feature_name=feature_name,
				categorical_feature=[21])

	p = LightGBMProcess(
		booster,
		dataset["train"],
		{
		"valid_1": dataset["valid"]
		},
		params,
		join("..","result", "result-toy")
	)

	p.process()


if __name__ == '__main__':
	LightGBMTest()
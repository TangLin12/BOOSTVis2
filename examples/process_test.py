import lightgbm as lgb
from os.path import join
import pandas as pd
from scripts import processor

def load_toy1():
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
		'num_boost_round': 100,
		'num_class': 5
	}

	booster = lgb.train(params,
				lgb_train,
				num_boost_round=params['num_boost_round'],
				valid_sets=[lgb_valid],  # eval training data
				feature_name=feature_name,
				categorical_feature=[21])
	p = processor.LightGBMProcess(booster, dataset["train"], {
		"valid_1": dataset["valid"]
	}, params, join("result", "result-test"))
	p.process()


if __name__ == '__main__':
	LightGBMTest()
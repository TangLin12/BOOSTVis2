import lightgbm as lgb
from os.path import join
from ..scripts import processor
from tests import datasets

def LightGBMTest():
    dataset = datasets.load_toy1()
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
        'num_boost_round': 10,
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
    }, params, join("..", "result", "result-test"))
    p.process()


if __name__ == '__main__':
    LightGBMTest()
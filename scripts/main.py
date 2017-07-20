from tests.datasets import *
from .training.lightgbm_training import lightgbm_test
from .training.xgboost_training import xgboost_test


def run_lightgbm_otto():
    dataset = load_otto()
    print("data loaded")
    training_data, training_label = dataset["training"]
    testing_data, testing_label = dataset["testing"]

    iteration_count = 800

    num_class = len(np.unique(training_label))
    data_count, feature_count = training_data.shape

    # for depth in [8]:
    depth = 8
    for learning_rate in [0.1]:
        # for min_data in [10, 20, 40, 100, 150, 200]:
        for min_data in [10]:
            for num_leaves in [150]:
            # for num_leaves in [100, ]:
                for colsample_bytree in [0.5]:
                    params = {
                        "tree_learner": "serial",
                        "is_train_metric": False,
                        "metric": ["multi_logloss", "multi_error"],
                        'task': 'train',
                        'max_depth': 8,
                        # 'subsample': 0.8,
                        # 'subsample_freq': 1,
                        'num_leaves': 300,
                        'learning_rate': 0.1,
                        'num_iterations': 800,
                        'boosting_type': 'gbdt',
                        'objective': 'multiclass',
                        'min_data_in_leaf': 5,
                        'num_class': num_class,
                        'nthread': -1,
                        'seed': 777
                    }

                    info = {
                        "feature_count": feature_count,
                        "iteration_count": iteration_count,
                        "data_count": data_count,
                        "class_count": num_class
                    }

                    identifier = "lightgbm-otto-8-0.1-noleaflimit-800"

                    lightgbm_test(identifier, (training_data, training_label), (testing_data, testing_label), params,
                                  info, True)



def run_xgboost_otto():
    training_data_sampled = False
    dataset = load_otto()
    print("data loaded")
    training_data, training_label = dataset["training"]
    testing_data, testing_label = dataset["testing"]

    iteration_count = 800

    num_class = len(np.unique(training_label))
    data_count, feature_count = training_data.shape

    depth = 8
    learning_rate = 0.1
    params = {
        'max_depth': depth,
        'learning_rate': learning_rate,
        'n_estimators': iteration_count,
        'objective': 'multi:softprob',
        'eval_metric': ['mlogloss'],
        'num_class': num_class,
        'num_round': iteration_count,
        'min_child_weight': 5
    }
    info = {
        "feature_count": feature_count,
        "iteration_count": iteration_count,
        "data_count": data_count,
        "class_count": num_class
    }
    identifier = "xgboost-otto-%d-%s-%d" % (depth, learning_rate, iteration_count)
    xgboost_test(identifier, (training_data, training_label), (testing_data, testing_label),
                 params, info)


def run_lightgbm_waveform():
    dataset = load_waveform()
    print("data loaded")
    training_data, training_label = dataset["training"]
    testing_data, testing_label = dataset["testing"]

    iteration_count = 100

    num_class = len(np.unique(training_label))
    data_count, feature_count = training_data.shape

    # for depth in [8]:

    params = {
        "tree_learner": "serial",
        "is_train_metric": False,
        "metric": ["multi_logloss", "multi_error"],
        'task': 'train',
        'max_depth': 4,
        'num_leaves': 50,
        'learning_rate': 0.1,
        'num_iterations': iteration_count,
        'boosting_type': 'gbdt',
        'objective': 'multiclass',
        'min_data_in_leaf': 5,
        'num_class': num_class,
        'nthread': -1,
        'seed': 777
    }

    info = {
        "feature_count": feature_count,
        "iteration_count": iteration_count,
        "data_count": data_count,
        "class_count": num_class
    }

    identifier = "lightgbm-waveform"

    lightgbm_test(identifier, (training_data, training_label), (testing_data, testing_label), params,
                  info, True)


if __name__ == '__main__':
    run_lightgbm_waveform()
    # run_lightgbm_mnist()
    # run_xgboost_otto()
    # run_lightgbm_otto()
    # run_lightgbm_isolet()

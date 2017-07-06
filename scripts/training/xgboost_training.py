import configparser
import json
from os import makedirs
from os.path import exists
from ..datasets import load_otto

import xgboost as xgb
import numpy as np
from sklearn.metrics import accuracy_score, confusion_matrix

from ..logger import Logger
from ..config import *


def xgboost_test(identifier, training, testing, params, info):
	# specify parameters via map
	iteration_count = info["iteration_count"]
	training_data, training_label = training
	testing_data, testing_label = testing
	num_train, num_feature = training_data.shape
	num_test = testing_data.shape[0]

	result_folder = join(*[PROJECT_ROOT, "result", identifier])
	if not exists(result_folder):
		makedirs(result_folder)

	with open(join(result_folder, "training_label"), "w") as file:
		file.write("\n".join([str(l) for l in training_label]))
	with open(join(result_folder, "testing_label"), "w") as file:
		file.write("\n".join([str(l) for l in testing_label]))
	print("label saved")

	manifest = {}
	manifest["feature_count"] = info["feature_count"]
	manifest["iteration_count"] = info["iteration_count"]
	manifest["class_count"] = info["class_count"]
	manifest["data_count"] = info["data_count"]
	manifest["class_label"] = ", ".join([str(c) for c in np.unique(training_label)])
	cp = configparser.ConfigParser()
	cp["DEFAULT"] = manifest
	with open(join(result_folder, "manifest"), "w") as manifest_file:
		cp.write(manifest_file)

	# create dataset for xgboost
	training_mat = xgb.DMatrix(training_data, label=training_label)
	testing_mat = xgb.DMatrix(testing_data, label=testing_label)
	# generate a feature name
	feature_name = ['f_' + str(col) for col in range(num_feature)]

	sys.stdout = Logger(join(result_folder, "console.log"))

	def monitor(env):
		print("%s\t" % (env.iteration))

	import pickle

	if exists(join(result_folder, "model.p")):
		# bst = xgb.Booster({'nthread': 4})  # init model
		bst = pickle.load(open(join(result_folder, "model.p"), "rb" ))
		# bst.load_model(join(result_folder, "model"))  # load data
	else:
		print('Start training...')
		bst = xgb.train(params, training_mat,
						evals=[(training_mat, "train"), (testing_mat, "test")],
						num_boost_round=params["num_round"],
						callbacks=[monitor])
		print("model trained")
		pickle.dump(bst, open("model.p", "wb"))
		bst.dump_model(join(result_folder, "model"), with_stats=True)
	print("Finish training")
	# gbm = lgb.Booster(model_file=join(result_folder, "model"))
	# return

	importances = bst.get_score(importance_type='gain')
	s = []
	for k in importances:
		s.append(str(k) + "\t" + str(importances[k]))
	print("\n".join(s))

	# AFTER TRAINING
	# log data
	margin_train = np.zeros((iteration_count, len(training_label)), dtype=np.float64)
	variance_train = np.zeros((iteration_count,), dtype=np.float64)
	mean_value_train = np.zeros((iteration_count,), dtype=np.float64)

	margin_test = np.zeros((iteration_count, len(training_label)), dtype=np.float64)
	variance_test = np.zeros((iteration_count,), dtype=np.float64)
	mean_value_test = np.zeros((iteration_count,), dtype=np.float64)

	confusion_matrices_train = []
	confusion_matrices_test = []
	train_accuracy_list = []
	test_accuracy_list = []

	split_size = POSTERIOR_SPLIT_SIZE
	train_pred_stash = []
	test_pred_stash = []
	train_posterior_folder = join(*[PROJECT_ROOT, "result", identifier, "posterior_full_train"])
	test_posterior_folder = join(*[PROJECT_ROOT, "result", identifier, "posterior_full_test"])

	if not exists(train_posterior_folder):
		makedirs(train_posterior_folder)
	if not exists(test_posterior_folder):
		makedirs(test_posterior_folder)

	import time
	start_time = time.time()

	for t in range(0, iteration_count):
		train_pred = bst.predict(training_mat, ntree_limit=t + 1)
		test_pred = bst.predict(testing_mat, ntree_limit=t + 1)

		# store posterior
		train_pred_stash.append(train_pred)
		if len(train_pred_stash) == split_size:
			# save to folder
			np.save(join(train_posterior_folder, str(t - split_size + 1) + "-" + str(t) + ".npy"), train_pred_stash)
			train_pred_stash = []
		test_pred_stash.append(test_pred)
		if len(test_pred_stash)== split_size:
			# save to folder
			np.save(join(test_posterior_folder, str(t - split_size + 1) + "-" + str(t) + ".npy"), test_pred_stash)
			test_pred_stash = []

		# train margin related
		for i, y_pred_single in enumerate(train_pred):
			true_label_index = int(training_label[i])
			true_label_prob = y_pred_single[true_label_index]
			y_pred_single[true_label_index] = -1
			others_max_prob = np.amax(y_pred_single)
			y_pred_single[true_label_index] = true_label_prob
			margin_train[t][i] = true_label_prob - others_max_prob
		variance_train[t] = np.var(margin_train[t])
		mean_value_train[t] = np.mean(margin_train[t])

		# test margin related
		for i, y_pred_single in enumerate(test_pred):
			true_label_index = int(testing_label[i])
			true_label_prob = y_pred_single[true_label_index]
			y_pred_single[true_label_index] = -1
			others_max_prob = np.amax(y_pred_single)
			y_pred_single[true_label_index] = true_label_prob
			margin_test[t][i] = true_label_prob - others_max_prob
		variance_test[t] = np.var(margin_test[t])
		mean_value_test[t] = np.mean(margin_test[t])

		train_decision = np.argmax(train_pred, axis=1)  # multiclass decision
		test_decision = np.argmax(test_pred, axis=1)

		confusion_matrices_train.append(confusion_matrix(training_label, train_decision))  # k * k matrix
		confusion_matrices_test.append(confusion_matrix(testing_label, test_decision))  # k * k matrix
		train_accuracy = accuracy_score(training_label, train_decision)  # scalar
		test_accuracy = accuracy_score(testing_label, test_decision)
		train_accuracy_list.append(train_accuracy)
		test_accuracy_list.append(test_accuracy)

		print("%s\t%.2f\t%s\t%s" % (t, time.time() - start_time, train_accuracy, test_accuracy))
		start_time = time.time()

	np.save(join(result_folder, "confusion_matrix_train"), np.array(confusion_matrices_train))
	np.save(join(result_folder, "confusion_matrix_test"), np.array(confusion_matrices_test))
	with open(join(result_folder, "overview_curves.json"), "w") as curve_file:
		json.dump({
			"margin_mean_train": mean_value_train.tolist(),
			"margin_variance_train": variance_train.tolist(),
			"margin_mean_test": mean_value_test.tolist(),
			"margin_variance_test": variance_test.tolist(),
			"accuracy-train": train_accuracy_list,
			"accuracy-test": test_accuracy_list
		}, curve_file, ensure_ascii=True)
	print("done")


def run_xgboost_otto1():
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
		'num_round': iteration_count
	}
	info = {
		"feature_count": feature_count,
		"iteration_count": iteration_count,
		"data_count": data_count,
		"class_count": num_class
	}
	identifier = "xgboost-otto-%d-%s-%d-trial" % (depth, learning_rate, iteration_count)
	xgboost_test(identifier, (training_data, training_label), (testing_data, testing_label),
					   params, info)


if __name__ == '__main__':
	run_xgboost_otto1()
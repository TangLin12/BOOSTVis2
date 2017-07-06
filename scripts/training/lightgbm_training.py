import configparser
import json
from os import makedirs
from os.path import exists,join

import lightgbm as lgb
import numpy as np
from sklearn.metrics import accuracy_score, confusion_matrix

from ..logger import Logger
from ..config import *


def learning_rate_func(current_round):
	# if( current_round < 400) :
		# return 0.1 * np.exp( - current_round	/ 1121.0 )
	# else:
	#	 return 0.07*np.exp( - (current_round - 400 ) / 206.0 )
	return 0.1 * np.exp( - current_round / 447 )


def lightgbm_test(identifier, training, testing, params, info, full=False):
	# specify parameters via map
	iteration_count = info["iteration_count"]
	training_data, training_label = training
	testing_data, testing_label = testing
	num_train, num_feature = training_data.shape
	num_test = testing_data.shape[0]

	result_folder = join(*[PROJECT_ROOT, "result", identifier])
	# if exists(result_folder):
	# 	import shutil
	# 	shutil.rmtree(result_folder)
	if not exists(result_folder):
		makedirs(result_folder)

	# save feature raw
	raw_data = "[" + ",".join(["[" + ",".join([str(e) for e in r]) + "]" for r in training_data]) + "]"
	raw_data += "_"
	raw_data += "[" + ",".join([str(e) for e in training_label]) + "]"
	with open(join(*[result_folder, "feature-raw"]), "w") as fr_file:
		fr_file.write(raw_data)
	raw_data = "[" + ",".join(["[" + ",".join([str(e) for e in r]) + "]" for r in testing_data]) + "]"
	raw_data += "_"
	raw_data += "[" + ",".join([str(e) for e in testing_label]) + "]"
	with open(join(*[result_folder, "feature-raw-valid"]), "w") as fr_file:
		fr_file.write(raw_data)

	with open(join(result_folder, "training_label"), "w") as file:
		file.write("\n".join([str(l) for l in training_label]))
	with open(join(result_folder, "testing_label"), "w") as file:
		file.write("\n".join([str(l) for l in testing_label]))
	# print("label saved")

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

	# create dataset for lightgbm
	lgb_train = lgb.Dataset(training_data, training_label)
	lgb_eval = lgb.Dataset(testing_data, testing_label, reference=lgb_train)

	# generate a feature name
	feature_name = ['f_' + str(col) for col in range(num_feature)]

	logger = Logger(join(result_folder, "console.log"))
	sys.stdout = logger

	def monitor(env):
		print("%s\t" % (env.iteration))

	print('Start training...')
	eval_result = {}
	gbm = lgb.train(params,
					lgb_train,
					num_boost_round=params["num_iterations"],
					valid_sets=[lgb_train, lgb_eval],  # eval training data
					valid_names=["train", "valid"],
					feature_name=feature_name,
					callbacks=[monitor],
					evals_result=eval_result)
	print(eval_result)
	gbm.save_model(join(result_folder, 'model'))

	# np.savetxt(join(result_folder, "eval_result"), [
	# 	eval_result["train"]["multi_logloss"],
	# 	eval_result["train"]["multi_error"],
	# 	eval_result["valid"]["multi_logloss"],
	# 	eval_result["valid"]["multi_error"],
	# ])
	# print(gbm.feature_importances_)
	print("Finish training")
	# logger.close()
	# sys.stdout.close()

	if not full:
		return

	# gbm = lgb.Booster(model_file=join(result_folder, "model"))

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

	booster = lgb.Booster(model_file=join(result_folder, 'model'))

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

	# predict using 400th iteration
	print("----------------")
	train_pred = booster.predict(training_data, num_iteration=400)
	test_pred = booster.predict(testing_data, num_iteration=400)
	train_decision = np.argmax(train_pred, axis=1)  # multiclass decision
	test_decision = np.argmax(test_pred, axis=1)

	cm = confusion_matrix(testing_label, test_decision)  # k * k matrix
	class_accuracy = []
	for i, row in enumerate(cm):
		class_accuracy.append(row[i] / np.sum(row))
	print(class_accuracy)
	train_accuracy = accuracy_score(training_label, train_decision)  # scalar
	test_accuracy = accuracy_score(testing_label, test_decision)
	print(train_accuracy, test_accuracy)
	print("----------------")

	# predict using final iteration
	print("----------------")
	train_pred = booster.predict(training_data, num_iteration=iteration_count)
	test_pred = booster.predict(testing_data, num_iteration=iteration_count)
	train_decision = np.argmax(train_pred, axis=1)  # multiclass decision
	test_decision = np.argmax(test_pred, axis=1)

	cm = confusion_matrix(training_label, train_decision)  # k * k matrix
	class_accuracy = []
	for i, row in enumerate(cm):
		class_accuracy.append(row[i] / np.sum(row))
	print(class_accuracy)
	train_accuracy = accuracy_score(training_label, train_decision)  # scalar
	test_accuracy = accuracy_score(testing_label, test_decision)
	print(train_accuracy, test_accuracy)
	print("----------------")

	for t in range(0, iteration_count):
		train_pred = booster.predict(training_data, num_iteration=t + 1)
		test_pred = booster.predict(testing_data, num_iteration=t + 1)

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


if __name__ == '__main__':
	pass
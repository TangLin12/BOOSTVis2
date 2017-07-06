import math
import numpy as np
from numpy import uint8
# from PIL import Image
import random
from os import path, makedirs
from os.path import split, exists
import configparser
import csv
import pandas as pd

from sklearn import datasets

from sklearn.model_selection import StratifiedShuffleSplit
from .config import *


def naive_sample_debug(data, start, end):
	if start == end:
		return data
	X, y = data
	return X[start: end], y[start: end]


def stratified_sampling(total, sampling_ratio, index_result=False):
	if sampling_ratio <= 0 or sampling_ratio >= 1:
		return total
	data, label = total
	sss = StratifiedShuffleSplit(n_splits=1, train_size=sampling_ratio, test_size=1-sampling_ratio, random_state=TSNE_SAMPLE_SEED)
	train_sampled_index = []
	test_sampled_index = []
	for train_index, test_index in sss.split(data, label):
		train_sampled_index = train_index
		test_sampled_index = test_index
	print(len(train_sampled_index), len(data))
	if index_result:
		return (train_sampled_index, test_sampled_index)
	train_data = data[train_sampled_index]
	train_label = label[train_sampled_index]
	test_data = data[test_sampled_index]
	test_label = label[test_sampled_index]
	return ((train_data, train_label), (test_data, test_label))


def load_hastie(n_samples=12000, random_state=1):
	data, label = datasets.make_hastie_10_2(n_samples=n_samples, random_state=random_state)
	split = math.floor(n_samples * 0.2)
	return {
		"training": (data[0: -split], label[0: -split]),
		"testing": (data[-split:], label[-split:])
	}


# def persistent_imagenet(crop_size=PATCH_SIZE, channel=1, dataset_name="toy"):
#	 from data.image_net_normalize import get_files
#	 from data.image_net_normalize import normalize
#	 random.seed(RANDOM_SEED)
#
#	 wind_list = DATASETS[dataset_name]
#	 ordered_wind_list = sorted(wind_list)
#	 identifier = "-".join(ordered_wind_list)
#	 # storage_folder = DATASET_ROOT + "/ImageNet/" + identifier + "/"
#	 storage_folder = join(*[DATASET_ROOT, "ImageNet", "-".join([dataset_name, str(crop_size), str(channel)])])
#	 if not exists(storage_folder):
#		 makedirs(storage_folder)
#	 training_storage_path = join(storage_folder, "train")
#	 testing_storage_path = join(storage_folder, "test")
#
#	 with open(training_storage_path, "wb") as training_file, \
#			 open(testing_storage_path, "wb") as testing_file, \
#			 open(join(storage_folder, "training_paths"), "w") as training_paths, \
#			 open(join(storage_folder, "testing_paths"), "w") as testing_paths, \
#			 open(join(storage_folder, "manifest"), "w") as manifest_file:
#
#		 config = configparser.ConfigParser()
#		 manifest = {}
#		 manifest["feature_length"] = channel * crop_size ** 2
#		 training_sample_count = 0
#		 testing_sample_count = 0
#
#		 for i, wind in enumerate(ordered_wind_list):
#			 normalize(wind, crop_size)
#			 filenames = get_files(wind, DATASET_ROOT, crop_size)
#			 for j, filename in enumerate(filenames):
#				 r, f = split(filename)
#				 img = Image.open(filename)
#				 if channel == 1:
#					 img = img.convert("L")
#				 # tl =
#				 feat = list(img.getdata())
#				 if channel is not 1:
#					 # pass
#					 if img.layers == 3:
#						 flatten_feat = [f for l in feat for f in l]
#					 else:
#						 flatten_feat = [f for f in feat for f in [f, f, f]]
#				 else:
#					 flatten_feat = feat
#				 if j % 100 == 0:
#					 print(j)
#				 # continue
#
#				 if random.random() < 0.75:
#					 # training_data.append(flatten_feat)
#					 # training_label.append(i)
#					 training_paths.write(f + "\t" + str(i) + "\n")
#					 training_file.write(bytearray(flatten_feat))
#					 training_sample_count += 1
#				 else:
#					 # testing_data.append(flatten_feat)
#					 # testing_label.append(i)
#					 testing_paths.write(f + "\t" + str(i) + "\n")
#					 testing_file.write(bytearray(flatten_feat))
#					 testing_sample_count += 1
#				 # break
#				 # if training_sample_count > 30:
#				 #	 break
#		 manifest["training_sample_count"] = training_sample_count
#		 manifest["testing_sample_count"] = testing_sample_count
#		 config["DEFAULT"] = manifest
#		 config.write(manifest_file)
#
#	 # return {
#	 #	 "training": (training_data, training_label),
#	 #	 "testing": (testing_data, testing_label)
#	 # }
#	 # print(len(files))


def load_imagenet(dataset_name="toy", patch_size=PATCH_SIZE, channel=CHANNEL):
	wind_list = DATASETS[dataset_name]
	# ordered_wind_list = sorted(wind_list)
	root_folder = join(*[DATASET_ROOT, "ImageNet", "-".join([dataset_name, str(patch_size), str(channel)])])
	training_storage_path = join(root_folder, "train")
	testing_storage_path = join(root_folder, "test")

	if not path.exists(training_storage_path) or not path.exists(testing_storage_path):
		print("not persistened")
		return

	def load_feature(path, sample_count, feature_length):
		with open(path, "rb") as feat_file:
			all_features = bytearray(feat_file.read())
			return np.array(all_features).reshape((sample_count, feature_length))

	# load manifest
	config = configparser.ConfigParser()
	config.read(join(root_folder, "manifest"))
	manifest = config["DEFAULT"]
	training_count = int(manifest["training_sample_count"])
	testing_count = int(manifest["testing_sample_count"])
	feature_length = int(manifest["feature_length"])

	# load features
	training_data = load_feature(training_storage_path, training_count, feature_length)
	testing_data = load_feature(testing_storage_path, testing_count, feature_length)

	# load label
	with open(join(root_folder, "training_paths")) as training_label_file, \
			open(join(root_folder, "testing_paths")) as testing_label_file:
		training_label = np.zeros(shape=(training_count), dtype=uint8)
		testing_label = np.zeros(shape=(testing_count), dtype=uint8)

		for i, r in enumerate(csv.reader(training_label_file, delimiter="\t")):
			training_label[i] = int(r[1])
		for i, r in enumerate(csv.reader(testing_label_file, delimiter="\t")):
			testing_label[i] = int(r[1])
	print("data loading done")
	return {
		"training": (training_data, training_label),
		"testing": (testing_data, testing_label)
	}


def load_higgs(sampled=False):
	dataset_path = join(*[DATASET_ROOT, "HIGGS"])
	train_raw = pd.read_csv(join(dataset_path, "higgs.train" if not sampled else "higgs1.train"), header=None, sep=' ')
	test_raw = pd.read_csv(join(dataset_path, "higgs.test" if not sampled else "higgs1.test"), header=None, sep=' ')
	y_train = train_raw[0]
	y_test = test_raw[0]
	X_train = train_raw.drop(0, axis=1)
	X_test = test_raw.drop(0, axis=1)
	return {
		"training": (X_train, y_train),
		"testing": (X_test, y_test)
	}


def load_otto_enhanced():
	dataset_path = join(*[DATASET_ROOT, "Otto"])
	converter = {
		"target": lambda x: int(x.replace("Class_", "")) - 1
	}
	use_cols = ["feat_" + str(i) for i in range(1, 94)]
	use_cols.append("target")
	full = pd.read_csv(join(dataset_path, "train.csv"), sep=',', converters=converter, usecols=use_cols)

	unsupervised_set = pd.read_csv(join(dataset_path, "enhanced-set.csv"), sep=',')
	predict_prob = unsupervised_set.as_matrix()[:, 1:]
	confidence = np.max(predict_prob, axis=1)
	high_confidence = np.argwhere(confidence < 0.899)[:, 0]

	unsupervised_instance = load_otto_true_test()[:, 1:][high_confidence, :]
	unsupervised_label = np.argmax(predict_prob[high_confidence], axis=1)

	# test_raw = pd.read_csv(join(dataset_path, "test.csv"), sep=',', converters=converter, usecols=use_cols)
	full_mat = full.as_matrix()
	# test_mat = test_raw.as_matrix()
	y = full_mat[:, -1]
	# y_test = test_mat[:, -1]
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
			"training": (np.concatenate((X_train, unsupervised_instance), axis=0),
				np.concatenate((y_train[:, np.newaxis], unsupervised_label[:, np.newaxis]), axis=0)[:, 0]),
			"testing": (X_test, y_test)
		}


def load_otto_feature():
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

	new_features = []
	new_features.append(X[:, 15] + X[:, 85])  # f_93
	new_features.append(X[:, 8] + X[:, 85])  # f_94
	new_features.append(X[:, 66] + X[:, 23])  # f_95 red + blue
	new_features.append(X[:, 79] + X[:, 78])  # f_96 red + blue
	new_features.append(X[:, 14] + X[:, 17])  # f_97
	new_features.append(X[:, 25] + X[:, 61])  # f_98

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


def load_otto():
	dataset_path = join(*[DATASET_ROOT, "Otto"])
	converter = {
		"target": lambda x: int(x.replace("Class_", "")) - 1
	}
	use_cols = ["feat_" + str(i) for i in range(1, 94)]
	use_cols.append("target")
	full = pd.read_csv(join(dataset_path, "train.csv"), sep=',', converters=converter, usecols=use_cols)

	# test_raw = pd.read_csv(join(dataset_path, "test.csv"), sep=',', converters=converter, usecols=use_cols)
	full_mat = full.as_matrix()
	# test_mat = test_raw.as_matrix()
	y = full_mat[:, -1]
	# y_test = test_mat[:, -1]
	X = full_mat[:, 0:-1]

	sampling_ratio = 0.8
	sss = StratifiedShuffleSplit(n_splits=1, train_size=sampling_ratio, test_size=1 - sampling_ratio,
								 random_state=TSNE_SAMPLE_SEED)
	for train_index, test_index in sss.split(X, y):
		X_train = X[train_index]
		y_train = y[train_index]
		X_test = X[test_index]
		y_test = y[test_index]
		# np.savetxt(join(*[DATASET_ROOT, "Otto", "split_train.csv"]), np.concatenate((X_train, y_train[:, np.newaxis]), axis=1).astype(np.int))
		# np.savetxt(join(*[DATASET_ROOT, "Otto", "split_valid.csv"]), np.concatenate((X_test, y_test[:, np.newaxis]), axis=1).astype(np.int))
		# with open(join(*[DATASET_ROOT, "Otto", "split_train.csv"]), "w") as train_file:
		# 	d = np.concatenate((X_train, y_train[:, np.newaxis]), axis=1)
		# 	for r in d:
		# 		train_file.write(",".join([str(int(e)) for e in r]) + "\n")
		# with open(join(*[DATASET_ROOT, "Otto", "split_valid.csv"]), "w") as test_file:
		# 	d = np.concatenate((X_test, y_test[:, np.newaxis]), axis=1)
		# 	for r in d:
		# 		test_file.write(",".join([str(int(e)) for e in r]) + "\n")

		return {
			"training": (X_train, y_train),
			"testing": (X_test, y_test)
		}

def load_otto_true_test():
	dataset_path = join(*[DATASET_ROOT, "Otto"])
	test_raw = pd.read_csv(join(dataset_path, "test.csv"), sep=',')
	return test_raw.as_matrix()


def load_isolet():
	dataset_path = join(*[DATASET_ROOT, "Isolet"])

	train_raw = pd.read_csv(join(dataset_path, "isolet1+2+3+4.data"), header=None, sep=',')
	test_raw = pd.read_csv(join(dataset_path, "isolet5.data"), header=None, sep=',')
	feature_count = 617
	print(train_raw.shape, test_raw.shape)
	y_train = train_raw.iloc[:, feature_count] - 1
	y_test = test_raw.iloc[:, feature_count] - 1
	X_train = train_raw.drop(feature_count, axis=1)
	X_test = test_raw.drop(feature_count, axis=1)

	return {
		"training": (X_train, y_train),
		"testing": (X_test, y_test)
	}



def load_syntic_data():
	dataset = load_otto()
	print("data loaded")
	training_data, training_label = dataset["training"]
	testing_data, testing_label = dataset["testing"]

	filtered_data = []
	filtered_label = []
	for i, l in enumerate(training_label):
		if l == 2 or l == 8 or l == 7:
			continue
		else:
			filtered_data.append(training_data[i, :])
			if l > 2:
				filtered_label.append(l - 1)
			else:
				filtered_label.append(l)

	filtered_data1 = []
	filtered_label1 = []
	for i, l in enumerate(testing_label):
		if l == 2 or l == 8 or l == 7:
			continue
		else:
			filtered_data1.append(testing_data[i, :])
			if l > 2:
				filtered_label1.append(l - 1)
			else:
				filtered_label1.append(l)

	print(len(filtered_label), len(filtered_label1))
	d = 9
	return {
		"training": (np.array(filtered_data[::d]), np.array(filtered_label[::d])),
		"testing": (np.array(filtered_data1[::d]), np.array(filtered_label1[::d]))
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


def persist_waveform2():
	all_data = load_waveform()
	training_data = all_data["training"][0]
	training_label = all_data["training"][1]
	raw_data = "[" + ",".join(["[" + ",".join([str(e) for e in r]) + "]" for r in training_data]) + "]"
	raw_data += "_"
	raw_data += "[" + ",".join([str(e) for e in training_label]) + "]"
	with open(join(*[DATASET_ROOT, "Waveform2", "feature-raw"]), "w") as fr_file:
		fr_file.write(raw_data)


def persist_waveform2_valid():
	all_data = load_waveform()
	training_data = all_data["testing"][0]
	training_label = all_data["testing"][1]
	raw_data = "[" + ",".join(["[" + ",".join([str(e) for e in r]) + "]" for r in training_data]) + "]"
	raw_data += "_"
	raw_data += "[" + ",".join([str(e) for e in training_label]) + "]"
	with open(join(*[DATASET_ROOT, "Waveform2", "feature-raw-valid"]), "w") as fr_file:
		fr_file.write(raw_data)


def persist_otto():
	all_data = load_otto()
	training_data = all_data["training"][0]
	training_label = all_data["training"][1]
	raw_data = "[" + ",".join(["[" + ",".join([str(e) for e in r]) + "]" for r in training_data]) + "]"
	raw_data += "_"
	raw_data += "[" + ",".join([str(e) for e in training_label]) + "]"
	with open(join(*[DATASET_ROOT, "Otto", "feature-raw"]), "w") as fr_file:
		fr_file.write(raw_data)


def persist_otto_valid():
	all_data = load_otto()
	training_data = all_data["testing"][0]
	training_label = all_data["testing"][1]
	raw_data = "[" + ",".join(["[" + ",".join([str(e) for e in r]) + "]" for r in training_data]) + "]"
	raw_data += "_"
	raw_data += "[" + ",".join([str(e) for e in training_label]) + "]"
	with open(join(*[DATASET_ROOT, "Otto", "feature-raw-valid"]), "w") as fr_file:
		fr_file.write(raw_data)


def persist_isolet():
	all_data = load_isolet()
	# all_data = load_otto()
	training_data = all_data["training"][0]
	training_label = all_data["training"][1]

	raw_data = "[" + ",".join(["[" + ",".join([str(e) for e in training_data[r]]) + "]" for r in training_data]) + "]"
	raw_data += "_"
	raw_data += "[" + ",".join([str(e) for e in training_label]) + "]"
	with open(join(*[DATASET_ROOT, "Isolet", "feature-raw"]), "w") as fr_file:
		fr_file.write(raw_data)


def load_otto_feature_raw_train():
	with open(join(*[DATASET_ROOT, "Otto", "feature-raw"])) as raw_file:
		return raw_file.read()

def load_otto_feature_raw_valid():
	with open(join(*[DATASET_ROOT, "Otto", "feature-raw-valid"])) as raw_file:
		return raw_file.read()


def load_isolet_feature_raw():
	with open(join(*[DATASET_ROOT, "Isolet", "feature-raw"])) as raw_file:
		return raw_file.read()


def load_mnist_feature_raw():
	with open(join(*[DATASET_ROOT, "mnist", "feature-raw"])) as raw_file:
		return raw_file.read()


if __name__ == "__main__":
	# load_higgs(True)
	# load_otto()
	# load_otto_true_test()
	persist_otto_valid()
	# persist_isolet()
	persist_waveform2_valid()
	persist_waveform2()
	# d = load_waveform()
	# print(len(d))
	# load_otto_enhanced()

	# persist_otto()
	# persist_isolet()
	# persist_mnist()
	# pass
	# start = datetime.now()
	# dataset_name = "terrier"
	# channel = 3
	# patch_size = 256
	# data = persistent_imagenet(crop_size=patch_size, channel=channel, dataset_name=dataset_name)
	# # data = load_imagenet()
	# print(datetime.now() - start)
	# # print(256**2*3/40)

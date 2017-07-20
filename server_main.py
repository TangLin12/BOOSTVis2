from flask import Flask, jsonify
import numpy as np
import configparser
from os import getcwd

import json
from os.path import join
import math

from scripts.clustering import performClustering

HTML_ROOT = getcwd()

app = Flask(__name__, static_url_path="/static")

POSTERIOR_SPLIT_SIZE = 10
from flask import after_this_request, request

from time import gmtime, strftime

import struct
from numpy import array


@app.route('/api/confusion_matrix', methods=['GET'])
def get_confusion_matrix():
	dataset_identifier = request.args["dataset"]
	type = int(request.args["is_train"])
	dataset_path = join(*[HTML_ROOT, "result", dataset_identifier])
	if type:
		confusion_matrix = np.load(join(dataset_path, "confusion_matrix_train.npy"))
	else:
		confusion_matrix = np.load(join(dataset_path, "confusion_matrix_test.npy"))
	return jsonify(confusion_matrix.tolist())


@app.route('/api/feature-importance-tree-size', methods=['GET'])
def get_feature_importance_tree_size():
	dataset_identifier = request.args["dataset"]
	# type = int(request.args["is_train"])
	dataset_path = join(*[HTML_ROOT, "result", dataset_identifier])
	
	with open(join(dataset_path, "importance_and_size.txt")) as file:
		return file.read()


@app.route('/api/manifest', methods=['GET'])
def get_manifest():
	dataset_identifier = request.args["dataset"]
	dataset_path = join(*[HTML_ROOT, "result", dataset_identifier])
	config = configparser.ConfigParser()
	config.read(join(dataset_path, "manifest"))
	setting_tuples = config.items("DEFAULT")
	manifest = {}
	for t in setting_tuples:
		k, v = t
		manifest[k] = v
	return jsonify(manifest)


import time


@app.route('/api/feature-raw-zipped', methods=['GET'])
# @gzipped
def get_raw_feature_zipped():
	dataset_identifier = request.args["dataset"]
	dataset = dataset_identifier.split("-")[1]
	dataset_path = join(*[HTML_ROOT, "result", dataset_identifier])
	type = int(request.args["is_train"])
	if type:
		return send_file(join(dataset_path, "feature-raw.zip"))
	else:
		return send_file(join(dataset_path, "feature-raw-valid.zip"))


from flask import send_file


@app.route('/api/predicted-label', methods=['GET'])
def get_predicted_label():
	dataset_identifier = request.args["dataset"]
	type = int(request.args["is_train"])
	root = join(*[HTML_ROOT, "result", dataset_identifier])
	l = np.loadtxt(join(root, "predicted-label-" + ("train" if type else "test")), dtype=np.int16)
	return jsonify(l.tolist())


@app.route('/api/posterior-by-class', methods=['GET'])
def get_posterior_by_class():
	start = time.time()
	dataset_identifier = request.args["dataset"]
	type = int(request.args["is_train"])
	class_ = request.args["class_"]
	root = join(*[HTML_ROOT, "result", dataset_identifier])
	if type:
		dataset_path = join(*[HTML_ROOT, "result", dataset_identifier, "posteriors-train"])
	else:
		dataset_path = join(*[HTML_ROOT, "result", dataset_identifier, "posteriors-test"])
	return send_file(dataset_path + "-" + class_)


# add by Changjian, 2017/7/14
# load clustering result
@app.route('/api/clustering-by-class', methods=['GET'])
def get_clustering_by_class():
	start = time.time()
	dataset_identifier = request.args['dataset']
	type = int(request.args["is_train"])
	class_ = request.args["class_"]
	root = join(*[HTML_ROOT, "result", dataset_identifier])
	if type:
		dataset_path = join(*[HTML_ROOT, "result", dataset_identifier, "clustering", "train"])
	else:
		dataset_path = join(*[HTML_ROOT, "result", dataset_identifier, "clustering", "test"])
	return send_file(dataset_path + "-" + class_)


# add by Changjian, 2017/7/14
@app.route('/api/perform-clustering-request', methods=['GET'])
def perform_clustering():
	dataset_identifier = request.args["dataset"]
	performClustering(dataset_identifier=dataset_identifier, label_number=9)
	return jsonify('[test]')


@app.before_request
def logging():
	app.logger.info(request.remote_addr + "\t" + request.url + "\t" + strftime("%Y-%m-%d %H:%M:%S", gmtime()))


import logging
from logging import FileHandler

if __name__ == '__main__':
	start = time.time()
	root = join(*[HTML_ROOT, "result"])
	app.run(port=8083, host="0.0.0.0", threaded=True)

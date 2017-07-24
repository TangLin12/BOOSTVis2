from flask import Flask, jsonify
import numpy as np
import configparser
from scripts.algorithm import *
import os
import sys

import json
from os.path import join, exists
import math
from os import getcwd
from os.path import join
from warehouse import *

import gc

from scripts.clustering import performClustering

HTML_ROOT = getcwd()

app = Flask(__name__, static_url_path="/static")

POSTERIOR_SPLIT_SIZE = 10
from flask import after_this_request, request

TREE_ALL_DATA = {}
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

# add by Shouxing, 2017 / 7 / 20
@app.route('/api/feature_matrix_for_cluster', methods=['GET'])
def get_feature_matrix_for_cluster():
    cluster_ids = json.loads(request.args.get('cluster_ids'))
    class_id = json.loads(request.args.get('class_id'))
    cluster_classes = json.loads(request.args.get('cluster_classes'))
    features = json.loads(request.args.get('features'))
    set_type = json.loads(request.args.get('set_type'))
    current_module = sys.modules[__name__]
    project_root = os.path.dirname(current_module.__file__)
    project_root = join(project_root, 'result', 'result-test')
    feature_raw_info = np.load(join(project_root, 'feature-raw-' + str(set_type) + '.npy'))
    feature_raw = feature_raw_info.tolist()['X']
    size = len(cluster_ids)
    features_split_values = np.load(join(project_root, 'features_split_values_' + str(set_type) + '.npy'))
    features_split_widths = np.load(join(project_root, 'features_split_widths_' + str(set_type) + '.npy'))

    feature_matrix = []
    widths = []
    ware_house = WareHouse(project_root)
    for feature_id in features:
        row = []
        widths.append(features_split_widths[feature_id].tolist())
        bins = features_split_values[feature_id]
        for i in range(size):
            instance_ids = ware_house.get_instances_by_cluster(set_type, class_id, cluster_classes[i], cluster_ids[i])
            feature_values = [feature_raw[instance_id][feature_id] for instance_id in instance_ids]
            distribution = get_feature_distribution(feature_values, bins)
            row.append(distribution)
        feature_matrix.append(row)
    return jsonify({
        'feature_matrix': feature_matrix,
        'feature_widths': widths
    })


# add by Shouxing, 2017 / 7 / 20
@app.route('/api/feature_matrix_for_class', methods=['GET'])
def get_feature_matrix_for_class():
    total = time.time()
    class_id = json.loads(request.args.get('class_id'))
    features = json.loads(request.args.get('features'))
    set_type = json.loads(request.args.get('set_type'))
    current_module = sys.modules[__name__]
    project_root = os.path.dirname(current_module.__file__)
    project_root = join(project_root, 'result', 'result-test')
    feature_raw_info = np.load(join(project_root, 'feature-raw-' + str(set_type) + '.npy'))
    feature_raw = feature_raw_info.tolist()['X']
    instance_labels = feature_raw_info.tolist()['y']
    features_split_values = np.load(join(project_root, 'features_split_values_' + str(set_type) + '.npy'))
    features_split_widths = np.load(join(project_root, 'features_split_widths_' + str(set_type) + '.npy'))
    size = len(instance_labels)
    class_instance_ids = [[],[]]
    for i in range(size):
        if instance_labels[i] == class_id:
            class_instance_ids[0].append(i)
        else:
            class_instance_ids[1].append(i)

    feature_matrix = []
    widths = []
    get_distribution = 0
    count = 0
    for feature_id in features:
        bins = features_split_values[feature_id]
        widths.append(features_split_widths[feature_id].tolist())
        row = []
        for i in range(2):
            feature_values = [feature_raw[instance_id][feature_id] for instance_id in class_instance_ids[i]]
            get_distribution -= time.time()
            distribution = get_feature_distribution(feature_values, bins)
            get_distribution += time.time()
            row.append(distribution)
        feature_matrix.append(row)
    print('total', 'get_distribution')
    print(float(time.time() - total), float(get_distribution), count)
    return jsonify({
        'feature_matrix': feature_matrix,
        'feature_widths': widths
    })

# add by Shouxing, 2017 / 7 / 20
@app.route('/api/bin_exist_for_instance', methods=['GET'])
def get_bin_exist_for_instance():
    instance_id = json.loads(request.args.get('instance_id'))
    features = json.loads(request.args.get('features'))
    set_type = json.loads(request.args.get('set_type'))
    current_module = sys.modules[__name__]
    project_root = os.path.dirname(current_module.__file__)
    project_root = join(project_root, 'result', 'result-test')
    feature_raw_info = np.load(join(project_root, 'feature-raw-' + str(set_type) + '.npy'))
    feature_raw = feature_raw_info.tolist()['X']
    features_split_values = np.load(join(project_root, 'features_split_values_' + str(set_type) + '.npy'))

    bins_instance = []
    for feature_id in features:
        bins = features_split_values[feature_id]
        feature_values = [feature_raw[instance_id][feature_id]]
        distribution = get_feature_distribution(feature_values, bins)
        bins_instance.append(distribution)
    return jsonify({
        'bins_instance': bins_instance
    })

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

#add by Changjian, 2017/7/14
#load clustering result
@app.route('/api/clustering-by-class', methods=['GET'])
def get_clustering_by_class():
    start = time.time()
    dataset_identifier = request.args['dataset']
    type = int( request.args["is_train"])
    class_ = request.args["class_"]
    root = join( *[HTML_ROOT, "result", dataset_identifier])
    if type:
        dataset_path = join(*[HTML_ROOT, "result", dataset_identifier, "clustering","train"])
    else:
        dataset_path = join(*[HTML_ROOT, "result", dataset_identifier, "clustering","test"])
    return send_file(dataset_path + "-" + class_)

#add by Changjian, 2017/7/14
@app.route('/api/perform-clustering-request', methods=['GET'])
def perform_clustering():
    dataset_identifier = request.args["dataset"]
    performClustering(dataset_identifier=dataset_identifier,label_number=9)
    return jsonify('[test]')

#add by Changjian, 2017/7/18
#for tree view
@app.route('/api/get-classifier-index', methods=['GET'])
def get_classifier():
    # app.logger.info(request.remote_addr + "\t" + request.url + "\t" + strftime("%Y-%m-%d %H:%M:%S", gmtime()))
    dataset_identifier = request.args["dataset"]
    index = int(request.args["index"])
    # dataset_path = join(*[HTML_ROOT, "..", "result", dataset_identifier])
    # with open(join(dataset_path, "tree-shortened.json")) as json_file:
    #     all = json.loads(json_file.read())
    global TREE_ALL_DATA
    if dataset_identifier not in TREE_ALL_DATA:
        TREE_ALL_DATA = {}
        dataset_path = join(*[HTML_ROOT, "result", dataset_identifier])
        print(dataset_path)
        with open(join(dataset_path, "tree-shortened.json")) as json_file:
            TREE_ALL_DATA[dataset_identifier] = json.loads(json_file.read())
    all = TREE_ALL_DATA[dataset_identifier]
    return jsonify({
        "index": index,
        "tree": all[index]
    })

#add by Changjian, 2017/7/18
# for tree view
@app.route('/api/model-raw-index', methods=['GET'])
# @gzipped
def get_raw_model_iteration():
    # print(request.remote_addr + "\t" + request.url + "\t" + strftime("%Y-%m-%d %H:%M:%S", gmtime()))
    dataset_identifier = request.args["dataset"]
    dataset_path = join(*[HTML_ROOT, "result", dataset_identifier])
    iteration = int(request.args["index"])
    with open(join(dataset_path, "model")) as model_file:
        in_block = False
        result = []
        for line in model_file:
            if line.startswith("Tree=" + str(iteration)):
                in_block = True
            if line.startswith("Tree=" + str(iteration + 1)):
                break
            if in_block:
                result.append(line)
        return "".join(result)

# add by Changjian, 2017/7/18
@app.route("/api/classifier-clustering-result", methods=['GET'])
def get_classifier_clustering_result():
    # print(request.remote_addr + "\t" + request.url + "\t" + strftime("%Y-%m-%d %H:%M:%S", gmtime()))
    dataset_identifier = request.args["dataset"]
    dataset_path = join(*[HTML_ROOT, "result", dataset_identifier])
    if not exists(join(dataset_path, "cluster_result_all.json")):
        return ""
    with open(join(dataset_path, "cluster_result_all.json")) as result_file:
        return result_file.read()

# add by Changjian, 2017/7/18
@app.route('/api/get-classifiers-set', methods=['GET'])
def get_classifier_set():
    # print(request.remote_addr + "\t" + request.url + "\t" + strftime("%Y-%m-%d %H:%M:%S", gmtime()))
    dataset_identifier = request.args["dataset"]
    # index = int(request.args["index"])
    index = [int(e) for e in request.args["index"].split("-")]
    dataset_path = join(*[HTML_ROOT, "result", dataset_identifier])
    # with open(join(dataset_path, "tree-shortened.json")) as json_file:
    #     all = json.loads(json_file.read())
    global TREE_ALL_DATA
    if dataset_identifier not in TREE_ALL_DATA:
        TREE_ALL_DATA = {}
        for key in TREE_ALL_DATA:
            del TREE_ALL_DATA[key]
        gc.collect()
        dataset_path = join(*[HTML_ROOT, "result", dataset_identifier])
        with open(join(dataset_path, "tree-shortened.json")) as json_file:
            TREE_ALL_DATA[dataset_identifier] = json.loads(json_file.read())
        print(dataset_identifier, "tree loaded")
    all = TREE_ALL_DATA[dataset_identifier]
    trees = []
    for i in index:
        trees.append(all[i])
    return jsonify({
        "index": index,
        "trees": trees
    })


# add by Changjian, 2017/7/18
@app.route('/api/model-raw-indices', methods=['GET'])
def get_raw_model_iterations():
    # print(request.remote_addr + "\t" + request.url + "\t" + strftime("%Y-%m-%d %H:%M:%S", gmtime()))
    dataset_identifier = request.args["dataset"]
    dataset_path = join(*[HTML_ROOT, "result", dataset_identifier])
    iterations = [int(e) for e in request.args["index"].split("-")]
    with open(join(dataset_path, "model")) as model_file:
        lines = model_file.readlines()
        results = []
        for iteration in iterations:
            in_block = False
            result = []
            for line in lines:
                if line.startswith("Tree=" + str(iteration)):
                    in_block = True
                if line.startswith("Tree=" + str(iteration + 1)):
                    break
                if in_block:
                    result.append(line)
            results.append("".join(result))
        return "|".join(results)

@app.before_request
def logging():
    app.logger.info(request.remote_addr + "\t" + request.url + "\t" + strftime("%Y-%m-%d %H:%M:%S", gmtime()))

import logging
from logging import FileHandler

if __name__ == '__main__':
    start = time.time()
    root = join(*[HTML_ROOT, "result"])
    app.run(port=8083, host="0.0.0.0", threaded=True)

from flask import Flask, jsonify
import numpy as np
import configparser
from scripts.algorithm import *
import os
import sys
import json
from os import listdir
from os.path import join, exists
from os import getcwd
from os.path import join
from warehouse import *
import webbrowser

from scripts.config import *
from scripts.algorithm import *
from scripts.helper import *
from warehouse import WareHouse
from scripts.clustering import performClustering


SERVER_ROOT = os.path.dirname(sys.modules[__name__].__file__)


warehouse = None
app = Flask(__name__, static_url_path="/static")

POSTERIOR_SPLIT_SIZE = 10
from flask import request

TREE_ALL_DATA = {}

def init_warehouse(dataset):
    global warehouse
    warehouse = WareHouse(dataset, join(SERVER_ROOT, "result", dataset))

@app.route('/api/confusion-matrix', methods=['GET'])
def get_confusion_matrix():
    dataset_identifier = request.args["dataset"]
    setname = request.args["setname"]
    dataset_path = join(*[SERVER_ROOT, "result", dataset_identifier])
    confusion_matrix = np.load(join(dataset_path, "confusion_matrix_" + setname + ".npy"))
    return jsonify(confusion_matrix.tolist())

# add by Shouxing, 2017 / 7 / 20
@app.route('/api/feature_matrix_for_cluster', methods=['GET'])
def get_feature_matrix_for_cluster():
    dataset_identifier = request.args["dataset"]
    if dataset_identifier[0] == '\"' and dataset_identifier[-1] == '\"':
        dataset_identifier = dataset_identifier[1:-1]
    cluster_ids = json.loads(request.args.get('cluster_ids'))
    class_id = json.loads(request.args.get('class_id'))
    cluster_classes = json.loads(request.args.get('cluster_classes'))
    features = json.loads(request.args.get('features'))
    set_type = json.loads(request.args.get('set_type'))
    current_module = sys.modules[__name__]
    project_root = os.path.dirname(current_module.__file__)
    project_root = join(project_root, 'result', dataset_identifier)
    feature_raw = np.load(join(project_root, 'feature-raw-' + str(set_type) + '.npy'))
    size = len(cluster_ids)
    features_split_values = np.load(join(project_root, 'features_split_values_' + str(set_type) + '.npy'))
    features_split_widths = np.load(join(project_root, 'features_split_widths_' + str(set_type) + '.npy'))

    feature_matrix = []
    widths = []
    ware_house = WareHouse(dataset_identifier, project_root)
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
    dataset_identifier = request.args["dataset"]
    if dataset_identifier[0] == '\"' and dataset_identifier[-1] == '\"':
        dataset_identifier = dataset_identifier[1:-1]
    class_id = json.loads(request.args.get('class_id'))
    features = json.loads(request.args.get('features'))
    set_type = json.loads(request.args.get('set_type'))
    current_module = sys.modules[__name__]
    project_root = os.path.dirname(current_module.__file__)
    project_root = join(project_root, 'result', dataset_identifier)
    feature_raw = np.load(join(project_root, "feature-raw-" + set_type + ".npy"))
    instance_labels = np.load(join(project_root, "label-" + set_type + ".npy"))
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
    dataset_identifier = request.args["dataset"]
    if dataset_identifier[0] == '\"' and dataset_identifier[-1] == '\"':
        dataset_identifier = dataset_identifier[1:-1]
    instance_id = json.loads(request.args.get('instance_id'))
    features = json.loads(request.args.get('features'))
    set_type = json.loads(request.args.get('set_type'))
    current_module = sys.modules[__name__]
    project_root = os.path.dirname(current_module.__file__)
    project_root = join(project_root, 'result', dataset_identifier)
    feature_raw = np.load(join(project_root, 'feature-raw-' + str(set_type) + '.npy'))
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

@app.route("/api/feature-importance", methods=["GET"])
def get_feature_importance():
    dataset_identifier = request.args["dataset"]
    dataset_path = join(*[SERVER_ROOT, "result", dataset_identifier])
    return send_file(join(dataset_path, "feature_importance.bin"))

@app.route("/api/tree-size", methods=["GET"])
def get_tree_size():
    dataset_identifier = request.args["dataset"]
    dataset_path = join(*[SERVER_ROOT, "result", dataset_identifier])
    return send_file(join(dataset_path, "tree_size.bin"))

@app.route('/api/manifest', methods=['GET'])
def get_manifest():
    dataset_identifier = request.args["dataset"]
    dataset_path = join(*[SERVER_ROOT, "result", dataset_identifier])
    global warehouse
    if warehouse is None or warehouse.identifier is not dataset_identifier:
        warehouse = WareHouse(dataset_identifier, dataset_path)
    with open(join(dataset_path, "manifest")) as manifest_file:
        return manifest_file.read()

import time

@app.route('/api/feature-raw-zipped', methods=['GET'])
# @gzipped
def get_raw_feature_zipped():
    dataset_identifier = request.args["dataset"]
    dataset = dataset_identifier.split("-")[1]
    dataset_path = join(*[SERVER_ROOT, "result", dataset_identifier])
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
    root = join(*[SERVER_ROOT, "result", dataset_identifier])
    l = np.loadtxt(join(root, "predicted-label-" + ("train" if type else "test")), dtype=np.int16)
    return jsonify(l.tolist())


@app.route('/api/posterior-by-class', methods=['GET'])
def get_posterior_by_class():
    start = time.time()
    dataset_identifier = request.args["dataset"]
    type = int(request.args["is_train"])
    class_ = request.args["class_"]
    root = join(*[SERVER_ROOT, "result", dataset_identifier])
    if type:
        dataset_path = join(*[SERVER_ROOT, "result", dataset_identifier, "posteriors-train"])
    else:
        dataset_path = join(*[SERVER_ROOT, "result", dataset_identifier, "posteriors-test"])
    return send_file(dataset_path + "-" + class_)

#add by Changjian, 2017/7/14
#load clustering result
@app.route('/api/clustering-by-class', methods=['GET'])
def get_clustering_by_class():
    start = time.time()
    dataset_identifier = request.args['dataset']
    type = int( request.args["is_train"])
    class_ = request.args["class_"]
    root = join(*[SERVER_ROOT, "result", dataset_identifier])
    if type:
        dataset_path = join(*[SERVER_ROOT, "result", dataset_identifier, "clustering", "train"])
    else:
        dataset_path = join(*[SERVER_ROOT, "result", dataset_identifier, "clustering", "test"])
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
        dataset_path = join(*[SERVER_ROOT, "result", dataset_identifier])
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
    dataset_path = join(*[SERVER_ROOT, "result", dataset_identifier])
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
    dataset_identifier = request.args["dataset"]
    dataset_path = join(*[SERVER_ROOT, "result", dataset_identifier])
    if not exists(join(dataset_path, "cluster_result_all.json")):
        return ""
    with open(join(dataset_path, "cluster_result_all.json")) as result_file:
        return result_file.read()

# add by Changjian, 2017/7/18
@app.route('/api/get-classifiers-set', methods=['GET'])
def get_classifier_set():
    dataset_identifier = request.args["dataset"]
    index = [int(e) for e in request.args["index"].split("-")]
    global TREE_ALL_DATA
    if dataset_identifier not in TREE_ALL_DATA:
        TREE_ALL_DATA = {}
        for key in TREE_ALL_DATA:
            del TREE_ALL_DATA[key]
        dataset_path = join(*[SERVER_ROOT, "result", dataset_identifier])
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
    dataset_identifier = request.args["dataset"]
    dataset_path = join(*[SERVER_ROOT, "result", dataset_identifier])
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


@app.route('/api/query-dataset', methods=['GET'])
def query_tag_names():
    datasets = listdir_sorted_by_date(join(SERVER_ROOT, "result"))
    return jsonify(datasets)


@app.route('/api/query-set-names', methods=['GET'])
def query_set_names():
    dataset_identifier = request.args["dataset"]
    manifest_path = join(SERVER_ROOT, "result", dataset_identifier, "manifest")
    if not exists(manifest_path):
        return jsonify({
            "message": "not exists",
            "status": "failure"
        })
    with open(manifest_path) as manifest_file:
        manifest = json.loads(manifest_file.read())
        return jsonify({
            "status": "success",
            "set_names": manifest["set_names"]
        })

@app.route('/api/cluster-result', methods=['GET'])
def get_cluster_result():
    dataset_identifier = request.args["dataset"]
    setname = request.args["setname"]
    cluster_result_path = join(SERVER_ROOT, "result", dataset_identifier, "clustering_result_" + setname + ".json")
    return send_file(cluster_result_path)

def start_server(port=API_SERVER_PORT):
    if not DEBUG:
        webbrowser.open("http://localhost:" + str(port) + "/static/index.html", autoraise=True)
    app.run(port=port, host="0.0.0.0", threaded=True)

if __name__ == '__main__':
    start_server()

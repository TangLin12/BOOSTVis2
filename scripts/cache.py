from flask import Flask, jsonify
import numpy as np
from os import getcwd
import json
from os.path import join, exists
import math

import configparser
HTML_ROOT = getcwd()

POSTERIOR_SPLIT_SIZE = 10
import time

def cache_tsne_result(identifier, type):
    dataset_identifier = identifier
    start = time.time()
    dataset_path = join(*[HTML_ROOT, "result", dataset_identifier])

    tsne_trajectory_full = np.load(join(dataset_path, type + "-tsne-result.npy"))

    iteration_count = tsne_trajectory_full.shape[1]
    timepoints = np.arange(iteration_count)
    tsne_trajectory = tsne_trajectory_full
    label = np.loadtxt(
        join(dataset_path, type + "-tsne-label"), dtype=np.uint32)
    instance_index = np.load(join(dataset_path, type + "-tsne-index.npy"))
    sorted_index = np.argsort(instance_index)

    unique_labels = np.unique(label)

    centers = np.zeros((len(timepoints), len(unique_labels), 2), dtype=np.float32)
    for i, t in enumerate(timepoints):
        for c in unique_labels:
            class_instance_index = [f for f, l in enumerate(label) if l == c]
            d = tsne_trajectory[class_instance_index, i]
            centers[i, c] = np.mean(d, axis=0)

    x_min = np.min(tsne_trajectory[:, :, 0])
    y_min = np.min(tsne_trajectory[:, :, 1])
    x_max = np.max(tsne_trajectory[:, :, 0])
    y_max = np.max(tsne_trajectory[:, :, 1])
    print(x_min, x_max, y_min, y_max)

    tsne_trajectory *= 100
    tsne_trajectory = tsne_trajectory.astype(np.int16)

    print(time.time() - start)
    r = json.dumps({
        "trajectory": tsne_trajectory[sorted_index].tolist(),
        "label": label[sorted_index].tolist(),
        "index": instance_index[sorted_index].tolist(),
        "center": centers.tolist(),
        "time-length": len(timepoints)
    })
    with open(join(dataset_path, type + "-tsne-result-cached"), "w") as json_file:
        json_file.write(r)
    print(time.time() - start)


def simplify_posterior(dataset_identifier, type="train"):
    start = time.time()
    if type is "train":
        dataset_path = join(*[HTML_ROOT, "result", dataset_identifier, "posterior_full_train"])
    else:
        dataset_path = join(*[HTML_ROOT, "result", dataset_identifier, "posterior_full_test"])

    if type is "train":
        output_path = join(*[HTML_ROOT, "result", dataset_identifier, "posterior_full_train_shortened"])
    else:
        output_path = join(*[HTML_ROOT, "result", dataset_identifier, "posterior_full_test_shortened"])

    from os import makedirs
    if not exists(output_path):
        makedirs(output_path)
    from os import listdir
    from os.path import isdir

    from numpy import array
    for i in range(0, 80):
        split_data = np.load(join(dataset_path, str(i * 10) + "-" + str(i * 10 + 9) + ".npy"))
        shape = split_data.shape
        data_count = shape[1]
        class_count = shape[2]
        for j in range(10):
            with open(join(output_path, str(i * 10 + j) + ".bin"), "wb") as result_file:
                d = split_data[j, :, :].reshape(data_count * class_count).astype(np.float32).tolist()
                # array.array('float32', d).tofile(result_file)
                array(d, 'float32').tofile(result_file)
            print(i * 10 + j, end=' ')

def cache_distance_matrix(identifier):
    dataset_path = join(*[HTML_ROOT, "result", identifier])
    mat = np.loadtxt(join(dataset_path, "distance_matrix_8_0.1.txt"))
    from numpy import array
    array(mat, 'float32').tofile(join(*[HTML_ROOT, "result", identifier, "distance-matrix"]))


def merge_posterior(dataset_identifier, type="train"):
    root = join(*[HTML_ROOT, "result-full", dataset_identifier])
    start = time.time()
    if type is "train":
        dataset_path = join(root, "posterior_full_train")
    else:
        dataset_path = join(root, "posterior_full_test")

    if type is "train":
        output_path = join(root, "posteriors-train")
    else:
        output_path = join(root, "posteriors-tests")

    config = configparser.ConfigParser()
    config.read(join(root, "manifest"))
    manifest = config["DEFAULT"]
    if type is "train":
        endpoints = [int(e) for e in manifest["endpoints"].split(",")]
    else:
        endpoints = [int(e) for e in manifest["endpoints_valid"].split(",")]

    filename = "790-799.npy"
    split_data = np.load(join(dataset_path, filename))
    r = split_data[9]
    predicted_label = np.argmax(r, axis=1)
    np.savetxt(join(root, "predicted-label-" + type), predicted_label)

    all = []
    for i in range(9):
        all.append([])
    from numpy import array
    for p in endpoints:
        split_size = POSTERIOR_SPLIT_SIZE
        split_index = int(math.floor(p / split_size) * split_size)
        filename = str(split_index) + "-" + str(split_index + split_size - 1) + ".npy"
        split_data = np.load(join(dataset_path, filename))
        r = split_data[p - split_index]
        for i in range(9):
            all[i].append(r[:, i])
    for i in range(9):
        d = np.array(all[i]).reshape(len(predicted_label) * 25).astype(np.float32).tolist()
        array(d, 'float32').tofile(output_path + "-" + str(i))
    print(dataset_identifier, type, "saved")


def shorten_model_file(dataset_identifier):
    root = join(*[HTML_ROOT, "result", dataset_identifier])
    with open(join(root, "model")) as source_file, open(join(root, "model-s"), "w") as dest_file:
        for line in source_file:
            p = line.replace("\n", "")
            if p.startswith("split_gain"):
                p = " ".join(["{:.3f}".format(float(e)) for e in p.replace("split_gain=", "").split(" ")])
                p = "split_gain=" + p
            dest_file.write(p + "\n")
        print("done")


def cache_feature_raw(identifier, type="train"):
    root = join(*[HTML_ROOT, "result-full", identifier])
    if type == "train":
        filename = "feature-raw"
        output = "feature-cached-train"
    else:
        filename = "feature-raw-valid"
        output = "feature-cached-valid"
    def parse_and_flatten(c, chop):
        arr = []
        for line in c[chop: -chop].split("],["):
            arr.append([int(d) for d in line.split(",")])
        shape = np.array(arr).shape
        d = np.array(arr).reshape(shape[0] * shape[1]).astype(np.uint8).tolist()
        return d

    with open(join(root, filename)) as file:
        data, label = file.read().split("_")
        data = parse_and_flatten(data, 2)
        label = parse_and_flatten(label, 1)
        np.array(np.concatenate((data, label)), 'i').tofile(join(root, output))


from os import listdir
from os.path import isdir

def cache_all_datasets():
    for identifier in listdir(join(HTML_ROOT, "result")):
        if not isdir(join(*[HTML_ROOT, "result-full", identifier])):
            continue
        if "-" not in identifier:
            continue
        cache_feature_raw(identifier, "train")
        cache_feature_raw(identifier, "tests")

        print(identifier, "all cached")

if __name__ == '__main__':
    cache_all_datasets()
from os import makedirs
from os.path import exists

import numpy as np
from numpy import array

import json

def save_json(object, path, message=None):
    with open(path, 'w') as outfile:
        json.dump(object, outfile)
        if message:
            print(message)

def prob2decision(pred):
    result = np.zeros(pred.shape[0])
    for i in range(pred.shape[0]):
        decision = np.argmax(pred[i])
        result[i] = decision
    return result

def save_binary(nd_data, path, type='float32'):
    array(nd_data.flatten(), type).tofile(path)
    return

def create_folder(d):
    if not exists(d):
        makedirs(d)

if __name__ == '__main__':
    a = np.random.rand(30, 3, 100)
    save_binary(a, "t.bin")
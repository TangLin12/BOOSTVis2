# coding: utf-8

import json
from os.path import join, exists
import numpy as np


class WareHouse(object):
    set_names = []
    manifest = {}
    cluster_2_instance_map = {}
    feature_raw_map = {}
    _identifier = ""

    def __init__(self, identifier, root_dir):
        self._identifier = identifier
        with open(join(root_dir, "manifest")) as manifest_file:
            self.manifest = json.loads(manifest_file.read())
            self.set_names = self.manifest["set_names"]
        for name in self.set_names:
            with open(join(root_dir, "clustering_result_" + name + ".json")) as cluster_result_file:
                self.cluster_2_instance_map[name] = json.loads(cluster_result_file.read())
            self.feature_raw_map[name] = np.load(join(root_dir, "feature-raw-" + name + ".npy"))

    @property
    def identifier(self):
        return self._identifier

    def get_instances_by_cluster(self, set_name, selected_class, cluster_class, cluster_id):
        """
        Parameters
        ----------
        set_name : string, required
            Name of the set specified by user, e.g. train, valid_1, ...
        selected_class : int, required
            Class index of the currently focused class
        cluster_class : int, required
            Class index of the selected cluster
        cluster_id : int, required
            Cluster id of the selected cluster within its class

        Returns
        -------
        instance_ids : list with shape (instance, )
        """

        print(cluster_class, cluster_id)
        cluster_instance_index = self.cluster_2_instance_map[set_name][str(selected_class)]["clusters"][cluster_id][cluster_class]
        return cluster_instance_index

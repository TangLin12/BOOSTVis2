from os import makedirs
from os.path import exists, join

import numpy as np
from numpy import array
import json
from sklearn.model_selection import train_test_split
from scripts import clustering

def save_json(object, path, message=None):
	with open(path, 'w') as outfile:
		json.dump(object, outfile)
		if message:
			print(message)

def create_valid(X, y, test_size=0.33, random_state=42):
	X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=test_size, random_state=random_state)
	return {
		"train": {
			"X": X_train,
			"y": y_train
		},
		"valid": {
			"X": X_test,
			"y": y_test
		}
	}


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

		def instance_clustering(self, set_name, timepoints, set, decision):
			y = set["y"]
			X = set["X"]
			data_count = X.shape[0]
			scores = np.zeros(shape=(len(timepoints), data_count, self.class_count))
			for i, t in enumerate(timepoints):
				scores[i] = np.load(
					join(self.data_root, set_name + "-prediction-score", "iteration-" + str(t) + ".npy"))
			print(scores.shape)
			scores = np.swapaxes(scores, 1, 0)
			# scores_flatten = scores.reshape(data_count, -1)
			clustering_result = {}
			for i in range(self.class_count):
				res = []
				K = []
				clusters = []
				lines = []
				prob = []
				for j in range(self.class_count):
					instance_index_j = []
					for index in range(data_count):
						if y[index] == j and decision[index] == i:
							instance_index_j.append(index)
					k = 5

					if len(instance_index_j) < 50:
						k = 1

					centroids, labels, cluster_size = clustering.kmeans_clustering(scores[instance_index_j, :, i], k)
					res.append({
						"centroids": centroids,
						"cluster_size": cluster_size,
						"inst_cluster": labels
					})
					K.append(k)
					clusters_by_class = []
					line_by_class = []
					prob_by_class = []
					for c in range(len(centroids)):
						cluster_instance_index = np.array(instance_index_j)[np.array(labels) == c]
						clusters_by_class.append(cluster_instance_index.tolist())
						line_by_class = np.mean(scores[cluster_instance_index][:, :, i], axis=0)
						prob_by_class.append(line_by_class[-1])
					clusters.append(clusters_by_class)
					lines.append(line_by_class.tolist())
					prob.append(prob_by_class)

				clustering_result[i] = {
					"res": res,
					"K": K,
					"clusters": clusters,
					"lines": lines,
					"prob": prob
				}

			save_json(clustering_result, join(self.data_root, "clustering_result_" + set_name + ".json"))


if __name__ == '__main__':
	a = np.random.rand(30, 3, 100)
	save_binary(a, "t.bin")
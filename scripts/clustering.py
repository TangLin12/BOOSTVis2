# author: Changjian Chen, 2017/7/14, chencjgene@gmail.com

import numpy as np
import os
from os.path import join
from sklearn.cluster import KMeans
from scripts import helper

#TODO: It is manually set.
CLUSTERING_K_MATRIX = [
    [0, 8, 8, 4, 0, 0, 0, 0, 0],
    [0, 8, 4, 4, 0, 0, 0, 0, 0],
    [0, 4, 8, 4, 2, 2, 0, 0, 0],
    [0, 8, 8, 4, 0, 0, 0, 0, 0],
    [0, 8, 8, 4, 0, 0, 0, 0, 0],
    [0, 8, 8, 4, 0, 0, 0, 0, 0],
    [0, 8, 8, 4, 0, 0, 0, 0, 0],
    [0, 8, 8, 4, 0, 0, 0, 0, 0],
    [0, 8, 8, 4, 0, 0, 0, 0, 0]
]

RESULT_ROOT = os.path.join(os.getcwd(),'result')

def loadPosterior( filename ):
	return np.fromfile( filename, dtype='float32' )


def loadReshapedPosterior( filename, instanceNumber ):
	data = loadPosterior( filename )
	data = data.reshape( -1, instanceNumber ).transpose(1,0)
	return data

def loadPredictedLabel( filename ):
	fi = open( filename, 'r' )
	s = fi.read()
	s = s.split('\n')
	s = [ int(i[0]) for i in s[:-1]]
	return np.array(s) 

def loadTrueLabel( filename ):
	fi = open( filename, 'r')
	s = fi.read().split('\n')
	s = [ int(i) for i in s]
	return np.array(s)

def kmeans_clustering(score, k):
	kmeans = KMeans(n_clusters=k, random_state=0).fit(score)
	labels = kmeans.labels_.tolist()
	centroids = kmeans.cluster_centers_.tolist()
	cluster_size = np.bincount(labels).tolist()
	return centroids, labels, cluster_size

def instance_clustering(class_count, scores, set, decision):
	y = set["y"]
	X = set["X"]
	data_count = X.shape[0]
	clustering_result = {}
	for i in range(class_count):
		res = []
		K = []
		clusters = []
		lines = []
		prob = []
		for j in range(class_count):
			instance_index_j = []
			for index in range(data_count):
				if y[index] == j and decision[index] == i:
					instance_index_j.append(index)
			k = 5
			if len(instance_index_j) < 50:
				k = 1
			centroids, labels, cluster_size = kmeans_clustering(scores[instance_index_j, :, i], k)
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
	return clustering_result

def clustering( focused_class, type, dataset_identifier, clustering_all_instances=False):
	'''
		This function create clustering results caches and store them in disk
		Each cache is a binary file that every 4 bytes represent a float number. 
	The cache is organizad by follows:
		1. the first float number of cache is T( SEGMENT_COUNT )
		2. following part contain n_class segmentations. Each segmentations contain 
			in order a float that represents the number of clusters, n_clusters * T float
			numbers that represents centroids, n_clusters that represents the number of 
			instance the according cluster contains.
	'''

	#loading data andd true labels
	if type:
		posteriorPath = os.path.join( RESULT_ROOT, dataset_identifier, 'posteriors-train-' + str(focused_class) )
		trueLabelPath = os.path.join( RESULT_ROOT, dataset_identifier, 'training_label')
		predictedLabelPath = os.path.join( RESULT_ROOT, dataset_identifier, 'predicted-label-train')
		outFilePath = os.path.join( RESULT_ROOT, dataset_identifier, 'clustering/train-' + str(focused_class) )
	else:
		posteriorPath = os.path.join( RESULT_ROOT, dataset_identifier, 'posteriors-tests-' + str(focused_class) )
		trueLabelPath = os.path.join( RESULT_ROOT, dataset_identifier, 'testing_label')
		predictedLabelPath = os.path.join( RESULT_ROOT, dataset_identifier, 'predicted-label-tests')
		outFilePath = os.path.join( RESULT_ROOT, dataset_identifier, 'clustering/tests-' + str(focused_class) )
	true_labels = loadTrueLabel( trueLabelPath )
	predicted_label = loadPredictedLabel( predictedLabelPath )

	labels_number = np.unique(true_labels).shape[0]
	if not clustering_all_instances:
		# perform cluster on instances that were predicted as focused_class
		true_labels = np.array([ -1 if  predicted_label[idx] != focused_class else true_labels[idx] for idx in range(true_labels.shape[0])])
	
	instanceNumber = true_labels.shape[0]
	data = loadReshapedPosterior( posteriorPath, instanceNumber )
	T = data.shape[1]

	#perform clustering
	res = np.array([T],dtype='float32')
	clusteringKVector = CLUSTERING_K_MATRIX[focused_class]
	print (clusteringKVector)
	for clustering_class in range(labels_number):
		clustering_data = data[true_labels==clustering_class,:]
		clustering_index = np.array(range(data.shape[0]))[true_labels==clustering_class]
		clustering_k = min( clusteringKVector[clustering_class], clustering_index.shape[0] )
		#decide k's value
		if clustering_k == 0:
			if clustering_index.shape[0] == 0:
				clustering_k = 0
			else:
				if clustering_index.shape[0] < 50:
					clustering_k = 1
				else:
					clustering_k = 2
		# do not perform k-means if clustering_k == 0
		if clustering_k == 0:
			res = np.concatenate( [res, np.array([clustering_k], dtype='float32')] )
		else:
			#initialization of centroids 
			#this initialization method is implemented according to the initial part \
			#of confidence-lines.js
			centroids = np.zeros((clustering_k, T))
			for i in range(clustering_k):
				j = int( float(clustering_index.shape[0]) * float(i) / float(clustering_k) )
				centroids[i] = clustering_data[j]
			kmeans = KMeans( n_clusters = clustering_k, 
								max_iter=50, 
								n_init = 1,
								init = centroids	
							).fit(clustering_data)


			centroids = kmeans.cluster_centers_.reshape(-1).astype('float32')
			clustering_labels = kmeans.labels_
			clustering_size = np.bincount(clustering_labels)
			#print clustering_labels
			dic_index = { clustering_index[i] : v for i, v in enumerate(clustering_labels)}
			clustering_sorted_index = np.array(sorted( clustering_index, key=lambda x : dic_index[x] )).reshape(-1).astype('float32')
			res = np.concatenate([res,np.array([clustering_k],dtype='float32'),centroids, clustering_size.astype('float32'), clustering_sorted_index])
	print (res.shape)
	np.array(res,dtype='float32').tofile( outFilePath ) 

def performClustering( dataset_identifier, label_number, clustering_all_instances=False ):
	clustering_dir = os.path.join( RESULT_ROOT, dataset_identifier, 'clustering')
	if not os.path.exists(clustering_dir):
		os.makedirs(clustering_dir)
	for i in range(label_number):
		clustering(i, 1, dataset_identifier)
		clustering(i, 0, dataset_identifier)


if __name__ == '__main__':
	for i in range(9):
		clustering( i, 1,'lightgbm-otto-8-0.1-800')
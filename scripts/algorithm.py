import numpy as np


def time_series_segmentation(confusion_matrics, segment_count):
	# TODO
	return []


# using k-means clustering
def cluster_instance(prediction_scores, k):
	# TODO
	return {}


def split_feature(feature_values: np.array, bin_count: int) -> np.array:
	'''This function generates split values of a given feature, given a count of bins.
	
	:param feature_values: 1-d array of feature values.
    :param bin_count: the number of bins.
    
    :return: np.array, the bin values
	'''
	# TODO
	bins = []
	return bins


def get_feature_distribution(feature_values: np.array, bins: np.array) -> np.array:
	'''This function generates distribution of a given feature, the bins are given

	:param feature_values: 1-d array of feature values.
    :param bins: the bin values.

    :return: np.array, the histogram of each bin
	'''
	# TODO
	histogram = []
	return histogram

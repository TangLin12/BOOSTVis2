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
	feature_values.sort()
	size = feature_values.size
	for i in range(bin_count):
		bins.append(feature_values[int(i * size / bin_count)])
	bins.append(feature_values[size - 1])
	return bins


def get_feature_distribution(feature_values: np.array, bins: np.array) -> np.array:
	'''This function generates distribution of a given feature, the bins are given

	:param feature_values: 1-d array of feature values.
    :param bins: the bin values.

    :return: np.array, the histogram of each bin
	'''
	# TODO
	size = bins.size
	histogram = [0] * (size - 1)
	for x in feature_values:
		if x == bins[size - 1]:
			histogram[size - 2] += 1
			break
		l = 0
		r = size - 1
		while l <= r:
			temp = int((l + r) / 2)
			if bins[temp] <= x < bins[temp + 1]:
				histogram[temp] += 1
				break
			elif x < bins[temp]:
				r = temp - 1
			else:
				l = temp + 1
	temp_val = 0
	for i in range(size - 1):
		if bins[i + 1] != bins[temp_val]:

	return histogram

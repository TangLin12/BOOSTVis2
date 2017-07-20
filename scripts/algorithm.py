import numpy as np
import math


def time_series_segmentation(confusion_matrics, segment_count):
	# TODO
	timepoint_count = len(confusion_matrics)
	segment_count = min(segment_count, timepoint_count)
	stride = math.ceil(timepoint_count / segment_count)
	segment = np.arange(timepoint_count)[::stride]
	segment[-1] = timepoint_count - 1
	return segment.tolist()


# using k-means clustering
def cluster_instance(prediction_scores, k):
	# TODO
	return {}


def split_feature(feature_values: np.array, bin_count: int) -> np.array:
	'''This function generates split values of a given feature, given a count of bins.
	
	:param feature_values: 1-d array of feature values.
    :param bin_count: the number of bins.
    
    :return: dictionary contains np.array, the bin values and bin width
	'''
	# TODO
	# add by Shouxing, 2017 / 7 / 20
	feature_values.sort()
	size = feature_values.size
	count = 0
	value = [feature_values[0]]
	width = []
	for x in feature_values:
		if x != value[-1]:
			width.append(count)
			value.append(x)
			count = 1
		else:
			count += 1
	if count != 0:
		width.append(count)
	value.append((value[-1] - value[0]) / (len(width) - 1) + value[-1])
	if len(width) <= bin_count:
		return {
			'bin_value': value,
			'bin_width': [round(100 * x / size, 2) for x in width]
		}

	bin_value = []
	bin_width = []
	step = int(size / bin_count)
	i = 0
	while i < size:
		bin_value.append(feature_values[i])
		j = min(step, size - i)
		val = feature_values[i + j - 1]
		while i + j < size and feature_values[i + j] == val:
			j += 1
		bin_width.append(j)
		i += j
	bin_value.append((bin_value[-1] - bin_value[0]) / (len(bin_width) - 1) + feature_values[-1])
	return {
		'bin_value': bin_value,
		'bin_width': [round(100 * x / size, 2) for x in bin_width]
	}


def get_feature_distribution(feature_values: np.array, bins: np.array) -> np.array:
	'''This function generates distribution of a given feature, the bins are given

	:param feature_values: 1-d array of feature values.
    :param bins: the bin values.

    :return: np.array, the histogram of each bin
	'''
	# TODO
	# add by Shouxing, 2017 / 7 / 20
	size = bins.size
	histogram = [0] * (size - 1)
	for x in feature_values:
		l = 0
		r = size - 2
		while l <= r:
			temp = int((l + r) / 2)
			if bins[temp] <= x < bins[temp + 1]:
				histogram[temp] += 1
				break
			elif x < bins[temp]:
				r = temp - 1
			else:
				l = temp + 1

	return histogram

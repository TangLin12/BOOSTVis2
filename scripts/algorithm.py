import numpy as np
import time
import sys

def get_segment_cost(vectors, L, R):
	l = len(vectors[L])
	avg_vec = np.mean(vectors[L: R, :], axis=0)

	cost = 0
	for i in range(L, R + 1):
		delta = vectors[i, :] - avg_vec
		cost += np.sum(np.square((delta)))

	return cost

def time_series_segmentation(confusion_matrics, segment_count):
	iteration_count = len(confusion_matrics)
	vectors = np.reshape(confusion_matrics, newshape=(iteration_count, -1))
	f = np.zeros(shape=(iteration_count, segment_count), dtype=np.float32)
	g = np.zeros(shape=(iteration_count, segment_count), dtype=np.int32)
	cost = np.zeros(shape=(iteration_count, iteration_count), dtype=np.float32)

	start = time.time()
	for i in range(iteration_count):
		cost[i][i] = 0
		for j in range(i + 1, iteration_count):
			cost[i][j] = get_segment_cost(vectors, i, j)

	print("segmentation cost:\t", time.time() - start)

	for i in range(iteration_count):
		f[i][0] = cost[0][i]
		g[i][0] = -1

	for j in range(1, segment_count):
		for i in range(j - 1, iteration_count):
			f[i][j] = sys.maxsize
			for k in range(j - 2, i):
				if (f[k][j - 1] + cost[k + 1][i] < f[i][j]):
					f[i][j] = f[k][j - 1] + cost[k + 1][i]
					g[i][j] = k

	endpoints = []
	i = np.int32(iteration_count - 1)
	j = segment_count - 1
	while i != -1:
		endpoints.append(i.item())
		i = g[i][j]
		j = j - 1

	endpoints = endpoints[::-1]
	return endpoints

def split_feature(feature_values: list, bin_count: int) -> list:
	'''This function generates split values of a given feature, given a count of bins.
	
	:param feature_values: list of feature values (n * 1)
    :param bin_count: the number of bins.
    
    :return:the dictionary contains lists, the bin values and bin width
	'''
	# TODO
	# add by Shouxing, 2017 / 7 / 20
	feature_values.sort()
	size = len(feature_values)
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

import time
def get_feature_distribution(feature_values: list, bins: list) -> list:
	'''This function generates distribution of a given feature, the bins are given

	:param feature_values: list of feature values.
    :param bins: list of the bin values.

    :return: list, the histogram of each bin
	'''
	# add by Shouxing, 2017 / 7 / 20
	size = len(bins)
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

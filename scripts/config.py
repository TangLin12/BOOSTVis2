from os.path import join
import os
import sys
current_module = sys.modules[__name__]
PROJECT_ROOT = os.path.dirname(current_module.__file__)
DATASET_ROOT = join(PROJECT_ROOT, "data")
RESULT_ROOT = join(PROJECT_ROOT, "result")
RANDOM_SEED = 1234
TSNE_SEED = 123
TSNE_SAMPLE_SEED = 1234

API_SERVER_PORT = 8082
MARGIN_BIN_COUNT = 10

CHANNEL = 1
PATCH_SIZE = 256
POSTERIOR_SPLIT_SIZE = 10

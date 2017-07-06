import os
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

TOY_DATASETS = [
    "n02092002",
    "n02093256",
    "n02111277",
    "n02109047"
]

Terrier_DATASETS = [
    "n02096294",
    "n02095050",
    "n02098105",
    "n02095412",
    "n02096437",
    "n02096051",
    "n02098413",
    "n02094433",
    "n02098286",
    "n02096756",
    "n02093056",
    "n02094114",
    "n02096177",
    "n02093859",
    "n02097298",
    "n02096585",
    "n02093647",
    "n02093991",
    "n02097658",
    "n02097786",
    "n02094258",
    "n02097474",
    "n02094562",
    "n02093754"
]

DATASET_NAME = "toy" # "toy"
DATASETS = {
    "toy": TOY_DATASETS,
    "terrier": Terrier_DATASETS
}
CHANNEL = 1
PATCH_SIZE = 256
POSTERIOR_SPLIT_SIZE = 10

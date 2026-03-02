import sys
import os

# Limit OpenBLAS threads to prevent crash on shared hosting
os.environ['OPENBLAS_NUM_THREADS'] = '1'
os.environ['MKL_NUM_THREADS'] = '1'
os.environ['OMP_NUM_THREADS'] = '1'

# Add the face_service directory to the Python path
sys.path.insert(0, os.path.dirname(__file__))

# Import the Flask application object
from main import app as application

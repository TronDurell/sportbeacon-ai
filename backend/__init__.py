# Make backend a Python package and expose the FastAPI app if needed
try:
	from .api import app  # noqa: F401
except Exception:
	# Allow package import even if dependencies for app are not yet installed
	pass


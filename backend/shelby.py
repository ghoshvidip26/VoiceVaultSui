"""
Compatibility wrapper for the old module name.

The storage implementation was renamed to `walrus.py`.
New code should import from `backend.walrus` / `walrus`.
"""

from walrus import FileNotFoundError
from walrus import delete_from_shelby
from walrus import download_from_shelby
from walrus import upload_to_shelby
from walrus import verify_access
from walrus import verify_shelby_access

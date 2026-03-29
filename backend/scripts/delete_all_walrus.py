"""
Script to delete all Walrus storage files
Run with: python backend/scripts/delete_all_walrus.py
"""

import sys
from pathlib import Path

STORAGE_ROOT = Path(__file__).resolve().parent.parent / "storage" / "walrus"


def delete_directory(dir_path):
    """Recursively delete a directory and print deleted files."""
    try:
        for entry in dir_path.iterdir():
            if entry.is_dir():
                delete_directory(entry)
            else:
                entry.unlink()
                print(f"  Deleted file: {entry.name}")
        dir_path.rmdir()
        return True
    except FileNotFoundError:
        return False


def delete_all_walrus_files():
    try:
        print(f"🗑️  Deleting all Walrus files from: {STORAGE_ROOT}\n")

        # Check if storage directory exists
        if not STORAGE_ROOT.exists():
            print("✓ No Walrus storage directory found. Nothing to delete.")
            return

        # Read all accounts
        accounts = [p for p in STORAGE_ROOT.iterdir() if p.is_dir()]

        if not accounts:
            print("✓ No accounts found. Storage is already empty.")
            return

        total_deleted = 0

        for account_path in accounts:
            account = account_path.name
            print(f"📁 Processing account: {account}")

            # Read namespaces
            namespaces = [p for p in account_path.iterdir() if p.is_dir()]

            for namespace_path in namespaces:
                namespace = namespace_path.name
                print(f"  📂 Processing namespace: {namespace}")

                # Read voice IDs
                voice_ids = [p for p in namespace_path.iterdir() if p.is_dir()]

                for voice_path in voice_ids:
                    voice_id = voice_path.name
                    print(f"    🗣️  Deleting voice: {voice_id}")

                    if delete_directory(voice_path):
                        total_deleted += 1
                        print(f"    ✓ Deleted voice: {voice_id}")

                # Try to remove namespace directory
                try:
                    namespace_path.rmdir()
                    print(f"  ✓ Removed namespace: {namespace}")
                except OSError:
                    pass  # Ignore if not empty

            # Try to remove account directory
            try:
                account_path.rmdir()
                print(f"✓ Removed account directory: {account}")
            except OSError:
                pass  # Ignore if not empty

        # Try to remove walrus directory
        try:
            STORAGE_ROOT.rmdir()
            print("✓ Removed walrus storage directory")
        except OSError:
            pass  # Ignore if not empty

        print(f"\n✅ Successfully deleted {total_deleted} voice(s) from Walrus storage!")
    except Exception as error:
        print(f"❌ Error deleting Walrus files: {error}")
        sys.exit(1)


# Run the script
if __name__ == "__main__":
    delete_all_walrus_files()

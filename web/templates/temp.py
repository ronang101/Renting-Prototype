import os

# List of folder paths to ignore
folders_to_ignore = [
    r'C:\Users\Ronan\OneDrive\Desktop\Git Website\Renting-Prototype\.git',
    r'C:\Users\Ronan\OneDrive\Desktop\REDWOOD.RENT\Prototype V2\redwood_prototype_v2',
    r'C:\Users\Ronan\OneDrive\Desktop\REDWOOD.RENT\Prototype V2\documents',
    r'C:\Users\Ronan\OneDrive\Desktop\REDWOOD.RENT\Prototype V2\venv38',
    r'C:\Users\Ronan\OneDrive\Desktop\REDWOOD.RENT\Prototype V2\__pycache__',
    r'C:\Users\Ronan\OneDrive\Desktop\REDWOOD.RENT\Prototype V2\web\static\images',
    r'C:\Users\Ronan\OneDrive\Desktop\REDWOOD.RENT\Prototype V2\web\__pycache__'
]

def should_ignore_folder(folder_path):
    """
    Checks if the folder should be ignored based on the list of folders to ignore.

    Args:
    folder_path (str): The path of the folder to check.

    Returns:
    bool: True if the folder should be ignored, False otherwise.
    """
    for ignore_folder in folders_to_ignore:
        if folder_path == ignore_folder or folder_path.startswith(ignore_folder + os.path.sep):
            return True
    return False

def print_directory_structure(folder_path, indent=""):
    """
    Recursively prints the directory structure starting from the specified folder.

    Args:
    folder_path (str): The path of the folder to start from.
    indent (str): Indentation for formatting the output.
    """
    if should_ignore_folder(folder_path):
        return

    try:
        items = os.listdir(folder_path)
    except OSError as e:
        print(f"{indent}- {os.path.basename(folder_path)}/")
        print(f"{indent}  Error: {e}")
        return

    print(f"{indent}- {os.path.basename(folder_path)}/")

    for item in sorted(items):
        item_path = os.path.join(folder_path, item)
        if os.path.isdir(item_path):
            print_directory_structure(item_path, indent + "  ")
        else:
            print(f"{indent}  - {item}")

# Replace this with the path to your folder
folder_path = r'C:\Users\Ronan\OneDrive\Desktop\Git Website\Renting-Prototype'

print_directory_structure(folder_path)

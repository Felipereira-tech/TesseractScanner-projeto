import sys
from pathlib import Path

sys.path.append(str(Path(__file__).parent))

from src import *

app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)
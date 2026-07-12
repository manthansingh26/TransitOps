"""Drop all tables and re-seed. Use for a clean demo state.  python reset_db.py"""
from app.core.database import Base, engine
import app.models  # noqa: F401  (register models)

Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)
print("Schema reset.")

import seed  # noqa: E402
seed.run()

import logging
import sqlite3

from flask import Flask

from .config import Config
from .database import init_app as init_database_app
from .database import init_db
from .projects import projects_bp


def create_app(test_config: dict | None = None) -> Flask:
    """Create and configure the Draftlight Flask application."""
    app = Flask(__name__)
    app.config.from_object(Config)

    if test_config is not None:
        app.config.from_mapping(test_config)

    init_database_app(app)
    app.register_blueprint(projects_bp)

    @app.get("/api/health")
    def health():
        return {"success": True, "data": {"status": "ok"}}

    @app.errorhandler(sqlite3.Error)
    def handle_database_error(_error):
        app.logger.exception("Database operation failed")
        return {"success": False, "error": "Database operation failed."}, 500

    @app.errorhandler(404)
    def handle_not_found(_error):
        return {"success": False, "error": "Resource not found."}, 404

    @app.errorhandler(405)
    def handle_method_not_allowed(_error):
        return {"success": False, "error": "Method not allowed."}, 405

    @app.errorhandler(500)
    def handle_internal_error(_error):
        app.logger.exception("Unhandled server error")
        return {"success": False, "error": "Internal server error."}, 500

    with app.app_context():
        init_db()

    return app


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    create_app().run()

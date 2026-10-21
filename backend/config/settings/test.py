from .base import *

DEBUG = True

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'test_db.sqlite3',
        'OPTIONS': {
            'timeout': 30,
        },
    }
}

CELERY_TASK_ALWAYS_EAGER = True
CELERY_TASK_STORE_EAGER_RESULT = True

# Patch PostgreSQL GinIndex for SQLite test environment
from django.db.backends.base.schema import BaseDatabaseSchemaEditor
_orig_add_index = BaseDatabaseSchemaEditor.add_index

def _safe_add_index(self, model, index):
    if self.connection.vendor != 'postgresql' and getattr(index, 'suffix', None) == 'gin':
        return None
    return _orig_add_index(self, model, index)

BaseDatabaseSchemaEditor.add_index = _safe_add_index

from django.db.backends.signals import connection_created

def enable_sqlite_wal(sender, connection, **kwargs):
    if connection.vendor == 'sqlite':
        with connection.cursor() as cursor:
            cursor.execute('PRAGMA journal_mode=WAL;')
            cursor.execute('PRAGMA busy_timeout=15000;')

connection_created.connect(enable_sqlite_wal)



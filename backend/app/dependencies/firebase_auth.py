import logging
from fastapi import Request, HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import firebase_admin
from firebase_admin import auth, credentials
from app.config import settings

logger = logging.getLogger(__name__)

security = HTTPBearer(auto_error=False)

import os

def _init_firebase():
    if not firebase_admin._apps:
        try:
            cred_path = settings.FIREBASE_CREDENTIALS_PATH or os.environ.get("FIREBASE_CREDENTIALS_PATH")
            cred = None
            if cred_path:
                if not os.path.isabs(cred_path):
                    possible_paths = [
                        cred_path,
                        os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), cred_path),
                        os.path.expanduser(f"~/Projects/ResumeIQ/{cred_path}")
                    ]
                    for p in possible_paths:
                        if os.path.exists(p):
                            cred_path = p
                            break
                if os.path.exists(cred_path):
                    cred = credentials.Certificate(cred_path)

            options = {}
            if settings.FIREBASE_PROJECT_ID:
                options["projectId"] = settings.FIREBASE_PROJECT_ID

            if cred:
                firebase_admin.initialize_app(cred, options=options)
            elif options:
                firebase_admin.initialize_app(options=options)
            else:
                firebase_admin.initialize_app()
            logger.info("Firebase Admin initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Firebase Admin: {e}")

_init_firebase()

async def verify_firebase_token(request: Request, creds: HTTPAuthorizationCredentials = Security(security)):
    if request.method == "OPTIONS":
        return None
    path = request.url.path
    if path in ["/", "/api/analysis/roles", "/api/jobs"]:
        return None

    if not creds:
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")

    token = creds.credentials
    try:
        decoded_token = auth.verify_id_token(token)
        uid = decoded_token.get("uid")
        logger.info(f"FIREBASE AUTH SUCCESS: Verified token for UID: {uid}")
        return uid
    except Exception as e:
        logger.warning(f"FIREBASE AUTH FAILURE: {e}")
        raise HTTPException(status_code=401, detail="Invalid authentication token")

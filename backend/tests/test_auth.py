import pytest
from unittest.mock import patch, MagicMock
from fastapi import HTTPException
from app.dependencies.firebase_auth import verify_firebase_token
from firebase_admin import auth

class MockRequest:
    def __init__(self, path="/api/resume/analyze", method="POST"):
        self.url = MagicMock(path=path)
        self.method = method

class MockCreds:
    def __init__(self, token="test_token"):
        self.credentials = token

@pytest.mark.anyio
async def test_auth_missing_token():
    req = MockRequest()
    with pytest.raises(HTTPException) as exc_info:
        await verify_firebase_token(req, creds=None)
    assert exc_info.value.status_code == 401
    assert "Missing" in exc_info.value.detail

@pytest.mark.anyio
async def test_auth_invalid_token():
    req = MockRequest()
    creds = MockCreds("invalid_token")
    with patch("app.dependencies.firebase_auth.auth.verify_id_token", side_effect=auth.InvalidIdTokenError("Invalid")):
        with pytest.raises(HTTPException) as exc_info:
            await verify_firebase_token(req, creds=creds)
        assert exc_info.value.status_code == 401
        assert "Invalid authentication token" in exc_info.value.detail

@pytest.mark.anyio
async def test_auth_expired_token():
    req = MockRequest()
    creds = MockCreds("expired_token")
    with patch("app.dependencies.firebase_auth.auth.verify_id_token", side_effect=auth.ExpiredIdTokenError("Expired", "token")):
        with pytest.raises(HTTPException) as exc_info:
            await verify_firebase_token(req, creds=creds)
        assert exc_info.value.status_code == 401
        assert "Invalid authentication token" in exc_info.value.detail

@pytest.mark.anyio
async def test_auth_valid_token():
    req = MockRequest()
    creds = MockCreds("valid_token")
    with patch("app.dependencies.firebase_auth.auth.verify_id_token", return_value={"uid": "user_123"}):
        uid = await verify_firebase_token(req, creds=creds)
        assert uid == "user_123"

@pytest.mark.anyio
async def test_auth_public_routes():
    creds = None
    for path in ["/", "/api/analysis/roles", "/api/jobs"]:
        req = MockRequest(path=path, method="GET")
        res = await verify_firebase_token(req, creds=creds)
        assert res is None

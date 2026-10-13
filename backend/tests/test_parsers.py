import pytest
from app.parsers import cleaner

def test_cleaner():
    raw = "Hello   world\n\n\n\nTest"
    cleaned = cleaner.clean_resume_text(raw)
    assert "Hello world\n\n\nTest" in cleaned

def test_cleaner_removes_null_bytes():
    dirty = "Hello\x00World"
    assert cleaner.clean_resume_text(dirty) == "Hello World"

def test_cleaner_collapses_whitespace():
    dirty = "This   is \t a   test"
    assert cleaner.clean_resume_text(dirty) == "This is a test"

def test_cleaner_removes_noise_lines():
    dirty = "Valid Line\n------------\n***\nAnother Valid Line"
    assert cleaner.clean_resume_text(dirty) == "Valid Line\nAnother Valid Line"

def test_is_meaningful():
    assert cleaner.is_text_meaningful("word " * 30, 30)
    assert not cleaner.is_text_meaningful("short text", 30)
    assert cleaner.is_text_meaningful("One two three four five", 5)
    assert not cleaner.is_text_meaningful("One two three", 5)

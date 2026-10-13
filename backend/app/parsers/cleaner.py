import re

NULL_BYTES_PATTERN = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]")
WHITESPACE_PATTERN = re.compile(r"[ \t]+")
PUNCTUATION_REPEATED_PATTERN = re.compile(r"^[^\w\s]{3,}$")
HORIZONTAL_RULE_PATTERN = re.compile(r"^[-_=*#~]{3,}$")

def clean_resume_text(text: str) -> str:
    if not text:
        return ""

    text = text.replace("\r\n", "\n").replace("\r", "\n")
    text = NULL_BYTES_PATTERN.sub(" ", text)

    lines = text.split("\n")
    cleaned_lines = []
    for line in lines:
        line = WHITESPACE_PATTERN.sub(" ", line).strip()
        cleaned_lines.append(line)

    filtered_lines = []
    for line in cleaned_lines:
        if PUNCTUATION_REPEATED_PATTERN.match(line):
            continue
        if HORIZONTAL_RULE_PATTERN.match(line):
            continue
        filtered_lines.append(line)

    result_lines = []
    blank_count = 0
    for line in filtered_lines:
        if not line:
            blank_count += 1
            if blank_count <= 2:
                result_lines.append(line)
        else:
            blank_count = 0
            result_lines.append(line)

    return "\n".join(result_lines).strip()

def is_text_meaningful(text: str, min_words: int) -> bool:
    if not text or not text.strip():
        return False
    words = text.split()
    return len(words) >= min_words

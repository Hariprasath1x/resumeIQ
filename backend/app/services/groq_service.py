"""
AI service — communicates with the Groq API.
"""

import json
import logging
import os
import re

from groq import Groq
from pydantic import ValidationError

from app.models.schemas import ResumeProfile, RoleMatch, ImprovementSuggestions
from app.config import settings

logger = logging.getLogger(__name__)

_client: Groq | None = None

def _get_client() -> Groq:
    global _client
    if _client is None:
        api_key = settings.GROQ_API_KEY
        if not api_key:
            raise EnvironmentError("GROQ_API_KEY is not set.")
        _client = Groq(api_key=api_key)
    return _client

def _get_model() -> str:
    return settings.GROQ_MODEL

EXTRACTION_SYSTEM_PROMPT = """You are a resume parser. Extract structured information from resume text.
Return ONLY a valid JSON object. Do not include any explanation, markdown, or code fences.

The JSON must have exactly these keys (use empty strings or empty arrays when data is missing):
{
  "candidate_name": "",
  "professional_summary": "",
  "education": [],
  "skills": [],
  "programming_languages": [],
  "frameworks": [],
  "databases": [],
  "cloud_tools": [],
  "experience": [],
  "projects": [],
  "certifications": [],
  "achievements": [],
  "soft_skills": []
}

Rules:
- Extract actual values from the resume text; do not invent anything.
- CRITICAL: Every item in every array MUST be a single plain string. DO NOT use objects or nested JSON.
- For experience, combine the job title, company and a brief summary into a single string per entry (e.g., "Software Engineer at TechCorp: Developed...").
- For projects, combine the project name and a brief description into a single string per entry.
- For education, combine the degree, institution, and year into a single string per entry.
"""

def extract_resume_profile(resume_text: str) -> ResumeProfile:
    client = _get_client()
    model = _get_model()

    raw_response = _call_groq_for_json(
        client=client,
        model=model,
        system_prompt=EXTRACTION_SYSTEM_PROMPT,
        user_message=f"Parse this resume:\n\n{resume_text[:8000]}",
    )

    return _parse_resume_profile(raw_response)

def _call_groq_for_json(client: Groq, model: str, system_prompt: str, user_message: str) -> str:
    response = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message},
        ],
        temperature=0.1,
        max_tokens=2048,
        response_format={"type": "json_object"}
    )
    return response.choices[0].message.content or ""

def _parse_resume_profile(raw: str) -> ResumeProfile:
    model = _get_model()
    logger.info("Attempting to parse JSON response (length: %d) from model: %s", len(raw), model)
    
    cleaned = _extract_json_block(raw)
    try:
        data = json.loads(cleaned)
        return ResumeProfile(**data)
    except (json.JSONDecodeError, ValidationError) as exc:
        logger.warning("First parse attempt failed: %s (Location: %s)", type(exc).__name__, exc)
        
        # Safe fallback: attempt an LLM-based JSON repair
        logger.info("Attempting LLM-based JSON repair...")
        try:
            client = _get_client()
            repair_prompt = (
                "The following text was supposed to be a valid JSON object matching a resume profile schema, "
                "but it is malformed or invalid. Please fix the syntax errors (e.g. trailing commas, missing quotes, unescaped characters) "
                "and return ONLY the corrected valid JSON.\n\n"
                f"Invalid JSON:\n{cleaned}"
            )
            repaired_raw = _call_groq_for_json(
                client=client, 
                model=model, 
                system_prompt="You are a JSON repair tool. Return ONLY a valid JSON object.", 
                user_message=repair_prompt
            )
            repaired_cleaned = _extract_json_block(repaired_raw)
            data = json.loads(repaired_cleaned)
            logger.info("JSON repair succeeded.")
            return ResumeProfile(**data)
        except Exception as repair_exc:
            logger.error("Resume profile parsing and repair failed completely. Repair error: %s. Raw snippet: %s", repair_exc, raw[:500])
            return ResumeProfile()

def _extract_json_block(text: str) -> str:
    text = re.sub(r"```(?:json)?\s*", "", text)
    text = re.sub(r"```", "", text)
    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1 and end > start:
        return text[start : end + 1]
    return text.strip()

def generate_role_explanations(resume_profile: ResumeProfile, role_matches: list[RoleMatch]) -> list[RoleMatch]:
    if not role_matches:
        return role_matches

    client = _get_client()
    model = _get_model()

    roles_summary = "\n".join(
        f"- {rm.role}: {rm.match_percentage:.0f}% match, "
        f"matched: {rm.matched_skills}, missing required: {rm.missing_required}"
        for rm in role_matches[:5]
    )

    prompt = (
        f"Candidate skills: {resume_profile.all_technical_skills()}\n\n"
        f"Role matches (percentages are pre-calculated, do not change them):\n{roles_summary}\n\n"
        "For each role listed, write ONE short sentence (max 30 words) explaining "
        "why this role fits the candidate based on their skills. "
        "Return a JSON object where keys are role names and values are the explanation strings. "
        "Return only valid JSON, no markdown."
    )

    try:
        raw = _call_groq_for_json(client=client, model=model, system_prompt="", user_message=prompt)
        cleaned = _extract_json_block(raw)
        explanations: dict[str, str] = json.loads(cleaned)
        updated: list[RoleMatch] = []
        for rm in role_matches:
            explanation = explanations.get(rm.role, "")
            updated.append(rm.model_copy(update={"explanation": explanation}))
        return updated
    except Exception as exc:
        logger.warning("Role explanation generation failed: %s", exc)
        return role_matches

SUGGESTIONS_SYSTEM_PROMPT = """You are a professional resume coach. 
Given a resume profile and score analysis, provide actionable improvement suggestions.

Important rules:
- Do NOT invent companies, job titles, metrics, technologies, or achievements not in the resume.
- If a bullet point lacks a metric, suggest adding one (e.g., "consider adding response-time improvement data if available").
- Be constructive and specific.
- Return ONLY a valid JSON object with these exact keys:
{
  "summary_suggestion": "",
  "bullet_point_suggestions": [],
  "missing_sections": [],
  "keyword_suggestions": [],
  "general_suggestions": []
}
"""

def generate_improvement_suggestions(resume_profile: ResumeProfile, weaknesses: list[str], missing_sections: list[str]) -> ImprovementSuggestions:
    client = _get_client()
    model = _get_model()

    user_message = (
        f"Resume profile summary:\n"
        f"- Name: {resume_profile.candidate_name}\n"
        f"- Skills: {resume_profile.all_technical_skills()}\n"
        f"- Has summary: {'yes' if resume_profile.professional_summary else 'no'}\n"
        f"- Experience entries: {len(resume_profile.experience)}\n"
        f"- Projects: {len(resume_profile.projects)}\n"
        f"- Certifications: {resume_profile.certifications}\n"
        f"- Achievements: {resume_profile.achievements}\n\n"
        f"Identified weaknesses: {weaknesses}\n"
        f"Missing resume sections: {missing_sections}\n\n"
        "Provide specific, actionable improvement suggestions."
    )

    try:
        raw = _call_groq_for_json(
            client=client,
            model=model,
            system_prompt=SUGGESTIONS_SYSTEM_PROMPT,
            user_message=user_message,
        )
        cleaned = _extract_json_block(raw)
        data = json.loads(cleaned)
        return ImprovementSuggestions(**data)
    except Exception as exc:
        logger.error("Suggestion generation failed: %s", exc)
        return ImprovementSuggestions(
            general_suggestions=["Could not generate suggestions at this time. Please try again."]
        )

from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from app.dependencies.firebase_auth import verify_firebase_token
from app.models.schemas import AnalysisResponse
from app.services import analysis_service
from app.parsers import pdf_parser, docx_parser, cleaner
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/analyze", response_model=AnalysisResponse, dependencies=[Depends(verify_firebase_token)])
async def analyze_resume(file: UploadFile = File(...)):
    # 1. Parse
    try:
        content = await file.read()
        if len(content) > 10 * 1024 * 1024:
            raise HTTPException(status_code=413, detail="File too large")
            
        filename = file.filename.lower() if file.filename else ""
        if filename.endswith(".pdf") or file.content_type == "application/pdf":
            raw_text = pdf_parser.parse_pdf(content)
        elif filename.endswith(".docx") or (file.content_type and "wordprocessingml" in file.content_type):
            raw_text = docx_parser.parse_docx(content)
        else:
            raise HTTPException(status_code=422, detail="Unsupported file format")

        if not raw_text or not raw_text.strip():
            raise HTTPException(status_code=422, detail="The document appears to be empty or could not be read.")

        # 2. Clean
        clean_text = cleaner.clean_resume_text(raw_text)
        if not cleaner.is_text_meaningful(clean_text, 30):
            raise HTTPException(status_code=422, detail="The resume appears to be too short or empty.")

        # 3. Analyze
        response = analysis_service.analyze_resume(clean_text)
        return response

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing resume: {e}")
        raise HTTPException(status_code=500, detail="Failed to process the uploaded file.")

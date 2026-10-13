import React, { useState } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, X } from 'lucide-react';

export default function UploadResume({ onAnalyze, isLoading }) {
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setError(null);
    
    if (!selectedFile) {
      setFile(null);
      return;
    }

    const validTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (!validTypes.includes(selectedFile.type) && !selectedFile.name.endsWith('.pdf') && !selectedFile.name.endsWith('.docx')) {
      setError('Please upload a PDF or DOCX file.');
      setFile(null);
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File size must be under 10 MB.');
      setFile(null);
      return;
    }

    setFile(selectedFile);
  };

  const handleAnalyzeClick = () => {
    if (file) {
      onAnalyze(file);
    }
  };

  return (
    <div className="upload-container">
      <div className="upload-header">
        <h2>Upload your resume</h2>
        <p>PDF or DOCX • Max 10 MB</p>
      </div>
      
      <div className="upload-box">
        {!file ? (
          <div className="upload-placeholder">
            <UploadCloud size={48} className="upload-icon" />
            <label className="upload-btn">
              Choose Resume
              <input 
                type="file" 
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" 
                onChange={handleFileChange}
                disabled={isLoading}
              />
            </label>
          </div>
        ) : (
          <div className="upload-selected">
            <FileText size={48} className="file-icon" />
            <div className="file-info">
              <span className="file-name">{file.name}</span>
              <span className="file-size">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
            </div>
            <button 
              className="clear-btn" 
              onClick={() => setFile(null)}
              disabled={isLoading}
            >
              <X size={20} />
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="upload-error">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {file && (
        <button 
          className="analyze-btn" 
          onClick={handleAnalyzeClick}
          disabled={isLoading}
        >
          {isLoading ? 'Analyzing...' : 'Analyze Resume'}
        </button>
      )}
    </div>
  );
}

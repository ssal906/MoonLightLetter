import React, { useState, useRef } from 'react';
import { getApiBase } from './api';

const TRANSLATIONS = {
  ko: {
    upload: '📄 문서 업로드',
    processing: '분석 중...',
    errorFormat: '❌ 지원하지 않는 파일 형식입니다.\n.txt, .docx, .pdf 파일만 가능합니다.',
    errorProcess: '문서 처리 실패',
    success: '✅ 문서 분석 완료!\n각 항목이 자동으로 채워졌습니다.',
    errorUpload: '❌ 문서 처리 실패:',
  },
  en: {
    upload: '📄 Upload Document',
    processing: 'Processing...',
    errorFormat: '❌ Unsupported file format.\nOnly .txt, .docx, .pdf files are allowed.',
    errorProcess: 'Document processing failed',
    success: '✅ Document analysis complete!\nAll fields have been automatically filled.',
    errorUpload: '❌ Document processing failed:',
  },
};

export default function DocumentUploadButton({ onFieldsReceived, language = 'ko' }) {
  const t = TRANSLATIONS[language] || TRANSLATIONS.ko;
  const [processing, setProcessing] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 파일 형식 검증
    const validExtensions = ['.txt', '.docx', '.pdf'];
    const fileExtension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
    
    if (!validExtensions.includes(fileExtension)) {
      alert(t.errorFormat);
      return;
    }

    setProcessing(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // FormData는 직접 fetch 사용 (Content-Type 헤더를 자동으로 설정하기 위해)
      const API_BASE = getApiBase();
      const url = `${API_BASE}/parse-document`;
      console.log('📤 문서 업로드 요청:', url);
      
      const response = await fetch(url, {
        method: 'POST',
        body: formData
        // FormData를 사용할 때는 Content-Type 헤더를 설정하지 않아야 브라우저가 자동으로 multipart/form-data를 설정합니다
      });

      if (!response.ok) {
        let errorMessage = t.errorProcess;
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorData.message || t.errorProcess;
        } catch (e) {
          // JSON 파싱 실패 시 상태 텍스트 사용
          errorMessage = response.statusText || `HTTP ${response.status}`;
        }
        console.error('❌ 문서 업로드 실패:', {
          status: response.status,
          statusText: response.statusText,
          url: url,
          errorMessage: errorMessage
        });
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('✅ 문서 파싱 성공:', data);

      // 부모 컴포넌트로 필드 데이터 전달
      if (onFieldsReceived && data.fields) {
        onFieldsReceived(data.fields, data.extracted_text);
      }

      alert(t.success);

    } catch (error) {
      console.error('문서 업로드 오류:', error);
      alert(`${t.errorUpload} ${error.message}`);
    } finally {
      setProcessing(false);
      // 파일 입력 초기화 (같은 파일 재선택 가능하게)
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div>
      {/* 숨겨진 파일 입력 */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,.docx,.pdf"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      {/* 버튼 */}
      <button
        onClick={triggerFileInput}
        disabled={processing}
        style={{
          padding: '10px 20px',
          background: processing 
            ? '#ccc' 
            : '#9370DB',
          color: 'white',
          border: processing ? 'none' : '1px solid #9370DB',
          borderRadius: '10px',
          cursor: processing ? 'not-allowed' : 'pointer',
          fontSize: '15px',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: processing ? 'none' : '0 4px 12px rgba(147, 112, 219, 0.4)',
          transition: 'all 0.3s ease',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          MozUserSelect: 'none',
          msUserSelect: 'none'
        }}
        onMouseEnter={(e) => {
          if (!processing) {
            e.currentTarget.style.background = '#6A5ACD';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(147, 112, 219, 0.5)';
          }
        }}
        onMouseLeave={(e) => {
          if (!processing) {
            e.currentTarget.style.background = '#9370DB';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(147, 112, 219, 0.4)';
          }
        }}
      >
        {processing ? (
          <>
            <span style={{ 
              width: '16px', 
              height: '16px', 
              border: '2px solid white',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              display: 'inline-block',
              animation: 'spin 0.8s linear infinite'
            }} />
            <span>{t.processing}</span>
          </>
        ) : (
          t.upload
        )}
      </button>

      {/* 스피너 애니메이션 및 텍스트 선택 방지 */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        button::-moz-selection,
        button::selection {
          background: transparent;
          color: inherit;
        }
        button span::-moz-selection,
        button span::selection {
          background: transparent;
          color: inherit;
        }
      `}</style>
    </div>
  );
}




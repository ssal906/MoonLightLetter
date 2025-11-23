// API 설정 및 유틸리티
export const getApiBase = () => {
  const envApiBase = import.meta?.env?.VITE_API_BASE;
  
  // 환경 변수가 설정되어 있으면 사용
  if (envApiBase) {
    return envApiBase.replace(/\/+$/, "");
  }
  
  // 프로덕션 환경 감지 (localhost가 아닌 도메인에서 실행 중)
  const isProduction = window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1";
  
  if (isProduction) {
    // 프로덕션에서는 같은 도메인에서 서빙되는 경우를 가정
    // Railway 등에서 프론트엔드와 백엔드가 같은 서비스로 배포되는 경우
    // 빈 문자열을 반환하여 상대 경로로 요청
    console.log("🌐 프로덕션 환경: 상대 경로로 API 요청 (같은 도메인)");
    return ""; // 빈 문자열 = 상대 경로
  }
  
  // 개발 환경에서만 localhost 사용
  return "http://localhost:8000";
};

const API_BASE = getApiBase();

// 인증 헤더 생성
export const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// 기본 fetch 래퍼
export const apiFetch = async (endpoint, options = {}) => {
  try {
    let url;
    if (endpoint.startsWith("http")) {
      url = endpoint;
    } else {
      // API_BASE와 endpoint를 결합할 때 슬래시 중복 제거
      const base = API_BASE || '';
      const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
      url = base + path;
      // 중복 슬래시 제거 (단, http:// 같은 프로토콜 부분은 보존)
      url = url.replace(/([^:]\/)\/+/g, '$1');
    }
    const headers = {
      "Content-Type": "application/json",
      ...getAuthHeader(),
      ...options.headers,
    };

    console.log(`🌐 API 요청: ${url}`, { method: options.method || "GET", headers });
    
    const response = await fetch(url, {
      ...options,
      headers,
    });

    console.log(`📡 응답 상태: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      let error;
      try {
        error = await response.json();
      } catch (e) {
        error = { detail: response.statusText || "Unknown error" };
      }
      console.error(`❌ API 오류:`, error);
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    const data = await response.json();
    console.log(`✅ API 성공:`, data);
    return data;
  } catch (error) {
    console.error(`❌ apiFetch 오류:`, error);
    // 네트워크 오류인 경우
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error(`서버에 연결할 수 없습니다. API 주소: ${API_BASE || '(설정되지 않음)'}`);
    }
    throw error;
  }
};

// HTTP 메서드별 헬퍼
export const apiGet = (endpoint, options = {}) => 
  apiFetch(endpoint, { ...options, method: "GET" });

export const apiPost = (endpoint, body, options = {}) =>
  apiFetch(endpoint, {
    ...options,
    method: "POST",
    body: body ? JSON.stringify(body) : undefined,
  });

export const apiPut = (endpoint, body, options = {}) =>
  apiFetch(endpoint, {
    ...options,
    method: "PUT",
    body: body ? JSON.stringify(body) : undefined,
  });

export const apiPatch = (endpoint, body, options = {}) =>
  apiFetch(endpoint, {
    ...options,
    method: "PATCH",
    body: body ? JSON.stringify(body) : undefined,
  });

export const apiDelete = (endpoint, options = {}) =>
  apiFetch(endpoint, { ...options, method: "DELETE" });

// URL 생성 헬퍼 함수 (슬래시 중복 제거)
export const buildApiUrl = (endpoint) => {
  if (endpoint.startsWith("http")) {
    return endpoint;
  }
  
  const base = getApiBase() || '';
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  let url = base + path;
  
  // 중복 슬래시 제거 (프로토콜 부분은 보존)
  // 예: "//path" -> "/path", "http://host//path" -> "http://host/path"
  url = url.replace(/([^:]\/)\/+/g, '$1');
  
  return url;
};

export default API_BASE;


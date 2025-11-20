// API 설정 및 유틸리티
const getApiBase = () => {
  const envApiBase = import.meta?.env?.VITE_API_BASE;
  
  // 환경 변수가 설정되어 있으면 사용
  if (envApiBase) {
    return envApiBase.replace(/\/+$/, "");
  }
  
  // 프로덕션 환경 감지 (localhost가 아닌 도메인에서 실행 중)
  const isProduction = window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1";
  
  if (isProduction) {
    console.error("⚠️ VITE_API_BASE 환경 변수가 설정되지 않았습니다!");
    console.error("프로덕션 환경에서는 반드시 VITE_API_BASE를 설정해야 합니다.");
    // 프로덕션에서는 현재 도메인을 기반으로 추정 (같은 도메인에서 서빙되는 경우)
    // 하지만 일반적으로는 별도 백엔드 도메인을 사용하므로 경고만 표시
    return ""; // 빈 문자열 반환하여 명확한 에러 발생
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
    const url = endpoint.startsWith("http") ? endpoint : `${API_BASE}${endpoint}`;
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

export default API_BASE;


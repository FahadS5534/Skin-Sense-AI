const API_BASE = "http://localhost:8000/api/v1";

export function getStoredToken() {
  return localStorage.getItem("skinsense_token");
}

export function setStoredToken(token) {
  if (token) {
    localStorage.setItem("skinsense_token", token);
  } else {
    localStorage.removeItem("skinsense_token");
  }
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = options.headers || {};
  
  const token = getStoredToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // If not FormData, default to application/json
  if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Session expired or invalid
    setStoredToken(null);
  }

  if (!response.ok) {
    let errorDetail = "An unexpected error occurred.";
    try {
      const errorJson = await response.json();
      errorDetail = errorJson.detail || errorDetail;
    } catch {
      // Non-json response
    }
    const err = new Error(errorDetail);
    err.status = response.status;
    throw err;
  }

  return await response.json();
}

// --- Health ---
export async function checkHealth() {
  const res = await fetch("http://localhost:8000/health");
  return await res.json();
}

// --- Auth ---
export async function registerUser(userData) {
  return await request("/auth/register", {
    method: "POST",
    body: JSON.stringify(userData),
  });
}

export async function loginUser(email, password) {
  return await request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function getCurrentUser() {
  return await request("/auth/me");
}

export async function updateConsent(consentData) {
  return await request("/auth/consent", {
    method: "PUT",
    body: JSON.stringify(consentData),
  });
}

export async function deleteAccount() {
  return await request("/auth/account", {
    method: "DELETE",
  });
}

// --- Analysis ---
export async function analyzeFacialPhoto(file, regions = null, retentionOverride = null, weightingScheme = "default") {
  const formData = new FormData();
  formData.append("file", file);
  
  if (regions) {
    formData.append("regions_json", JSON.stringify(regions));
  }
  if (retentionOverride !== null) {
    formData.append("retention_override", retentionOverride ? "true" : "false");
  }
  if (weightingScheme) {
    formData.append("weighting_scheme", weightingScheme);
  }

  return await request("/analyze", {
    method: "POST",
    body: formData,
  });
}

// --- Scans & History ---
export async function getScans() {
  return await request("/scans");
}

export async function getScanDetail(scanId) {
  return await request(`/scans/${scanId}`);
}

export async function deleteScanRecord(scanId) {
  return await request(`/scans/${scanId}`, {
    method: "DELETE",
  });
}

export async function compareTwoScans(beforeId, afterId) {
  return await request("/scans/compare", {
    method: "POST",
    body: JSON.stringify({
      scan_id_before: beforeId,
      scan_id_after: afterId,
    }),
  });
}

export function getScanImageUrl(scanId) {
  return `http://localhost:8000/api/v1/scans/${scanId}/image`;
}

export function getScanAnnotatedUrl(scanId) {
  return `http://localhost:8000/api/v1/scans/${scanId}/annotated`;
}

// --- Questionnaire ---
export async function submitQuestionnaire(answers) {
  return await request("/questionnaire", {
    method: "POST",
    body: JSON.stringify(answers),
  });
}

export async function getLatestQuestionnaire() {
  return await request("/questionnaire");
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

function getHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  const githubToken = typeof window !== 'undefined' ? localStorage.getItem('github_token') : null;
  const language = typeof window !== 'undefined' ? localStorage.getItem('forgemind_language') || 'es' : 'es';
  const headers: HeadersInit = { 'Content-Type': 'application/json', 'x-language': language };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (githubToken) headers['x-github-token'] = githubToken;
  return headers;
}

async function handleResponse(r: Response) {
  if (r.status === 204) return { success: true };
  const text = await r.text();
  const data = text ? JSON.parse(text) : {};
  if (!r.ok) {
    throw new Error(data.message || `Error del servidor (${r.status})`);
  }
  return data;
}

export const api = {
  drive: {
    listFiles: (accessToken: string, folderId?: string, sharedWithMe?: boolean, recents?: boolean) =>
      fetch(`${API_BASE}/drive/list-files`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ accessToken, folderId, sharedWithMe, recents }),
      }).then(handleResponse),
    readFile: (fileId: string, accessToken: string) =>
      fetch(`${API_BASE}/drive/read-file`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ fileId, accessToken }),
      }).then(handleResponse),
  },
  gmail: {
    getAuthUrl: () => fetch(`${API_BASE}/gmail/auth-url`, { headers: getHeaders() }).then(handleResponse),
    getContacts: (accessToken: string) =>
      fetch(`${API_BASE}/gmail/contacts?accessToken=${encodeURIComponent(accessToken)}`, { headers: getHeaders() }).then(handleResponse),
    sendReport: (
      arg1: string | { accessToken: string; to: string; subject: string; content: string; projectName?: string },
      to?: string,
      subject?: string,
      content?: string,
      projectName?: string
    ) => {
      const bodyPayload =
        typeof arg1 === 'object'
          ? arg1
          : { accessToken: arg1, to, subject, content, projectName };

      return fetch(`${API_BASE}/gmail/send-report`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(bodyPayload),
      }).then(handleResponse);
    },
    getMessages: (accessToken: string) =>
      fetch(`${API_BASE}/gmail/messages?accessToken=${encodeURIComponent(accessToken)}`, { headers: getHeaders() }).then(handleResponse),
  },
  engine: {
    command: (message: string) =>
      fetch(`${API_BASE}/engine/command`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ message }),
      }).then(handleResponse),
  },
  auth: {
    login: (token: string) => {
      localStorage.setItem('auth_token', token);
      return fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      }).then(handleResponse);
    },
    me: () => fetch(`${API_BASE}/auth/me`, { headers: getHeaders() }).then(handleResponse),
  },
  workspaces: {
    list: (userId: string) => fetch(`${API_BASE}/workspaces/user/${userId}`, { headers: getHeaders() }).then(handleResponse),
    get: (id: string) => fetch(`${API_BASE}/workspaces/${id}`, { headers: getHeaders() }).then(handleResponse),
    create: (name: string, ownerId: string, description?: string) =>
      fetch(`${API_BASE}/workspaces`, { method: 'POST', headers: getHeaders(), body: JSON.stringify({ name, ownerId, description }) }).then(handleResponse),
    delete: (id: string) =>
      fetch(`${API_BASE}/workspaces/${id}`, { method: 'DELETE', headers: getHeaders() }).then(handleResponse),
  },
  projects: {
    list: (workspaceId: string) => fetch(`${API_BASE}/projects/workspace/${workspaceId}`, { headers: getHeaders() }).then(handleResponse),
    get: (id: string) => fetch(`${API_BASE}/projects/${id}`, { headers: getHeaders() }).then(handleResponse),
    create: (workspaceId: string, name: string, description?: string) =>
      fetch(`${API_BASE}/projects`, { method: 'POST', headers: getHeaders(), body: JSON.stringify({ workspaceId, name, description }) }).then(handleResponse),
    update: (id: string, data: { name?: string; description?: string }) =>
      fetch(`${API_BASE}/projects/${id}`, { method: 'PATCH', headers: getHeaders(), body: JSON.stringify(data) }).then(handleResponse),
    delete: (id: string) =>
      fetch(`${API_BASE}/projects/${id}`, { method: 'DELETE', headers: getHeaders() }).then(handleResponse),
    analyzeRepo: (projectId: string, repoUrl: string) =>
      fetch(`${API_BASE}/projects/${projectId}/analyze-repo`, { method: 'POST', headers: getHeaders(), body: JSON.stringify({ repoUrl }) }).then(handleResponse),
    syncRepo: (projectId: string) =>
      fetch(`${API_BASE}/projects/${projectId}/sync-repo`, { method: 'POST', headers: getHeaders() }).then(handleResponse),
    getStatusSummary: (id: string) =>
      fetch(`${API_BASE}/projects/${id}/status-summary`, { headers: getHeaders() }).then(handleResponse),
    getGitActivity: (id: string) =>
      fetch(`${API_BASE}/projects/${id}/git-activity`, { headers: getHeaders() }).then(handleResponse),
    getReadmeSummary: (id: string) =>
      fetch(`${API_BASE}/projects/${id}/readme-summary`, { headers: getHeaders() }).then(handleResponse),
    analyze: (id: string) =>
      fetch(`${API_BASE}/projects/${id}/analyze`, { method: 'POST', headers: getHeaders() }).then(handleResponse),
    analyzeArchitecture: (id: string) =>
      fetch(`${API_BASE}/projects/${id}/analyze-architecture`, { method: 'POST', headers: getHeaders() }).then(handleResponse),
  },
  objectives: {
    list: (projectId: string) =>
      fetch(`${API_BASE}/objectives/project/${projectId}`, { headers: getHeaders() }).then(handleResponse),
    listByProject: (projectId: string) =>
      fetch(`${API_BASE}/objectives/project/${projectId}`, { headers: getHeaders() }).then(handleResponse),
    listByUser: (userId: string) =>
      fetch(`${API_BASE}/objectives/user/${userId}`, { headers: getHeaders() }).then(handleResponse),
    create: (projectId: string, title: string, description?: string, tags?: string[]) =>
      fetch(`${API_BASE}/objectives`, { method: 'POST', headers: getHeaders(), body: JSON.stringify({ projectId, title, description, tags }) }).then(handleResponse),
    updateStatus: (id: string, status: string) =>
      fetch(`${API_BASE}/objectives/${id}/status`, { method: 'PATCH', headers: getHeaders(), body: JSON.stringify({ status }) }).then(handleResponse),
    delete: (id: string) =>
      fetch(`${API_BASE}/objectives/${id}`, { method: 'DELETE', headers: getHeaders() }).then(handleResponse),
  },
  repositories: {
    listByProject: (projectId: string) =>
      fetch(`${API_BASE}/repositories/project/${projectId}`, { headers: getHeaders() }).then(handleResponse),
    listGitHub: (username?: string, visibility?: string) =>
      fetch(`${API_BASE}/repositories/github?username=${encodeURIComponent(username || '')}&visibility=${encodeURIComponent(visibility || 'all')}`, { headers: getHeaders() }).then(handleResponse),
    connect: (
      arg1: string | { projectId: string; owner?: string; name?: string; defaultBranch?: string; monitoredBranches?: string[] },
      owner?: string,
      name?: string,
      defaultBranch?: string,
      monitoredBranches?: string[]
    ) => {
      const bodyPayload =
        typeof arg1 === 'object'
          ? arg1
          : { projectId: arg1, owner, name, defaultBranch, monitoredBranches };

      return fetch(`${API_BASE}/repositories/connect`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(bodyPayload),
      }).then(handleResponse);
    },
    delete: (id: string) =>
      fetch(`${API_BASE}/repositories/${id}`, { method: 'DELETE', headers: getHeaders() }).then(handleResponse),
  },
  documents: {
    list: () => fetch(`${API_BASE}/documents`, { headers: getHeaders() }).then(handleResponse),
    listByProject: (projectId: string) =>
      fetch(`${API_BASE}/documents/project/${projectId}`, { headers: getHeaders() }).then(handleResponse),
    create: (projectId: string, fileName: string, fileType: string, fileSize?: number, contentUrl?: string, repoId?: string) =>
      fetch(`${API_BASE}/documents`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ projectId, fileName, fileType, fileSize, contentUrl, repoId }),
      }).then(handleResponse),
    process: (projectId: string, fileName: string, fileType: string, rawContentText?: string, fileSize?: number, fileBase64?: string) =>
      fetch(`${API_BASE}/documents/process`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ projectId, fileName, fileType, rawContentText, fileSize, fileBase64 }),
      }).then(handleResponse),
    delete: (id: string) =>
      fetch(`${API_BASE}/documents/${id}`, { method: 'DELETE', headers: getHeaders() }).then(handleResponse),
  },
  chat: {
    getSessions: () => fetch(`${API_BASE}/chat/sessions`, { headers: getHeaders() }).then(handleResponse),
    saveSession: (session: any) =>
      fetch(`${API_BASE}/chat/sessions`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(session),
      }).then(handleResponse),
    updateSession: (id: string, updates: any) =>
      fetch(`${API_BASE}/chat/sessions/${id}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify(updates),
      }).then(handleResponse),
    deleteSession: (id: string) =>
      fetch(`${API_BASE}/chat/sessions/${id}`, { method: 'DELETE', headers: getHeaders() }).then(handleResponse),
  },
  leads: {
    list: () => fetch(`${API_BASE}/leads`, { headers: getHeaders() }).then(handleResponse),
    create: (data: any) =>
      fetch(`${API_BASE}/leads`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
      }).then(handleResponse),
    searchFacebook: (query: string, token?: string) =>
      fetch(`${API_BASE}/leads/search/facebook`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ query, token }),
      }).then(handleResponse),
  },
  opportunity: {
    analyzeCompany: (url: string) =>
      fetch(`${API_BASE}/opportunity/analyze-company`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ url }),
      }).then(handleResponse),
    analyzeJob: (urlOrText: string, companyId?: string, cvId?: string) =>
      fetch(`${API_BASE}/opportunity/analyze-job`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ urlOrText, companyId, cvId }),
      }).then(handleResponse),
    getMetrics: () => fetch(`${API_BASE}/opportunity/metrics`, { headers: getHeaders() }).then(handleResponse),
    getOpportunities: (type?: 'job' | 'client') =>
      fetch(`${API_BASE}/opportunity/opportunities${type ? `?type=${type}` : ''}`, { headers: getHeaders() }).then(handleResponse),
    getCompanies: () => fetch(`${API_BASE}/opportunity/companies`, { headers: getHeaders() }).then(handleResponse),
    getCompany: (id: string) => fetch(`${API_BASE}/opportunity/companies/${id}`, { headers: getHeaders() }).then(handleResponse),
    getContacts: () => fetch(`${API_BASE}/opportunity/contacts`, { headers: getHeaders() }).then(handleResponse),
    getJobs: () => fetch(`${API_BASE}/opportunity/jobs`, { headers: getHeaders() }).then(handleResponse),
    generateMessage: (data: { opportunityId?: string; contactId?: string; type?: string; language?: string; tone?: string }) =>
      fetch(`${API_BASE}/opportunity/generate-message`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
      }).then(handleResponse),
    getMessages: () => fetch(`${API_BASE}/opportunity/messages`, { headers: getHeaders() }).then(handleResponse),
    getOutreach: () => fetch(`${API_BASE}/opportunity/outreach`, { headers: getHeaders() }).then(handleResponse),
    createDraft: (data: { accessToken: string; to: string; subject: string; body: string; messageId?: string }) =>
      fetch(`${API_BASE}/opportunity/create-draft`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
      }).then(handleResponse),
    sendEmail: (data: { accessToken: string; to: string; subject: string; body: string; opportunityId?: string; contactId?: string; messageId?: string }) =>
      fetch(`${API_BASE}/opportunity/send-email`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
      }).then(handleResponse),
    refineText: (data: { originalText: string; instruction: string }) =>
      fetch(`${API_BASE}/opportunity/refine-text`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
      }).then(handleResponse),
    getProfile: () => fetch(`${API_BASE}/opportunity/profile`, { headers: getHeaders() }).then(handleResponse),
    saveProfile: (data: any) =>
      fetch(`${API_BASE}/opportunity/profile`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
      }).then(handleResponse),
    getCvs: () => fetch(`${API_BASE}/opportunity/cvs`, { headers: getHeaders() }).then(handleResponse),
    saveCv: (data: any) =>
      fetch(`${API_BASE}/opportunity/cvs`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
      }).then(handleResponse),
    deleteCv: (id: string) =>
      fetch(`${API_BASE}/opportunity/cvs/${id}`, { method: 'DELETE', headers: getHeaders() }).then(handleResponse),
    deleteCompany: (id: string) =>
      fetch(`${API_BASE}/opportunity/companies/${id}`, { method: 'DELETE', headers: getHeaders() }).then(handleResponse),
    clearCompanies: () =>
      fetch(`${API_BASE}/opportunity/companies`, { method: 'DELETE', headers: getHeaders() }).then(handleResponse),
  },
};


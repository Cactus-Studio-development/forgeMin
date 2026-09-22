import {
  AEUser,
  AEJob,
  AEWallet,
  AEWalletTransaction,
  AEWithdrawal,
  AEAdminLog,
  CategorizedFeed,
  AdminDashboardMetrics,
} from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

function getHeaders(userId?: string): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  const storedUserId = typeof window !== 'undefined' ? localStorage.getItem('ae_user_id') : null;
  const currentUserId = userId || storedUserId;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (currentUserId) headers['x-ae-user-id'] = currentUserId;

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

export const aeApi = {
  auth: {
    sync: (payload: { uid: string; email: string; displayName?: string; photoUrl?: string }): Promise<{
      user: AEUser;
      wallet: AEWallet;
      isNewUser: boolean;
    }> =>
      fetch(`${API_BASE}/argentina-empleos/auth/sync`, {
        method: 'POST',
        headers: getHeaders(payload.uid),
        body: JSON.stringify(payload),
      }).then(handleResponse),

    completeOnboarding: (userId: string, profileData: any): Promise<AEUser> =>
      fetch(`${API_BASE}/argentina-empleos/auth/onboarding`, {
        method: 'POST',
        headers: getHeaders(userId),
        body: JSON.stringify({ userId, profileData }),
      }).then(handleResponse),

    updateProfile: (userId: string, profileData: any): Promise<AEUser> =>
      fetch(`${API_BASE}/argentina-empleos/auth/profile`, {
        method: 'PATCH',
        headers: getHeaders(userId),
        body: JSON.stringify({ userId, profileData }),
      }).then(handleResponse),

    getProfile: (userId: string): Promise<AEUser> =>
      fetch(`${API_BASE}/argentina-empleos/auth/profile`, {
        method: 'GET',
        headers: getHeaders(userId),
      }).then(handleResponse),

    getGeoMetadata: () =>
      fetch(`${API_BASE}/argentina-empleos/auth/geo/metadata`, {
        method: 'GET',
        headers: getHeaders(),
      }).then(handleResponse),
  },

  jobs: {
    getFeed: (params: {
      provinceId?: string;
      cityId?: string;
      modality?: string;
      categoryId?: string;
      query?: string;
      userProvinceId?: string;
      userCityId?: string;
    }): Promise<CategorizedFeed> => {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v) queryParams.append(k, v);
      });
      return fetch(`${API_BASE}/argentina-empleos/jobs/feed?${queryParams.toString()}`, {
        method: 'GET',
        headers: getHeaders(),
      }).then(handleResponse);
    },

    getJob: (id: string, userId?: string): Promise<AEJob> =>
      fetch(`${API_BASE}/argentina-empleos/jobs/${id}`, {
        method: 'GET',
        headers: getHeaders(userId),
      }).then(handleResponse),

    getMyJobs: (userId: string): Promise<AEJob[]> =>
      fetch(`${API_BASE}/argentina-empleos/jobs/mine`, {
        method: 'GET',
        headers: getHeaders(userId),
      }).then(handleResponse),

    createJob: (userId: string, jobData: any): Promise<AEJob> =>
      fetch(`${API_BASE}/argentina-empleos/jobs`, {
        method: 'POST',
        headers: getHeaders(userId),
        body: JSON.stringify(jobData),
      }).then(handleResponse),

    updateJob: (id: string, userId: string, partial: any): Promise<AEJob> =>
      fetch(`${API_BASE}/argentina-empleos/jobs/${id}`, {
        method: 'PATCH',
        headers: getHeaders(userId),
        body: JSON.stringify(partial),
      }).then(handleResponse),

    apply: (jobId: string, userId: string, message: string): Promise<any> =>
      fetch(`${API_BASE}/argentina-empleos/jobs/${jobId}/apply`, {
        method: 'POST',
        headers: getHeaders(userId),
        body: JSON.stringify({ message }),
      }).then(handleResponse),

    getApplications: (jobId: string, userId: string): Promise<any[]> =>
      fetch(`${API_BASE}/argentina-empleos/jobs/${jobId}/applications`, {
        method: 'GET',
        headers: getHeaders(userId),
      }).then(handleResponse),

    deleteJob: (id: string, userId: string): Promise<{ success: boolean }> =>
      fetch(`${API_BASE}/argentina-empleos/jobs/${id}`, {
        method: 'DELETE',
        headers: getHeaders(userId),
      }).then(handleResponse),
  },

  wallet: {
    getMyWallet: (userId: string): Promise<{
      wallet: AEWallet;
      transactions: AEWalletTransaction[];
      withdrawals: AEWithdrawal[];
    }> =>
      fetch(`${API_BASE}/argentina-empleos/wallet`, {
        method: 'GET',
        headers: getHeaders(userId),
      }).then(handleResponse),

    requestWithdrawal: (
      userId: string,
      payload: {
        amount: number;
        method: 'Mercado Pago' | 'Transferencia Bancaria';
        destinationAccount: string;
      },
    ): Promise<AEWithdrawal> =>
      fetch(`${API_BASE}/argentina-empleos/wallet/withdraw`, {
        method: 'POST',
        headers: getHeaders(userId),
        body: JSON.stringify(payload),
      }).then(handleResponse),

    linkMercadoPago: (
      userId: string,
      account: string,
      email?: string,
    ): Promise<AEWallet> =>
      fetch(`${API_BASE}/argentina-empleos/wallet/link-mp`, {
        method: 'POST',
        headers: getHeaders(userId),
        body: JSON.stringify({ account, email }),
      }).then(handleResponse),

    unlinkMercadoPago: (userId: string): Promise<AEWallet> =>
      fetch(`${API_BASE}/argentina-empleos/wallet/unlink-mp`, {
        method: 'POST',
        headers: getHeaders(userId),
      }).then(handleResponse),

    buyCreditsPreference: (
      userId: string,
      paidAmountArs: number,
    ): Promise<{ preferenceId: string; initPoint: string; paidAmountArs: number; creditsToReceive: number }> =>
      fetch(`${API_BASE}/argentina-empleos/wallet/buy-credits-preference`, {
        method: 'POST',
        headers: getHeaders(userId),
        body: JSON.stringify({ paidAmountArs }),
      }).then(handleResponse),

    confirmPurchase: (
      userId: string,
      payload: { paidAmountArs: number; paymentId?: string },
    ): Promise<{ wallet: AEWallet; transaction: AEWalletTransaction }> =>
      fetch(`${API_BASE}/argentina-empleos/wallet/confirm-purchase`, {
        method: 'POST',
        headers: getHeaders(userId),
        body: JSON.stringify(payload),
      }).then(handleResponse),
  },

  admin: {
    getDashboard: (adminId: string): Promise<AdminDashboardMetrics> =>
      fetch(`${API_BASE}/argentina-empleos/admin/dashboard`, {
        method: 'GET',
        headers: getHeaders(adminId),
      }).then(handleResponse),

    listUsers: (
      adminId: string,
      filters?: { provinceId?: string; cityId?: string; query?: string },
    ): Promise<Array<AEUser & { wallet?: AEWallet }>> => {
      const sp = new URLSearchParams();
      if (filters?.provinceId) sp.append('provinceId', filters.provinceId);
      if (filters?.cityId) sp.append('cityId', filters.cityId);
      if (filters?.query) sp.append('query', filters.query);

      return fetch(`${API_BASE}/argentina-empleos/admin/users?${sp.toString()}`, {
        method: 'GET',
        headers: getHeaders(adminId),
      }).then(handleResponse);
    },

    toggleBlockUser: (adminId: string, targetUserId: string, isBlocked: boolean) =>
      fetch(`${API_BASE}/argentina-empleos/admin/users/${targetUserId}/block`, {
        method: 'PATCH',
        headers: getHeaders(adminId),
        body: JSON.stringify({ isBlocked }),
      }).then(handleResponse),

    listAllJobs: (adminId: string): Promise<AEJob[]> =>
      fetch(`${API_BASE}/argentina-empleos/admin/jobs`, {
        method: 'GET',
        headers: getHeaders(adminId),
      }).then(handleResponse),

    generateAIJob: (adminId: string, prompt: string) =>
      fetch(`${API_BASE}/argentina-empleos/admin/ai/generate`, {
        method: 'POST',
        headers: getHeaders(adminId),
        body: JSON.stringify({ prompt }),
      }).then(handleResponse),

    publishAIJob: (adminId: string, payload: any) =>
      fetch(`${API_BASE}/argentina-empleos/admin/ai/publish`, {
        method: 'POST',
        headers: getHeaders(adminId),
        body: JSON.stringify(payload),
      }).then(handleResponse),

    grantCredits: (
      adminId: string,
      payload: { targetUserId: string; amount: number; reason: string },
    ) =>
      fetch(`${API_BASE}/argentina-empleos/admin/wallet/grant-credits`, {
        method: 'POST',
        headers: getHeaders(adminId),
        body: JSON.stringify(payload),
      }).then(handleResponse),

    moderateWithdrawal: (
      adminId: string,
      withdrawalId: string,
      payload: { status: string; adminNotes?: string },
    ) =>
      fetch(`${API_BASE}/argentina-empleos/admin/withdrawals/${withdrawalId}/moderate`, {
        method: 'PATCH',
        headers: getHeaders(adminId),
        body: JSON.stringify(payload),
      }).then(handleResponse),

    getAuditLogs: (adminId: string): Promise<AEAdminLog[]> =>
      fetch(`${API_BASE}/argentina-empleos/admin/audit-logs`, {
        method: 'GET',
        headers: getHeaders(adminId),
      }).then(handleResponse),
  },
};

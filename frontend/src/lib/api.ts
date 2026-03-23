const API_BASE = import.meta.env.VITE_API_URL || "";

class ApiClient {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem("token");
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem("token", token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...((options.headers as Record<string, string>) || {}),
    };

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });

    if (res.status === 401) {
      this.clearToken();
      window.location.href = "/login";
      throw new Error("Unauthorized");
    }

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.detail || `API error: ${res.status}`);
    }

    if (res.status === 204) return {} as T;
    return res.json();
  }

  // Auth
  sendOTP(phone: string) {
    return this.request("/api/v1/auth/otp/send", {
      method: "POST",
      body: JSON.stringify({ phone }),
    });
  }

  verifyOTP(phone: string, code: string) {
    return this.request<{
      access_token: string;
      user_id: string;
      role: string;
      name: string;
    }>("/api/v1/auth/otp/verify", {
      method: "POST",
      body: JSON.stringify({ phone, code }),
    });
  }

  // Properties
  listProperties(status?: string) {
    const params = status ? `?status=${status}` : "";
    return this.request<Property[]>(`/api/v1/properties/${params}`);
  }

  createProperty(data: Partial<Property>) {
    return this.request<Property>("/api/v1/properties/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  updateProperty(id: string, data: Partial<Property>) {
    return this.request<Property>(`/api/v1/properties/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  // Tasks
  listTasks(params?: {
    scheduled_date?: string;
    status?: string;
    property_id?: string;
  }) {
    const searchParams = new URLSearchParams();
    if (params?.scheduled_date) searchParams.set("scheduled_date", params.scheduled_date);
    if (params?.status) searchParams.set("status", params.status);
    if (params?.property_id) searchParams.set("property_id", params.property_id);
    const qs = searchParams.toString();
    return this.request<Task[]>(`/api/v1/tasks/${qs ? `?${qs}` : ""}`);
  }

  getTask(id: string) {
    return this.request<Task>(`/api/v1/tasks/${id}`);
  }

  createTask(data: {
    property_id: string;
    name: string;
    scheduled_date: string;
    scheduled_time?: string;
    notes?: string;
    assignee_ids?: string[];
  }) {
    return this.request<Task>("/api/v1/tasks/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  updateTaskStatus(taskId: string, status: string) {
    return this.request<Task>(`/api/v1/tasks/${taskId}/status`, {
      method: "POST",
      body: JSON.stringify({ status }),
    });
  }

  respondToAssignment(taskId: string, assignmentId: string, status: string) {
    return this.request(`/api/v1/tasks/${taskId}/assignments/${assignmentId}/respond`, {
      method: "POST",
      body: JSON.stringify({ status }),
    });
  }

  // Photos
  getUploadUrl(data: {
    task_id: string;
    filename: string;
    category?: string;
    checklist_item?: string;
  }) {
    return this.request<{
      upload_url: string;
      photo_id: string;
      r2_key: string;
    }>("/api/v1/photos/upload-url", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  listTaskPhotos(taskId: string) {
    return this.request<Photo[]>(`/api/v1/photos/task/${taskId}`);
  }

  async uploadPhoto(
    taskId: string,
    file: File,
    category?: string,
  ): Promise<{ photo_id: string }> {
    // Get presigned URL
    const { upload_url, photo_id } = await this.getUploadUrl({
      task_id: taskId,
      filename: file.name,
      category,
    });

    // Upload directly to R2
    await fetch(upload_url, {
      method: "PUT",
      body: file,
      headers: { "Content-Type": file.type || "image/jpeg" },
    });

    return { photo_id };
  }

  // Admin
  listUsers(role?: string) {
    const params = role ? `?role=${role}` : "";
    return this.request<User[]>(`/api/v1/admin/users${params}`);
  }

  createUser(data: { name: string; phone?: string; role?: string; language?: string }) {
    return this.request<User>("/api/v1/admin/users", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }
}

// Types
export interface Property {
  id: string;
  name: string;
  address: string | null;
  suburb: string | null;
  beds: number | null;
  baths: number | null;
  property_type: string | null;
  owner_name: string | null;
  owner_email: string | null;
  owner_phone: string | null;
  notes: string | null;
  status: string;
  breezeway_id: string | null;
  created_at: string;
}

export interface Assignment {
  id: string;
  user_id: string;
  user_name: string | null;
  status: string;
  responded_at: string | null;
}

export interface Task {
  id: string;
  property_id: string;
  property_name: string | null;
  name: string;
  status: string;
  scheduled_date: string;
  scheduled_time: string | null;
  started_at: string | null;
  completed_at: string | null;
  notes: string | null;
  report_url: string | null;
  assignments: Assignment[];
  photo_count: number;
  created_at: string;
  updated_at: string;
}

export interface Photo {
  id: string;
  task_id: string;
  user_id: string;
  category: string | null;
  checklist_item: string | null;
  caption: string | null;
  url: string;
  thumbnail_url: string | null;
  uploaded_at: string;
}

export interface User {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  role: string;
  language: string;
  is_active: boolean;
}

export const api = new ApiClient();

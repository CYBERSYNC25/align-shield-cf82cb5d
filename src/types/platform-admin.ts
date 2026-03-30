export interface PlatformAdmin {
  id: string;
  user_id: string;
  name: string;
  email: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PlatformAdminGroup {
  id: string;
  name: string;
  description: string | null;
  permissions: string[];
  created_at: string;
  updated_at: string;
}

export interface PlatformAdminGroupMember {
  id: string;
  admin_id: string;
  group_id: string;
  created_at: string;
}

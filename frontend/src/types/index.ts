export interface User {
  id: string
  email: string
  full_name: string
  role: 'SUPER_ADMIN' | 'OFFICE_ADMIN' | 'OPERATOR' | 'STAFF'
  organization_id: string | null
  is_active: boolean
}

export interface LoginResponse {
  access_token: string
  refresh_token: string
  token_type: string
  user: User
}

export interface Organization {
  id: string
  name: string
  code: string
  org_type: string
  status: string
  state_id: string | null
  district_id: string | null
  block_id: string | null
  created_at: string
}

export interface OtpMessage {
  id: string
  organization_id: string
  staff_id: string
  sender_text: string
  service_name: string | null
  otp_display: string | null
  otp_length: number | null
  purpose: string | null
  reference_number: string | null
  status: string
  expiry_at: string | null
  received_at: string
  routed_at: string | null
  delivered_at: string | null
  viewed_at: string | null
  used_at: string | null
}

export interface Staff {
  id: string
  user_id: string
  organization_id: string
  staff_id_number: string | null
  full_name: string
  mobile_number: string
  designation: string | null
  department_id: string | null
  is_active: boolean
  profile_completed: boolean
  created_at: string
}

export interface Operator {
  id: string
  user_id: string
  organization_id: string
  full_name: string
  is_active: boolean
  created_at: string
}

export interface DashboardMetrics {
  total_organizations?: number
  active_organizations?: number
  trial_organizations?: number
  expired_suspended_organizations?: number
  total_staff?: number
  total_operators?: number
  total_devices?: number
  active_devices?: number
  otps_today?: number
  otps_this_month?: number
  pending_otps?: number
  used_otps?: number
  failed_otps?: number
}

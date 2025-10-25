/**
 * Enhanced Security Type Definitions
 * Provides comprehensive security features including 2FA, audit logs, and session management
 */

// ============================================================================
// AUTHENTICATION SECURITY
// ============================================================================

export interface SecuritySettings {
  id: string;
  tenantId: string;
  passwordPolicy: PasswordPolicy;
  mfaSettings: MFASettings;
  sessionSettings: SessionSettings;
  ipWhitelist?: string[];
  ipBlacklist?: string[];
  rateLimiting: RateLimitSettings;
  auditSettings: AuditSettings;
  encryptionSettings: EncryptionSettings;
  complianceSettings: ComplianceSettings;
  updatedAt: string;
  updatedBy: string;
}

// ============================================================================
// PASSWORD POLICY
// ============================================================================

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  preventCommonPasswords: boolean;
  preventPasswordReuse: number; // Number of previous passwords to check
  expiryDays?: number; // Password expiration in days
  lockoutAttempts: number; // Failed login attempts before lockout
  lockoutDuration: number; // Lockout duration in minutes
  requireChangeOnFirstLogin: boolean;
  minimumAge: number; // Minimum time before password can be changed again (hours)
}

// ============================================================================
// MULTI-FACTOR AUTHENTICATION (MFA)
// ============================================================================

export interface MFASettings {
  enabled: boolean;
  required: boolean; // Enforce for all users
  requiredForRoles?: string[]; // Roles that must use MFA
  methods: MFAMethod[];
  gracePeriod?: number; // Days before MFA becomes mandatory
  backupCodes: boolean;
  rememberDevice: boolean;
  rememberDeviceDuration: number; // Days
}

export type MFAMethod = 'totp' | 'sms' | 'email' | 'authenticator' | 'hardware_key' | 'biometric';

export interface MFAConfiguration {
  userId: string;
  method: MFAMethod;
  verified: boolean;
  secret?: string; // For TOTP
  phoneNumber?: string; // For SMS
  backupCodes?: string[];
  deviceFingerprints?: string[]; // Remembered devices
  createdAt: string;
  lastUsedAt?: string;
}

export interface MFAChallenge {
  id: string;
  userId: string;
  method: MFAMethod;
  code?: string; // For verification
  expiresAt: string;
  attempts: number;
  verified: boolean;
  createdAt: string;
}

// ============================================================================
// SESSION MANAGEMENT
// ============================================================================

export interface SessionSettings {
  maxConcurrentSessions: number;
  sessionTimeout: number; // Idle timeout in minutes
  absoluteTimeout: number; // Maximum session duration in hours
  refreshTokenExpiry: number; // Days
  requireReauthForSensitive: boolean;
  logoutOnPasswordChange: boolean;
  secureCookies: boolean;
  sameSiteCookies: 'strict' | 'lax' | 'none';
}

export interface UserSession {
  id: string;
  userId: string;
  deviceId: string;
  deviceInfo: DeviceInfo;
  ipAddress: string;
  location?: GeoLocation;
  userAgent: string;
  isActive: boolean;
  createdAt: string;
  lastActivity: string;
  expiresAt: string;
  mfaVerified: boolean;
  refreshToken?: string;
  fingerprint: string;
}

export interface DeviceInfo {
  type: 'desktop' | 'mobile' | 'tablet';
  os: string;
  osVersion: string;
  browser: string;
  browserVersion: string;
  screenResolution: string;
  timezone: string;
  language: string;
}

export interface GeoLocation {
  country: string;
  region: string;
  city: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
}

// ============================================================================
// RATE LIMITING
// ============================================================================

export interface RateLimitSettings {
  enabled: boolean;
  loginAttempts: RateLimitRule;
  apiCalls: RateLimitRule;
  passwordReset: RateLimitRule;
  dataExport: RateLimitRule;
  customRules?: Record<string, RateLimitRule>;
}

export interface RateLimitRule {
  maxAttempts: number;
  windowSeconds: number; // Time window in seconds
  blockDuration: number; // Block duration in seconds after limit exceeded
  scope: 'ip' | 'user' | 'both';
}

export interface RateLimitEntry {
  key: string; // IP or user ID
  attempts: number;
  firstAttempt: string;
  lastAttempt: string;
  blockedUntil?: string;
}

// ============================================================================
// AUDIT LOGGING
// ============================================================================

export interface AuditSettings {
  enabled: boolean;
  retentionDays: number;
  logLevel: 'minimal' | 'standard' | 'detailed' | 'comprehensive';
  loggedActions: AuditAction[];
  alertThresholds?: AuditAlertThreshold[];
  exportEnabled: boolean;
  realTimeMonitoring: boolean;
}

export type AuditAction = 
  | 'login' 
  | 'logout' 
  | 'login_failed'
  | 'password_change'
  | 'password_reset'
  | 'mfa_enabled'
  | 'mfa_disabled'
  | 'permission_change'
  | 'role_change'
  | 'user_created'
  | 'user_deleted'
  | 'user_updated'
  | 'sensitive_data_access'
  | 'data_export'
  | 'data_import'
  | 'settings_change'
  | 'security_violation'
  | 'suspicious_activity';

export interface AuditLog {
  id: string;
  tenantId: string;
  userId: string;
  userEmail: string;
  userName: string;
  action: AuditAction;
  resource: string;
  resourceId?: string;
  description: string;
  metadata?: Record<string, any>;
  changes?: AuditChange[];
  severity: 'info' | 'warning' | 'error' | 'critical';
  ipAddress: string;
  userAgent: string;
  location?: GeoLocation;
  sessionId?: string;
  success: boolean;
  errorMessage?: string;
  duration?: number; // milliseconds
  timestamp: string;
}

export interface AuditChange {
  field: string;
  oldValue: any;
  newValue: any;
  sensitive: boolean;
}

export interface AuditAlertThreshold {
  action: AuditAction;
  threshold: number;
  window: number; // Time window in minutes
  severity: 'warning' | 'critical';
  notifyUsers: string[];
}

// ============================================================================
// DATA ENCRYPTION
// ============================================================================

export interface EncryptionSettings {
  dataAtRest: boolean;
  dataInTransit: boolean;
  algorithm: 'AES-256-GCM' | 'AES-256-CBC' | 'ChaCha20-Poly1305';
  keyRotationDays: number;
  encryptedFields: string[]; // Fields that must be encrypted
  piiEncryption: boolean;
  backupEncryption: boolean;
}

export interface EncryptionKey {
  id: string;
  version: number;
  algorithm: string;
  key: string; // Encrypted key
  createdAt: string;
  expiresAt: string;
  isActive: boolean;
  rotatedFrom?: string;
}

// ============================================================================
// SECURITY INCIDENTS
// ============================================================================

export interface SecurityIncident {
  id: string;
  type: SecurityIncidentType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  affectedUsers: string[];
  affectedResources: string[];
  detectedAt: string;
  detectedBy: 'system' | 'user';
  status: 'open' | 'investigating' | 'mitigated' | 'resolved' | 'false_positive';
  assignedTo?: string;
  actions: SecurityAction[];
  indicators: Record<string, any>;
  resolution?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type SecurityIncidentType =
  | 'brute_force_attack'
  | 'unauthorized_access'
  | 'data_breach'
  | 'privilege_escalation'
  | 'suspicious_login'
  | 'anomalous_activity'
  | 'malware_detected'
  | 'ddos_attack'
  | 'sql_injection'
  | 'xss_attack'
  | 'csrf_attack'
  | 'session_hijacking'
  | 'data_exfiltration'
  | 'configuration_tampering';

export interface SecurityAction {
  id: string;
  type: 'block_ip' | 'disable_user' | 'revoke_session' | 'alert_admin' | 'log_event' | 'quarantine';
  description: string;
  automated: boolean;
  executedAt: string;
  executedBy: string;
  success: boolean;
  result?: string;
}

// ============================================================================
// COMPLIANCE & REGULATIONS
// ============================================================================

export interface ComplianceSettings {
  standards: ComplianceStandard[];
  dataResidency: string; // Country code
  dataRetentionPolicies: DataRetentionPolicy[];
  rightToErasure: boolean; // GDPR
  dataPortability: boolean; // GDPR
  consentManagement: boolean;
  privacyPolicy: string;
  termsOfService: string;
  lastAuditDate?: string;
  nextAuditDate?: string;
  certifications: string[];
}

export type ComplianceStandard = 
  | 'GDPR'      // General Data Protection Regulation (EU)
  | 'CCPA'      // California Consumer Privacy Act
  | 'HIPAA'     // Health Insurance Portability and Accountability Act
  | 'SOC2'      // Service Organization Control 2
  | 'ISO27001'  // Information Security Management
  | 'PCI-DSS'   // Payment Card Industry Data Security Standard
  | 'NIST'      // National Institute of Standards and Technology
  | 'SOX';      // Sarbanes-Oxley Act

export interface DataRetentionPolicy {
  dataType: string;
  retentionPeriod: number; // Days
  deletionMethod: 'soft_delete' | 'hard_delete' | 'anonymize';
  archiveBeforeDelete: boolean;
  exceptions?: string[];
}

// ============================================================================
// IP MANAGEMENT
// ============================================================================

export interface IPAccessRule {
  id: string;
  ipAddress: string;
  ipRange?: string; // CIDR notation
  type: 'whitelist' | 'blacklist';
  reason: string;
  appliesTo: 'all' | 'roles' | 'users';
  targetRoles?: string[];
  targetUsers?: string[];
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  expiresAt?: string;
}

// ============================================================================
// SECURITY ALERTS
// ============================================================================

export interface SecurityAlert {
  id: string;
  type: SecurityAlertType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  affectedUsers: string[];
  indicators: Record<string, any>;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  createdAt: string;
  expiresAt?: string;
}

export type SecurityAlertType =
  | 'anomalous_login'
  | 'multiple_failed_attempts'
  | 'new_device_login'
  | 'unusual_location'
  | 'unusual_time'
  | 'permission_escalation'
  | 'mass_data_access'
  | 'suspicious_api_usage'
  | 'policy_violation';



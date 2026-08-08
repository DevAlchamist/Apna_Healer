export type UserRole = "ADMIN" | "USER" | "THERAPIST" | "LISTENER";
export type ProfessionalApplicationStatusValue = "PENDING" | "APPROVED" | "REJECTED";
export type ApplicationTypeValue = "THERAPIST" | "LISTENER";
export type ProviderRoleValue = "THERAPIST" | "LISTENER";
export type TransactionTypeValue = "CREDIT" | "DEBIT" | "REFUND" | "SESSION_PAYMENT" | "PAYOUT";
export type TransactionStatusValue = "PENDING" | "SUCCESS" | "FAILED";
export type BookingStatusValue =
  | "PENDING"
  | "ACCEPTED"
  | "REJECTED"
  | "CANCELLED"
  | "COMPLETED";
export type BookingTypeValue = "THERAPIST" | "LISTENER";
export type BookingPaymentMethodValue = "WALLET" | "QR" | "CARD";
export type CareSessionStatusValue =
  | "UPCOMING"
  | "ONGOING"
  | "COMPLETED"
  | "MISSED"
  | "CANCELLED";

export type NotificationTypeValue =
  | "APPLICATION_APPROVED"
  | "APPLICATION_REJECTED"
  | "BOOKING_ACCEPTED"
  | "BOOKING_REJECTED"
  | "BOOKING_CANCELLED"
  | "LISTENER_REQUEST_ASSIGNED"
  | "LISTENER_REQUEST_APPROVED"
  | "LISTENER_REQUEST_DECLINED"
  | "SESSION_STARTED"
  | "SESSION_COMPLETED"
  | "SESSION_CANCELLED"
  | "SESSION_MISSED"
  | "WALLET_CREDIT"
  | "WALLET_DEBIT"
  | "ADMIN_USER_UPDATED"
  | "JOURNAL_REMINDER"
  | "CLUB_CREATION_APPROVED"
  | "CLUB_CREATION_REJECTED"
  | "CLUB_JOIN_REQUEST_RECEIVED"
  | "CLUB_JOIN_APPROVED"
  | "CLUB_JOIN_REJECTED"
  | "CLUB_SUBSCRIPTION_CHARGED"
  | "CLUB_SUBSCRIPTION_FAILED"
  | "CLUB_MEMBER_PAYMENT_OVERDUE"
  | "EVENT_REGISTRATION_CONFIRMED"
  | "EVENT_REGISTRATION_RECEIVED"
  | "EVENT_REGISTRATION_CANCELLED"
  | "EVENT_CANCELLED"
  | "WELCOME"
  | "WELCOME_BACK"
  | "SESSION_REMINDER_24H"
  | "SESSION_REMINDER_1H"
  | "SESSION_FEEDBACK_REQUEST"
  | "BLOG_COMMENT_RECEIVED"
  | "CLUB_ACTIVITY_DIGEST"
  | "MONTHLY_RECAP";

export type EventStatusValue = "DRAFT" | "PUBLISHED" | "CANCELLED" | "COMPLETED";
export type EventModeValue = "VIRTUAL" | "IN_PERSON";
export type EventRegistrationStatusValue = "PENDING" | "CONFIRMED" | "CANCELLED" | "REFUNDED";

export interface ApiEventRegistration {
  id: string;
  status: EventRegistrationStatusValue;
  amountCharged: string;
  createdAt: string;
}

export interface ApiEventSummary {
  id: string;
  slug: string;
  clubId: string | null;
  clubSlug: string | null;
  clubTitle: string | null;
  title: string;
  subtitle: string | null;
  host: string;
  excerpt: string;
  heroImageUrl: string | null;
  category: string;
  startsAt: string;
  dateLabel: string;
  timeLabel: string;
  venue: string | null;
  mode: EventModeValue;
  capacity: number;
  seatsRemaining: number;
  basePrice: string;
  priceForMe: number;
  membersPay: boolean;
  nonMembersPay: boolean;
  status: EventStatusValue;
  isRegistered: boolean;
  canManage: boolean;
}

export interface ApiEventDetail extends ApiEventSummary {
  description: string | null;
  endsAt: string | null;
  memberPrice: string | null;
  guestPrice: string | null;
  facilitatorName: string | null;
  facilitatorRole: string | null;
  facilitatorImage: string | null;
  facilitatorBio: string | null;
  journeyPoints: string[];
  audienceText: string | null;
  testimonialQuote: string | null;
  testimonialAuthor: string | null;
  organizedByUserId: string;
  myRegistration: ApiEventRegistration | null;
  completedImages?: string[];
  completedVideos?: string[];
}

export interface ApiEventFacilitatorOption {
  id: string;
  type: "apna-healer" | "club-owner";
  label: string;
  name: string;
  role: string;
  imageUrl: string | null;
  clubTitles: string[];
}

export interface ApiEventListResponse {
  items: ApiEventSummary[];
  meta: { total: number; take: number; nextCursor: string | null };
}

export interface ApiEventRegistrationRow {
  id: string;
  eventId: string;
  userId: string;
  amountCharged: string;
  paymentMethod: string | null;
  status: EventRegistrationStatusValue;
  isClubMemberAtBooking: boolean;
  note: string | null;
  createdAt: string;
  user?: { id: string; name: string | null; email: string; image?: string | null };
  event?: { id: string; slug: string; title: string; club?: { id: string; title: string; slug: string } | null };
}

export type ClubStatusValue = "DRAFT" | "ACTIVE" | "ARCHIVED";
export type ClubVisibilityValue = "PUBLIC" | "PRIVATE";
export type ClubRequestStatusValue = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
export type ClubMembershipRoleValue = "OWNER" | "MODERATOR" | "MEMBER";
export type ClubMembershipStatusValue = "ACTIVE" | "PAST_DUE" | "SUSPENDED" | "LEFT";

export interface ApiClubOnboardingQuestion {
  id: string;
  question: string;
  required: boolean;
  sortOrder: number;
  type: "TEXT" | "CHOICE";
  options: string[];
  allowMultiple: boolean;
}

export interface ApiClubOnboardingStep {
  id: string;
  title: string;
  description: string | null;
  sortOrder: number;
  questions: ApiClubOnboardingQuestion[];
}

export interface ApiClubOnboardingAnswerStep {
  stepTitle: string;
  stepDescription?: string | null;
  questions: Array<{
    questionId: string;
    question: string;
    answer: string | string[];
  }>;
}

export interface ApiClubReview {
  id: string;
  authorLabel: string;
  quote: string;
  memberSince: string | null;
  rating: number | null;
  sortOrder: number;
}

export interface ApiClubMembershipSummary {
  id: string;
  role: ClubMembershipRoleValue;
  status: ClubMembershipStatusValue;
  joinedAt: string;
  nextBillingAt: string | null;
}

export interface ApiClubSummary {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  heroImageUrl: string | null;
  monthlyFee: string;
  memberCount: number;
  memberCountLabel: string;
  sphere: string;
  visibility: ClubVisibilityValue;
  status: ClubStatusValue;
  isMember: boolean;
  hasPendingJoin: boolean;
  ownerUserId: string | null;
}

export interface ApiClubDetail extends ApiClubSummary {
  description: string | null;
  purpose: string | null;
  galleryUrls: string[];
  heroTagline: string | null;
  pulseQuote: string | null;
  ritualsIntro: string | null;
  voicesQuote: string | null;
  finalCtaText: string | null;
  landingFeatures: Array<{ title: string; description: string; icon?: "wind" | "leaf" }>;
  landingRituals: Array<{
    label: string;
    title: string;
    description: string;
    imageUrl?: string | null;
    cta?: string | null;
  }>;
  onboardingSteps: ApiClubOnboardingStep[];
  reviews: ApiClubReview[];
  membership: ApiClubMembershipSummary | null;
  isOwner: boolean;
  canManageJoinRequests: boolean;
  canPublishEvents: boolean;
  /** Populated on admin club list */
  eventCount?: number;
}

export interface ApiPublicClubEvent {
  slug: string;
  title: string;
  description: string;
  host: string;
  tag: string;
  image: string;
  startsAt: string;
  seatsRemaining: number;
  mode: string;
}

export interface ApiPublicClubDetail extends ApiClubDetail {
  events: ApiPublicClubEvent[];
  weeklyEventsLabel: string;
}

export interface ApiClubListResponse {
  items: ApiClubSummary[];
  meta: { total: number; take: number; nextCursor: string | null };
}

export interface ApiClubJoinRequest {
  id: string;
  clubId: string;
  userId: string;
  message: string;
  status: ClubRequestStatusValue;
  createdAt: string;
  user?: { id: string; name: string | null; email: string; image?: string | null };
  club?: { id: string; title: string; slug: string };
}

export interface ApiClubCreationRequestOnboardingQuestion {
  question: string;
  required: boolean;
  sortOrder: number;
  type: "TEXT" | "CHOICE";
  options: string[];
  allowMultiple: boolean;
}

export interface ApiClubCreationRequestOnboardingStep {
  title: string;
  description: string | null;
  sortOrder: number;
  questions: ApiClubCreationRequestOnboardingQuestion[];
}

export interface ApiClubCreationRequestReview {
  authorLabel: string;
  quote: string;
  sortOrder: number;
}

export interface ApiClubCreationRequest {
  id: string;
  userId: string;
  status: ClubRequestStatusValue;
  title: string;
  subtitle: string;
  description: string | null;
  purpose: string | null;
  heroImageUrl: string | null;
  galleryUrls: string[];
  reviews: ApiClubCreationRequestReview[];
  monthlyFee: string;
  onboardingSteps: ApiClubCreationRequestOnboardingStep[];
  onboardingStepCount: number;
  onboardingQuestionCount: number;
  createdAt: string;
  createdClubId: string | null;
  adminNote: string | null;
  user?: { id: string; name: string | null; email: string; image?: string | null };
  createdClub?: { id: string; slug: string; title: string } | null;
}

export type JournalEntryStatusValue = "DRAFT" | "COMPLETED";
export type JournalCardVariantValue =
  | "REFLECTION"
  | "IMAGE"
  | "QUOTE"
  | "LIST"
  | "DARK";

export interface ApiJournalEntry {
  id: string;
  journalDateKey: string;
  title: string | null;
  contentHtml: string;
  excerpt: string;
  mood: string | null;
  tags: string[];
  coverImageUrl: string | null;
  cardVariant: JournalCardVariantValue;
  status: JournalEntryStatusValue;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApiJournalStreak {
  currentStreak: number;
  longestStreak: number;
  todayCompleted: boolean;
  todayDateKey: string;
}

export interface ApiJournalTodayPayload {
  entry: ApiJournalEntry | null;
  streak: ApiJournalStreak;
  journalDateKey: string;
}

export interface ApiJournalListMeta {
  total: number;
  take: number;
  cursor: string | null;
  nextCursor: string | null;
}

export interface ApiJournalListResponse {
  items: ApiJournalEntry[];
  meta: ApiJournalListMeta;
}

export interface ApiJournalCompleteResponse {
  entry: ApiJournalEntry;
  streak: ApiJournalStreak;
  isNewCompletion: boolean;
}

export type AuditActionValue =
  | "USER_UPDATED_BY_ADMIN"
  | "APPLICATION_REVIEWED"
  | "BOOKING_STATUS_CHANGED"
  | "SESSION_STATUS_CHANGED"
  | "LISTENER_REQUEST_UPDATED"
  | "WALLET_TRANSACTION"
  | "CLUB_CREATED"
  | "CLUB_UPDATED"
  | "CLUB_CREATION_REVIEWED"
  | "CLUB_JOIN_REVIEWED"
  | "CLUB_MEMBERSHIP_BILLING"
  | "EVENT_CREATED"
  | "EVENT_UPDATED"
  | "EVENT_REGISTRATION_CREATED"
  | "ROLE_THEME_UPDATED"
  | "ROLE_THEME_RESET"
  | "BLOG_CREATED"
  | "BLOG_UPDATED"
  | "BLOG_PUBLISHED"
  | "BLOG_APPROVED"
  | "BLOG_REJECTED"
  | "BLOG_UNPUBLISHED"
  | "BLOG_DELETED"
  | "BLOG_FEATURED"
  | "BLOG_COMMENT_MODERATED"
  | "BLOG_REPORT_REVIEWED";

export type ApiMetadata = Record<string, unknown> | null;

export interface ApiRoleTheme {
  role: UserRole;
  tokens: Record<string, string>;
  version: number;
  isCustomized: boolean;
  updatedAt: string;
  updatedById: string | null;
}

export type ApiRoleThemeMap = Record<UserRole, ApiRoleTheme>;

export interface ApiNotification {
  id: string;
  userId: string;
  type: NotificationTypeValue;
  title: string;
  body: string;
  href: string | null;
  readAt: string | null;
  emailSentAt: string | null;
  metadata: ApiMetadata;
  createdAt: string;
}

export interface ApiNotificationsListMeta {
  unreadCount: number;
  take: number;
  cursor: string | null;
  nextCursor: string | null;
}

export interface ApiNotificationsListResponse {
  items: ApiNotification[];
  meta: ApiNotificationsListMeta;
}

export interface ApiAuditLogEntry {
  id: string;
  action: AuditActionValue;
  actorId: string | null;
  actorEmail: string | null;
  actorName: string | null;
  actorRole: UserRole | null;
  actorImage: string | null;
  targetType: string;
  targetId: string;
  summary: string;
  entityLabel: string;
  status: "success" | "failed";
  ipAddress: string;
  details: ApiMetadata;
  createdAt: string;
}

export interface ApiAuditLogListMeta {
  take: number;
  page: number;
  total: number;
  totalPages: number;
  cursor: string | null;
  nextCursor: string | null;
}

export interface ApiAuditLogListResponse {
  items: ApiAuditLogEntry[];
  meta: ApiAuditLogListMeta;
}

export interface ApiPublicStats {
  totalMembers: number;
  verifiedTherapists: number;
  verifiedListeners: number;
  completedSessions: number;
  activeTodayLabel: string;
}

export interface ApiPublicClubSummary {
  id: string;
  title: string;
  subtitle: string;
  heroImage: string;
  activeMembers: string;
  weeklyEvents: string;
  sphere: string;
}

export interface ApiPublicEventSummary {
  id: string;
  title: string;
  host: string;
  description: string;
  image: string;
  tag: string;
  likes: number;
  category: string;
}

export interface ApiPublicHomeBundle {
  stats: ApiPublicStats;
  featuredTherapists: ApiProvider[];
  listeners: ApiProvider[];
  upcomingEvents: ApiPublicEventSummary[];
  testimonials: string[][];
  faq: Array<{ question: string; answer: string }>;
}

export interface ApiDailyQuote {
  id: string;
  text: string;
  author: string | null;
  /** Asia/Kolkata calendar day (YYYY-MM-DD) used to pick this quote. */
  dateKey: string;
}

export interface ApiAvailabilitySlot {
  start: string;
  end: string;
  isBooked: boolean;
}

export interface ApiAvailability {
  id: string;
  providerId: string;
  date: string;
  timezone: string;
  slots: ApiAvailabilitySlot[];
  createdAt: string;
  updatedAt: string;
}

export interface ApiTransaction {
  id: string;
  walletId: string;
  userId: string;
  type: TransactionTypeValue;
  amount: string;
  status: TransactionStatusValue;
  purpose: string;
  referenceId: string | null;
  metadata: ApiMetadata;
  createdAt: string;
  user?: ApiIdentity;
}

export interface ApiWallet {
  id: string;
  userId: string;
  availableBalance: string;
  heldBalance: string;
  totalSpent: string;
  totalReceived: string;
  createdAt: string;
  updatedAt: string;
  transactions?: ApiTransaction[];
}

export interface ApiTherapistProfile {
  id: string;
  userId: string;
  bio: string | null;
  specializations: string[];
  certifications: string[];
  experienceYears: number | null;
  hourlyRate: string | null;
  availability: ApiMetadata;
  links: ApiMetadata;
  profileDescription: string | null;
  philosophyQuote: string | null;
  experienceDescription: string | null;
  testimonialQuote: string | null;
  testimonialAuthor: string | null;
  retentionRate: string | null;
  rating: string;
  totalSessions: number;
  createdAt: string;
  updatedAt: string;
}

export interface ApiListenerProfile {
  id: string;
  userId: string;
  bio: string | null;
  languages: string[];
  emotionalStrengths: string[];
  availability: ApiMetadata;
  rating: string;
  totalSessions: number;
  createdAt: string;
  updatedAt: string;
}

export interface ApiApplication {
  id: string;
  userId: string;
  type: ApplicationTypeValue;
  status: ProfessionalApplicationStatusValue;
  applicationData: ApiMetadata;
  adminNote: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
  user?: ApiUser;
}

export interface ApiIdentity {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: UserRole;
  isVerified: boolean;
}

export interface ApiProvider {
  id: string;
  name: string | null;
  image: string | null;
  role: ProviderRoleValue;
  isVerified: boolean;
  bio: string | null;
  hourlyRate: string | null;
  specializations: string[];
  languages: string[];
  sessionCount: number;
  nextAvailabilityDate: string | null;
  createdAt: string;
  updatedAt: string;
  availability?: ApiAvailability[];
}

export interface ApiPublicTherapistDetail extends ApiProvider {
  certifications: string[];
  experienceYears: number | null;
  rating: string;
  profileSessionCount: number;
  profileDescription: string | null;
  philosophyQuote: string | null;
  experienceDescription: string | null;
  testimonialQuote: string | null;
  testimonialAuthor: string | null;
  retentionRate: string | null;
}

export interface ApiBooking {
  id: string;
  userId: string;
  providerId: string;
  type: BookingTypeValue;
  requestedDate: string;
  requestedTime: string;
  duration: number;
  amount: string;
  paymentMethod: BookingPaymentMethodValue;
  note: string | null;
  status: BookingStatusValue;
  createdAt: string;
  updatedAt: string;
  user?: ApiIdentity;
  provider?: ApiIdentity;
  session?: ApiCareSession | null;
}

export interface ApiCareSession {
  id: string;
  bookingId: string | null;
  listenerRequestId?: string | null;
  userId: string;
  providerId: string;
  sessionMode: BookingTypeValue;
  amount: string;
  duration: number;
  startTime: string;
  endTime: string | null;
  meetingLink: string | null;
  description: string | null;
  notes: string | null;
  status: CareSessionStatusValue;
  createdAt: string;
  updatedAt: string;
  booking?: ApiBooking;
  user?: ApiIdentity;
  provider?: ApiIdentity;
}

export interface ApiWelcomeBonusState {
  available: boolean;
  claimed: boolean;
  amount: number;
}

export interface ApiUserProfileSessionStats {
  completedCount: number;
  totalMinutesCompleted: number;
  streakDays: number;
  reviewsGivenCount: number;
  avgRatingGiven: number | null;
}

export interface ApiUser {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: UserRole;
  walletId: string | null;
  isVerified: boolean;
  bio?: string | null;
  phone?: string | null;
  city?: string | null;
  timezone?: string | null;
  primaryFocus?: string | null;
  interestTags?: string[];
  createdAt: string;
  updatedAt: string;
  wallet?: ApiWallet | null;
  therapistProfile?: ApiTherapistProfile | null;
  listenerProfile?: ApiListenerProfile | null;
  applications?: ApiApplication[];
  welcomeBonus?: ApiWelcomeBonusState;
  profileSessionStats?: ApiUserProfileSessionStats;
  packagePurchases?: ApiPackagePurchase[];
}

export interface ApiPackagePurchaseAllocation {
  id: string;
  purchaseId: string;
  role: string;
  allocatedSessions: number;
  remainingSessions: number;
  usedSessions: number;
}

export interface ApiPackagePurchase {
  id: string;
  userId: string;
  packageId: string;
  purchaseDate: string;
  expiryDate: string | null;
  pricePaid: string;
  status: string;
  packageSnapshot: any;
  allocations: ApiPackagePurchaseAllocation[];
}

export interface AdminSessionStats {
  totalRevenue: number;
  activeSessions: number;
  pendingBookings: number;
  capacityPercent: number;
  avgDurationMinutes: number;
}

export type AdminOperationsRow =
  | {
      kind: "session";
      id: string;
      sortAt: string;
      session: ApiCareSession;
      booking: ApiBooking | null;
    }
  | {
      kind: "booking";
      id: string;
      sortAt: string;
      booking: ApiBooking;
    };

export interface AdminSessionSatisfaction {
  averageRating: number | null;
  reviewCount: number;
  weeklyBars: number[];
}

export interface AdminSessionsDashboard {
  items: AdminOperationsRow[];
  total: number;
  page: number;
  pageSize: number;
  stats: AdminSessionStats;
  satisfaction: AdminSessionSatisfaction;
  pendingCredentialingCount: number;
}

export interface AdminFinanceTransaction {
  id: string;
  displayId: string;
  walletId: string;
  userId: string;
  type: TransactionTypeValue;
  amount: string;
  status: TransactionStatusValue;
  purpose: string;
  referenceId: string | null;
  metadata: ApiMetadata;
  createdAt: string;
  method: string;
  counterpartyLabel: string;
  user?: ApiIdentity;
  counterparty?: ApiIdentity | null;
}

export interface AdminFinanceReport {
  id: string;
  status: "PENDING" | "RESOLVED";
  title: string;
  description: string;
  occurredAt: string;
  href: string;
}

export interface AdminFinanceStats {
  totalRevenue: number;
  revenueDeltaPercent: number | null;
  activeHealers: number;
  newHealersThisWeek: number;
  pendingReports: number;
}

export interface AdminFinanceDashboard {
  items: AdminFinanceTransaction[];
  total: number;
  page: number;
  pageSize: number;
  stats: AdminFinanceStats;
  chart: Array<{ earnings: number; processing: number }>;
  reports: AdminFinanceReport[];
  expenditureSummary: {
    totalWalletSpent: number;
    totalWalletHeld: number;
  };
}

export interface AdminControlCenterDashboard {
  header: { title: string; subtitle: string };
  kpis: {
    totalUsers: number;
    userGrowthPercent: number | null;
    monthlyActiveUsers: number;
    mauFillPercent: number;
    activeSessions: number;
    sessionGrowthPercent: number | null;
    sessionSparkline: number[];
    grossRevenueMonth: number;
    revenueDeltaAmount: number;
    revenueGrowthPercent: number | null;
    nextPayoutDate: string | null;
    activeQueuesTotal: number;
    queueSeverity: "healthy" | "warning" | "critical";
    queueBreakdown: { critical: number; warning: number; info: number };
  };
  needsAttention: {
    onboarding: { healers: number; listeners: number };
    flagged: { communities: number; dmReports: number };
    support: { openTickets: number; criticalBugs: number };
  };
  financial: {
    netFlow24h: number;
    pendingPayouts: number;
    refundRequests: number;
    reconciliationStatus: "verified" | "needs_review";
  };
  supplyHealth: {
    providerCoveragePercent: number;
    coverageSegments: number;
    qualityScore: number;
    qualitySegments: number;
    burnoutLabel: "Low" | "Moderate" | "High";
    burnoutHoursAvg: number;
    burnoutSegments: number;
  };
  integrations: Array<{
    id: string;
    label: string;
    percent: number;
    status: "healthy" | "warning" | "critical";
    detail: string;
  }>;
  generatedAt: string;
}

export type BlogStatusValue =
  | "DRAFT"
  | "PENDING_REVIEW"
  | "PUBLISHED"
  | "REJECTED"
  | "UNPUBLISHED";

export type BlogBlockTypeValue =
  | "HEADING"
  | "PARAGRAPH"
  | "LIST"
  | "QUOTE"
  | "CODE"
  | "DIVIDER"
  | "HIGHLIGHT"
  | "IMAGE"
  | "IMAGE_GALLERY"
  | "VIDEO_EMBED"
  | "BANNER";

export type BlogCommentStatusValue = "ACTIVE" | "HIDDEN" | "DELETED";

export type BlogReportStatusValue = "OPEN" | "REVIEWED" | "DISMISSED";

export interface ApiBlogAuthor {
  id: string;
  name: string | null;
  image: string | null;
  role: UserRole;
}

export interface ApiBlogCategory {
  id: string;
  slug: string;
  name: string;
  blogCount?: number;
}

export interface ApiBlogTag {
  id: string;
  slug: string;
  name: string;
  blogCount?: number;
}

export interface ApiBlogBlock {
  id: string;
  type: BlogBlockTypeValue;
  sortOrder: number;
  data: Record<string, unknown>;
}

export interface ApiBlogSummary {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  excerpt: string | null;
  coverImageUrl: string | null;
  status: BlogStatusValue;
  isFeatured: boolean;
  readingTimeMinutes: number;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  publishedAt: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
  author: ApiBlogAuthor;
  categories: ApiBlogCategory[];
  tags: ApiBlogTag[];
}

export interface ApiBlogDetail extends ApiBlogSummary {
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string[];
  blocks: ApiBlogBlock[];
  likedByMe?: boolean;
  related?: ApiPublicBlogSummary[];
}

export interface ApiPublicBlogSummary {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  excerpt: string | null;
  coverImageUrl: string | null;
  isFeatured: boolean;
  readingTimeMinutes: number;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  publishedAt: string | null;
  author: ApiBlogAuthor;
  categories: ApiBlogCategory[];
  tags: ApiBlogTag[];
}

export interface ApiBlogListMeta {
  total: number;
  take: number;
  cursor: string | null;
  nextCursor: string | null;
}

export interface ApiBlogListResponse {
  items: ApiBlogSummary[];
  meta: ApiBlogListMeta;
}

export interface ApiPublicBlogListResponse {
  featured: ApiPublicBlogSummary | null;
  items: ApiPublicBlogSummary[];
  meta: ApiBlogListMeta;
}

export interface ApiBlogAuthorStats {
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  publishedCount: number;
  draftCount: number;
  pendingCount: number;
}

export interface ApiBlogComment {
  id: string;
  blogId: string;
  content: string;
  status: BlogCommentStatusValue;
  createdAt: string;
  updatedAt: string;
  user: ApiBlogAuthor;
  parentId: string | null;
  replies?: ApiBlogComment[];
}

export interface ApiBlogReport {
  id: string;
  targetType: "BLOG" | "COMMENT";
  targetId: string;
  blogId: string | null;
  reason: string;
  status: BlogReportStatusValue;
  createdAt: string;
  reviewedAt: string | null;
  reviewNote: string | null;
  reporter: ApiBlogAuthor;
  blog?: { id: string; slug: string; title: string } | null;
}

export interface ApiBlogAnalyticsOverview {
  totalBlogs: number;
  publishedBlogs: number;
  pendingReview: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  topPosts: ApiPublicBlogSummary[];
  viewsTrend: Array<{ date: string; views: number }>;
}

export interface ApiBlogUploadResponse {
  url: string;
}

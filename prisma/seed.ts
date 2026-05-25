import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  ApplicationType,
  BookingStatus,
  BookingType,
  CareSessionStatus,
  Prisma,
  PrismaClient,
  ProfessionalApplicationStatus,
  Role,
  TransactionStatus,
  TransactionType,
} from "@prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required to run the Prisma seed.");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const PLATFORM_FEE_RATE = 0.15;
const TIMEZONE = "Asia/Kolkata";

type WalletSnapshot = {
  availableBalance: number;
  heldBalance: number;
  totalSpent: number;
  totalReceived: number;
};

type SeedUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  isVerified: boolean;
  walletSnapshot: WalletSnapshot;
};

const SEED_USERS: SeedUser[] = [
  {
    id: "seed-admin",
    email: "admin@apnahealer.dev",
    name: "Admin Console",
    role: Role.ADMIN,
    isVerified: true,
    walletSnapshot: zeroWallet(),
  },
  // Members
  {
    id: "seed-user-aanya",
    email: "aanya@apnahealer.dev",
    name: "Aanya Verma",
    role: Role.USER,
    isVerified: true,
    walletSnapshot: { availableBalance: 3500, heldBalance: 1500, totalSpent: 0, totalReceived: 0 },
  },
  {
    id: "seed-user-rohan",
    email: "rohan@apnahealer.dev",
    name: "Rohan Bhatt",
    role: Role.USER,
    isVerified: true,
    walletSnapshot: { availableBalance: 1900, heldBalance: 800, totalSpent: 0, totalReceived: 0 },
  },
  {
    id: "seed-user-meera",
    email: "meera@apnahealer.dev",
    name: "Meera Iyer",
    role: Role.USER,
    isVerified: true,
    walletSnapshot: { availableBalance: 3500, heldBalance: 2200, totalSpent: 1800, totalReceived: 0 },
  },
  {
    id: "seed-user-arjun",
    email: "arjun@apnahealer.dev",
    name: "Arjun Kapoor",
    role: Role.USER,
    isVerified: false,
    walletSnapshot: { availableBalance: 1500, heldBalance: 0, totalSpent: 0, totalReceived: 0 },
  },
  {
    id: "seed-user-priya",
    email: "priya@apnahealer.dev",
    name: "Priya Nair",
    role: Role.USER,
    isVerified: true,
    walletSnapshot: { availableBalance: 2500, heldBalance: 0, totalSpent: 1500, totalReceived: 0 },
  },
  {
    id: "seed-user-vikram",
    email: "vikram@apnahealer.dev",
    name: "Vikram Singh",
    role: Role.USER,
    isVerified: false,
    walletSnapshot: { availableBalance: 1500, heldBalance: 0, totalSpent: 0, totalReceived: 0 },
  },
  // Therapists
  {
    id: "seed-therapist-nira",
    email: "nira.therapist@apnahealer.dev",
    name: "Dr. Nira Sharma",
    role: Role.THERAPIST,
    isVerified: true,
    walletSnapshot: { availableBalance: 1530, heldBalance: 0, totalSpent: 0, totalReceived: 1530 },
  },
  {
    id: "seed-therapist-anand",
    email: "anand.therapist@apnahealer.dev",
    name: "Dr. Anand Mehra",
    role: Role.THERAPIST,
    isVerified: true,
    walletSnapshot: zeroWallet(),
  },
  {
    id: "seed-therapist-zara",
    email: "zara.therapist@apnahealer.dev",
    name: "Dr. Zara Khan",
    role: Role.THERAPIST,
    isVerified: true,
    walletSnapshot: { availableBalance: 1275, heldBalance: 0, totalSpent: 0, totalReceived: 1275 },
  },
  // Listeners
  {
    id: "seed-listener-kavya",
    email: "kavya.listener@apnahealer.dev",
    name: "Kavya Patel",
    role: Role.LISTENER,
    isVerified: true,
    walletSnapshot: zeroWallet(),
  },
  {
    id: "seed-listener-dev",
    email: "dev.listener@apnahealer.dev",
    name: "Dev Krishnan",
    role: Role.LISTENER,
    isVerified: true,
    walletSnapshot: zeroWallet(),
  },
  {
    id: "seed-listener-isha",
    email: "isha.listener@apnahealer.dev",
    name: "Isha Banerjee",
    role: Role.LISTENER,
    isVerified: true,
    walletSnapshot: zeroWallet(),
  },
];

function zeroWallet(): WalletSnapshot {
  return { availableBalance: 0, heldBalance: 0, totalSpent: 0, totalReceived: 0 };
}

async function seedUsersAndWallets() {
  for (const seed of SEED_USERS) {
    const user = await prisma.user.upsert({
      where: { email: seed.email },
      create: {
        id: seed.id,
        email: seed.email,
        name: seed.name,
        role: seed.role,
        isVerified: seed.isVerified,
      },
      update: {
        name: seed.name,
        role: seed.role,
        isVerified: seed.isVerified,
      },
    });

    const wallet = await prisma.wallet.upsert({
      where: { userId: user.id },
      create: { userId: user.id, ...seed.walletSnapshot },
      update: { ...seed.walletSnapshot },
    });

    if (user.walletId !== wallet.id) {
      await prisma.user.update({
        where: { id: user.id },
        data: { walletId: wallet.id },
      });
    }

    // Record a pre-claimed welcome bonus so re-seeded demo users do not
    // trigger another +100 credit on their next login. The wallet balance
    // already accounts for this in the seed snapshot.
    const existingBonus = await prisma.transaction.findFirst({
      where: {
        userId: user.id,
        type: TransactionType.CREDIT,
        purpose: "WELCOME_BONUS",
      },
      select: { id: true },
    });
    if (!existingBonus) {
      await prisma.transaction.create({
        data: {
          walletId: wallet.id,
          userId: user.id,
          type: TransactionType.CREDIT,
          amount: 100,
          status: TransactionStatus.SUCCESS,
          purpose: "WELCOME_BONUS",
          metadata: { claimed: true, seeded: true },
        },
      });
    }
  }
}

const THERAPIST_PROFILES: Array<{
  userId: string;
  bio: string;
  specializations: string[];
  hourlyRate: number;
}> = [
  {
    userId: "seed-therapist-nira",
    bio: "Trauma-informed therapist who blends somatic work with cognitive behavioural therapy.",
    specializations: ["Anxiety", "Grief", "Burnout"],
    hourlyRate: 1800,
  },
  {
    userId: "seed-therapist-anand",
    bio: "Couples and family therapist focused on attachment, communication patterns, and repair.",
    specializations: ["Couples", "Family", "Relational"],
    hourlyRate: 2200,
  },
  {
    userId: "seed-therapist-zara",
    bio: "Specialises in complex trauma and PTSD using EMDR and parts-based approaches.",
    specializations: ["Trauma", "PTSD", "Identity"],
    hourlyRate: 1500,
  },
];

const LISTENER_PROFILES: Array<{
  userId: string;
  bio: string;
  languages: string[];
}> = [
  {
    userId: "seed-listener-kavya",
    bio: "Empathetic listener trained to hold space for quiet check-ins and reflective conversations.",
    languages: ["English", "Hindi", "Marathi"],
  },
  {
    userId: "seed-listener-dev",
    bio: "Peer supporter with two years on a campus wellbeing helpline.",
    languages: ["English", "Hindi", "Tamil"],
  },
  {
    userId: "seed-listener-isha",
    bio: "Listener focused on first-generation students navigating family expectations and anxiety.",
    languages: ["English", "Hindi", "Bengali"],
  },
];

async function seedProviderProfiles() {
  for (const profile of THERAPIST_PROFILES) {
    await prisma.therapistProfile.upsert({
      where: { userId: profile.userId },
      create: profile,
      update: {
        bio: profile.bio,
        specializations: profile.specializations,
        hourlyRate: profile.hourlyRate,
      },
    });
  }

  for (const profile of LISTENER_PROFILES) {
    await prisma.listenerProfile.upsert({
      where: { userId: profile.userId },
      create: profile,
      update: {
        bio: profile.bio,
        languages: profile.languages,
      },
    });
  }
}

const LISTENER_WEEKLY_IDS = [
  "seed-listener-kavya",
  "seed-listener-dev",
  "seed-listener-isha",
] as const;

/** Weekly windows for the new listener-flow slot generator (not the legacy per-day JSON availability). */
async function seedListenerWeeklyAvailability() {
  for (const listenerId of LISTENER_WEEKLY_IDS) {
    await prisma.listenerAvailability.deleteMany({ where: { listenerId } });
    for (const dayOfWeek of [0, 1, 2, 3, 4, 5, 6]) {
      await prisma.listenerAvailability.create({
        data: {
          listenerId,
          dayOfWeek,
          startTime: "19:00",
          endTime: "21:30",
          timezone: TIMEZONE,
          isActive: true,
        },
      });
    }
  }
}

function listenerPayload(bio: string, summary: string) {
  return {
    bio,
    whyHelp: `${summary} I want to hold calm, non-judgmental space for members who feel overwhelmed.`,
    languages: ["English", "Hindi"],
    emotionalStrengths: ["Patience", "Active listening", "Grounding techniques"],
    weeklyAvailability: [{ dayOfWeek: 1, startTime: "18:00", endTime: "21:30", timezone: TIMEZONE }],
    optionalExperience: summary,
  };
}

function therapistPayload(bio: string, summary: string) {
  return {
    bio,
    specialization: "Anxiety, mood, workplace stress",
    certifications: ["RCI licensed psychologist (seed)", "Trauma-informed care (seed)"],
    yearsOfExperience: 6,
    pricing: 1800,
    weeklyAvailability: [
      { dayOfWeek: 2, startTime: "10:00", endTime: "13:00", timezone: TIMEZONE },
      { dayOfWeek: 4, startTime: "16:00", endTime: "20:00", timezone: TIMEZONE },
    ],
    documents: ["https://example.com/seed-credentials.pdf"],
    whyJoin: `${summary} I want Apna Healer to be a dependable access point for ethical mental health support.`,
    optionalLinks: ["https://example.com/seed-therapist"],
  };
}

type SeedApplication = {
  id: string;
  userId: string;
  type: ApplicationType;
  status: ProfessionalApplicationStatus;
  applicationData: Record<string, unknown>;
  reviewedBy?: string;
  reviewedAt?: Date;
};

const APPLICATIONS: SeedApplication[] = [
  {
    id: "seed-app-rohan-listener",
    userId: "seed-user-rohan",
    type: ApplicationType.LISTENER,
    status: ProfessionalApplicationStatus.PENDING,
    applicationData: listenerPayload(
      "Peer supporter exploring listener track",
      "Two years co-facilitating a campus wellbeing circle.",
    ),
  },
  {
    id: "seed-app-meera-listener",
    userId: "seed-user-meera",
    type: ApplicationType.LISTENER,
    status: ProfessionalApplicationStatus.PENDING,
    applicationData: listenerPayload(
      "Educator with crisis line training",
      "Trained on iCall hotline, 80+ supervised hours.",
    ),
  },
  {
    id: "seed-app-arjun-therapist",
    userId: "seed-user-arjun",
    type: ApplicationType.THERAPIST,
    status: ProfessionalApplicationStatus.REJECTED,
    applicationData: therapistPayload(
      "Wellness coach seeking therapy credentials",
      "Holistic coaching background, no clinical license.",
    ),
    reviewedBy: "seed-admin",
    reviewedAt: daysFromNow(-3),
  },
  {
    id: "seed-app-vikram-listener",
    userId: "seed-user-vikram",
    type: ApplicationType.LISTENER,
    status: ProfessionalApplicationStatus.PENDING,
    applicationData: listenerPayload(
      "Recovery peer support volunteer",
      "Two years volunteering at a recovery community drop-in.",
    ),
  },
  {
    id: "seed-app-nira-therapist",
    userId: "seed-therapist-nira",
    type: ApplicationType.THERAPIST,
    status: ProfessionalApplicationStatus.APPROVED,
    applicationData: therapistPayload(
      "Licensed therapist returning to private practice",
      "Eight years across hospital and private clinic settings.",
    ),
    reviewedBy: "seed-admin",
    reviewedAt: daysFromNow(-20),
  },
  {
    id: "seed-app-anand-therapist",
    userId: "seed-therapist-anand",
    type: ApplicationType.THERAPIST,
    status: ProfessionalApplicationStatus.APPROVED,
    applicationData: therapistPayload(
      "Couples therapist with 12 years of practice",
      "Gottman trained; private practice since 2014.",
    ),
    reviewedBy: "seed-admin",
    reviewedAt: daysFromNow(-15),
  },
  {
    id: "seed-app-zara-therapist",
    userId: "seed-therapist-zara",
    type: ApplicationType.THERAPIST,
    status: ProfessionalApplicationStatus.APPROVED,
    applicationData: therapistPayload(
      "Trauma specialist returning to practice",
      "EMDR-certified; previously hospital-based.",
    ),
    reviewedBy: "seed-admin",
    reviewedAt: daysFromNow(-30),
  },
  {
    id: "seed-app-kavya-listener",
    userId: "seed-listener-kavya",
    type: ApplicationType.LISTENER,
    status: ProfessionalApplicationStatus.APPROVED,
    applicationData: listenerPayload(
      "Multilingual peer supporter",
      "Volunteer crisis line, 400+ hours.",
    ),
    reviewedBy: "seed-admin",
    reviewedAt: daysFromNow(-40),
  },
  {
    id: "seed-app-dev-listener",
    userId: "seed-listener-dev",
    type: ApplicationType.LISTENER,
    status: ProfessionalApplicationStatus.APPROVED,
    applicationData: listenerPayload(
      "Campus listener with 2 years on helpline",
      "Trained peer counsellor.",
    ),
    reviewedBy: "seed-admin",
    reviewedAt: daysFromNow(-35),
  },
  {
    id: "seed-app-isha-listener",
    userId: "seed-listener-isha",
    type: ApplicationType.LISTENER,
    status: ProfessionalApplicationStatus.APPROVED,
    applicationData: listenerPayload(
      "Listener specialising in student support",
      "Three years on a university mental health team.",
    ),
    reviewedBy: "seed-admin",
    reviewedAt: daysFromNow(-25),
  },
];

async function seedApplications() {
  for (const application of APPLICATIONS) {
    await prisma.professionalApplication.upsert({
      where: { id: application.id },
      create: {
        id: application.id,
        userId: application.userId,
        type: application.type,
        status: application.status,
        applicationData: application.applicationData as Prisma.InputJsonValue,
        reviewedBy: application.reviewedBy,
        reviewedAt: application.reviewedAt,
      },
      update: {
        status: application.status,
        applicationData: application.applicationData as Prisma.InputJsonValue,
        reviewedBy: application.reviewedBy,
        reviewedAt: application.reviewedAt,
      },
    });
  }
}

function daysFromNow(offsetDays: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date;
}

function dateAtMidnight(offsetDays: number): Date {
  const date = daysFromNow(offsetDays);
  date.setHours(0, 0, 0, 0);
  return date;
}

function dateAt(offsetDays: number, time: string): Date {
  const [hours, minutes] = time.split(":").map((part) => Number(part) || 0);
  const date = daysFromNow(offsetDays);
  date.setHours(hours, minutes, 0, 0);
  return date;
}

const THERAPIST_WEEKLY_IDS = [
  "seed-therapist-nira",
  "seed-therapist-anand",
  "seed-therapist-zara",
] as const;

const THERAPIST_WEEKLY_WINDOWS = [
  { dayOfWeek: 1, startTime: "09:00", endTime: "12:00" },
  { dayOfWeek: 1, startTime: "14:00", endTime: "17:00" },
  { dayOfWeek: 2, startTime: "10:00", endTime: "13:00" },
  { dayOfWeek: 3, startTime: "09:00", endTime: "12:00" },
  { dayOfWeek: 4, startTime: "14:00", endTime: "18:00" },
  { dayOfWeek: 5, startTime: "09:00", endTime: "12:00" },
  { dayOfWeek: 6, startTime: "10:00", endTime: "13:00" },
] as const;

async function seedTherapistWeeklyAvailability() {
  for (const therapistId of THERAPIST_WEEKLY_IDS) {
    await prisma.therapistAvailability.deleteMany({ where: { therapistId } });
    for (const window of THERAPIST_WEEKLY_WINDOWS) {
      await prisma.therapistAvailability.create({
        data: {
          therapistId,
          dayOfWeek: window.dayOfWeek,
          startTime: window.startTime,
          endTime: window.endTime,
          slotDuration: 60,
          breakDuration: 0,
          timezone: TIMEZONE,
          isActive: true,
        },
      });
    }
  }
}

type SeedBooking = {
  id: string;
  userId: string;
  providerId: string;
  type: BookingType;
  amount: number;
  daysAhead: number;
  time: string;
  duration: number;
  status: BookingStatus;
  note?: string;
  session?: {
    id: string;
    status: CareSessionStatus;
    meetingLink?: string;
    description?: string;
    notes?: string;
  };
};

const BOOKINGS: SeedBooking[] = [
  {
    id: "seed-booking-aanya-nira",
    userId: "seed-user-aanya",
    providerId: "seed-therapist-nira",
    type: BookingType.THERAPIST,
    amount: 1500,
    daysAhead: 3,
    time: "18:30",
    duration: 60,
    status: BookingStatus.PENDING,
    note: "First session — would like to talk about work anxiety.",
  },
  {
    id: "seed-booking-rohan-kavya",
    userId: "seed-user-rohan",
    providerId: "seed-listener-kavya",
    type: BookingType.LISTENER,
    amount: 800,
    daysAhead: 2,
    time: "20:00",
    duration: 45,
    status: BookingStatus.ACCEPTED,
    note: "Quiet check-in after a long week.",
    session: {
      id: "seed-session-rohan-kavya",
      status: CareSessionStatus.UPCOMING,
      meetingLink: "https://meet.apnahealer.dev/rohan-kavya",
      description: "Reflective conversation, no agenda.",
    },
  },
  {
    id: "seed-booking-meera-anand",
    userId: "seed-user-meera",
    providerId: "seed-therapist-anand",
    type: BookingType.THERAPIST,
    amount: 2200,
    daysAhead: 5,
    time: "11:00",
    duration: 60,
    status: BookingStatus.ACCEPTED,
    note: "Couples intake (partner not joining for first session).",
    session: {
      id: "seed-session-meera-anand",
      status: CareSessionStatus.UPCOMING,
      meetingLink: "https://meet.apnahealer.dev/meera-anand",
      description: "Intake — explore presenting concerns and goals.",
    },
  },
  {
    id: "seed-booking-meera-nira-completed",
    userId: "seed-user-meera",
    providerId: "seed-therapist-nira",
    type: BookingType.THERAPIST,
    amount: 1800,
    daysAhead: -7,
    time: "17:00",
    duration: 60,
    status: BookingStatus.COMPLETED,
    note: "Burnout recovery — third session.",
    session: {
      id: "seed-session-meera-nira",
      status: CareSessionStatus.COMPLETED,
      meetingLink: "https://meet.apnahealer.dev/meera-nira",
      description: "Burnout recovery work; somatic grounding practice.",
      notes: "Client reported lower fatigue and clearer boundaries at work.",
    },
  },
  {
    id: "seed-booking-priya-zara-completed",
    userId: "seed-user-priya",
    providerId: "seed-therapist-zara",
    type: BookingType.THERAPIST,
    amount: 1500,
    daysAhead: -4,
    time: "19:00",
    duration: 60,
    status: BookingStatus.COMPLETED,
    note: "Trauma re-processing session.",
    session: {
      id: "seed-session-priya-zara",
      status: CareSessionStatus.COMPLETED,
      meetingLink: "https://meet.apnahealer.dev/priya-zara",
      description: "EMDR continuation, target memory cluster B.",
      notes: "Steady processing; SUDS dropped from 7 to 3.",
    },
  },
  {
    id: "seed-booking-arjun-dev-cancelled",
    userId: "seed-user-arjun",
    providerId: "seed-listener-dev",
    type: BookingType.LISTENER,
    amount: 600,
    daysAhead: 1,
    time: "21:00",
    duration: 30,
    status: BookingStatus.CANCELLED,
    note: "Cancelled by user, schedule conflict.",
  },
  {
    id: "seed-booking-vikram-isha-rejected",
    userId: "seed-user-vikram",
    providerId: "seed-listener-isha",
    type: BookingType.LISTENER,
    amount: 500,
    daysAhead: 2,
    time: "22:00",
    duration: 30,
    status: BookingStatus.REJECTED,
    note: "Listener could not take the slot.",
  },
];

async function seedBookingsAndSessions() {
  for (const booking of BOOKINGS) {
    const requestedDate = dateAtMidnight(booking.daysAhead);

    await prisma.booking.upsert({
      where: { id: booking.id },
      create: {
        id: booking.id,
        userId: booking.userId,
        providerId: booking.providerId,
        type: booking.type,
        requestedDate,
        requestedTime: booking.time,
        duration: booking.duration,
        amount: booking.amount,
        note: booking.note,
        status: booking.status,
      },
      update: {
        type: booking.type,
        requestedDate,
        requestedTime: booking.time,
        duration: booking.duration,
        amount: booking.amount,
        note: booking.note,
        status: booking.status,
      },
    });

    if (booking.session) {
      const startTime = dateAt(booking.daysAhead, booking.time);

      await prisma.careSession.upsert({
        where: { id: booking.session.id },
        create: {
          id: booking.session.id,
          bookingId: booking.id,
          userId: booking.userId,
          providerId: booking.providerId,
          sessionMode: booking.type,
          amount: booking.amount,
          duration: booking.duration,
          startTime,
          meetingLink: booking.session.meetingLink,
          description: booking.session.description,
          notes: booking.session.notes,
          status: booking.session.status,
        },
        update: {
          startTime,
          meetingLink: booking.session.meetingLink,
          description: booking.session.description,
          notes: booking.session.notes,
          status: booking.session.status,
        },
      });
    }
  }
}

type SeedTransaction = {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  status: TransactionStatus;
  purpose: string;
  referenceId?: string;
  metadata?: Record<string, unknown>;
  createdAtOffsetDays: number;
};

async function seedTransactions() {
  const walletByUser = new Map<string, string>();
  const wallets = await prisma.wallet.findMany({ select: { id: true, userId: true } });
  for (const wallet of wallets) {
    walletByUser.set(wallet.userId, wallet.id);
  }

  const txns: SeedTransaction[] = [
    // Member top-ups
    creditTxn("aanya", "seed-user-aanya", 5000, -10),
    creditTxn("rohan", "seed-user-rohan", 2700, -9),
    creditTxn("meera", "seed-user-meera", 5700, -12),
    creditTxn("arjun", "seed-user-arjun", 1500, -8),
    creditTxn("priya", "seed-user-priya", 4000, -8),
    creditTxn("vikram", "seed-user-vikram", 1500, -6),

    // Pending hold for Aanya -> Nira
    holdTxn("aanya-nira", "seed-user-aanya", 1500, "seed-booking-aanya-nira", "seed-therapist-nira", -3, BookingType.THERAPIST),

    // Accepted hold for Rohan -> Kavya
    holdTxn("rohan-kavya", "seed-user-rohan", 800, "seed-booking-rohan-kavya", "seed-listener-kavya", -2, BookingType.LISTENER),

    // Accepted hold for Meera -> Anand
    holdTxn("meera-anand", "seed-user-meera", 2200, "seed-booking-meera-anand", "seed-therapist-anand", -1, BookingType.THERAPIST),

    // Completed session: Meera -> Nira (paid out)
    completedHoldTxn("meera-nira", "seed-user-meera", 1800, "seed-booking-meera-nira-completed", "seed-therapist-nira", -7, BookingType.THERAPIST),
    payoutTxn("meera-nira", "seed-therapist-nira", 1530, "seed-session-meera-nira", "seed-booking-meera-nira-completed", 1800, 270, -7),

    // Completed session: Priya -> Zara (paid out)
    completedHoldTxn("priya-zara", "seed-user-priya", 1500, "seed-booking-priya-zara-completed", "seed-therapist-zara", -4, BookingType.THERAPIST),
    payoutTxn("priya-zara", "seed-therapist-zara", 1275, "seed-session-priya-zara", "seed-booking-priya-zara-completed", 1500, 225, -4),

    // Cancelled: Arjun -> Dev (failed hold + refund)
    failedHoldTxn("arjun-dev", "seed-user-arjun", 600, "seed-booking-arjun-dev-cancelled", "seed-listener-dev", -1, BookingType.LISTENER, BookingStatus.CANCELLED),
    refundTxn("arjun-dev", "seed-user-arjun", 600, "seed-booking-arjun-dev-cancelled", "BOOKING_CANCELLED", -1),

    // Rejected: Vikram -> Isha (failed hold + refund)
    failedHoldTxn("vikram-isha", "seed-user-vikram", 500, "seed-booking-vikram-isha-rejected", "seed-listener-isha", -2, BookingType.LISTENER, BookingStatus.REJECTED),
    refundTxn("vikram-isha", "seed-user-vikram", 500, "seed-booking-vikram-isha-rejected", "BOOKING_REJECTED", -2),
  ];

  for (const txn of txns) {
    const walletId = walletByUser.get(txn.userId);
    if (!walletId) continue;

    const createdAt = daysFromNow(txn.createdAtOffsetDays);

    await prisma.transaction.upsert({
      where: { id: txn.id },
      create: {
        id: txn.id,
        walletId,
        userId: txn.userId,
        type: txn.type,
        amount: txn.amount,
        status: txn.status,
        purpose: txn.purpose,
        referenceId: txn.referenceId,
        metadata: (txn.metadata ?? null) as never,
        createdAt,
      },
      update: {
        type: txn.type,
        amount: txn.amount,
        status: txn.status,
        purpose: txn.purpose,
        referenceId: txn.referenceId,
        metadata: (txn.metadata ?? null) as never,
        createdAt,
      },
    });
  }
}

function creditTxn(slug: string, userId: string, amount: number, offset: number): SeedTransaction {
  return {
    id: `seed-txn-credit-${slug}`,
    userId,
    type: TransactionType.CREDIT,
    amount,
    status: TransactionStatus.SUCCESS,
    purpose: "WALLET_TOPUP",
    metadata: { source: "seed-bootstrap" },
    createdAtOffsetDays: offset,
  };
}

function holdTxn(
  slug: string,
  userId: string,
  amount: number,
  bookingId: string,
  providerId: string,
  offset: number,
  bookingType: BookingType,
): SeedTransaction {
  return {
    id: `seed-txn-hold-${slug}`,
    userId,
    type: TransactionType.SESSION_PAYMENT,
    amount,
    status: TransactionStatus.PENDING,
    purpose: "BOOKING_HOLD",
    referenceId: bookingId,
    metadata: { providerId, bookingType },
    createdAtOffsetDays: offset,
  };
}

function completedHoldTxn(
  slug: string,
  userId: string,
  amount: number,
  bookingId: string,
  providerId: string,
  offset: number,
  bookingType: BookingType,
): SeedTransaction {
  const platformFee = Number((amount * PLATFORM_FEE_RATE).toFixed(2));
  const providerNet = Number((amount - platformFee).toFixed(2));
  return {
    id: `seed-txn-hold-${slug}`,
    userId,
    type: TransactionType.SESSION_PAYMENT,
    amount,
    status: TransactionStatus.SUCCESS,
    purpose: "SESSION_COMPLETED",
    referenceId: bookingId,
    metadata: { providerId, bookingType, platformFee, providerNet },
    createdAtOffsetDays: offset,
  };
}

function failedHoldTxn(
  slug: string,
  userId: string,
  amount: number,
  bookingId: string,
  providerId: string,
  offset: number,
  bookingType: BookingType,
  action: BookingStatus,
): SeedTransaction {
  return {
    id: `seed-txn-hold-${slug}`,
    userId,
    type: TransactionType.SESSION_PAYMENT,
    amount,
    status: TransactionStatus.FAILED,
    purpose: "BOOKING_HOLD",
    referenceId: bookingId,
    metadata: { providerId, bookingType, action },
    createdAtOffsetDays: offset,
  };
}

function refundTxn(
  slug: string,
  userId: string,
  amount: number,
  bookingId: string,
  purpose: string,
  offset: number,
): SeedTransaction {
  return {
    id: `seed-txn-refund-${slug}`,
    userId,
    type: TransactionType.REFUND,
    amount,
    status: TransactionStatus.SUCCESS,
    purpose,
    referenceId: bookingId,
    createdAtOffsetDays: offset,
  };
}

function payoutTxn(
  slug: string,
  providerId: string,
  providerNet: number,
  sessionId: string,
  bookingId: string,
  grossAmount: number,
  platformFee: number,
  offset: number,
): SeedTransaction {
  return {
    id: `seed-txn-payout-${slug}`,
    userId: providerId,
    type: TransactionType.PAYOUT,
    amount: providerNet,
    status: TransactionStatus.SUCCESS,
    purpose: "SESSION_PAYOUT",
    referenceId: sessionId,
    metadata: { bookingId, grossAmount, platformFee },
    createdAtOffsetDays: offset,
  };
}

const DAILY_QUOTE_SEEDS: Array<{
  id: string;
  sortOrder: number;
  text: string;
  author: string | null;
}> = [
  {
    id: "seed-dq-0",
    sortOrder: 0,
    text: "You are not your thoughts; you are the awareness noticing them. Breathe, and let the next moment arrive gently.",
    author: null,
  },
  {
    id: "seed-dq-1",
    sortOrder: 1,
    text: "Healing is not linear. Some days are quiet steps backward—and they still count as part of the path.",
    author: null,
  },
  {
    id: "seed-dq-2",
    sortOrder: 2,
    text: "Self-compassion is not self-indulgence. It is the courage to stay with yourself when things feel hard.",
    author: "Kristin Neff",
  },
  {
    id: "seed-dq-3",
    sortOrder: 3,
    text: "What lies behind us and what lies before us are tiny matters compared to what lies within us.",
    author: "Ralph Waldo Emerson",
  },
  {
    id: "seed-dq-4",
    sortOrder: 4,
    text: "The wound is the place where the light enters you.",
    author: "Rumi",
  },
  {
    id: "seed-dq-5",
    sortOrder: 5,
    text: "Courage does not always roar. Sometimes courage is the quiet voice at the end of the day saying, I will try again tomorrow.",
    author: "Mary Anne Radmacher",
  },
  {
    id: "seed-dq-6",
    sortOrder: 6,
    text: "Rest is not a reward you earn. It is a need your nervous system depends on.",
    author: null,
  },
  {
    id: "seed-dq-7",
    sortOrder: 7,
    text: "Be patient toward all that is unsolved in your heart and try to love the questions themselves.",
    author: "Rainer Maria Rilke",
  },
];

async function seedDailyQuotes() {
  for (const row of DAILY_QUOTE_SEEDS) {
    await prisma.dailyQuote.upsert({
      where: { id: row.id },
      create: {
        id: row.id,
        text: row.text,
        author: row.author,
        sortOrder: row.sortOrder,
        isActive: true,
      },
      update: {
        text: row.text,
        author: row.author,
        sortOrder: row.sortOrder,
        isActive: true,
      },
    });
  }
}

async function main() {
  console.log("Seeding apnahealer development data...");

  await seedUsersAndWallets();
  console.log(`  ${SEED_USERS.length} users + wallets`);

  await seedDailyQuotes();
  console.log(`  ${DAILY_QUOTE_SEEDS.length} daily quotes`);

  await seedProviderProfiles();
  console.log(`  ${THERAPIST_PROFILES.length} therapist + ${LISTENER_PROFILES.length} listener profiles`);

  await seedListenerWeeklyAvailability();
  console.log(`  listener weekly availability (${LISTENER_WEEKLY_IDS.length} listeners × 7 days)`);

  await seedApplications();
  console.log(`  ${APPLICATIONS.length} applications`);

  await seedTherapistWeeklyAvailability();
  console.log(
    `  therapist weekly availability (${THERAPIST_WEEKLY_IDS.length} therapists × ${THERAPIST_WEEKLY_WINDOWS.length} windows)`,
  );

  await seedBookingsAndSessions();
  const sessionCount = BOOKINGS.filter((b) => b.session).length;
  console.log(`  ${BOOKINGS.length} bookings (${sessionCount} with care sessions)`);

  await seedTransactions();
  console.log("  ledger transactions (credits, holds, refunds, payouts)");

  console.log("\nDemo accounts:");
  for (const user of SEED_USERS) {
    console.log(`  ${user.role.padEnd(9)} ${user.email}`);
  }
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

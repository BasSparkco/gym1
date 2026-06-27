import "server-only";
import { cookies } from "next/headers";

export type Lang = "en" | "ar" | "he";

export type Dict = {
  nav: {
    dashboard: string;
    branches: string;
    usersRoles: string;
    employees: string;
    membershipPlans: string;
    members: string;
    checkIn: string;
    visits: string;
    notifications: string;
    reports: string;
    settings: string;
  };
  shell: {
    appName: string;
    appTitle: string;
    appDescription: string;
    pilotBranchContext: string;
    searchMembers: string;
  };
  auth: {
    signIn: string;
    signOut: string;
    emailOrUsername: string;
    password: string;
    continue: string;
    signingIn: string;
    accessConsole: string;
    signInDescription: string;
    pilotCredentials: string;
    mvpFocus: string;
    access: string;
    reporting: string;
  };
  actions: {
    save: string;
    cancel: string;
    edit: string;
    create: string;
    back: string;
    allItems: string;
    newItem: string;
    view: string;
    details: string;
    saveChanges: string;
  };
  status: {
    active: string;
    inactive: string;
    frozen: string;
    expired: string;
    cancelled: string;
    draft: string;
    paid: string;
    pending: string;
    failed: string;
    refunded: string;
  };
  dashboard: {
    title: string;
    overviewTitle: string;
    overviewTenantLabel: string;
    overviewRoleLabel: string;
    overviewAsOfLabel: string;
    overviewDataHelper: string;
    operationsGuideTitle: string;
    guide1: string;
    guide2: string;
    guide3: string;
    guide4: string;
    cardActiveMemberships: string;
    cardActiveMembershipsHelper: string;
    cardExpiringWeek: string;
    cardExpiringWeekHelper: string;
    cardTodayCheckIns: string;
    cardTodayCheckInsHelper: string;
    cardPaymentsLogged: string;
    cardPaymentsLoggedHelper: string;
    actionCreateMember: string;
    actionSellMembership: string;
    actionRecordPayment: string;
    actionCheckInMember: string;
  };
  members: {
    title: string;
    newMember: string;
    editMember: string;
    profile: string;
    memberships: string;
    payments: string;
    quickActions: string;
    editDetails: string;
    recordPayment: string;
    sellMembership: string;
    renewMembership: string;
    freezeMembership: string;
    reactivateMembership: string;
    fullName: string;
    phone: string;
    email: string;
    dateOfBirth: string;
    sex: string;
    male: string;
    female: string;
    idNumber: string;
    address: string;
    joinDate: string;
    height: string;
    weight: string;
    registeredEmployee: string;
    photo: string;
    uploadPhoto: string;
    takePhoto: string;
    changePhoto: string;
    homeBranch: string;
    emergencyContact: string;
    medicalNotes: string;
    memberNumber: string;
    allMembers: string;
    noMembers: string;
    createFirst: string;
    basicInfo: string;
    contactName: string;
    contactPhone: string;
    notes: string;
    statusLabel: string;
    showQrCode: string;
    qrCode: string;
    qrCodeDescription: string;
    printQrCode: string;
    sendQrWhatsApp: string;
    qrSentSuccess: string;
    qrSentFailed: string;
  };
  plans: {
    title: string;
    newPlan: string;
    editPlan: string;
    planName: string;
    planType: string;
    planDetails: string;
    durationBased: string;
    sessionBased: string;
    duration: string;
    sessionCount: string;
    defaultPrice: string;
    branchAccess: string;
    allBranches: string;
    homeBranchOnly: string;
    freezePolicy: string;
    freezeAllowed: string;
    freezeNotAllowed: string;
    maxFreezeDays: string;
    noPlans: string;
    allPlans: string;
    createPlan: string;
    details: string;
    type: string;
    sessions: string;
    unlimited: string;
    yes: string;
    no: string;
  };
  memberships: {
    sell: string;
    renew: string;
    freeze: string;
    unfreeze: string;
    activeMembershipExists: string;
    noMembershipHistory: string;
    noActiveMembership: string;
    noFrozenMembership: string;
    freezeNotAllowed: string;
    currentMembership: string;
    frozenMembership: string;
    activeMembership: string;
    freezeHistory: string;
    confirmReactivation: string;
    plan: string;
    period: string;
    startDate: string;
    endDate: string;
    finalPrice: string;
    activateMembership: string;
    reactivateMembership: string;
    membershipPlan: string;
    noPlansAvailable: string;
    createPlanFirst: string;
    freezeStartDate: string;
    freezeEndDate: string;
    freezePolicy: string;
    sellNewInstead: string;
    backToProfile: string;
    days: string;
  };
  payments: {
    title: string;
    recordPayment: string;
    membership: string;
    amount: string;
    paymentMethod: string;
    paymentDate: string;
    cash: string;
    card: string;
    transfer: string;
    noActiveMembership: string;
    noMembershipsFound: string;
    sellMembershipFirst: string;
    noPayments: string;
    statusLabel: string;
  };
  checkIn: {
    title: string;
    description: string;
    memberNumber: string;
    searchPlaceholder: string;
    selectedMember: string;
    clearSelection: string;
    accessMethod: string;
    manualEntry: string;
    qrScan: string;
    checkInButton: string;
    accessGranted: string;
    accessDenied: string;
    expires: string;
    openGate: string;
    gateOpened: string;
    gateOpenFailed: string;
  };
  visits: {
    title: string;
    allVisits: string;
    visitDetail: string;
    visitInfo: string;
    checkInTime: string;
    checkOutTime: string;
    checkOut: string;
    inside: string;
    checkedOut: string;
    accessMethod: string;
    branch: string;
    member: string;
    noVisits: string;
    noVisitsForPeriod: string;
    viewMemberProfile: string;
    qrScan: string;
    manualEntry: string;
    filterToday: string;
    filterWeek: string;
    filterMonth: string;
    filterAll: string;
    filterPresenceAll: string;
    filterInside: string;
    filterCheckedOut: string;
  };
  branches: {
    title: string;
    newBranch: string;
    editBranch: string;
    allBranches: string;
    branchName: string;
    address: string;
    phone: string;
    country: string;
    statusLabel: string;
    details: string;
    noBranches: string;
    createFirst: string;
    branchId: string;
    tenantId: string;
    createBranch: string;
    editBranchBtn: string;
  };
  users: {
    title: string;
    staffUsers: string;
    newUser: string;
    newStaffUser: string;
    allUsers: string;
    staffDetails: string;
    fullName: string;
    email: string;
    username: string;
    role: string;
    homeBranch: string;
    password: string;
    noUsers: string;
    createUser: string;
    viewRoles: string;
    userId: string;
    tenant: string;
  };
  roles: {
    title: string;
    staffUsers: string;
    mvpAccessSummary: string;
    capability: string;
    owner: string;
    manager: string;
    frontDesk: string;
  };
  employees: {
    title: string;
    allEmployees: string;
    newEmployee: string;
    newStaffEmployee: string;
    noEmployees: string;
    createEmployee: string;
    employeeNumber: string;
    fullName: string;
    andBranch: string;
    branch: string;
    status: string;
    active: string;
    inactive: string;
    deactivate: string;
    reactivate: string;
    employeeDetails: string;
    employeeId: string;
    personalInfo: string;
    employmentInfo: string;
    systemAccess: string;
    idNumber: string;
    phone: string;
    gender: string;
    male: string;
    female: string;
    dateOfBirth: string;
    job: string;
    salary: string;
    workType: string;
    fullTime: string;
    partTime: string;
    trainee: string;
    startDate: string;
    endDate: string;
    isUser: string;
  };
  notifications: {
    title: string;
    allNotifications: string;
    notificationDetail: string;
    notificationInfo: string;
    subject: string;
    body: string;
    channel: string;
    statusLabel: string;
    created: string;
    sent: string;
    failedReason: string;
    member: string;
    noNotifications: string;
    viewMemberProfile: string;
  };
  reports: {
    title: string;
    allReports: string;
    activeMemberships: string;
    expiredMemberships: string;
    visits: string;
    payments: string;
    viewReport: string;
    memberCol: string;
    planCol: string;
    startCol: string;
    expiresCol: string;
    expiredCol: string;
    statusCol: string;
    priceCol: string;
    methodCol: string;
    checkInTimeCol: string;
    dateCol: string;
    amountCol: string;
    noActiveMemberships: string;
    noExpiredMemberships: string;
    noVisits: string;
    noPayments: string;
    totalPaid: string;
  };
  settings: {
    title: string;
    language: string;
    languageConfig: string;
    defaultLanguage: string;
    defaultLanguageHelp: string;
    availableLanguages: string;
    availableLanguagesHelp: string;
    saveLanguageSettings: string;
    supportedLanguages: string;
    rightToLeft: string;
    leftToRight: string;
    defaultBadge: string;
    notificationsTitle: string;
    notificationsDescription: string;
    notificationEvents: string;
    eventMembershipExpiring: string;
    eventMembershipExpired: string;
    eventPaymentPending: string;
    eventMembershipActivated: string;
    eventMembershipExpiringHelp: string;
    eventMembershipExpiredHelp: string;
    eventPaymentPendingHelp: string;
    eventMembershipActivatedHelp: string;
    channelsSectionTitle: string;
    channelWhatsapp: string;
    channelEmail: string;
    daysBefore: string;
    daysBeforeUnit: string;
    enableEvent: string;
    saveNotificationSettings: string;
    sendersSectionTitle: string;
    sendersSectionDescription: string;
    senderEmailFrom: string;
    senderEmailFromHelp: string;
    display: string;
    displayTitle: string;
    displayDescription: string;
    dateFormat: string;
    dateFormatHelp: string;
    dateFormatDDMMYYYY: string;
    dateFormatMMDDYYYY: string;
    saveDisplaySettings: string;
    whatsapp: string;
    whatsappTitle: string;
    whatsappDescription: string;
    whatsappConnectButton: string;
    whatsappConnecting: string;
    whatsappConnected: string;
    whatsappDisconnect: string;
    whatsappDisconnectConfirm: string;
    whatsappScanInstruction: string;
    whatsappStarting: string;
    whatsappNotConfigured: string;
    gates: string;
    gatesTitle: string;
    gatesDescription: string;
    gatesEmpty: string;
    gateAddButton: string;
    gateName: string;
    gateGenderRestriction: string;
    gateGenderMale: string;
    gateGenderFemale: string;
    gateGenderNone: string;
    gateDeviceUrl: string;
    gateDeviceUrlHelp: string;
    gateDeviceUsername: string;
    gateDevicePassword: string;
    gateDevicePasswordHelp: string;
    gateLockNumber: string;
    gateEnabled: string;
    gateCreate: string;
    gateUpdate: string;
    gateDelete: string;
    gateDeleteConfirm: string;
    gateDeviceConfigured: string;
    gateDeviceNotConfigured: string;
  };
};

const en: Dict = {
  nav: {
    dashboard: "Dashboard",
    branches: "Branches",
    usersRoles: "Users & Roles",
    employees: "Employees",
    membershipPlans: "Membership Plans",
    members: "Members",
    checkIn: "Check-In",
    visits: "Visits",
    notifications: "Notifications",
    reports: "Reports",
    settings: "Settings",
  },
  shell: {
    appName: "Spark Gym ERP",
    appTitle: "Operations Console",
    appDescription: "MVP workspace for memberships, access control, reporting, and front-desk operations.",
    pilotBranchContext: "Pilot Branch Context",
    searchMembers: "Search members",
  },
  auth: {
    signIn: "Sign In",
    signOut: "Sign out",
    emailOrUsername: "Email or username",
    password: "Password",
    continue: "Continue",
    signingIn: "Signing in...",
    accessConsole: "Access the operations console",
    signInDescription: "Sign in with a seeded pilot account to enter the protected shell and verify the first Sprint 1 auth flow.",
    pilotCredentials: "Pilot credentials",
    mvpFocus: "MVP Focus",
    access: "Access",
    reporting: "Reporting",
  },
  actions: {
    save: "Save",
    cancel: "Cancel",
    edit: "Edit",
    create: "Create",
    back: "Back",
    allItems: "All items",
    newItem: "New item",
    view: "View",
    details: "Details",
    saveChanges: "Save changes",
  },
  status: {
    active: "Active",
    inactive: "Inactive",
    frozen: "Frozen",
    expired: "Expired",
    cancelled: "Cancelled",
    draft: "Draft",
    paid: "Paid",
    pending: "Pending",
    failed: "Failed",
    refunded: "Refunded",
  },
  dashboard: {
    title: "Operations Dashboard",
    overviewTitle: "Branch Overview",
    overviewTenantLabel: "Organization",
    overviewRoleLabel: "Role",
    overviewAsOfLabel: "Reporting date",
    overviewDataHelper: "All figures reflect data as of this date.",
    operationsGuideTitle: "Operations Guide",
    guide1: "Check expiring memberships and contact members before their plan ends.",
    guide2: "Monitor today's check-in log to track attendance.",
    guide3: "Use the quick actions above for common front-desk tasks.",
    guide4: "Visit Reports for detailed data on memberships, visits, and payments.",
    cardActiveMemberships: "Active memberships",
    cardActiveMembershipsHelper: "Members with an active plan",
    cardExpiringWeek: "Expiring this week",
    cardExpiringWeekHelper: "Active plans ending within 7 days",
    cardTodayCheckIns: "Today's check-ins",
    cardTodayCheckInsHelper: "Visits logged at this branch today",
    cardPaymentsLogged: "Payments today",
    cardPaymentsLoggedHelper: "Paid transactions at this branch",
    actionCreateMember: "Add member",
    actionSellMembership: "Sell membership",
    actionRecordPayment: "Record payment",
    actionCheckInMember: "Check in",
  },
  members: {
    title: "Members",
    newMember: "New member",
    editMember: "Edit member",
    profile: "Profile",
    memberships: "Memberships",
    payments: "Payments",
    quickActions: "Quick actions",
    editDetails: "Edit member details",
    recordPayment: "Record payment",
    sellMembership: "Sell membership",
    renewMembership: "Renew membership",
    freezeMembership: "Freeze membership",
    reactivateMembership: "Re-activate membership",
    fullName: "Full name",
    phone: "Phone",
    email: "Email",
    dateOfBirth: "Date of birth",
    sex: "Sex",
    male: "Male",
    female: "Female",
    idNumber: "ID Number",
    address: "Address",
    joinDate: "Join date",
    height: "Height (cm)",
    weight: "Weight (kg)",
    registeredEmployee: "Registered by",
    photo: "Photo",
    uploadPhoto: "Upload photo",
    takePhoto: "Take photo",
    changePhoto: "Change photo",
    homeBranch: "Home branch",
    emergencyContact: "Emergency contact",
    medicalNotes: "Medical notes",
    memberNumber: "Member number",
    allMembers: "All members",
    noMembers: "No members yet. Create the first one.",
    createFirst: "Create the first one.",
    basicInfo: "Basic info",
    contactName: "Contact name",
    contactPhone: "Contact phone",
    notes: "Notes",
    statusLabel: "Status",
    showQrCode: "Show QR code",
    qrCode: "Member QR code",
    qrCodeDescription: "Show this QR code at the gym entrance to open the gate.",
    printQrCode: "Print",
    sendQrWhatsApp: "Send via WhatsApp",
    qrSentSuccess: "QR code sent via WhatsApp!",
    qrSentFailed: "Failed to send QR code.",
  },
  plans: {
    title: "Membership plans",
    newPlan: "New plan",
    editPlan: "Edit plan",
    planName: "Plan name",
    planType: "Plan type",
    planDetails: "Plan details",
    durationBased: "Duration-based",
    sessionBased: "Session-based",
    duration: "Duration",
    sessionCount: "Session count",
    defaultPrice: "Default price",
    branchAccess: "Branch access",
    allBranches: "All branches",
    homeBranchOnly: "Home branch only",
    freezePolicy: "Freeze policy",
    freezeAllowed: "Freeze allowed",
    freezeNotAllowed: "Freeze not allowed",
    maxFreezeDays: "Max freeze days",
    noPlans: "No plans yet. Create the first one.",
    allPlans: "All plans",
    createPlan: "Create plan",
    details: "Details",
    type: "Type",
    sessions: "Sessions",
    unlimited: "Unlimited",
    yes: "Yes",
    no: "No",
  },
  memberships: {
    sell: "Sell membership",
    renew: "Renew membership",
    freeze: "Freeze membership",
    unfreeze: "Unfreeze membership",
    activeMembershipExists: "Active membership exists",
    noMembershipHistory: "No membership to renew",
    noActiveMembership: "No active membership",
    noFrozenMembership: "No frozen membership",
    freezeNotAllowed: "Freeze not allowed",
    currentMembership: "Current membership",
    frozenMembership: "Frozen membership",
    activeMembership: "Active membership",
    freezeHistory: "Freeze history",
    confirmReactivation: "Confirm re-activation",
    plan: "Plan",
    period: "Period",
    startDate: "Start date",
    endDate: "End date",
    finalPrice: "Final price",
    activateMembership: "Activate membership",
    reactivateMembership: "Re-activate membership",
    membershipPlan: "Membership plan",
    noPlansAvailable: "No plans available.",
    createPlanFirst: "Create a plan first.",
    freezeStartDate: "Freeze start date",
    freezeEndDate: "Freeze end date",
    freezePolicy: "Freeze policy",
    sellNewInstead: "Sell a new membership instead.",
    backToProfile: "Back to profile",
    days: "days",
  },
  payments: {
    title: "Payments",
    recordPayment: "Record payment",
    membership: "Membership",
    amount: "Amount",
    paymentMethod: "Payment method",
    paymentDate: "Payment date",
    cash: "Cash",
    card: "Card",
    transfer: "Transfer",
    noActiveMembership: "No active membership",
    noMembershipsFound: "No memberships found for this member.",
    sellMembershipFirst: "Sell a membership first.",
    noPayments: "No payments recorded.",
    statusLabel: "Status",
  },
  checkIn: {
    title: "Check-In",
    description: "Search by name or member number to record a visit.",
    memberNumber: "Member number",
    searchPlaceholder: "Search by name or member number…",
    selectedMember: "Selected member",
    clearSelection: "Change",
    accessMethod: "Access method",
    manualEntry: "Manual entry",
    qrScan: "QR scan",
    checkInButton: "Check In",
    accessGranted: "Access Granted",
    accessDenied: "Access Denied",
    expires: "expires",
    openGate: "Open Gate",
    gateOpened: "Gate opened",
    gateOpenFailed: "Failed to open gate",
  },
  visits: {
    title: "Visits",
    allVisits: "All visits",
    visitDetail: "Visit detail",
    visitInfo: "Visit info",
    checkInTime: "Check-in time",
    checkOutTime: "Check-out time",
    checkOut: "Check Out",
    inside: "Inside",
    checkedOut: "Checked out",
    accessMethod: "Access method",
    branch: "Branch",
    member: "Member",
    noVisits: "No visits recorded for this branch yet.",
    noVisitsForPeriod: "No visits found for this period.",
    viewMemberProfile: "View member profile →",
    qrScan: "QR scan",
    manualEntry: "Manual entry",
    filterToday: "Today",
    filterWeek: "Last 7 days",
    filterMonth: "Last 30 days",
    filterAll: "All",
    filterPresenceAll: "All",
    filterInside: "Inside now",
    filterCheckedOut: "Checked out",
  },
  branches: {
    title: "Branches",
    newBranch: "New branch",
    editBranch: "Edit branch",
    allBranches: "All branches",
    branchName: "Branch name",
    address: "Address",
    phone: "Phone",
    country: "Country",
    statusLabel: "Status",
    details: "Details",
    noBranches: "No branches yet. Create the first one.",
    createFirst: "Create the first one.",
    branchId: "Branch ID",
    tenantId: "Tenant ID",
    createBranch: "Create branch",
    editBranchBtn: "Edit branch",
  },
  users: {
    title: "Users & Roles",
    staffUsers: "Staff users",
    newUser: "New user",
    newStaffUser: "New staff user",
    allUsers: "All users",
    staffDetails: "Staff details",
    fullName: "Full name",
    email: "Email",
    username: "Username",
    role: "Role",
    homeBranch: "Home branch",
    password: "Password",
    noUsers: "No staff users found.",
    createUser: "Create user",
    viewRoles: "View roles and permissions →",
    userId: "User ID",
    tenant: "Tenant",
  },
  roles: {
    title: "Roles",
    staffUsers: "Staff users",
    mvpAccessSummary: "MVP access summary",
    capability: "Capability",
    owner: "Owner",
    manager: "Manager",
    frontDesk: "Front Desk",
  },
  employees: {
    title: "Employees",
    allEmployees: "All employees",
    newEmployee: "New employee",
    newStaffEmployee: "New staff employee",
    noEmployees: "No employees found.",
    createEmployee: "Create employee",
    employeeNumber: "Employee no.",
    fullName: "Full name",
    andBranch: "and branch are required. An employee number will be assigned automatically.",
    branch: "Branch",
    status: "Status",
    active: "Active",
    inactive: "Inactive",
    deactivate: "Deactivate",
    reactivate: "Reactivate",
    employeeDetails: "Employee details",
    employeeId: "Employee ID",
    personalInfo: "Personal information",
    employmentInfo: "Employment information",
    systemAccess: "System access",
    idNumber: "ID number",
    phone: "Mobile number",
    gender: "Gender",
    male: "Male",
    female: "Female",
    dateOfBirth: "Date of birth",
    job: "Job title",
    salary: "Salary",
    workType: "Work type",
    fullTime: "Full time",
    partTime: "Part time",
    trainee: "Trainee",
    startDate: "Start date",
    endDate: "End date",
    isUser: "Has system user account",
  },
  notifications: {
    title: "Notifications",
    allNotifications: "All notifications",
    notificationDetail: "Notification detail",
    notificationInfo: "Notification info",
    subject: "Subject",
    body: "Body",
    channel: "Channel",
    statusLabel: "Status",
    created: "Created",
    sent: "Sent",
    failedReason: "Failure reason",
    member: "Member",
    noNotifications: "No notifications recorded yet.",
    viewMemberProfile: "View member profile →",
  },
  reports: {
    title: "Reports",
    allReports: "All reports",
    activeMemberships: "Active Memberships",
    expiredMemberships: "Expired Memberships",
    visits: "Visits",
    payments: "Payments",
    viewReport: "View report →",
    memberCol: "Member",
    planCol: "Plan",
    startCol: "Start",
    expiresCol: "Expires",
    expiredCol: "Expired",
    statusCol: "Status",
    priceCol: "Price",
    methodCol: "Method",
    checkInTimeCol: "Check-in time",
    dateCol: "Date",
    amountCol: "Amount",
    noActiveMemberships: "No active memberships found.",
    noExpiredMemberships: "No expired memberships found.",
    noVisits: "No visits found for this date range.",
    noPayments: "No payments found for this date range.",
    totalPaid: "Total paid",
  },
  settings: {
    title: "Settings",
    language: "Language",
    languageConfig: "Language configuration",
    defaultLanguage: "Default language",
    defaultLanguageHelp: "The language the application opens in. Must be one of the enabled languages below.",
    availableLanguages: "Available languages",
    availableLanguagesHelp: "Choose which languages appear in the language picker. At least one must remain enabled. The default language cannot be disabled.",
    saveLanguageSettings: "Save language settings",
    supportedLanguages: "Supported languages",
    rightToLeft: "Right-to-left",
    leftToRight: "Left-to-right",
    defaultBadge: "Default",
    notificationsTitle: "Notification rules",
    notificationsDescription: "Control which events trigger member notifications and which channels are used to deliver them.",
    notificationEvents: "Notification events",
    eventMembershipExpiring: "Membership expiring soon",
    eventMembershipExpired: "Membership expired",
    eventPaymentPending: "Payment pending",
    eventMembershipActivated: "Membership activated",
    eventMembershipExpiringHelp: "Notify members before their membership runs out.",
    eventMembershipExpiredHelp: "Notify members on the day their membership expires.",
    eventPaymentPendingHelp: "Remind members with an outstanding balance.",
    eventMembershipActivatedHelp: "Welcome message when a new membership is activated.",
    channelsSectionTitle: "Delivery channels",
    channelWhatsapp: "WhatsApp",
    channelEmail: "Email",
    daysBefore: "Days before expiry",
    daysBeforeUnit: "days",
    enableEvent: "Enable this notification",
    saveNotificationSettings: "Save notification settings",
    sendersSectionTitle: "Sender identity",
    sendersSectionDescription: "The email address your members will see in the \"from\" field when they receive a notification.",
    senderEmailFrom: "Email sender address",
    senderEmailFromHelp: "Email address members will see in the \"from\" field, e.g. notices@yourgym.com.",
    display: "Display",
    displayTitle: "Display settings",
    displayDescription: "Control how dates and other values are displayed across the application.",
    dateFormat: "Date format",
    dateFormatHelp: "Choose how dates are displayed throughout the application.",
    dateFormatDDMMYYYY: "DD/MM/YYYY (e.g. 24/06/2026)",
    dateFormatMMDDYYYY: "MM/DD/YYYY (e.g. 06/24/2026)",
    saveDisplaySettings: "Save display settings",
    whatsapp: "WhatsApp",
    whatsappTitle: "WhatsApp connection",
    whatsappDescription: "Connect your gym's WhatsApp number so that member notifications are sent from your own number.",
    whatsappConnectButton: "Connect WhatsApp",
    whatsappConnecting: "Starting session…",
    whatsappConnected: "Connected",
    whatsappDisconnect: "Disconnect",
    whatsappDisconnectConfirm: "Disconnect WhatsApp? Notifications will fall back to the platform number.",
    whatsappScanInstruction: "Open WhatsApp on your phone → Linked Devices → Link a device → scan this QR code.",
    whatsappStarting: "Starting WhatsApp session — QR will appear shortly…",
    whatsappNotConfigured: "SparkCo API key is not configured on this server.",
    gates: "Smart Gates",
    gatesTitle: "Smart Gates",
    gatesDescription: "Configure the electronic gates installed at this branch. Each gate connects to a BAS-IP device and can be restricted to a specific gender.",
    gatesEmpty: "No gates configured yet.",
    gateAddButton: "Add Gate",
    gateName: "Gate Name",
    gateGenderRestriction: "Gender Restriction",
    gateGenderMale: "Men's Gate (male only)",
    gateGenderFemale: "Women's Gate (female only)",
    gateGenderNone: "No restriction",
    gateDeviceUrl: "Device IP / URL",
    gateDeviceUrlHelp: "Local network address of the BAS-IP device, e.g. http://192.168.1.178",
    gateDeviceUsername: "Device Username",
    gateDevicePassword: "Device Password",
    gateDevicePasswordHelp: "Leave blank to keep the existing password.",
    gateLockNumber: "Lock Number",
    gateEnabled: "Enabled",
    gateCreate: "Create Gate",
    gateUpdate: "Save Changes",
    gateDelete: "Delete Gate",
    gateDeleteConfirm: "Delete this gate? This cannot be undone.",
    gateDeviceConfigured: "Device configured",
    gateDeviceNotConfigured: "No device configured",
  },
};

const ar: Dict = {
  nav: {
    dashboard: "لوحة التحكم",
    branches: "الفروع",
    usersRoles: "المستخدمون والأدوار",
    employees: "الموظفون",
    membershipPlans: "خطط الاشتراك",
    members: "الأعضاء",
    checkIn: "تسجيل الدخول",
    visits: "الزيارات",
    notifications: "الإشعارات",
    reports: "التقارير",
    settings: "الإعدادات",
  },
  shell: {
    appName: "Spark Gym ERP",
    appTitle: "لوحة العمليات",
    appDescription: "منصة العمل لإدارة الاشتراكات والتحكم بالوصول والتقارير وعمليات الاستقبال.",
    pilotBranchContext: "سياق الفرع التجريبي",
    searchMembers: "البحث عن الأعضاء",
  },
  auth: {
    signIn: "تسجيل الدخول",
    signOut: "تسجيل الخروج",
    emailOrUsername: "البريد الإلكتروني أو اسم المستخدم",
    password: "كلمة المرور",
    continue: "متابعة",
    signingIn: "جارٍ تسجيل الدخول...",
    accessConsole: "الوصول إلى لوحة العمليات",
    signInDescription: "سجّل دخولك باستخدام حساب تجريبي للدخول إلى النظام.",
    pilotCredentials: "بيانات الاعتماد التجريبية",
    mvpFocus: "محور المنتج",
    access: "الوصول",
    reporting: "التقارير",
  },
  actions: {
    save: "حفظ",
    cancel: "إلغاء",
    edit: "تعديل",
    create: "إنشاء",
    back: "رجوع",
    allItems: "جميع العناصر",
    newItem: "عنصر جديد",
    view: "عرض",
    details: "التفاصيل",
    saveChanges: "حفظ التغييرات",
  },
  status: {
    active: "نشط",
    inactive: "غير نشط",
    frozen: "مجمد",
    expired: "منتهي",
    cancelled: "ملغي",
    draft: "مسودة",
    paid: "مدفوع",
    pending: "قيد الانتظار",
    failed: "فشل",
    refunded: "مُسترد",
  },
  dashboard: {
    title: "لوحة العمليات",
    overviewTitle: "نظرة عامة على الفرع",
    overviewTenantLabel: "المنظمة",
    overviewRoleLabel: "الدور",
    overviewAsOfLabel: "تاريخ التقرير",
    overviewDataHelper: "جميع الأرقام تعكس البيانات حتى هذا التاريخ.",
    operationsGuideTitle: "دليل العمليات",
    guide1: "تحقق من الاشتراكات المنتهية قريباً وتواصل مع الأعضاء قبل انتهاء خطتهم.",
    guide2: "راقب سجل تسجيل الدخول اليوم لمتابعة الحضور.",
    guide3: "استخدم الإجراءات السريعة أعلاه للمهام الشائعة في مكتب الاستقبال.",
    guide4: "انتقل إلى التقارير للحصول على بيانات تفصيلية حول الاشتراكات والزيارات والمدفوعات.",
    cardActiveMemberships: "الاشتراكات النشطة",
    cardActiveMembershipsHelper: "أعضاء لديهم خطة نشطة",
    cardExpiringWeek: "تنتهي هذا الأسبوع",
    cardExpiringWeekHelper: "خطط نشطة تنتهي خلال 7 أيام",
    cardTodayCheckIns: "تسجيلات الدخول اليوم",
    cardTodayCheckInsHelper: "زيارات مسجلة في هذا الفرع اليوم",
    cardPaymentsLogged: "مدفوعات اليوم",
    cardPaymentsLoggedHelper: "معاملات مدفوعة في هذا الفرع",
    actionCreateMember: "إضافة عضو",
    actionSellMembership: "بيع اشتراك",
    actionRecordPayment: "تسجيل دفعة",
    actionCheckInMember: "تسجيل دخول",
  },
  members: {
    title: "الأعضاء",
    newMember: "عضو جديد",
    editMember: "تعديل العضو",
    profile: "الملف الشخصي",
    memberships: "الاشتراكات",
    payments: "المدفوعات",
    quickActions: "إجراءات سريعة",
    editDetails: "تعديل بيانات العضو",
    recordPayment: "تسجيل دفعة",
    sellMembership: "بيع اشتراك",
    renewMembership: "تجديد الاشتراك",
    freezeMembership: "تجميد الاشتراك",
    reactivateMembership: "إعادة تفعيل الاشتراك",
    fullName: "الاسم الكامل",
    phone: "الهاتف",
    email: "البريد الإلكتروني",
    dateOfBirth: "تاريخ الميلاد",
    sex: "الجنس",
    male: "ذكر",
    female: "أنثى",
    idNumber: "رقم الهوية",
    address: "العنوان",
    joinDate: "تاريخ الانتساب",
    height: "الطول (سم)",
    weight: "الوزن (كغم)",
    registeredEmployee: "سجّله الموظف",
    photo: "الصورة",
    uploadPhoto: "رفع صورة",
    takePhoto: "التقاط صورة",
    changePhoto: "تغيير الصورة",
    homeBranch: "الفرع الرئيسي",
    emergencyContact: "جهة الاتصال في الطوارئ",
    medicalNotes: "ملاحظات طبية",
    memberNumber: "رقم العضو",
    allMembers: "جميع الأعضاء",
    noMembers: "لا يوجد أعضاء بعد. أنشئ أول عضو.",
    createFirst: "أنشئ أول عضو.",
    basicInfo: "المعلومات الأساسية",
    contactName: "اسم جهة الاتصال",
    contactPhone: "هاتف جهة الاتصال",
    notes: "ملاحظات",
    statusLabel: "الحالة",
    showQrCode: "عرض رمز QR",
    qrCode: "رمز QR للعضو",
    qrCodeDescription: "اعرض رمز QR هذا عند مدخل الصالة لفتح البوابة.",
    printQrCode: "طباعة",
    sendQrWhatsApp: "إرسال عبر واتساب",
    qrSentSuccess: "تم إرسال رمز QR عبر واتساب!",
    qrSentFailed: "فشل إرسال رمز QR.",
  },
  plans: {
    title: "خطط الاشتراك",
    newPlan: "خطة جديدة",
    editPlan: "تعديل الخطة",
    planName: "اسم الخطة",
    planType: "نوع الخطة",
    planDetails: "تفاصيل الخطة",
    durationBased: "مبنية على المدة",
    sessionBased: "مبنية على الجلسات",
    duration: "المدة",
    sessionCount: "عدد الجلسات",
    defaultPrice: "السعر الافتراضي",
    branchAccess: "صلاحية الفروع",
    allBranches: "جميع الفروع",
    homeBranchOnly: "الفرع الرئيسي فقط",
    freezePolicy: "سياسة التجميد",
    freezeAllowed: "التجميد مسموح",
    freezeNotAllowed: "التجميد غير مسموح",
    maxFreezeDays: "الحد الأقصى لأيام التجميد",
    noPlans: "لا توجد خطط بعد. أنشئ أول خطة.",
    allPlans: "جميع الخطط",
    createPlan: "إنشاء خطة",
    details: "التفاصيل",
    type: "النوع",
    sessions: "الجلسات",
    unlimited: "غير محدود",
    yes: "نعم",
    no: "لا",
  },
  memberships: {
    sell: "بيع اشتراك",
    renew: "تجديد الاشتراك",
    freeze: "تجميد الاشتراك",
    unfreeze: "إلغاء تجميد الاشتراك",
    activeMembershipExists: "يوجد اشتراك نشط",
    noMembershipHistory: "لا يوجد اشتراك للتجديد",
    noActiveMembership: "لا يوجد اشتراك نشط",
    noFrozenMembership: "لا يوجد اشتراك مجمد",
    freezeNotAllowed: "التجميد غير مسموح",
    currentMembership: "الاشتراك الحالي",
    frozenMembership: "الاشتراك المجمد",
    activeMembership: "الاشتراك النشط",
    freezeHistory: "سجل التجميد",
    confirmReactivation: "تأكيد إعادة التفعيل",
    plan: "الخطة",
    period: "الفترة",
    startDate: "تاريخ البدء",
    endDate: "تاريخ الانتهاء",
    finalPrice: "السعر النهائي",
    activateMembership: "تفعيل الاشتراك",
    reactivateMembership: "إعادة تفعيل الاشتراك",
    membershipPlan: "خطة الاشتراك",
    noPlansAvailable: "لا توجد خطط متاحة.",
    createPlanFirst: "أنشئ خطة أولاً.",
    freezeStartDate: "تاريخ بدء التجميد",
    freezeEndDate: "تاريخ انتهاء التجميد",
    freezePolicy: "سياسة التجميد",
    sellNewInstead: "بيع اشتراك جديد بدلاً من ذلك.",
    backToProfile: "العودة إلى الملف الشخصي",
    days: "أيام",
  },
  payments: {
    title: "المدفوعات",
    recordPayment: "تسجيل دفعة",
    membership: "الاشتراك",
    amount: "المبلغ",
    paymentMethod: "طريقة الدفع",
    paymentDate: "تاريخ الدفع",
    cash: "نقدي",
    card: "بطاقة",
    transfer: "تحويل",
    noActiveMembership: "لا يوجد اشتراك نشط",
    noMembershipsFound: "لم يتم العثور على اشتراكات لهذا العضو.",
    sellMembershipFirst: "بيع اشتراك أولاً.",
    noPayments: "لا توجد مدفوعات مسجلة.",
    statusLabel: "الحالة",
  },
  checkIn: {
    title: "تسجيل الدخول",
    description: "ابحث بالاسم أو رقم العضو لتسجيل زيارة.",
    memberNumber: "رقم العضو",
    searchPlaceholder: "ابحث بالاسم أو رقم العضو…",
    selectedMember: "العضو المختار",
    clearSelection: "تغيير",
    accessMethod: "طريقة الوصول",
    manualEntry: "إدخال يدوي",
    qrScan: "مسح QR",
    checkInButton: "تسجيل الدخول",
    accessGranted: "تم منح الوصول",
    accessDenied: "تم رفض الوصول",
    expires: "ينتهي",
    openGate: "فتح البوابة",
    gateOpened: "تم فتح البوابة",
    gateOpenFailed: "فشل فتح البوابة",
  },
  visits: {
    title: "الزيارات",
    allVisits: "جميع الزيارات",
    visitDetail: "تفاصيل الزيارة",
    visitInfo: "معلومات الزيارة",
    checkInTime: "وقت تسجيل الدخول",
    checkOutTime: "وقت تسجيل الخروج",
    checkOut: "تسجيل الخروج",
    inside: "داخل الصالة",
    checkedOut: "غادر",
    accessMethod: "طريقة الوصول",
    branch: "الفرع",
    member: "العضو",
    noVisits: "لا توجد زيارات مسجلة لهذا الفرع بعد.",
    noVisitsForPeriod: "لا توجد زيارات في هذه الفترة.",
    viewMemberProfile: "عرض ملف العضو ←",
    qrScan: "مسح QR",
    manualEntry: "إدخال يدوي",
    filterToday: "اليوم",
    filterWeek: "آخر 7 أيام",
    filterMonth: "آخر 30 يومًا",
    filterAll: "الكل",
    filterPresenceAll: "الكل",
    filterInside: "داخل الآن",
    filterCheckedOut: "غادر",
  },
  branches: {
    title: "الفروع",
    newBranch: "فرع جديد",
    editBranch: "تعديل الفرع",
    allBranches: "جميع الفروع",
    branchName: "اسم الفرع",
    address: "العنوان",
    phone: "الهاتف",
    country: "الدولة",
    statusLabel: "الحالة",
    details: "التفاصيل",
    noBranches: "لا توجد فروع بعد. أنشئ أول فرع.",
    createFirst: "أنشئ أول فرع.",
    branchId: "معرف الفرع",
    tenantId: "معرف المستأجر",
    createBranch: "إنشاء فرع",
    editBranchBtn: "تعديل الفرع",
  },
  users: {
    title: "المستخدمون والأدوار",
    staffUsers: "موظفو النظام",
    newUser: "مستخدم جديد",
    newStaffUser: "موظف جديد",
    allUsers: "جميع المستخدمين",
    staffDetails: "بيانات الموظف",
    fullName: "الاسم الكامل",
    email: "البريد الإلكتروني",
    username: "اسم المستخدم",
    role: "الدور",
    homeBranch: "الفرع الرئيسي",
    password: "كلمة المرور",
    noUsers: "لم يتم العثور على موظفين.",
    createUser: "إنشاء مستخدم",
    viewRoles: "عرض الأدوار والصلاحيات ←",
    userId: "معرف المستخدم",
    tenant: "المستأجر",
  },
  roles: {
    title: "الأدوار",
    staffUsers: "موظفو النظام",
    mvpAccessSummary: "ملخص صلاحيات الوصول",
    capability: "الإمكانية",
    owner: "المالك",
    manager: "المدير",
    frontDesk: "الاستقبال",
  },
  employees: {
    title: "الموظفون",
    allEmployees: "جميع الموظفين",
    newEmployee: "موظف جديد",
    newStaffEmployee: "موظف جديد",
    noEmployees: "لم يتم العثور على موظفين.",
    createEmployee: "إضافة موظف",
    employeeNumber: "رقم الموظف",
    fullName: "الاسم الكامل",
    andBranch: "والفرع مطلوبان. سيتم تعيين رقم الموظف تلقائياً.",
    branch: "الفرع",
    status: "الحالة",
    active: "نشط",
    inactive: "غير نشط",
    deactivate: "تعطيل",
    reactivate: "تفعيل",
    employeeDetails: "بيانات الموظف",
    employeeId: "معرف الموظف",
    personalInfo: "المعلومات الشخصية",
    employmentInfo: "معلومات التوظيف",
    systemAccess: "صلاحيات النظام",
    idNumber: "رقم الهوية",
    phone: "رقم الجوال",
    gender: "الجنس",
    male: "ذكر",
    female: "أنثى",
    dateOfBirth: "تاريخ الميلاد",
    job: "المسمى الوظيفي",
    salary: "الراتب",
    workType: "نوع العمل",
    fullTime: "دوام كامل",
    partTime: "دوام جزئي",
    trainee: "متدرب",
    startDate: "تاريخ بدء العمل",
    endDate: "تاريخ انتهاء العمل",
    isUser: "لديه حساب مستخدم في النظام",
  },
  notifications: {
    title: "الإشعارات",
    allNotifications: "جميع الإشعارات",
    notificationDetail: "تفاصيل الإشعار",
    notificationInfo: "معلومات الإشعار",
    subject: "الموضوع",
    body: "النص",
    channel: "القناة",
    statusLabel: "الحالة",
    created: "تاريخ الإنشاء",
    sent: "تاريخ الإرسال",
    failedReason: "سبب الفشل",
    member: "العضو",
    noNotifications: "لا توجد إشعارات مسجلة بعد.",
    viewMemberProfile: "عرض ملف العضو ←",
  },
  reports: {
    title: "التقارير",
    allReports: "جميع التقارير",
    activeMemberships: "الاشتراكات النشطة",
    expiredMemberships: "الاشتراكات المنتهية",
    visits: "الزيارات",
    payments: "المدفوعات",
    viewReport: "عرض التقرير ←",
    memberCol: "العضو",
    planCol: "الخطة",
    startCol: "البداية",
    expiresCol: "الانتهاء",
    expiredCol: "انتهى",
    statusCol: "الحالة",
    priceCol: "السعر",
    methodCol: "الطريقة",
    checkInTimeCol: "وقت الدخول",
    dateCol: "التاريخ",
    amountCol: "المبلغ",
    noActiveMemberships: "لم يتم العثور على اشتراكات نشطة.",
    noExpiredMemberships: "لم يتم العثور على اشتراكات منتهية.",
    noVisits: "لم يتم العثور على زيارات لهذا النطاق الزمني.",
    noPayments: "لم يتم العثور على مدفوعات لهذا النطاق الزمني.",
    totalPaid: "إجمالي المدفوع",
  },
  settings: {
    title: "الإعدادات",
    language: "اللغة",
    languageConfig: "إعدادات اللغة",
    defaultLanguage: "اللغة الافتراضية",
    defaultLanguageHelp: "اللغة التي يفتح بها التطبيق. يجب أن تكون من اللغات الممكّنة أدناه.",
    availableLanguages: "اللغات المتاحة",
    availableLanguagesHelp: "اختر اللغات التي تظهر في منتقي اللغة. يجب تمكين لغة واحدة على الأقل. لا يمكن تعطيل اللغة الافتراضية.",
    saveLanguageSettings: "حفظ إعدادات اللغة",
    supportedLanguages: "اللغات المدعومة",
    rightToLeft: "من اليمين إلى اليسار",
    leftToRight: "من اليسار إلى اليمين",
    defaultBadge: "افتراضي",
    notificationsTitle: "قواعد الإشعارات",
    notificationsDescription: "تحكم في الأحداث التي تُرسل إشعارات للأعضاء والقنوات المستخدمة للإرسال.",
    notificationEvents: "أحداث الإشعارات",
    eventMembershipExpiring: "الاشتراك على وشك الانتهاء",
    eventMembershipExpired: "الاشتراك منتهٍ",
    eventPaymentPending: "دفعة معلقة",
    eventMembershipActivated: "تم تفعيل الاشتراك",
    eventMembershipExpiringHelp: "إشعار الأعضاء قبل انتهاء اشتراكهم.",
    eventMembershipExpiredHelp: "إشعار الأعضاء في يوم انتهاء اشتراكهم.",
    eventPaymentPendingHelp: "تذكير الأعضاء الذين لديهم رصيد مستحق.",
    eventMembershipActivatedHelp: "رسالة ترحيب عند تفعيل اشتراك جديد.",
    channelsSectionTitle: "قنوات الإرسال",
    channelWhatsapp: "واتساب",
    channelEmail: "البريد الإلكتروني",
    daysBefore: "أيام قبل الانتهاء",
    daysBeforeUnit: "أيام",
    enableEvent: "تفعيل هذا الإشعار",
    saveNotificationSettings: "حفظ إعدادات الإشعارات",
    sendersSectionTitle: "هوية المرسل",
    sendersSectionDescription: "عنوان البريد الإلكتروني الذي سيظهر للأعضاء في خانة \"من\" عند استلام الإشعار.",
    senderEmailFrom: "عنوان البريد الإلكتروني للمرسل",
    senderEmailFromHelp: "عنوان البريد الإلكتروني الذي سيظهر للأعضاء في خانة \"من\"، مثل notices@yourgym.com.",
    display: "العرض",
    displayTitle: "إعدادات العرض",
    displayDescription: "تحكم في طريقة عرض التواريخ والقيم الأخرى في التطبيق.",
    dateFormat: "صيغة التاريخ",
    dateFormatHelp: "اختر كيف تظهر التواريخ في جميع أنحاء التطبيق.",
    dateFormatDDMMYYYY: "يوم/شهر/سنة (مثال: 24/06/2026)",
    dateFormatMMDDYYYY: "شهر/يوم/سنة (مثال: 06/24/2026)",
    saveDisplaySettings: "حفظ إعدادات العرض",
    whatsapp: "واتساب",
    whatsappTitle: "ربط واتساب",
    whatsappDescription: "اربط رقم واتساب الصالة حتى تُرسل إشعارات الأعضاء من رقمك الخاص.",
    whatsappConnectButton: "ربط واتساب",
    whatsappConnecting: "جارٍ بدء الجلسة…",
    whatsappConnected: "متصل",
    whatsappDisconnect: "قطع الاتصال",
    whatsappDisconnectConfirm: "هل تريد قطع اتصال واتساب؟ ستُرسل الإشعارات من رقم المنصة.",
    whatsappScanInstruction: "افتح واتساب على هاتفك ← الأجهزة المرتبطة ← ربط جهاز ← امسح رمز QR.",
    whatsappStarting: "جارٍ بدء جلسة واتساب — سيظهر رمز QR قريباً…",
    whatsappNotConfigured: "مفتاح SparkCo API غير مُعدّ على هذا الخادم.",
    gates: "البوابات الذكية",
    gatesTitle: "البوابات الذكية",
    gatesDescription: "إعداد البوابات الإلكترونية المثبتة في هذا الفرع. كل بوابة تتصل بجهاز BAS-IP ويمكن تخصيصها لجنس معين.",
    gatesEmpty: "لا توجد بوابات مضافة بعد.",
    gateAddButton: "إضافة بوابة",
    gateName: "اسم البوابة",
    gateGenderRestriction: "تقييد الجنس",
    gateGenderMale: "بوابة الرجال (ذكور فقط)",
    gateGenderFemale: "بوابة النساء (إناث فقط)",
    gateGenderNone: "بدون تقييد",
    gateDeviceUrl: "IP الجهاز / الرابط",
    gateDeviceUrlHelp: "عنوان الشبكة المحلية لجهاز BAS-IP، مثل http://192.168.1.178",
    gateDeviceUsername: "اسم مستخدم الجهاز",
    gateDevicePassword: "كلمة مرور الجهاز",
    gateDevicePasswordHelp: "اتركها فارغة للإبقاء على كلمة المرور الحالية.",
    gateLockNumber: "رقم القفل",
    gateEnabled: "مفعّلة",
    gateCreate: "إنشاء بوابة",
    gateUpdate: "حفظ التغييرات",
    gateDelete: "حذف البوابة",
    gateDeleteConfirm: "حذف هذه البوابة؟ لا يمكن التراجع عن هذا الإجراء.",
    gateDeviceConfigured: "الجهاز مضبوط",
    gateDeviceNotConfigured: "لا يوجد جهاز مضبوط",
  },
};

const he: Dict = {
  nav: {
    dashboard: "לוח בקרה",
    branches: "סניפים",
    usersRoles: "משתמשים ותפקידים",
    employees: "עובדים",
    membershipPlans: "תוכניות מנוי",
    members: "חברים",
    checkIn: "כניסה",
    visits: "ביקורים",
    notifications: "התראות",
    reports: "דוחות",
    settings: "הגדרות",
  },
  shell: {
    appName: "Spark Gym ERP",
    appTitle: "מסוף תפעולי",
    appDescription: "סביבת עבודה לניהול מנויים, בקרת גישה, דיווח ועבודת קבלה.",
    pilotBranchContext: "הקשר סניף פיילוט",
    searchMembers: "חפש חברים",
  },
  auth: {
    signIn: "כניסה",
    signOut: "יציאה",
    emailOrUsername: "דוא\"ל או שם משתמש",
    password: "סיסמה",
    continue: "המשך",
    signingIn: "מתחבר...",
    accessConsole: "גישה למסוף התפעולי",
    signInDescription: "התחבר עם חשבון פיילוט לכניסה למערכת המוגנת.",
    pilotCredentials: "פרטי כניסה לפיילוט",
    mvpFocus: "מיקוד MVP",
    access: "גישה",
    reporting: "דיווח",
  },
  actions: {
    save: "שמור",
    cancel: "ביטול",
    edit: "עריכה",
    create: "צור",
    back: "חזור",
    allItems: "כל הפריטים",
    newItem: "פריט חדש",
    view: "הצג",
    details: "פרטים",
    saveChanges: "שמור שינויים",
  },
  status: {
    active: "פעיל",
    inactive: "לא פעיל",
    frozen: "מוקפא",
    expired: "פג תוקף",
    cancelled: "מבוטל",
    draft: "טיוטה",
    paid: "שולם",
    pending: "ממתין",
    failed: "נכשל",
    refunded: "הוחזר",
  },
  dashboard: {
    title: "לוח תפעולי",
    overviewTitle: "סקירת סניף",
    overviewTenantLabel: "ארגון",
    overviewRoleLabel: "תפקיד",
    overviewAsOfLabel: "תאריך דיווח",
    overviewDataHelper: "כל הנתונים משקפים מידע נכון לתאריך זה.",
    operationsGuideTitle: "מדריך תפעול",
    guide1: "בדוק מנויים שפגים ופנה לחברים לפני סיום התוכנית שלהם.",
    guide2: "עקוב אחר יומן כניסות היום לניטור הנוכחות.",
    guide3: "השתמש בפעולות המהירות למשימות נפוצות בדלפק הקבלה.",
    guide4: "עבור לדוחות לקבלת נתונים מפורטים על מנויים, ביקורים ותשלומים.",
    cardActiveMemberships: "מנויים פעילים",
    cardActiveMembershipsHelper: "חברים עם תוכנית פעילה",
    cardExpiringWeek: "פגים השבוע",
    cardExpiringWeekHelper: "תוכניות פעילות שפגות תוך 7 ימים",
    cardTodayCheckIns: "כניסות היום",
    cardTodayCheckInsHelper: "ביקורים שנרשמו בסניף זה היום",
    cardPaymentsLogged: "תשלומים היום",
    cardPaymentsLoggedHelper: "עסקאות ששולמו בסניף זה",
    actionCreateMember: "הוסף חבר",
    actionSellMembership: "מכור מנוי",
    actionRecordPayment: "רשום תשלום",
    actionCheckInMember: "כניסה",
  },
  members: {
    title: "חברים",
    newMember: "חבר חדש",
    editMember: "עריכת חבר",
    profile: "פרופיל",
    memberships: "מנויים",
    payments: "תשלומים",
    quickActions: "פעולות מהירות",
    editDetails: "ערוך פרטי חבר",
    recordPayment: "רשום תשלום",
    sellMembership: "מכור מנוי",
    renewMembership: "חדש מנוי",
    freezeMembership: "הקפא מנוי",
    reactivateMembership: "הפעל מחדש מנוי",
    fullName: "שם מלא",
    phone: "טלפון",
    email: "דוא\"ל",
    dateOfBirth: "תאריך לידה",
    sex: "מין",
    male: "זכר",
    female: "נקבה",
    idNumber: "מספר תעודת זהות",
    address: "כתובת",
    joinDate: "תאריך הצטרפות",
    height: "גובה (ס\"מ)",
    weight: "משקל (ק\"ג)",
    registeredEmployee: "נרשם על ידי",
    photo: "תמונה",
    uploadPhoto: "העלה תמונה",
    takePhoto: "צלם תמונה",
    changePhoto: "שנה תמונה",
    homeBranch: "סניף בית",
    emergencyContact: "איש קשר לחירום",
    medicalNotes: "הערות רפואיות",
    memberNumber: "מספר חבר",
    allMembers: "כל החברים",
    noMembers: "אין חברים עדיין. צור את הראשון.",
    createFirst: "צור את הראשון.",
    basicInfo: "מידע בסיסי",
    contactName: "שם איש קשר",
    contactPhone: "טלפון איש קשר",
    notes: "הערות",
    statusLabel: "סטטוס",
    showQrCode: "הצג קוד QR",
    qrCode: "קוד QR של חבר",
    qrCodeDescription: "הצג קוד QR זה בכניסה לחדר הכושר לפתיחת השער.",
    printQrCode: "הדפס",
    sendQrWhatsApp: "שלח ב-WhatsApp",
    qrSentSuccess: "קוד QR נשלח ב-WhatsApp!",
    qrSentFailed: "שליחת קוד QR נכשלה.",
  },
  plans: {
    title: "תוכניות מנוי",
    newPlan: "תוכנית חדשה",
    editPlan: "ערוך תוכנית",
    planName: "שם תוכנית",
    planType: "סוג תוכנית",
    planDetails: "פרטי תוכנית",
    durationBased: "מבוסס משך",
    sessionBased: "מבוסס מפגשים",
    duration: "משך",
    sessionCount: "מספר מפגשים",
    defaultPrice: "מחיר ברירת מחדל",
    branchAccess: "גישה לסניף",
    allBranches: "כל הסניפים",
    homeBranchOnly: "סניף בית בלבד",
    freezePolicy: "מדיניות הקפאה",
    freezeAllowed: "הקפאה מותרת",
    freezeNotAllowed: "הקפאה אינה מותרת",
    maxFreezeDays: "מקסימום ימי הקפאה",
    noPlans: "אין תוכניות עדיין. צור את הראשונה.",
    allPlans: "כל התוכניות",
    createPlan: "צור תוכנית",
    details: "פרטים",
    type: "סוג",
    sessions: "מפגשים",
    unlimited: "ללא הגבלה",
    yes: "כן",
    no: "לא",
  },
  memberships: {
    sell: "מכור מנוי",
    renew: "חדש מנוי",
    freeze: "הקפא מנוי",
    unfreeze: "בטל הקפאת מנוי",
    activeMembershipExists: "קיים מנוי פעיל",
    noMembershipHistory: "אין מנוי לחידוש",
    noActiveMembership: "אין מנוי פעיל",
    noFrozenMembership: "אין מנוי מוקפא",
    freezeNotAllowed: "הקפאה אינה מותרת",
    currentMembership: "מנוי נוכחי",
    frozenMembership: "מנוי מוקפא",
    activeMembership: "מנוי פעיל",
    freezeHistory: "היסטוריית הקפאות",
    confirmReactivation: "אשר הפעלה מחדש",
    plan: "תוכנית",
    period: "תקופה",
    startDate: "תאריך התחלה",
    endDate: "תאריך סיום",
    finalPrice: "מחיר סופי",
    activateMembership: "הפעל מנוי",
    reactivateMembership: "הפעל מחדש מנוי",
    membershipPlan: "תוכנית מנוי",
    noPlansAvailable: "אין תוכניות זמינות.",
    createPlanFirst: "צור תוכנית תחילה.",
    freezeStartDate: "תאריך תחילת הקפאה",
    freezeEndDate: "תאריך סיום הקפאה",
    freezePolicy: "מדיניות הקפאה",
    sellNewInstead: "מכור מנוי חדש במקום.",
    backToProfile: "חזור לפרופיל",
    days: "ימים",
  },
  payments: {
    title: "תשלומים",
    recordPayment: "רשום תשלום",
    membership: "מנוי",
    amount: "סכום",
    paymentMethod: "אמצעי תשלום",
    paymentDate: "תאריך תשלום",
    cash: "מזומן",
    card: "כרטיס",
    transfer: "העברה",
    noActiveMembership: "אין מנוי פעיל",
    noMembershipsFound: "לא נמצאו מנויים לחבר זה.",
    sellMembershipFirst: "מכור מנוי תחילה.",
    noPayments: "לא נרשמו תשלומים.",
    statusLabel: "סטטוס",
  },
  checkIn: {
    title: "כניסה",
    description: "חפש לפי שם או מספר חבר לרישום ביקור.",
    memberNumber: "מספר חבר",
    searchPlaceholder: "חפש לפי שם או מספר חבר…",
    selectedMember: "חבר נבחר",
    clearSelection: "שנה",
    accessMethod: "שיטת גישה",
    manualEntry: "הזנה ידנית",
    qrScan: "סריקת QR",
    checkInButton: "כניסה",
    accessGranted: "גישה אושרה",
    accessDenied: "גישה נדחתה",
    expires: "פג תוקף",
    openGate: "פתח שער",
    gateOpened: "השער נפתח",
    gateOpenFailed: "פתיחת השער נכשלה",
  },
  visits: {
    title: "ביקורים",
    allVisits: "כל הביקורים",
    visitDetail: "פרטי ביקור",
    visitInfo: "מידע על ביקור",
    checkInTime: "שעת כניסה",
    checkOutTime: "שעת יציאה",
    checkOut: "יציאה",
    inside: "בפנים",
    checkedOut: "יצא",
    accessMethod: "שיטת גישה",
    branch: "סניף",
    member: "חבר",
    noVisits: "לא נרשמו ביקורים לסניף זה עדיין.",
    noVisitsForPeriod: "לא נמצאו ביקורים לתקופה זו.",
    viewMemberProfile: "הצג פרופיל חבר ←",
    qrScan: "סריקת QR",
    manualEntry: "הזנה ידנית",
    filterToday: "היום",
    filterWeek: "7 ימים אחרונים",
    filterMonth: "30 ימים אחרונים",
    filterAll: "הכל",
    filterPresenceAll: "הכל",
    filterInside: "בפנים כעת",
    filterCheckedOut: "יצא",
  },
  branches: {
    title: "סניפים",
    newBranch: "סניף חדש",
    editBranch: "ערוך סניף",
    allBranches: "כל הסניפים",
    branchName: "שם סניף",
    address: "כתובת",
    phone: "טלפון",
    country: "מדינה",
    statusLabel: "סטטוס",
    details: "פרטים",
    noBranches: "אין סניפים עדיין. צור את הראשון.",
    createFirst: "צור את הראשון.",
    branchId: "מזהה סניף",
    tenantId: "מזהה דייר",
    createBranch: "צור סניף",
    editBranchBtn: "ערוך סניף",
  },
  users: {
    title: "משתמשים ותפקידים",
    staffUsers: "משתמשי צוות",
    newUser: "משתמש חדש",
    newStaffUser: "איש צוות חדש",
    allUsers: "כל המשתמשים",
    staffDetails: "פרטי צוות",
    fullName: "שם מלא",
    email: "דוא\"ל",
    username: "שם משתמש",
    role: "תפקיד",
    homeBranch: "סניף בית",
    password: "סיסמה",
    noUsers: "לא נמצאו משתמשי צוות.",
    createUser: "צור משתמש",
    viewRoles: "הצג תפקידים והרשאות ←",
    userId: "מזהה משתמש",
    tenant: "דייר",
  },
  roles: {
    title: "תפקידים",
    staffUsers: "משתמשי צוות",
    mvpAccessSummary: "סיכום הרשאות גישה",
    capability: "יכולת",
    owner: "בעלים",
    manager: "מנהל",
    frontDesk: "קבלה",
  },
  employees: {
    title: "עובדים",
    allEmployees: "כל העובדים",
    newEmployee: "עובד חדש",
    newStaffEmployee: "עובד צוות חדש",
    noEmployees: "לא נמצאו עובדים.",
    createEmployee: "צור עובד",
    employeeNumber: "מספר עובד",
    fullName: "שם מלא",
    andBranch: "וסניף נדרשים. מספר עובד יוקצה אוטומטית.",
    branch: "סניף",
    status: "סטטוס",
    active: "פעיל",
    inactive: "לא פעיל",
    deactivate: "השבת",
    reactivate: "הפעל מחדש",
    employeeDetails: "פרטי עובד",
    employeeId: "מזהה עובד",
    personalInfo: "מידע אישי",
    employmentInfo: "מידע על העסקה",
    systemAccess: "גישה למערכת",
    idNumber: "מספר תעודת זהות",
    phone: "מספר נייד",
    gender: "מין",
    male: "זכר",
    female: "נקבה",
    dateOfBirth: "תאריך לידה",
    job: "תפקיד",
    salary: "שכר",
    workType: "סוג משרה",
    fullTime: "משרה מלאה",
    partTime: "משרה חלקית",
    trainee: "מתמחה",
    startDate: "תאריך תחילת עבודה",
    endDate: "תאריך סיום עבודה",
    isUser: "בעל חשבון משתמש במערכת",
  },
  notifications: {
    title: "התראות",
    allNotifications: "כל ההתראות",
    notificationDetail: "פרטי התראה",
    notificationInfo: "מידע על התראה",
    subject: "נושא",
    body: "גוף ההודעה",
    channel: "ערוץ",
    statusLabel: "סטטוס",
    created: "נוצר",
    sent: "נשלח",
    failedReason: "סיבת הכישלון",
    member: "חבר",
    noNotifications: "לא נרשמו התראות עדיין.",
    viewMemberProfile: "הצג פרופיל חבר ←",
  },
  reports: {
    title: "דוחות",
    allReports: "כל הדוחות",
    activeMemberships: "מנויים פעילים",
    expiredMemberships: "מנויים שפג תוקפם",
    visits: "ביקורים",
    payments: "תשלומים",
    viewReport: "הצג דוח ←",
    memberCol: "חבר",
    planCol: "תוכנית",
    startCol: "התחלה",
    expiresCol: "פקיעה",
    expiredCol: "פג",
    statusCol: "סטטוס",
    priceCol: "מחיר",
    methodCol: "שיטה",
    checkInTimeCol: "שעת כניסה",
    dateCol: "תאריך",
    amountCol: "סכום",
    noActiveMemberships: "לא נמצאו מנויים פעילים.",
    noExpiredMemberships: "לא נמצאו מנויים שפג תוקפם.",
    noVisits: "לא נמצאו ביקורים לטווח תאריכים זה.",
    noPayments: "לא נמצאו תשלומים לטווח תאריכים זה.",
    totalPaid: "סה\"כ שולם",
  },
  settings: {
    title: "הגדרות",
    language: "שפה",
    languageConfig: "הגדרות שפה",
    defaultLanguage: "שפת ברירת מחדל",
    defaultLanguageHelp: "השפה שבה נפתחת האפליקציה. חייבת להיות אחת השפות המופעלות למטה.",
    availableLanguages: "שפות זמינות",
    availableLanguagesHelp: "בחר אילו שפות מופיעות בבורר השפות. לפחות שפה אחת חייבת להישאר מופעלת. לא ניתן להשבית את שפת ברירת המחדל.",
    saveLanguageSettings: "שמור הגדרות שפה",
    supportedLanguages: "שפות נתמכות",
    rightToLeft: "ימין לשמאל",
    leftToRight: "שמאל לימין",
    defaultBadge: "ברירת מחדל",
    notificationsTitle: "כללי התראות",
    notificationsDescription: "קבע אילו אירועים מפעילים התראות לחברים ובאיזה ערוץ הן נשלחות.",
    notificationEvents: "אירועי התראות",
    eventMembershipExpiring: "מנוי עומד לפוג",
    eventMembershipExpired: "מנוי פג תוקף",
    eventPaymentPending: "תשלום ממתין",
    eventMembershipActivated: "מנוי הופעל",
    eventMembershipExpiringHelp: "שלח התראה לחברים לפני שמנויהם פג.",
    eventMembershipExpiredHelp: "שלח התראה לחברים ביום שבו מנויהם פג.",
    eventPaymentPendingHelp: "תזכורת לחברים עם יתרה פתוחה.",
    eventMembershipActivatedHelp: "הודעת ברוך הבא כאשר מנוי חדש מופעל.",
    channelsSectionTitle: "ערוצי מסירה",
    channelWhatsapp: "WhatsApp",
    channelEmail: "דוא\"ל",
    daysBefore: "ימים לפני פקיעה",
    daysBeforeUnit: "ימים",
    enableEvent: "הפעל התראה זו",
    saveNotificationSettings: "שמור הגדרות התראות",
    sendersSectionTitle: "זהות השולח",
    sendersSectionDescription: "כתובת הדוא\"ל שהחברים יראו בשדה \"מאת\" כשמתקבלת התראה.",
    senderEmailFrom: "כתובת דוא\"ל של השולח",
    senderEmailFromHelp: "כתובת הדוא\"ל שהחברים יראו בשדה \"מאת\", למשל notices@yourgym.com.",
    display: "תצוגה",
    displayTitle: "הגדרות תצוגה",
    displayDescription: "שלוט בצורה שבה תאריכים וערכים אחרים מוצגים ביישום.",
    dateFormat: "פורמט תאריך",
    dateFormatHelp: "בחר כיצד מוצגים תאריכים בכל רחבי היישום.",
    dateFormatDDMMYYYY: "יום/חודש/שנה (לדוגמה: 24/06/2026)",
    dateFormatMMDDYYYY: "חודש/יום/שנה (לדוגמה: 06/24/2026)",
    saveDisplaySettings: "שמור הגדרות תצוגה",
    whatsapp: "WhatsApp",
    whatsappTitle: "חיבור WhatsApp",
    whatsappDescription: "חבר את מספר ה-WhatsApp של המכון כדי שהתראות לחברים יישלחו מהמספר שלך.",
    whatsappConnectButton: "חבר WhatsApp",
    whatsappConnecting: "מפעיל סשן…",
    whatsappConnected: "מחובר",
    whatsappDisconnect: "נתק",
    whatsappDisconnectConfirm: "לנתק WhatsApp? ההתראות יישלחו ממספר הפלטפורמה.",
    whatsappScanInstruction: "פתח WhatsApp בטלפון ← מכשירים מקושרים ← קשר מכשיר ← סרוק את קוד ה-QR.",
    whatsappStarting: "מפעיל סשן WhatsApp — קוד QR יופיע בקרוב…",
    whatsappNotConfigured: "מפתח SparkCo API לא מוגדר בשרת.",
    gates: "שערים חכמים",
    gatesTitle: "שערים חכמים",
    gatesDescription: "הגדר את השערים האלקטרוניים המותקנים בסניף זה. כל שער מתחבר למכשיר BAS-IP וניתן להגבילו לפי מגדר.",
    gatesEmpty: "אין שערים מוגדרים עדיין.",
    gateAddButton: "הוסף שער",
    gateName: "שם השער",
    gateGenderRestriction: "הגבלת מגדר",
    gateGenderMale: "שער גברים (גברים בלבד)",
    gateGenderFemale: "שער נשים (נשים בלבד)",
    gateGenderNone: "ללא הגבלה",
    gateDeviceUrl: "IP המכשיר / כתובת URL",
    gateDeviceUrlHelp: "כתובת הרשת המקומית של מכשיר BAS-IP, לדוגמה http://192.168.1.178",
    gateDeviceUsername: "שם משתמש של המכשיר",
    gateDevicePassword: "סיסמת המכשיר",
    gateDevicePasswordHelp: "השאר ריק כדי לשמור על הסיסמה הקיימת.",
    gateLockNumber: "מספר מנעול",
    gateEnabled: "פעיל",
    gateCreate: "צור שער",
    gateUpdate: "שמור שינויים",
    gateDelete: "מחק שער",
    gateDeleteConfirm: "למחוק שער זה? לא ניתן לבטל פעולה זו.",
    gateDeviceConfigured: "מכשיר מוגדר",
    gateDeviceNotConfigured: "אין מכשיר מוגדר",
  },
};

const dictionaries: Record<Lang, Dict> = { en, ar, he };

export async function getLang(): Promise<Lang> {
  const cookieStore = await cookies();
  const lang = cookieStore.get("spark_gym_lang")?.value as Lang | undefined;
  return lang && lang in dictionaries ? lang : "en";
}

export async function getT(): Promise<Dict> {
  const lang = await getLang();
  return dictionaries[lang];
}

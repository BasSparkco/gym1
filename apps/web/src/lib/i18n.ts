import "server-only";
import { cookies } from "next/headers";

export type Lang = "en" | "ar" | "he";

export function formatDict(template: string, vars: Record<string, string | number>): string {
  return Object.entries(vars).reduce((acc, [key, value]) => acc.replaceAll(`{${key}}`, String(value)), template);
}

export type Dict = {
  nav: {
    dashboard: string;
    branches: string;
    usersRoles: string;
    employees: string;
    membershipPlans: string;
    lockers: string;
    announcements: string;
    closedDates: string;
    members: string;
    checkIn: string;
    employeeCheckIn: string;
    attendanceReport: string;
    visits: string;
    notifications: string;
    reports: string;
    settings: string;
    classes: string;
    groupOverview: string;
    groupPeople: string;
    groupOperations: string;
    groupInsights: string;
  };
  shell: {
    appName: string;
    appTitle: string;
    appDescription: string;
    pilotBranchContext: string;
    searchMembers: string;
    openMenu: string;
    closeMenu: string;
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
    prev: string;
    next: string;
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
    latestCheckIns: string;
    noRecentCheckIns: string;
    expiringMemberships: string;
    noExpiringMemberships: string;
    branchesAtGlance: string;
    branchesAtGlanceHelper: string;
  };
  members: {
    title: string;
    newMember: string;
    editMember: string;
    profile: string;
    memberships: string;
    payments: string;
    lockers: string;
    quickActions: string;
    editDetails: string;
    recordPayment: string;
    sellMembership: string;
    sellLocker: string;
    noLockersYet: string;
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
    debt: string;
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
    filterAll: string;
    filterActiveMembership: string;
    filterFrozen: string;
    filterExpiringSoon: string;
    filterNoMembership: string;
    totalMembers: string;
    activeMemberships: string;
    expiringIn30Days: string;
    memberCountSingular: string;
    memberCountPlural: string;
    matchingFilters: string;
    total: string;
    identityTitle: string;
    contactTitle: string;
    physicalProfileTitle: string;
    memberSince: string;
    age: string;
    ageYears: string;
    bmi: string;
    daysLeftSingular: string;
    daysLeftPlural: string;
    noEmergencyContactLong: string;
    addEmergencyContact: string;
    noMembershipsYet: string;
    rfidTagLabel: string;
    heightStat: string;
    weightStat: string;
    searchPlaceholder: string;
    filterAllPlans: string;
    showingResults: string;
  };
  plans: {
    title: string;
    listDescription: string;
    newPlan: string;
    editPlan: string;
    planName: string;
    planType: string;
    planDetails: string;
    durationBased: string;
    mostSubscribed: string;
    sessionBased: string;
    duration: string;
    sessionCount: string;
    defaultPrice: string;
    branchAccess: string;
    allBranches: string;
    homeBranchOnly: string;
    programAccess: string;
    allPrograms: string;
    selectedProgramsOnly: string;
    noProgramsYet: string;
    noProgramsSelected: string;
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
    currentDebt: string;
  };
  lockers: {
    title: string;
    listDescription: string;
    newLocker: string;
    editLocker: string;
    lockerNumber: string;
    size: string;
    sizeNone: string;
    sizeSmall: string;
    sizeMedium: string;
    sizeLarge: string;
    monthlyPrice: string;
    statusLabel: string;
    statusAvailable: string;
    statusOccupied: string;
    statusMaintenance: string;
    quantity: string;
    quantityHelp: string;
    createLocker: string;
    saveChanges: string;
    noLockers: string;
    allLockers: string;
    details: string;
    branch: string;
    delete: string;
    deleteConfirm: string;
    sell: string;
    sellDescription: string;
    selectLocker: string;
    noLockersAvailable: string;
    createLockerFirst: string;
    activeRentalExists: string;
    startDate: string;
    endDate: string;
    finalPrice: string;
    activateRental: string;
    cancelRental: string;
    rentalHistory: string;
    noRentalsYet: string;
    rentedBy: string;
  };
  announcements: {
    title: string;
    listDescription: string;
    newAnnouncement: string;
    newAnnouncementDescription: string;
    announcementTitle: string;
    titlePlaceholder: string;
    body: string;
    bodyPlaceholder: string;
    branch: string;
    allBranches: string;
    sendAnnouncement: string;
    noAnnouncements: string;
    pushSentCount: string;
    delete: string;
  };
  closedDates: {
    title: string;
    listDescription: string;
    newClosedDate: string;
    date: string;
    branch: string;
    allBranches: string;
    reason: string;
    reasonPlaceholder: string;
    createClosedDate: string;
    noClosedDates: string;
    delete: string;
  };
  checkIn: {
    title: string;
    description: string;
    manualTitle: string;
    manualDescription: string;
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
    listDescription: string;
    newBranch: string;
    editBranch: string;
    allBranches: string;
    branchName: string;
    address: string;
    phone: string;
    country: string;
    currency: string;
    statusLabel: string;
    details: string;
    noBranches: string;
    createFirst: string;
    branchId: string;
    tenantId: string;
    createBranch: string;
    editBranchBtn: string;
    branchLogo: string;
    branchLogoHelp: string;
  };
  users: {
    title: string;
    listDescription: string;
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
    linkToEmployee: string;
    linkToEmployeeHint: string;
    noLinkableEmployees: string;
    searchEmployee: string;
    linkedEmployee: string;
    notLinked: string;
    editLink: string;
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
    listDescription: string;
    allEmployees: string;
    newEmployee: string;
    newStaffEmployee: string;
    noEmployees: string;
    filterAllBranches: string;
    filterAllPositions: string;
    searchPlaceholder: string;
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
    isCoach: string;
  };
  attendance: {
    checkInTitle: string;
    checkInDescription: string;
    employeeNumber: string;
    checkInButton: string;
    checkOutButton: string;
    accessGranted: string;
    accessDenied: string;
    qrCode: string;
    qrCodeDescription: string;
    downloadQrCode: string;
    printQrCode: string;
    gateAccess: string;
    allGates: string;
    selectedGatesOnly: string;
    noGatesYet: string;
    recentAttendance: string;
    noRecentAttendance: string;
    checkInTime: string;
    checkOutTime: string;
    stillCheckedIn: string;
    reportTitle: string;
    reportDescription: string;
    dateFrom: string;
    dateTo: string;
    filter: string;
    totalHours: string;
    daysPresent: string;
    noAttendanceData: string;
  };
  notifications: {
    title: string;
    listDescription: string;
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
    indexDescription: string;
    activeMembershipsCardDescription: string;
    expiredMembershipsCardDescription: string;
    visitsCardDescription: string;
    paymentsCardDescription: string;
    membersBySexCardDescription: string;
    registrationsByEmployeeCardDescription: string;
    planPerformanceCardDescription: string;
    membershipStatusCardDescription: string;
    expiringSoonCardDescription: string;
    upcomingBirthdaysCardDescription: string;
    newMembersGrowthCardDescription: string;
    activeMembershipsDescription: string;
    expiredMembershipsDescription: string;
    visitsDescription: string;
    membersBySexDescription: string;
    membershipStatusDescription: string;
    expiringSoonDescription: string;
    upcomingBirthdaysDescription: string;
    newMembersGrowthDescription: string;
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
    membersBySex: string;
    registrationsByEmployee: string;
    planPerformance: string;
    membershipStatusBreakdown: string;
    expiringSoon: string;
    upcomingBirthdays: string;
    newMembersGrowth: string;
    sexCol: string;
    maleLabel: string;
    femaleLabel: string;
    unspecifiedLabel: string;
    activeCol: string;
    totalCol: string;
    employeeCol: string;
    countCol: string;
    unassignedLabel: string;
    allEmployeesLabel: string;
    filterLabel: string;
    applyFilter: string;
    dateFromLabel: string;
    dateToLabel: string;
    daysLabel: string;
    viewMembers: string;
    planTypeCol: string;
    revenueCol: string;
    daysUntilCol: string;
    birthdayCol: string;
    phoneCol: string;
    noResults: string;
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
    activeBranchTitle: string;
    activeBranchDescription: string;
    currentBranch: string;
    switchBranch: string;
    noOtherBranches: string;
    createABranch: string;
    current: string;
    switchAction: string;
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
    options: string;
    optionsTitle: string;
    optionsDescription: string;
    checkInOutSectionTitle: string;
    checkOutToggleLabel: string;
    checkOutToggleHelp: string;
    dataVisibilityTitle: string;
    dataVisibilityHelp: string;
    dataVisibilityAllBranches: string;
    dataVisibilityAllBranchesHelp: string;
    dataVisibilityActiveBranch: string;
    dataVisibilityActiveBranchHelp: string;
    reportingCurrencyTitle: string;
    reportingCurrencyHelp: string;
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
    whatsappReconnecting: string;
    whatsappRefreshHint: string;
    whatsappGenericError: string;
    logoSectionTitle: string;
    logoSectionHelp: string;
    logoModeLabel: string;
    logoModeShared: string;
    logoModeSharedHelp: string;
    logoModePerBranch: string;
    logoModePerBranchHelp: string;
    logoUpload: string;
    logoChange: string;
    logoRemove: string;
    logoUploading: string;
    logoUploadError: string;
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
  classes: {
    title: string;
    programsTitle: string;
    listDescription: string;
    newProgram: string;
    noPrograms: string;
    todaysSessions: string;
    todaysSessionsHelper: string;
    noSessionsToday: string;
    statusInProgress: string;
    statusUpcoming: string;
    statusCompleted: string;
    statusLowBookings: string;
    programName: string;
    description: string;
    color: string;
    maxMembers: string;
    defaultCoach: string;
    noCoach: string;
    allBranches: string;
    createProgram: string;
    programDetails: string;
    allPrograms: string;
    sessionsTitle: string;
    newSession: string;
    program: string;
    coach: string;
    room: string;
    date: string;
    startTime: string;
    endTime: string;
    capacity: string;
    bookedCount: string;
    repeatWeeks: string;
    scheduleSingle: string;
    scheduleRecurring: string;
    noSessions: string;
    cancelSession: string;
    viewSession: string;
    sessionDetails: string;
    bookingsTitle: string;
    bookMember: string;
    member: string;
    selectMember: string;
    book: string;
    noBookings: string;
    cancelBooking: string;
    bookingBooked: string;
    bookingWaitlisted: string;
    bookingAttended: string;
    bookingNoShow: string;
    bookingCancelled: string;
    coachProfileTitle: string;
    specializations: string;
    certifications: string;
    saveCoachProfile: string;
    notACoach: string;
    price: string;
    startDate: string;
    endDate: string;
    scheduleTitle: string;
    scheduleHint: string;
    dayOfWeek: string;
    addSlot: string;
    removeSlot: string;
    saveSchedule: string;
    generateSessions: string;
    daySunday: string;
    dayMonday: string;
    dayTuesday: string;
    dayWednesday: string;
    dayThursday: string;
    dayFriday: string;
    daySaturday: string;
    rosterTitle: string;
    rosterHint: string;
    addStudent: string;
    noStudentsRegistered: string;
    unregisterStudent: string;
    registerForCourse: string;
    selectCourse: string;
    noCoursesAvailable: string;
    coursesTitle: string;
    noCoursesYet: string;
    attendanceReportTitle: string;
    attendanceReportHint: string;
    viewReport: string;
    present: string;
    absent: string;
    totalLessons: string;
    noLessonsYet: string;
    markPresent: string;
    markAbsent: string;
  };
};

const en: Dict = {
  nav: {
    dashboard: "Dashboard",
    branches: "Branches",
    usersRoles: "Users & Roles",
    employees: "Employees",
    membershipPlans: "Membership Plans",
    lockers: "Lockers",
    announcements: "Announcements",
    closedDates: "Closed Dates",
    members: "Members",
    checkIn: "Check-In",
    employeeCheckIn: "Staff Check-In",
    attendanceReport: "Attendance Report",
    visits: "Visits",
    notifications: "Notifications",
    reports: "Reports",
    settings: "Settings",
    classes: "Courses",
    groupOverview: "Overview",
    groupPeople: "People",
    groupOperations: "Operations",
    groupInsights: "Insights",
  },
  shell: {
    appName: "Spark Gym ERP",
    appTitle: "Operations Console",
    appDescription: "MVP workspace for memberships, access control, reporting, and front-desk operations.",
    pilotBranchContext: "Pilot Branch Context",
    searchMembers: "Search members",
    openMenu: "Open menu",
    closeMenu: "Close menu",
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
    prev: "Prev",
    next: "Next",
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
    latestCheckIns: "Latest check-ins",
    noRecentCheckIns: "No check-ins recorded yet today.",
    expiringMemberships: "Memberships expiring soon",
    noExpiringMemberships: "Nothing expiring in the next 7 days.",
    branchesAtGlance: "Branches at a glance",
    branchesAtGlanceHelper: "Active members and today's check-ins per branch.",
  },
  members: {
    title: "Members",
    newMember: "New member",
    editMember: "Edit member",
    profile: "Profile",
    memberships: "Memberships",
    payments: "Payments",
    lockers: "Lockers",
    quickActions: "Quick actions",
    editDetails: "Edit member details",
    recordPayment: "Record payment",
    sellMembership: "Sell membership",
    sellLocker: "Sell locker",
    noLockersYet: "No locker rentals yet.",
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
    debt: "Debt",
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
    filterAll: "All",
    filterActiveMembership: "Active membership",
    filterFrozen: "Frozen",
    filterExpiringSoon: "Expiring soon",
    filterNoMembership: "No membership",
    totalMembers: "Total members",
    activeMemberships: "Active memberships",
    expiringIn30Days: "Expiring in 30 days",
    memberCountSingular: "member",
    memberCountPlural: "members",
    matchingFilters: "matching filters",
    total: "total",
    identityTitle: "Identity",
    contactTitle: "Contact",
    physicalProfileTitle: "Physical profile",
    memberSince: "Member since",
    age: "Age",
    ageYears: "{count} yrs",
    bmi: "BMI",
    daysLeftSingular: "{count} day left",
    daysLeftPlural: "{count} days left",
    noEmergencyContactLong: "No emergency contact on file. Every member should have one before their first session.",
    addEmergencyContact: "Add emergency contact",
    noMembershipsYet: "No memberships yet.",
    rfidTagLabel: "RFID tag",
    heightStat: "Height",
    weightStat: "Weight",
    searchPlaceholder: "Search by name, phone or ID…",
    filterAllPlans: "All plans",
    showingResults: "Showing {from}–{to} of {total}",
  },
  plans: {
    title: "Membership plans",
    listDescription: "{count} plan{plural} configured for this tenant.",
    newPlan: "New plan",
    editPlan: "Edit plan",
    planName: "Plan name",
    planType: "Plan type",
    planDetails: "Plan details",
    durationBased: "Duration-based",
    mostSubscribed: "Most subscribed",
    sessionBased: "Session-based",
    duration: "Duration",
    sessionCount: "Session count",
    defaultPrice: "Default price",
    branchAccess: "Branch access",
    allBranches: "All branches",
    homeBranchOnly: "Home branch only",
    programAccess: "Training program access",
    allPrograms: "All programs",
    selectedProgramsOnly: "Selected programs only",
    noProgramsYet: "No training programs have been created yet.",
    noProgramsSelected: "No programs selected — members on this plan cannot book any class.",
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
    currentDebt: "Current debt",
  },
  lockers: {
    title: "Lockers",
    listDescription: "{count} locker{plural} in your inventory.",
    newLocker: "New locker",
    editLocker: "Edit locker",
    lockerNumber: "Locker number",
    size: "Size",
    sizeNone: "Not specified",
    sizeSmall: "Small",
    sizeMedium: "Medium",
    sizeLarge: "Large",
    monthlyPrice: "Monthly price",
    statusLabel: "Status",
    statusAvailable: "Available",
    statusOccupied: "Occupied",
    statusMaintenance: "Maintenance",
    quantity: "Quantity",
    quantityHelp: "Create several lockers at once, numbered sequentially from the locker number above.",
    createLocker: "Create locker",
    saveChanges: "Save changes",
    noLockers: "No lockers yet. Add your locker inventory to start renting them out.",
    allLockers: "All lockers",
    details: "Details",
    branch: "Branch",
    delete: "Delete locker",
    deleteConfirm: "Delete this locker? This cannot be undone.",
    sell: "Sell locker",
    sellDescription: "Assign an available locker to this member and set the rental price.",
    selectLocker: "Locker",
    noLockersAvailable: "No available lockers at this branch.",
    createLockerFirst: "Add one to the locker inventory first.",
    activeRentalExists: "This member already has an active locker rental.",
    startDate: "Start date",
    endDate: "End date",
    finalPrice: "Rental price",
    activateRental: "Rent locker",
    cancelRental: "Cancel rental",
    rentalHistory: "Rental history",
    noRentalsYet: "No locker rentals yet.",
    rentedBy: "Rented by",
  },
  announcements: {
    title: "Announcements",
    listDescription: "{count} announcement{plural} sent to members.",
    newAnnouncement: "New announcement",
    newAnnouncementDescription: "Send a broadcast message to every member with the mobile app, or just one branch.",
    announcementTitle: "Title",
    titlePlaceholder: "e.g. New yoga class starting Tuesday",
    body: "Message",
    bodyPlaceholder: "Write the announcement members will see...",
    branch: "Branch",
    allBranches: "All branches",
    sendAnnouncement: "Send announcement",
    noAnnouncements: "No announcements sent yet.",
    pushSentCount: "Sent to {count} device(s)",
    delete: "Delete",
  },
  closedDates: {
    title: "Closed Dates",
    listDescription: "{count} closed date{plural} on the calendar.",
    newClosedDate: "New closed date",
    date: "Date",
    branch: "Branch",
    allBranches: "All branches",
    reason: "Reason",
    reasonPlaceholder: "e.g. Public holiday, maintenance",
    createClosedDate: "Add closed date",
    noClosedDates: "No closed dates yet.",
    delete: "Delete",
  },
  checkIn: {
    title: "Check-In",
    description: "Search by name or member number to record a visit.",
    manualTitle: "Manual Check-In",
    manualDescription: "Staff override — use this when a member has forgotten or lost their access card. Search by name or member number.",
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
    listDescription: "{count} branch{plural} in {tenant}.",
    newBranch: "New branch",
    editBranch: "Edit branch",
    allBranches: "All branches",
    branchName: "Branch name",
    address: "Address",
    phone: "Phone",
    country: "Country",
    currency: "Currency",
    statusLabel: "Status",
    details: "Details",
    noBranches: "No branches yet. Create the first one.",
    createFirst: "Create the first one.",
    branchId: "Branch ID",
    tenantId: "Tenant ID",
    createBranch: "Create branch",
    editBranchBtn: "Edit branch",
    branchLogo: "Branch logo",
    branchLogoHelp: "Shown on this branch's page and in the branches list when per-branch logos are enabled.",
  },
  users: {
    title: "Users & Roles",
    listDescription: "{count} staff account{plural} in {tenant}.",
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
    linkToEmployee: "Link to employee record",
    linkToEmployeeHint: "Required — every account must be linked to an employee so their actions (e.g. member registrations) are attributed to them.",
    noLinkableEmployees: "No employees available to link. Create an employee first.",
    searchEmployee: "Search by name or employee number…",
    linkedEmployee: "Linked employee",
    notLinked: "Not linked to an employee",
    editLink: "Change linked employee",
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
    listDescription: "{active} active · {total} total in {tenant}.",
    allEmployees: "All employees",
    newEmployee: "New employee",
    newStaffEmployee: "New staff employee",
    noEmployees: "No employees found.",
    filterAllBranches: "All branches",
    filterAllPositions: "All positions",
    searchPlaceholder: "Search employees…",
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
    isCoach: "This employee is a coach (can be booked for classes)",
  },
  attendance: {
    checkInTitle: "Staff Check-In",
    checkInDescription: "Check an employee in or out for their shift.",
    employeeNumber: "Employee no.",
    checkInButton: "Check in",
    checkOutButton: "Check out",
    accessGranted: "Checked in",
    accessDenied: "Not checked in",
    qrCode: "QR Code",
    qrCodeDescription: "Scan this code at the gate to check in and open the gate automatically.",
    downloadQrCode: "Download",
    printQrCode: "Print",
    gateAccess: "Gate Access",
    allGates: "All gates at this branch",
    selectedGatesOnly: "Selected gates only",
    noGatesYet: "No gates configured for this branch yet.",
    recentAttendance: "Recent attendance",
    noRecentAttendance: "No check-ins recorded yet.",
    checkInTime: "Check-in",
    checkOutTime: "Check-out",
    stillCheckedIn: "Still checked in",
    reportTitle: "Attendance Report",
    reportDescription: "Check-in/out history and hours worked per employee.",
    dateFrom: "From",
    dateTo: "To",
    filter: "Filter",
    totalHours: "Total hours",
    daysPresent: "Days present",
    noAttendanceData: "No attendance recorded for this period.",
  },
  notifications: {
    title: "Notifications",
    listDescription: "{count} notification{plural} in history.",
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
    indexDescription: "Operational reports for daily review. All data is scoped to your tenant and branch.",
    activeMembershipsCardDescription: "Members with currently active memberships in this branch scope.",
    expiredMembershipsCardDescription: "Memberships that have expired or reached their end date.",
    visitsCardDescription: "Check-in records for today by default; filterable by date range.",
    paymentsCardDescription: "Payment records for today by default; filterable by date range.",
    membersBySexCardDescription: "Member headcount broken down by gender.",
    registrationsByEmployeeCardDescription: "New members registered per employee, filterable by staff member and date.",
    planPerformanceCardDescription: "Memberships sold and revenue generated per plan this month.",
    membershipStatusCardDescription: "Counts of active, frozen, expired, and cancelled memberships.",
    expiringSoonCardDescription: "Active memberships ending within the next 7 days — for renewal outreach.",
    upcomingBirthdaysCardDescription: "Members with a birthday in the next 30 days.",
    newMembersGrowthCardDescription: "New member joins per day this month.",
    activeMembershipsDescription: "{total} active membership{plural} as of {asOfDate}.",
    expiredMembershipsDescription: "{total} expired membership{plural} as of {asOfDate}.",
    visitsDescription: "{total} visit{plural} from {dateFrom} to {dateTo}.",
    membersBySexDescription: "{total} member{plural} as of {asOfDate} ({activeTotal} active).",
    membershipStatusDescription: "{total} membership{plural} as of {asOfDate}.",
    expiringSoonDescription: "{total} membership{plural} expiring within {days} days of {asOfDate}.",
    upcomingBirthdaysDescription: "{total} member{plural} with a birthday in the next {days} days.",
    newMembersGrowthDescription: "{total} new member{plural} joined from {dateFrom} to {dateTo}.",
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
    membersBySex: "Members by Gender",
    registrationsByEmployee: "Registrations by Employee",
    planPerformance: "Plan Performance",
    membershipStatusBreakdown: "Membership Status Breakdown",
    expiringSoon: "Expiring Soon",
    upcomingBirthdays: "Upcoming Birthdays",
    newMembersGrowth: "New Members Growth",
    sexCol: "Gender",
    maleLabel: "Male",
    femaleLabel: "Female",
    unspecifiedLabel: "Unspecified",
    activeCol: "Active",
    totalCol: "Total",
    employeeCol: "Employee",
    countCol: "Count",
    unassignedLabel: "Unassigned",
    allEmployeesLabel: "All employees",
    filterLabel: "Filter",
    applyFilter: "Apply",
    dateFromLabel: "From",
    dateToLabel: "To",
    daysLabel: "Days ahead",
    viewMembers: "View members →",
    planTypeCol: "Type",
    revenueCol: "Revenue",
    daysUntilCol: "Days left",
    birthdayCol: "Birthday",
    phoneCol: "Phone",
    noResults: "No data found for this report.",
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
    activeBranchTitle: "Active branch",
    activeBranchDescription: "Select which branch you are currently operating from. This controls which members and visits you see across the application.",
    currentBranch: "Current branch",
    switchBranch: "Switch branch",
    noOtherBranches: "No other active branches to switch to.",
    createABranch: "Create a branch",
    current: "Current",
    switchAction: "Switch",
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
    options: "Options",
    optionsTitle: "General preferences",
    optionsDescription: "Language, display, and check-in/out behavior for your gym.",
    checkInOutSectionTitle: "Check-in / Check-out",
    checkOutToggleLabel: "Enable member check-out registration",
    checkOutToggleHelp: "When off, members only scan in at the gate — the visits list won't track or show check-out times.",
    dataVisibilityTitle: "Data visibility",
    dataVisibilityHelp: "As the owner, choose whether members, employees, users, visits, payments, and reports show every branch or only the branch you're currently switched into.",
    dataVisibilityAllBranches: "All branches",
    dataVisibilityAllBranchesHelp: "See members, employees, users, and reports from every branch in your gym.",
    dataVisibilityActiveBranch: "Active branch only",
    dataVisibilityActiveBranchHelp: "See only the branch you're currently switched into (change it under Branches).",
    reportingCurrencyTitle: "Reporting currency",
    reportingCurrencyHelp: "Used for company-wide reports across all branches. Each branch's own operating currency (set under Branches) is used for its day-to-day payments.",
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
    whatsappReconnecting: "Device disconnected — waiting for new QR code…",
    whatsappRefreshHint: "Refreshes every 3 seconds.",
    whatsappGenericError: "An error occurred.",
    logoSectionTitle: "Logo",
    logoSectionHelp: "Choose whether all branches share one logo, or each branch has its own.",
    logoModeLabel: "Logo mode",
    logoModeShared: "Same logo for all branches",
    logoModeSharedHelp: "Upload one logo used everywhere across the tenant.",
    logoModePerBranch: "Each branch has its own logo",
    logoModePerBranchHelp: "Upload a logo per branch from the branch's edit page.",
    logoUpload: "Upload logo",
    logoChange: "Change logo",
    logoRemove: "Remove",
    logoUploading: "Uploading…",
    logoUploadError: "Failed to upload logo. Please try again.",
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
  classes: {
    title: "Courses",
    programsTitle: "Courses",
    listDescription: "{count} course{plural} in {tenant}.",
    newProgram: "New Course",
    noPrograms: "No courses yet.",
    todaysSessions: "Today's sessions",
    todaysSessionsHelper: "Classes scheduled for today across all programs.",
    noSessionsToday: "No sessions scheduled today.",
    statusInProgress: "In progress",
    statusUpcoming: "Upcoming",
    statusCompleted: "Completed",
    statusLowBookings: "Low bookings",
    programName: "Course name",
    description: "Description",
    color: "Color",
    maxMembers: "Max students",
    defaultCoach: "Default coach",
    noCoach: "No coach assigned",
    allBranches: "All branches (global)",
    createProgram: "Create course",
    programDetails: "Course details",
    allPrograms: "All courses",
    price: "Price",
    startDate: "Start date",
    endDate: "End date",
    sessionsTitle: "Class Sessions",
    newSession: "Schedule a class",
    program: "Program",
    coach: "Coach",
    room: "Room",
    date: "Date",
    startTime: "Start time",
    endTime: "End time",
    capacity: "Capacity",
    bookedCount: "Booked",
    repeatWeeks: "Repeat weekly for (weeks)",
    scheduleSingle: "Schedule a single class",
    scheduleRecurring: "Schedule recurring classes",
    noSessions: "No class sessions scheduled yet.",
    cancelSession: "Cancel class",
    viewSession: "View",
    sessionDetails: "Session details",
    bookingsTitle: "Bookings",
    bookMember: "Book a member",
    member: "Member",
    selectMember: "Select a member",
    book: "Book",
    noBookings: "No bookings yet.",
    cancelBooking: "Cancel booking",
    bookingBooked: "Booked",
    bookingWaitlisted: "Waitlisted",
    bookingAttended: "Attended",
    bookingNoShow: "No-show",
    bookingCancelled: "Cancelled",
    coachProfileTitle: "Coach Profile",
    specializations: "Specializations (comma-separated)",
    certifications: "Certifications (comma-separated)",
    saveCoachProfile: "Save coach profile",
    notACoach: "This employee has no coach profile yet — add specializations to make them bookable as a coach.",
    scheduleTitle: "Weekly Schedule",
    scheduleHint: "Set the days and times this course meets each week, then generate its class sessions for the full course term.",
    dayOfWeek: "Day of week",
    addSlot: "Add time slot",
    removeSlot: "Remove",
    saveSchedule: "Save schedule",
    generateSessions: "Generate sessions",
    daySunday: "Sunday",
    dayMonday: "Monday",
    dayTuesday: "Tuesday",
    dayWednesday: "Wednesday",
    dayThursday: "Thursday",
    dayFriday: "Friday",
    daySaturday: "Saturday",
    rosterTitle: "Students",
    rosterHint: "Members registered for this course. Registering charges the course price to the member and books them into every upcoming lesson — no membership required.",
    addStudent: "Register a student",
    noStudentsRegistered: "No students registered yet.",
    unregisterStudent: "Unregister",
    registerForCourse: "Register for a course",
    selectCourse: "Select a course",
    noCoursesAvailable: "No courses available.",
    coursesTitle: "Courses",
    noCoursesYet: "Not registered for any courses yet.",
    attendanceReportTitle: "Attendance report",
    attendanceReportHint: "Presence and absence for every student across all lessons of this course.",
    viewReport: "View attendance report",
    present: "Present",
    absent: "Absent",
    totalLessons: "Total lessons",
    noLessonsYet: "No lessons scheduled yet.",
    markPresent: "Mark present",
    markAbsent: "Mark absent",
  },
};

const ar: Dict = {
  nav: {
    dashboard: "لوحة التحكم",
    branches: "الفروع",
    usersRoles: "المستخدمون والأدوار",
    employees: "الموظفون",
    membershipPlans: "خطط الاشتراك",
    lockers: "الخزائن",
    announcements: "الإعلانات",
    closedDates: "أيام الإغلاق",
    members: "الأعضاء",
    checkIn: "تسجيل الدخول",
    employeeCheckIn: "تسجيل حضور الموظفين",
    attendanceReport: "تقرير الحضور",
    visits: "الزيارات",
    notifications: "الإشعارات",
    reports: "التقارير",
    settings: "الإعدادات",
    classes: "الدورات",
    groupOverview: "نظرة عامة",
    groupPeople: "الأشخاص",
    groupOperations: "العمليات",
    groupInsights: "التحليلات",
  },
  shell: {
    appName: "Spark Gym ERP",
    appTitle: "لوحة العمليات",
    appDescription: "منصة العمل لإدارة الاشتراكات والتحكم بالوصول والتقارير وعمليات الاستقبال.",
    pilotBranchContext: "سياق الفرع التجريبي",
    searchMembers: "البحث عن الأعضاء",
    openMenu: "فتح القائمة",
    closeMenu: "إغلاق القائمة",
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
    prev: "السابق",
    next: "التالي",
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
    latestCheckIns: "آخر تسجيلات الدخول",
    noRecentCheckIns: "لا توجد تسجيلات دخول اليوم بعد.",
    expiringMemberships: "اشتراكات على وشك الانتهاء",
    noExpiringMemberships: "لا يوجد اشتراكات تنتهي خلال 7 أيام.",
    branchesAtGlance: "نظرة سريعة على الفروع",
    branchesAtGlanceHelper: "الأعضاء النشطون وتسجيلات الدخول اليوم لكل فرع.",
  },
  members: {
    title: "الأعضاء",
    newMember: "عضو جديد",
    editMember: "تعديل العضو",
    profile: "الملف الشخصي",
    memberships: "الاشتراكات",
    payments: "المدفوعات",
    lockers: "الخزائن",
    quickActions: "إجراءات سريعة",
    editDetails: "تعديل بيانات العضو",
    recordPayment: "تسجيل دفعة",
    sellMembership: "بيع اشتراك",
    sellLocker: "بيع خزانة",
    noLockersYet: "لا توجد إيجارات خزائن بعد.",
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
    debt: "الدين",
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
    filterAll: "الكل",
    filterActiveMembership: "عضوية نشطة",
    filterFrozen: "مجمّدة",
    filterExpiringSoon: "تنتهي قريبًا",
    filterNoMembership: "بدون عضوية",
    totalMembers: "إجمالي الأعضاء",
    activeMemberships: "العضويات النشطة",
    expiringIn30Days: "تنتهي خلال 30 يومًا",
    memberCountSingular: "عضو",
    memberCountPlural: "أعضاء",
    matchingFilters: "مطابقين للفلاتر",
    total: "الإجمالي",
    identityTitle: "الهوية",
    contactTitle: "التواصل",
    physicalProfileTitle: "المعلومات الجسدية",
    memberSince: "عضو منذ",
    age: "العمر",
    ageYears: "{count} سنة",
    bmi: "مؤشر كتلة الجسم",
    daysLeftSingular: "يوم واحد متبقٍ",
    daysLeftPlural: "{count} أيام متبقية",
    noEmergencyContactLong: "لا توجد جهة اتصال للطوارئ. يجب أن يكون لكل عضو جهة اتصال قبل جلسته الأولى.",
    addEmergencyContact: "إضافة جهة اتصال للطوارئ",
    noMembershipsYet: "لا توجد اشتراكات بعد.",
    rfidTagLabel: "علامة RFID",
    heightStat: "الطول",
    weightStat: "الوزن",
    searchPlaceholder: "ابحث بالاسم أو الهاتف أو الرقم…",
    filterAllPlans: "جميع الخطط",
    showingResults: "عرض {from}–{to} من {total}",
  },
  plans: {
    title: "خطط الاشتراك",
    listDescription: "{count} خطة مُعدّة لهذا الحساب.",
    newPlan: "خطة جديدة",
    editPlan: "تعديل الخطة",
    planName: "اسم الخطة",
    planType: "نوع الخطة",
    planDetails: "تفاصيل الخطة",
    durationBased: "مبنية على المدة",
    mostSubscribed: "الأكثر اشتراكًا",
    sessionBased: "مبنية على الجلسات",
    duration: "المدة",
    sessionCount: "عدد الجلسات",
    defaultPrice: "السعر الافتراضي",
    branchAccess: "صلاحية الفروع",
    allBranches: "جميع الفروع",
    homeBranchOnly: "الفرع الرئيسي فقط",
    programAccess: "الوصول إلى البرامج التدريبية",
    allPrograms: "جميع البرامج",
    selectedProgramsOnly: "برامج محددة فقط",
    noProgramsYet: "لم يتم إنشاء أي برامج تدريبية بعد.",
    noProgramsSelected: "لم يتم اختيار أي برنامج — لا يمكن لأعضاء هذه الخطة حجز أي حصة.",
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
    currentDebt: "الدين الحالي",
  },
  lockers: {
    title: "الخزائن",
    listDescription: "{count} خزانة في المخزون.",
    newLocker: "خزانة جديدة",
    editLocker: "تعديل الخزانة",
    lockerNumber: "رقم الخزانة",
    size: "الحجم",
    sizeNone: "غير محدد",
    sizeSmall: "صغير",
    sizeMedium: "متوسط",
    sizeLarge: "كبير",
    monthlyPrice: "السعر الشهري",
    statusLabel: "الحالة",
    statusAvailable: "متاحة",
    statusOccupied: "مؤجرة",
    statusMaintenance: "صيانة",
    quantity: "الكمية",
    quantityHelp: "أنشئ عدة خزائن دفعة واحدة، مرقّمة بالتسلسل بدءًا من رقم الخزانة أعلاه.",
    createLocker: "إنشاء خزانة",
    saveChanges: "حفظ التغييرات",
    noLockers: "لا توجد خزائن بعد. أضف مخزون الخزائن لبدء تأجيرها.",
    allLockers: "جميع الخزائن",
    details: "التفاصيل",
    branch: "الفرع",
    delete: "حذف الخزانة",
    deleteConfirm: "حذف هذه الخزانة؟ لا يمكن التراجع عن هذا الإجراء.",
    sell: "بيع خزانة",
    sellDescription: "خصّص خزانة متاحة لهذا العضو وحدد سعر الإيجار.",
    selectLocker: "الخزانة",
    noLockersAvailable: "لا توجد خزائن متاحة في هذا الفرع.",
    createLockerFirst: "أضف خزانة إلى المخزون أولاً.",
    activeRentalExists: "لدى هذا العضو بالفعل إيجار خزانة نشط.",
    startDate: "تاريخ البدء",
    endDate: "تاريخ الانتهاء",
    finalPrice: "سعر الإيجار",
    activateRental: "تأجير الخزانة",
    cancelRental: "إلغاء الإيجار",
    rentalHistory: "سجل الإيجار",
    noRentalsYet: "لا توجد إيجارات خزائن بعد.",
    rentedBy: "مستأجرة من قبل",
  },
  announcements: {
    title: "الإعلانات",
    listDescription: "{count} إعلان تم إرساله للأعضاء.",
    newAnnouncement: "إعلان جديد",
    newAnnouncementDescription: "أرسل رسالة عامة لجميع الأعضاء الذين لديهم تطبيق الجوال، أو لفرع واحد فقط.",
    announcementTitle: "العنوان",
    titlePlaceholder: "مثال: حصة يوغا جديدة تبدأ الثلاثاء",
    body: "الرسالة",
    bodyPlaceholder: "اكتب الإعلان الذي سيراه الأعضاء...",
    branch: "الفرع",
    allBranches: "جميع الفروع",
    sendAnnouncement: "إرسال الإعلان",
    noAnnouncements: "لم يتم إرسال أي إعلانات بعد.",
    pushSentCount: "أُرسل إلى {count} جهاز",
    delete: "حذف",
  },
  closedDates: {
    title: "أيام الإغلاق",
    listDescription: "{count} يوم إغلاق في التقويم.",
    newClosedDate: "إضافة يوم إغلاق",
    date: "التاريخ",
    branch: "الفرع",
    allBranches: "جميع الفروع",
    reason: "السبب",
    reasonPlaceholder: "مثال: عطلة رسمية، صيانة",
    createClosedDate: "إضافة يوم إغلاق",
    noClosedDates: "لا توجد أيام إغلاق بعد.",
    delete: "حذف",
  },
  checkIn: {
    title: "تسجيل الدخول",
    description: "ابحث بالاسم أو رقم العضو لتسجيل زيارة.",
    manualTitle: "تسجيل دخول يدوي",
    manualDescription: "تجاوز يقوم به الموظف — استخدم هذا عندما ينسى العضو بطاقة الدخول أو يفقدها. ابحث بالاسم أو رقم العضو.",
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
    listDescription: "{count} فرع في {tenant}.",
    newBranch: "فرع جديد",
    editBranch: "تعديل الفرع",
    allBranches: "جميع الفروع",
    branchName: "اسم الفرع",
    address: "العنوان",
    phone: "الهاتف",
    country: "الدولة",
    currency: "العملة",
    statusLabel: "الحالة",
    details: "التفاصيل",
    noBranches: "لا توجد فروع بعد. أنشئ أول فرع.",
    createFirst: "أنشئ أول فرع.",
    branchId: "معرف الفرع",
    tenantId: "معرف المستأجر",
    createBranch: "إنشاء فرع",
    editBranchBtn: "تعديل الفرع",
    branchLogo: "شعار الفرع",
    branchLogoHelp: "يظهر في صفحة هذا الفرع وفي قائمة الفروع عند تفعيل شعار مستقل لكل فرع.",
  },
  users: {
    title: "المستخدمون والأدوار",
    listDescription: "{count} حساب موظف في {tenant}.",
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
    linkToEmployee: "ربط بسجل موظف",
    linkToEmployeeHint: "مطلوب — يجب ربط كل حساب بموظف بحيث تُنسب إجراءاته (مثل تسجيل الأعضاء) إليه.",
    noLinkableEmployees: "لا يوجد موظفون متاحون للربط. أنشئ موظفًا أولاً.",
    searchEmployee: "ابحث بالاسم أو رقم الموظف…",
    linkedEmployee: "الموظف المرتبط",
    notLinked: "غير مرتبط بموظف",
    editLink: "تغيير الموظف المرتبط",
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
    listDescription: "{active} نشط · {total} إجمالي في {tenant}.",
    allEmployees: "جميع الموظفين",
    newEmployee: "موظف جديد",
    newStaffEmployee: "موظف جديد",
    noEmployees: "لم يتم العثور على موظفين.",
    filterAllBranches: "كل الفروع",
    filterAllPositions: "كل الوظائف",
    searchPlaceholder: "ابحث عن موظف…",
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
    isCoach: "هذا الموظف مدرب (يمكن حجزه للحصص)",
  },
  attendance: {
    checkInTitle: "تسجيل حضور الموظفين",
    checkInDescription: "سجّل دخول أو خروج الموظف لبدء أو إنهاء دوامه.",
    employeeNumber: "رقم الموظف",
    checkInButton: "تسجيل دخول",
    checkOutButton: "تسجيل خروج",
    accessGranted: "تم تسجيل الدخول",
    accessDenied: "لم يتم تسجيل الدخول",
    qrCode: "رمز QR",
    qrCodeDescription: "امسح هذا الرمز عند البوابة لتسجيل الدخول وفتح البوابة تلقائياً.",
    downloadQrCode: "تنزيل",
    printQrCode: "طباعة",
    gateAccess: "صلاحية البوابات",
    allGates: "كل بوابات هذا الفرع",
    selectedGatesOnly: "بوابات محددة فقط",
    noGatesYet: "لا توجد بوابات مُعدّة لهذا الفرع بعد.",
    recentAttendance: "الحضور الأخير",
    noRecentAttendance: "لا يوجد سجل حضور بعد.",
    checkInTime: "الدخول",
    checkOutTime: "الخروج",
    stillCheckedIn: "لا يزال داخل النادي",
    reportTitle: "تقرير الحضور",
    reportDescription: "سجل الدخول/الخروج وساعات العمل لكل موظف.",
    dateFrom: "من",
    dateTo: "إلى",
    filter: "تصفية",
    totalHours: "إجمالي الساعات",
    daysPresent: "أيام الحضور",
    noAttendanceData: "لا يوجد سجل حضور لهذه الفترة.",
  },
  notifications: {
    title: "الإشعارات",
    listDescription: "{count} إشعار في السجل.",
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
    indexDescription: "تقارير تشغيلية للمراجعة اليومية. جميع البيانات مرتبطة بحسابك وفرعك.",
    activeMembershipsCardDescription: "الأعضاء ذوو الاشتراكات النشطة حاليًا ضمن نطاق هذا الفرع.",
    expiredMembershipsCardDescription: "الاشتراكات التي انتهت أو بلغت تاريخ انتهائها.",
    visitsCardDescription: "سجلات تسجيل الدخول لليوم افتراضيًا؛ قابلة للتصفية حسب الفترة الزمنية.",
    paymentsCardDescription: "سجلات الدفع لليوم افتراضيًا؛ قابلة للتصفية حسب الفترة الزمنية.",
    membersBySexCardDescription: "عدد الأعضاء مقسّمًا حسب الجنس.",
    registrationsByEmployeeCardDescription: "الأعضاء الجدد المسجَّلون لكل موظف، قابل للتصفية حسب الموظف والتاريخ.",
    planPerformanceCardDescription: "الاشتراكات المُباعة والإيرادات المحقّقة لكل خطة هذا الشهر.",
    membershipStatusCardDescription: "أعداد الاشتراكات النشطة والمجمَّدة والمنتهية والملغاة.",
    expiringSoonCardDescription: "الاشتراكات النشطة التي تنتهي خلال 7 أيام القادمة — للتواصل بشأن التجديد.",
    upcomingBirthdaysCardDescription: "الأعضاء الذين لديهم عيد ميلاد خلال الـ 30 يومًا القادمة.",
    newMembersGrowthCardDescription: "عدد الأعضاء الجدد المنضمين يوميًا هذا الشهر.",
    activeMembershipsDescription: "{total} اشتراك نشط اعتبارًا من {asOfDate}.",
    expiredMembershipsDescription: "{total} اشتراك منتهٍ اعتبارًا من {asOfDate}.",
    visitsDescription: "{total} زيارة من {dateFrom} إلى {dateTo}.",
    membersBySexDescription: "{total} عضو اعتبارًا من {asOfDate} ({activeTotal} نشط).",
    membershipStatusDescription: "{total} اشتراك اعتبارًا من {asOfDate}.",
    expiringSoonDescription: "{total} اشتراك ينتهي خلال {days} يومًا من {asOfDate}.",
    upcomingBirthdaysDescription: "{total} عضو عيد ميلاده خلال {days} يومًا القادمة.",
    newMembersGrowthDescription: "{total} عضو جديد انضم من {dateFrom} إلى {dateTo}.",
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
    membersBySex: "الأعضاء حسب الجنس",
    registrationsByEmployee: "التسجيلات حسب الموظف",
    planPerformance: "أداء الخطط",
    membershipStatusBreakdown: "توزيع حالة الاشتراكات",
    expiringSoon: "تنتهي قريبًا",
    upcomingBirthdays: "أعياد الميلاد القادمة",
    newMembersGrowth: "نمو الأعضاء الجدد",
    sexCol: "الجنس",
    maleLabel: "ذكر",
    femaleLabel: "أنثى",
    unspecifiedLabel: "غير محدد",
    activeCol: "نشط",
    totalCol: "الإجمالي",
    employeeCol: "الموظف",
    countCol: "العدد",
    unassignedLabel: "غير مسند",
    allEmployeesLabel: "جميع الموظفين",
    filterLabel: "تصفية",
    applyFilter: "تطبيق",
    dateFromLabel: "من",
    dateToLabel: "إلى",
    daysLabel: "عدد الأيام القادمة",
    viewMembers: "عرض الأعضاء ←",
    planTypeCol: "النوع",
    revenueCol: "الإيرادات",
    daysUntilCol: "الأيام المتبقية",
    birthdayCol: "تاريخ الميلاد",
    phoneCol: "الهاتف",
    noResults: "لا توجد بيانات لهذا التقرير.",
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
    activeBranchTitle: "الفرع النشط",
    activeBranchDescription: "اختر الفرع الذي تعمل منه حاليًا. يتحكم هذا في الأعضاء والزيارات التي تراها في التطبيق.",
    currentBranch: "الفرع الحالي",
    switchBranch: "تبديل الفرع",
    noOtherBranches: "لا توجد فروع نشطة أخرى للتبديل إليها.",
    createABranch: "إنشاء فرع",
    current: "الحالي",
    switchAction: "تبديل",
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
    options: "الخيارات",
    optionsTitle: "التفضيلات العامة",
    optionsDescription: "اللغة والعرض وسلوك تسجيل الدخول/الخروج لصالتك الرياضية.",
    checkInOutSectionTitle: "تسجيل الدخول / الخروج",
    checkOutToggleLabel: "تفعيل تسجيل خروج الأعضاء",
    checkOutToggleHelp: "عند التعطيل، يقوم الأعضاء بمسح الدخول فقط عند البوابة — ولن تعرض قائمة الزيارات أوقات الخروج أو تتتبعها.",
    dataVisibilityTitle: "رؤية البيانات",
    dataVisibilityHelp: "بصفتك المالك، اختر ما إذا كانت صفحات الأعضاء والموظفين والمستخدمين والزيارات والمدفوعات والتقارير تعرض جميع الفروع أو الفرع النشط فقط.",
    dataVisibilityAllBranches: "جميع الفروع",
    dataVisibilityAllBranchesHelp: "اعرض الأعضاء والموظفين والمستخدمين والتقارير من جميع فروع صالتك.",
    dataVisibilityActiveBranch: "الفرع النشط فقط",
    dataVisibilityActiveBranchHelp: "اعرض فقط الفرع الذي أنت متصل به حاليًا (يمكن تغييره من صفحة الفروع).",
    reportingCurrencyTitle: "عملة التقارير",
    reportingCurrencyHelp: "تُستخدم للتقارير على مستوى الشركة عبر جميع الفروع. كل فرع يستخدم عملته التشغيلية الخاصة (يتم تعيينها من صفحة الفروع) لمدفوعاته اليومية.",
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
    whatsappReconnecting: "تم فصل الجهاز — بانتظار رمز QR جديد…",
    whatsappRefreshHint: "يتم التحديث كل 3 ثوانٍ.",
    whatsappGenericError: "حدث خطأ ما.",
    logoSectionTitle: "الشعار",
    logoSectionHelp: "اختر ما إذا كانت جميع الفروع تشترك في شعار واحد، أو أن لكل فرع شعاره الخاص.",
    logoModeLabel: "وضع الشعار",
    logoModeShared: "نفس الشعار لجميع الفروع",
    logoModeSharedHelp: "ارفع شعاراً واحداً يُستخدم في كل مكان ضمن الحساب.",
    logoModePerBranch: "لكل فرع شعاره الخاص",
    logoModePerBranchHelp: "ارفع شعاراً لكل فرع من صفحة تعديل الفرع.",
    logoUpload: "رفع شعار",
    logoChange: "تغيير الشعار",
    logoRemove: "إزالة",
    logoUploading: "جارٍ الرفع…",
    logoUploadError: "فشل رفع الشعار. يرجى المحاولة مرة أخرى.",
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
  classes: {
    title: "الدورات",
    programsTitle: "الدورات",
    listDescription: "{count} دورة في {tenant}.",
    newProgram: "دورة جديدة",
    noPrograms: "لا توجد دورات بعد.",
    todaysSessions: "حصص اليوم",
    todaysSessionsHelper: "الحصص المجدولة اليوم لجميع البرامج.",
    noSessionsToday: "لا توجد حصص مجدولة اليوم.",
    statusInProgress: "جارية الآن",
    statusUpcoming: "قادمة",
    statusCompleted: "انتهت",
    statusLowBookings: "حجوزات منخفضة",
    programName: "اسم الدورة",
    description: "الوصف",
    color: "اللون",
    maxMembers: "الحد الأقصى للطلاب",
    defaultCoach: "المدرب الافتراضي",
    noCoach: "لا يوجد مدرب معيّن",
    allBranches: "جميع الفروع (عام)",
    createProgram: "إنشاء دورة",
    programDetails: "تفاصيل الدورة",
    allPrograms: "جميع الدورات",
    price: "السعر",
    startDate: "تاريخ البدء",
    endDate: "تاريخ الانتهاء",
    sessionsTitle: "الحصص المجدولة",
    newSession: "جدولة حصة",
    program: "البرنامج",
    coach: "المدرب",
    room: "القاعة",
    date: "التاريخ",
    startTime: "وقت البدء",
    endTime: "وقت الانتهاء",
    capacity: "السعة",
    bookedCount: "المحجوز",
    repeatWeeks: "تكرار أسبوعي لعدد (أسابيع)",
    scheduleSingle: "جدولة حصة واحدة",
    scheduleRecurring: "جدولة حصص متكررة",
    noSessions: "لا توجد حصص مجدولة بعد.",
    cancelSession: "إلغاء الحصة",
    viewSession: "عرض",
    sessionDetails: "تفاصيل الحصة",
    bookingsTitle: "الحجوزات",
    bookMember: "حجز عضو",
    member: "العضو",
    selectMember: "اختر عضوًا",
    book: "حجز",
    noBookings: "لا توجد حجوزات بعد.",
    cancelBooking: "إلغاء الحجز",
    bookingBooked: "محجوز",
    bookingWaitlisted: "قائمة الانتظار",
    bookingAttended: "حضر",
    bookingNoShow: "لم يحضر",
    bookingCancelled: "ملغى",
    coachProfileTitle: "ملف المدرب",
    specializations: "التخصصات (مفصولة بفواصل)",
    certifications: "الشهادات (مفصولة بفواصل)",
    saveCoachProfile: "حفظ ملف المدرب",
    notACoach: "لا يملك هذا الموظف ملف مدرب بعد — أضف التخصصات لجعله قابلاً للحجز كمدرب.",
    scheduleTitle: "الجدول الأسبوعي",
    scheduleHint: "حدد الأيام والأوقات التي تُعقد فيها هذه الدورة كل أسبوع، ثم أنشئ حصصها لكامل مدة الدورة.",
    dayOfWeek: "يوم الأسبوع",
    addSlot: "إضافة موعد",
    removeSlot: "إزالة",
    saveSchedule: "حفظ الجدول",
    generateSessions: "إنشاء الحصص",
    daySunday: "الأحد",
    dayMonday: "الاثنين",
    dayTuesday: "الثلاثاء",
    dayWednesday: "الأربعاء",
    dayThursday: "الخميس",
    dayFriday: "الجمعة",
    daySaturday: "السبت",
    rosterTitle: "الطلاب",
    rosterHint: "الأعضاء المسجلون في هذه الدورة. يؤدي التسجيل إلى تحميل سعر الدورة على العضو وحجزه في كل حصة قادمة — دون الحاجة إلى عضوية.",
    addStudent: "تسجيل طالب",
    noStudentsRegistered: "لا يوجد طلاب مسجلون بعد.",
    unregisterStudent: "إلغاء التسجيل",
    registerForCourse: "التسجيل في دورة",
    selectCourse: "اختر دورة",
    noCoursesAvailable: "لا توجد دورات متاحة.",
    coursesTitle: "الدورات",
    noCoursesYet: "غير مسجل في أي دورة بعد.",
    attendanceReportTitle: "تقرير الحضور",
    attendanceReportHint: "حضور وغياب كل طالب عبر جميع حصص هذه الدورة.",
    viewReport: "عرض تقرير الحضور",
    present: "حاضر",
    absent: "غائب",
    totalLessons: "إجمالي الحصص",
    noLessonsYet: "لا توجد حصص مجدولة بعد.",
    markPresent: "تسجيل حضور",
    markAbsent: "تسجيل غياب",
  },
};

const he: Dict = {
  nav: {
    dashboard: "לוח בקרה",
    branches: "סניפים",
    usersRoles: "משתמשים ותפקידים",
    employees: "עובדים",
    membershipPlans: "תוכניות מנוי",
    lockers: "לוקרים",
    announcements: "הודעות",
    closedDates: "ימי סגירה",
    members: "חברים",
    checkIn: "כניסה",
    employeeCheckIn: "נוכחות עובדים",
    attendanceReport: "דוח נוכחות",
    visits: "ביקורים",
    notifications: "התראות",
    reports: "דוחות",
    settings: "הגדרות",
    classes: "קורסים",
    groupOverview: "סקירה כללית",
    groupPeople: "אנשים",
    groupOperations: "תפעול",
    groupInsights: "תובנות",
  },
  shell: {
    appName: "Spark Gym ERP",
    appTitle: "מסוף תפעולי",
    appDescription: "סביבת עבודה לניהול מנויים, בקרת גישה, דיווח ועבודת קבלה.",
    pilotBranchContext: "הקשר סניף פיילוט",
    searchMembers: "חפש חברים",
    openMenu: "פתח תפריט",
    closeMenu: "סגור תפריט",
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
    prev: "הקודם",
    next: "הבא",
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
    latestCheckIns: "כניסות אחרונות",
    noRecentCheckIns: "עדיין לא נרשמו כניסות היום.",
    expiringMemberships: "מנויים שעומדים לפוג",
    noExpiringMemberships: "אין מנויים שפגים בתוך 7 הימים הקרובים.",
    branchesAtGlance: "מבט מהיר על הסניפים",
    branchesAtGlanceHelper: "חברים פעילים וכניסות היום לכל סניף.",
  },
  members: {
    title: "חברים",
    newMember: "חבר חדש",
    editMember: "עריכת חבר",
    profile: "פרופיל",
    memberships: "מנויים",
    payments: "תשלומים",
    lockers: "לוקרים",
    quickActions: "פעולות מהירות",
    editDetails: "ערוך פרטי חבר",
    recordPayment: "רשום תשלום",
    sellMembership: "מכור מנוי",
    sellLocker: "מכור לוקר",
    noLockersYet: "עדיין אין השכרות לוקרים.",
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
    debt: "חוב",
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
    filterAll: "הכל",
    filterActiveMembership: "מנוי פעיל",
    filterFrozen: "מוקפא",
    filterExpiringSoon: "מסתיים בקרוב",
    filterNoMembership: "ללא מנוי",
    totalMembers: "סה\"כ חברים",
    activeMemberships: "מנויים פעילים",
    expiringIn30Days: "מסתיימים תוך 30 יום",
    memberCountSingular: "חבר",
    memberCountPlural: "חברים",
    matchingFilters: "תואמים לסינון",
    total: "סה\"כ",
    identityTitle: "זהות",
    contactTitle: "פרטי קשר",
    physicalProfileTitle: "פרופיל גופני",
    memberSince: "חבר מאז",
    age: "גיל",
    ageYears: "{count} שנים",
    bmi: "BMI",
    daysLeftSingular: "יום אחד נותר",
    daysLeftPlural: "{count} ימים נותרו",
    noEmergencyContactLong: "אין איש קשר לשעת חירום בתיק. לכל חבר כדאי שיהיה איש קשר כזה לפני האימון הראשון.",
    addEmergencyContact: "הוסף איש קשר לשעת חירום",
    noMembershipsYet: "אין עדיין מנויים.",
    rfidTagLabel: "תג RFID",
    heightStat: "גובה",
    weightStat: "משקל",
    searchPlaceholder: "חיפוש לפי שם, טלפון או מספר…",
    filterAllPlans: "כל המנויים",
    showingResults: "מציג {from}–{to} מתוך {total}",
  },
  plans: {
    title: "תוכניות מנוי",
    listDescription: "{count} תוכניות מוגדרות עבור חשבון זה.",
    newPlan: "תוכנית חדשה",
    editPlan: "ערוך תוכנית",
    planName: "שם תוכנית",
    planType: "סוג תוכנית",
    planDetails: "פרטי תוכנית",
    durationBased: "מבוסס משך",
    mostSubscribed: "המנוי הפופולרי ביותר",
    sessionBased: "מבוסס מפגשים",
    duration: "משך",
    sessionCount: "מספר מפגשים",
    defaultPrice: "מחיר ברירת מחדל",
    branchAccess: "גישה לסניף",
    allBranches: "כל הסניפים",
    homeBranchOnly: "סניף בית בלבד",
    programAccess: "גישה לתוכניות אימון",
    allPrograms: "כל התוכניות",
    selectedProgramsOnly: "תוכניות נבחרות בלבד",
    noProgramsYet: "עדיין לא נוצרו תוכניות אימון.",
    noProgramsSelected: "לא נבחרו תוכניות — חברי תוכנית זו לא יוכלו להזמין שיעורים.",
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
    currentDebt: "חוב נוכחי",
  },
  lockers: {
    title: "לוקרים",
    listDescription: "{count} לוקרים במלאי.",
    newLocker: "לוקר חדש",
    editLocker: "ערוך לוקר",
    lockerNumber: "מספר לוקר",
    size: "גודל",
    sizeNone: "לא צוין",
    sizeSmall: "קטן",
    sizeMedium: "בינוני",
    sizeLarge: "גדול",
    monthlyPrice: "מחיר חודשי",
    statusLabel: "סטטוס",
    statusAvailable: "פנוי",
    statusOccupied: "תפוס",
    statusMaintenance: "בתחזוקה",
    quantity: "כמות",
    quantityHelp: "צור מספר לוקרים בבת אחת, ממוספרים ברצף החל ממספר הלוקר שלמעלה.",
    createLocker: "צור לוקר",
    saveChanges: "שמור שינויים",
    noLockers: "עדיין אין לוקרים. הוסף את מלאי הלוקרים כדי להתחיל להשכיר אותם.",
    allLockers: "כל הלוקרים",
    details: "פרטים",
    branch: "סניף",
    delete: "מחק לוקר",
    deleteConfirm: "למחוק את הלוקר הזה? לא ניתן לבטל פעולה זו.",
    sell: "מכור לוקר",
    sellDescription: "שייך לוקר פנוי לחבר זה וקבע את מחיר ההשכרה.",
    selectLocker: "לוקר",
    noLockersAvailable: "אין לוקרים פנויים בסניף זה.",
    createLockerFirst: "הוסף לוקר למלאי תחילה.",
    activeRentalExists: "לחבר זה כבר יש השכרת לוקר פעילה.",
    startDate: "תאריך התחלה",
    endDate: "תאריך סיום",
    finalPrice: "מחיר השכרה",
    activateRental: "השכר לוקר",
    cancelRental: "בטל השכרה",
    rentalHistory: "היסטוריית השכרות",
    noRentalsYet: "עדיין אין השכרות לוקרים.",
    rentedBy: "מושכר על ידי",
  },
  announcements: {
    title: "הודעות",
    listDescription: "{count} הודעות נשלחו לחברים.",
    newAnnouncement: "הודעה חדשה",
    newAnnouncementDescription: "שלח הודעה כללית לכל החברים עם אפליקציית הנייד, או לסניף אחד בלבד.",
    announcementTitle: "כותרת",
    titlePlaceholder: "לדוגמה: שיעור יוגה חדש מתחיל ביום שלישי",
    body: "הודעה",
    bodyPlaceholder: "כתוב את ההודעה שהחברים יראו...",
    branch: "סניף",
    allBranches: "כל הסניפים",
    sendAnnouncement: "שלח הודעה",
    noAnnouncements: "עדיין לא נשלחו הודעות.",
    pushSentCount: "נשלח ל-{count} מכשירים",
    delete: "מחק",
  },
  closedDates: {
    title: "ימי סגירה",
    listDescription: "{count} ימי סגירה ביומן.",
    newClosedDate: "הוסף יום סגירה",
    date: "תאריך",
    branch: "סניף",
    allBranches: "כל הסניפים",
    reason: "סיבה",
    reasonPlaceholder: "לדוגמה: חג ציבורי, תחזוקה",
    createClosedDate: "הוסף יום סגירה",
    noClosedDates: "עדיין אין ימי סגירה.",
    delete: "מחק",
  },
  checkIn: {
    title: "כניסה",
    description: "חפש לפי שם או מספר חבר לרישום ביקור.",
    manualTitle: "כניסה ידנית",
    manualDescription: "עקיפה על ידי הצוות — השתמש בזה כאשר חבר שכח או איבד את כרטיס הכניסה שלו. חפש לפי שם או מספר חבר.",
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
    listDescription: "{count} סניפים ב-{tenant}.",
    newBranch: "סניף חדש",
    editBranch: "ערוך סניף",
    allBranches: "כל הסניפים",
    branchName: "שם סניף",
    address: "כתובת",
    phone: "טלפון",
    country: "מדינה",
    currency: "מטבע",
    statusLabel: "סטטוס",
    details: "פרטים",
    noBranches: "אין סניפים עדיין. צור את הראשון.",
    createFirst: "צור את הראשון.",
    branchId: "מזהה סניף",
    tenantId: "מזהה דייר",
    createBranch: "צור סניף",
    editBranchBtn: "ערוך סניף",
    branchLogo: "לוגו הסניף",
    branchLogoHelp: "מוצג בדף הסניף וברשימת הסניפים כאשר מופעל לוגו נפרד לכל סניף.",
  },
  users: {
    title: "משתמשים ותפקידים",
    listDescription: "{count} חשבונות צוות ב-{tenant}.",
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
    linkToEmployee: "קישור לרשומת עובד",
    linkToEmployeeHint: "שדה חובה — כל חשבון חייב להיות מקושר לעובד כך שפעולותיו (למשל רישום מנויים) ייוחסו לו.",
    noLinkableEmployees: "אין עובדים זמינים לקישור. צור עובד קודם.",
    searchEmployee: "חיפוש לפי שם או מספר עובד…",
    linkedEmployee: "עובד מקושר",
    notLinked: "לא מקושר לעובד",
    editLink: "שינוי העובד המקושר",
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
    listDescription: "{active} פעילים · {total} סה\"כ ב-{tenant}.",
    allEmployees: "כל העובדים",
    newEmployee: "עובד חדש",
    newStaffEmployee: "עובד צוות חדש",
    noEmployees: "לא נמצאו עובדים.",
    filterAllBranches: "כל הסניפים",
    filterAllPositions: "כל התפקידים",
    searchPlaceholder: "חיפוש עובדים…",
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
    isCoach: "עובד זה הוא מאמן (ניתן לשבץ אותו לשיעורים)",
  },
  attendance: {
    checkInTitle: "נוכחות עובדים",
    checkInDescription: "רשום כניסה או יציאה של עובד למשמרת.",
    employeeNumber: "מספר עובד",
    checkInButton: "רישום כניסה",
    checkOutButton: "רישום יציאה",
    accessGranted: "נרשמה כניסה",
    accessDenied: "הכניסה לא נרשמה",
    qrCode: "קוד QR",
    qrCodeDescription: "סרוק קוד זה בשער כדי לרשום כניסה ולפתוח את השער אוטומטית.",
    downloadQrCode: "הורדה",
    printQrCode: "הדפסה",
    gateAccess: "גישה לשערים",
    allGates: "כל השערים בסניף זה",
    selectedGatesOnly: "שערים נבחרים בלבד",
    noGatesYet: "טרם הוגדרו שערים לסניף זה.",
    recentAttendance: "נוכחות אחרונה",
    noRecentAttendance: "טרם נרשמה נוכחות.",
    checkInTime: "כניסה",
    checkOutTime: "יציאה",
    stillCheckedIn: "עדיין בפנים",
    reportTitle: "דוח נוכחות",
    reportDescription: "היסטוריית כניסה/יציאה ושעות עבודה לכל עובד.",
    dateFrom: "מתאריך",
    dateTo: "עד תאריך",
    filter: "סינון",
    totalHours: "סה\"כ שעות",
    daysPresent: "ימי נוכחות",
    noAttendanceData: "לא נרשמה נוכחות לתקופה זו.",
  },
  notifications: {
    title: "התראות",
    listDescription: "{count} התראות בהיסטוריה.",
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
    indexDescription: "דוחות תפעוליים לסקירה יומית. כל הנתונים מוגבלים לחשבון ולסניף שלך.",
    activeMembershipsCardDescription: "חברים בעלי מנויים פעילים כרגע בטווח הסניף הזה.",
    expiredMembershipsCardDescription: "מנויים שפג תוקפם או הגיעו לתאריך הסיום שלהם.",
    visitsCardDescription: "רישומי כניסה להיום כברירת מחדל; ניתן לסנן לפי טווח תאריכים.",
    paymentsCardDescription: "רישומי תשלום להיום כברירת מחדל; ניתן לסנן לפי טווח תאריכים.",
    membersBySexCardDescription: "מספר החברים מפולח לפי מגדר.",
    registrationsByEmployeeCardDescription: "חברים חדשים שנרשמו לכל עובד, ניתן לסנן לפי עובד ותאריך.",
    planPerformanceCardDescription: "מנויים שנמכרו והכנסות שנוצרו לכל תוכנית החודש.",
    membershipStatusCardDescription: "מספר המנויים הפעילים, המוקפאים, שפג תוקפם והמבוטלים.",
    expiringSoonCardDescription: "מנויים פעילים שיפוגו בתוך 7 הימים הקרובים — לצורך פנייה לחידוש.",
    upcomingBirthdaysCardDescription: "חברים עם יום הולדת בתוך 30 הימים הקרובים.",
    newMembersGrowthCardDescription: "הצטרפויות חברים חדשים ליום החודש הזה.",
    activeMembershipsDescription: "{total} מנויים פעילים נכון לתאריך {asOfDate}.",
    expiredMembershipsDescription: "{total} מנויים שפג תוקפם נכון לתאריך {asOfDate}.",
    visitsDescription: "{total} ביקורים מ-{dateFrom} עד {dateTo}.",
    membersBySexDescription: "{total} חברים נכון לתאריך {asOfDate} ({activeTotal} פעילים).",
    membershipStatusDescription: "{total} מנויים נכון לתאריך {asOfDate}.",
    expiringSoonDescription: "{total} מנויים שפגים תוך {days} ימים מתאריך {asOfDate}.",
    upcomingBirthdaysDescription: "{total} חברים חוגגים יום הולדת ב-{days} הימים הקרובים.",
    newMembersGrowthDescription: "{total} חברים חדשים הצטרפו מ-{dateFrom} עד {dateTo}.",
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
    membersBySex: "חברים לפי מגדר",
    registrationsByEmployee: "רישומים לפי עובד",
    planPerformance: "ביצועי תוכניות",
    membershipStatusBreakdown: "פילוח סטטוס מנויים",
    expiringSoon: "פגי תוקף בקרוב",
    upcomingBirthdays: "ימי הולדת קרובים",
    newMembersGrowth: "צמיחת חברים חדשים",
    sexCol: "מגדר",
    maleLabel: "זכר",
    femaleLabel: "נקבה",
    unspecifiedLabel: "לא צוין",
    activeCol: "פעיל",
    totalCol: "סה\"כ",
    employeeCol: "עובד",
    countCol: "כמות",
    unassignedLabel: "לא משויך",
    allEmployeesLabel: "כל העובדים",
    filterLabel: "סינון",
    applyFilter: "החל",
    dateFromLabel: "מ־",
    dateToLabel: "עד",
    daysLabel: "ימים קדימה",
    viewMembers: "הצג חברים ←",
    planTypeCol: "סוג",
    revenueCol: "הכנסות",
    daysUntilCol: "ימים שנותרו",
    birthdayCol: "יום הולדת",
    phoneCol: "טלפון",
    noResults: "לא נמצאו נתונים עבור דוח זה.",
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
    activeBranchTitle: "הסניף הפעיל",
    activeBranchDescription: "בחר מאיזה סניף אתה פועל כרגע. זה קובע אילו חברים וביקורים אתה רואה באפליקציה.",
    currentBranch: "הסניף הנוכחי",
    switchBranch: "החלף סניף",
    noOtherBranches: "אין סניפים פעילים נוספים להחלפה.",
    createABranch: "צור סניף",
    current: "נוכחי",
    switchAction: "החלף",
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
    options: "אפשרויות",
    optionsTitle: "העדפות כלליות",
    optionsDescription: "שפה, תצוגה והתנהגות כניסה/יציאה עבור המכון שלך.",
    checkInOutSectionTitle: "כניסה / יציאה",
    checkOutToggleLabel: "הפעל רישום יציאת חברים",
    checkOutToggleHelp: "כשזה כבוי, חברים רק סורקים כניסה בשער — רשימת הביקורים לא תעקוב או תציג זמני יציאה.",
    dataVisibilityTitle: "נראות נתונים",
    dataVisibilityHelp: "כבעלים, בחר האם עמודי החברים, העובדים, המשתמשים, הביקורים, התשלומים והדוחות יציגו את כל הסניפים או רק את הסניף הפעיל שלך.",
    dataVisibilityAllBranches: "כל הסניפים",
    dataVisibilityAllBranchesHelp: "הצג חברים, עובדים, משתמשים ודוחות מכל סניפי המכון שלך.",
    dataVisibilityActiveBranch: "הסניף הפעיל בלבד",
    dataVisibilityActiveBranchHelp: "הצג רק את הסניף שאתה מחובר אליו כרגע (ניתן לשנות תחת סניפים).",
    reportingCurrencyTitle: "מטבע דיווח",
    reportingCurrencyHelp: "משמש לדוחות ברמת החברה על פני כל הסניפים. לכל סניף מטבע תפעולי משלו (מוגדר תחת סניפים) המשמש לתשלומים היומיים שלו.",
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
    whatsappReconnecting: "המכשיר נותק — ממתין לקוד QR חדש…",
    whatsappRefreshHint: "מתרענן כל 3 שניות.",
    whatsappGenericError: "אירעה שגיאה.",
    logoSectionTitle: "לוגו",
    logoSectionHelp: "בחר אם לכל הסניפים יש לוגו משותף אחד, או שלכל סניף יש לוגו משלו.",
    logoModeLabel: "מצב לוגו",
    logoModeShared: "אותו לוגו לכל הסניפים",
    logoModeSharedHelp: "העלה לוגו אחד שישמש בכל מקום בחשבון.",
    logoModePerBranch: "לכל סניף לוגו משלו",
    logoModePerBranchHelp: "העלה לוגו לכל סניף מתוך דף עריכת הסניף.",
    logoUpload: "העלה לוגו",
    logoChange: "החלף לוגו",
    logoRemove: "הסר",
    logoUploading: "מעלה…",
    logoUploadError: "העלאת הלוגו נכשלה. נסה שוב.",
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
  classes: {
    title: "קורסים",
    programsTitle: "קורסים",
    listDescription: "{count} קורסים ב-{tenant}.",
    newProgram: "קורס חדש",
    noPrograms: "אין עדיין קורסים.",
    todaysSessions: "השיעורים של היום",
    todaysSessionsHelper: "שיעורים מתוזמנים להיום בכל התוכניות.",
    noSessionsToday: "אין שיעורים מתוזמנים היום.",
    statusInProgress: "מתקיים כעת",
    statusUpcoming: "בקרוב",
    statusCompleted: "הסתיים",
    statusLowBookings: "מעט הרשמות",
    programName: "שם הקורס",
    description: "תיאור",
    color: "צבע",
    maxMembers: "מספר תלמידים מרבי",
    defaultCoach: "מאמן ברירת מחדל",
    noCoach: "לא הוקצה מאמן",
    allBranches: "כל הסניפים (כללי)",
    createProgram: "צור קורס",
    programDetails: "פרטי הקורס",
    allPrograms: "כל הקורסים",
    price: "מחיר",
    startDate: "תאריך התחלה",
    endDate: "תאריך סיום",
    sessionsTitle: "שיעורים מתוזמנים",
    newSession: "תזמן שיעור",
    program: "תוכנית",
    coach: "מאמן",
    room: "חדר",
    date: "תאריך",
    startTime: "שעת התחלה",
    endTime: "שעת סיום",
    capacity: "קיבולת",
    bookedCount: "מוזמן",
    repeatWeeks: "חזור מדי שבוע למשך (שבועות)",
    scheduleSingle: "תזמן שיעור בודד",
    scheduleRecurring: "תזמן שיעורים חוזרים",
    noSessions: "אין עדיין שיעורים מתוזמנים.",
    cancelSession: "בטל שיעור",
    viewSession: "צפה",
    sessionDetails: "פרטי השיעור",
    bookingsTitle: "הזמנות",
    bookMember: "הזמן חבר",
    member: "חבר",
    selectMember: "בחר חבר",
    book: "הזמן",
    noBookings: "אין עדיין הזמנות.",
    cancelBooking: "בטל הזמנה",
    bookingBooked: "מוזמן",
    bookingWaitlisted: "ברשימת המתנה",
    bookingAttended: "נכח",
    bookingNoShow: "לא הופיע",
    bookingCancelled: "בוטל",
    coachProfileTitle: "פרופיל מאמן",
    specializations: "התמחויות (מופרדות בפסיקים)",
    certifications: "הסמכות (מופרדות בפסיקים)",
    saveCoachProfile: "שמור פרופיל מאמן",
    notACoach: "לעובד זה אין עדיין פרופיל מאמן — הוסף התמחויות כדי לאפשר הזמנתו כמאמן.",
    scheduleTitle: "לוח זמנים שבועי",
    scheduleHint: "הגדירו את הימים והשעות שבהם מתקיים הקורס מדי שבוע, ולאחר מכן צרו את השיעורים לכל משך הקורס.",
    dayOfWeek: "יום בשבוע",
    addSlot: "הוסף מועד",
    removeSlot: "הסר",
    saveSchedule: "שמור לוח זמנים",
    generateSessions: "צור שיעורים",
    daySunday: "ראשון",
    dayMonday: "שני",
    dayTuesday: "שלישי",
    dayWednesday: "רביעי",
    dayThursday: "חמישי",
    dayFriday: "שישי",
    daySaturday: "שבת",
    rosterTitle: "תלמידים",
    rosterHint: "חברים הרשומים לקורס זה. הרשמה מחייבת את החבר במחיר הקורס ומזמינה אותו לכל שיעור עתידי — ללא צורך במנוי.",
    addStudent: "רישום תלמיד",
    noStudentsRegistered: "עדיין לא נרשמו תלמידים.",
    unregisterStudent: "ביטול הרשמה",
    registerForCourse: "הרשמה לקורס",
    selectCourse: "בחר קורס",
    noCoursesAvailable: "אין קורסים זמינים.",
    coursesTitle: "קורסים",
    noCoursesYet: "עדיין לא נרשם לאף קורס.",
    attendanceReportTitle: "דוח נוכחות",
    attendanceReportHint: "נוכחות והיעדרות של כל תלמיד בכל שיעורי הקורס.",
    viewReport: "צפה בדוח נוכחות",
    present: "נוכח",
    absent: "נעדר",
    totalLessons: "סה\"כ שיעורים",
    noLessonsYet: "עדיין לא נקבעו שיעורים.",
    markPresent: "סמן נוכח",
    markAbsent: "סמן נעדר",
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

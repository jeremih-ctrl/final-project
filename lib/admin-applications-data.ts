export type ApplicationStatus =
  | "Submitted"
  | "Under Review"
  | "Needs Correction"
  | "Correction Submitted"
  | "Approved"
  | "Rejected";

export interface AddressInfo {
  houseNumber: string;
  street: string;
  barangay: string;
  city: string;
  province: string;
  region: string;
  country: string;
}

export interface GovernmentIdInfo {
  submitted: boolean;
  filename: string;
  idType: string;
  uploadedAt: string;
  status: "Submitted" | "Verified" | "Replacement Requested";
}

export interface ActivityItem {
  id: string;
  title: string;
  date: string;
  description: string;
  type: "submission" | "review" | "correction" | "approval" | "rejection";
}

export interface AdminApplication {
  id: string;
  businessName: string;
  owner: string;
  barangay: string;
  submitted: string;
  status: ApplicationStatus;
  businessDescription: string;
  contactNumber: string;
  email: string;
  address: AddressInfo;
  governmentId?: GovernmentIdInfo;
  remarks?: string;
  vendorId?: string;
  activityTimeline: ActivityItem[];
}

export const BARANGAY_OPTIONS = [
  "All Barangays",
  "Baan KM 3",
  "Ampayon",
  "Libertad",
  "San Vicente",
  "Villa Kananga",
  "Urduja",
] as const;

export const STATUS_OPTIONS = [
  "All",
  "Submitted",
  "Under Review",
  "Needs Correction",
  "Correction Submitted",
  "Approved",
  "Rejected",
] as const;

export const MOCK_APPLICATIONS: AdminApplication[] = [
  {
    id: "BVR-2026-001248",
    businessName: "Juan's Food Stall",
    owner: "Juan Dela Cruz",
    barangay: "Baan KM 3",
    submitted: "Oct 6, 2026",
    status: "Under Review",
    businessDescription:
      "Local food vendor serving affordable meals and snacks.",
    contactNumber: "09XXXXXXXXX",
    email: "juan@email.com",
    address: {
      houseNumber: "123",
      street: "J.C. Aquino Avenue",
      barangay: "Baan KM 3",
      city: "Butuan City",
      province: "Agusan del Norte",
      region: "Caraga",
      country: "Philippines",
    },
    governmentId: {
      submitted: true,
      filename: "government-id.pdf",
      idType: "Philippine National ID (PhilSys)",
      uploadedAt: "October 6, 2026",
      status: "Submitted",
    },
    remarks: "Please provide a clearer copy of the submitted document.",
    vendorId: "BUT-V-001248",
    activityTimeline: [
      {
        id: "act-1",
        title: "Application Submitted",
        date: "October 6, 2026",
        description: "Vendor submitted the registration application.",
        type: "submission",
      },
      {
        id: "act-2",
        title: "Application Under Review",
        date: "October 6, 2026",
        description: "Administrator started reviewing the application.",
        type: "review",
      },
    ],
  },
  {
    id: "BVR-2026-001247",
    businessName: "Maria's Sari-Sari Store",
    owner: "Maria Santos",
    barangay: "Libertad",
    submitted: "Oct 6, 2026",
    status: "Approved",
    businessDescription:
      "Neighborhood retail sundries, canned goods, rice, and daily necessities.",
    contactNumber: "09181234567",
    email: "maria.santos@email.com",
    address: {
      houseNumber: "45-B",
      street: "Montilla Boulevard",
      barangay: "Libertad",
      city: "Butuan City",
      province: "Agusan del Norte",
      region: "Caraga",
      country: "Philippines",
    },
    governmentId: {
      submitted: true,
      filename: "barangay-clearance.pdf",
      idType: "Barangay Identification Card",
      uploadedAt: "October 6, 2026",
      status: "Verified",
    },
    remarks: "All documents valid and verified with Barangay Libertad registry.",
    vendorId: "BUT-V-001247",
    activityTimeline: [
      {
        id: "act-1",
        title: "Application Submitted",
        date: "October 6, 2026",
        description: "Vendor submitted the registration application.",
        type: "submission",
      },
      {
        id: "act-2",
        title: "Application Under Review",
        date: "October 6, 2026",
        description: "Administrator started reviewing the application.",
        type: "review",
      },
      {
        id: "act-3",
        title: "Application Approved",
        date: "October 6, 2026",
        description: "Vendor registration approved. Vendor ID: BUT-V-001247.",
        type: "approval",
      },
    ],
  },
  {
    id: "BVR-2026-001246",
    businessName: "Pedro BBQ",
    owner: "Pedro Cruz",
    barangay: "Ampayon",
    submitted: "Oct 5, 2026",
    status: "Needs Correction",
    businessDescription:
      "Evening street-side barbecue grilling pork, chicken inasal, and isaw.",
    contactNumber: "09201234567",
    email: "pedro.bbq@email.com",
    address: {
      houseNumber: "88",
      street: "National Highway (Ampayon Junction)",
      barangay: "Ampayon",
      city: "Butuan City",
      province: "Agusan del Norte",
      region: "Caraga",
      country: "Philippines",
    },
    governmentId: {
      submitted: true,
      filename: "valid-id-scan.png",
      idType: "Driver's License",
      uploadedAt: "October 5, 2026",
      status: "Replacement Requested",
    },
    remarks: "Please provide a clearer copy of the submitted document.",
    vendorId: "BUT-V-001246",
    activityTimeline: [
      {
        id: "act-1",
        title: "Application Submitted",
        date: "October 5, 2026",
        description: "Vendor submitted the registration application.",
        type: "submission",
      },
      {
        id: "act-2",
        title: "Application Under Review",
        date: "October 5, 2026",
        description: "Administrator started reviewing the application.",
        type: "review",
      },
      {
        id: "act-3",
        title: "Correction Requested",
        date: "October 5, 2026",
        description:
          "Administrator requested clearer copy of submitted government ID.",
        type: "correction",
      },
    ],
  },
  {
    id: "BVR-2026-001245",
    businessName: "Agusan River Fresh Fish",
    owner: "Elena Roxas",
    barangay: "San Vicente",
    submitted: "Oct 5, 2026",
    status: "Submitted",
    businessDescription:
      "Fresh catch tilapia, bangus, and river shrimp sold at morning market.",
    contactNumber: "09179876543",
    email: "elena.roxas@email.com",
    address: {
      houseNumber: "12",
      street: "Riverside Drive",
      barangay: "San Vicente",
      city: "Butuan City",
      province: "Agusan del Norte",
      region: "Caraga",
      country: "Philippines",
    },
    governmentId: {
      submitted: false,
      filename: "",
      idType: "",
      uploadedAt: "",
      status: "Submitted",
    },
    remarks: "Initial queue intake. Government ID optional but not provided.",
    vendorId: "BUT-V-001245",
    activityTimeline: [
      {
        id: "act-1",
        title: "Application Submitted",
        date: "October 5, 2026",
        description: "Vendor submitted the registration application.",
        type: "submission",
      },
    ],
  },
  {
    id: "BVR-2026-001244",
    businessName: "Golden Tara Refreshments",
    owner: "Roberto Ramos",
    barangay: "Villa Kananga",
    submitted: "Oct 4, 2026",
    status: "Approved",
    businessDescription:
      "Specialty halo-halo, sago't gulaman, and cold native snacks.",
    contactNumber: "09192233445",
    email: "roberto.ramos@email.com",
    address: {
      houseNumber: "302",
      street: "Pizarro Street",
      barangay: "Villa Kananga",
      city: "Butuan City",
      province: "Agusan del Norte",
      region: "Caraga",
      country: "Philippines",
    },
    governmentId: {
      submitted: true,
      filename: "dti-certificate.pdf",
      idType: "Postal ID (Digital)",
      uploadedAt: "October 4, 2026",
      status: "Verified",
    },
    remarks: "Compliant with City Health sanitary guidelines.",
    vendorId: "BUT-V-001244",
    activityTimeline: [
      {
        id: "act-1",
        title: "Application Submitted",
        date: "October 4, 2026",
        description: "Vendor submitted the registration application.",
        type: "submission",
      },
      {
        id: "act-2",
        title: "Application Under Review",
        date: "October 4, 2026",
        description: "Administrator started reviewing the application.",
        type: "review",
      },
      {
        id: "act-3",
        title: "Application Approved",
        date: "October 4, 2026",
        description: "Vendor registration approved. Vendor ID: BUT-V-001244.",
        type: "approval",
      },
    ],
  },
  {
    id: "BVR-2026-001243",
    businessName: "Butuan Balut & Penoy Express",
    owner: "Dante Magbanua",
    barangay: "Baan KM 3",
    submitted: "Oct 3, 2026",
    status: "Rejected",
    businessDescription:
      "Mobile evening egg cart serving hot balut and penoy.",
    contactNumber: "09214455667",
    email: "dante.balut@email.com",
    address: {
      houseNumber: "77",
      street: "Langihan Road",
      barangay: "Baan KM 3",
      city: "Butuan City",
      province: "Agusan del Norte",
      region: "Caraga",
      country: "Philippines",
    },
    governmentId: {
      submitted: true,
      filename: "national-id-scan.jpg",
      idType: "PhilSys National ID",
      uploadedAt: "October 3, 2026",
      status: "Submitted",
    },
    remarks:
      "Duplicate registration detected for same stall location. Please register under main cooperative permit.",
    vendorId: "BUT-V-001243",
    activityTimeline: [
      {
        id: "act-1",
        title: "Application Submitted",
        date: "October 3, 2026",
        description: "Vendor submitted the registration application.",
        type: "submission",
      },
      {
        id: "act-2",
        title: "Application Under Review",
        date: "October 3, 2026",
        description: "Administrator started reviewing the application.",
        type: "review",
      },
      {
        id: "act-3",
        title: "Application Rejected",
        date: "October 3, 2026",
        description:
          "Application rejected. Duplicate registration detected for same stall location.",
        type: "rejection",
      },
    ],
  },
  {
    id: "BVR-2026-001242",
    businessName: "Kadayawan Fruit Stand",
    owner: "Liza Flores",
    barangay: "Villa Kananga",
    submitted: "Oct 3, 2026",
    status: "Under Review",
    businessDescription:
      "Seasonal tropical fruits: durian, lanzones, and marang direct from growers.",
    contactNumber: "09307788990",
    email: "liza.flores@email.com",
    address: {
      houseNumber: "51",
      street: "Capitol Drive",
      barangay: "Villa Kananga",
      city: "Butuan City",
      province: "Agusan del Norte",
      region: "Caraga",
      country: "Philippines",
    },
    governmentId: {
      submitted: true,
      filename: "philhealth-id.pdf",
      idType: "PhilHealth ID",
      uploadedAt: "October 3, 2026",
      status: "Submitted",
    },
    remarks: "Pending cross-check with City Agriculture vendor permits.",
    vendorId: "BUT-V-001242",
    activityTimeline: [
      {
        id: "act-1",
        title: "Application Submitted",
        date: "October 3, 2026",
        description: "Vendor submitted the registration application.",
        type: "submission",
      },
      {
        id: "act-2",
        title: "Application Under Review",
        date: "October 3, 2026",
        description: "Administrator started reviewing the application.",
        type: "review",
      },
    ],
  },
  {
    id: "BVR-2026-001241",
    businessName: "Maningning Tailoring & Repair",
    owner: "Estrella Maningning",
    barangay: "San Vicente",
    submitted: "Oct 2, 2026",
    status: "Under Review",
    businessDescription:
      "Clothing alterations, zipper repairs, and custom school uniform sewing.",
    contactNumber: "09153322114",
    email: "estrella.sew@email.com",
    address: {
      houseNumber: "14",
      street: "E. Luna Street",
      barangay: "San Vicente",
      city: "Butuan City",
      province: "Agusan del Norte",
      region: "Caraga",
      country: "Philippines",
    },
    governmentId: {
      submitted: true,
      filename: "voters-cert.pdf",
      idType: "COMELEC Voter's Certificate",
      uploadedAt: "October 2, 2026",
      status: "Submitted",
    },
    remarks: "Stall location verified along commercial alleyway.",
    vendorId: "BUT-V-001241",
    activityTimeline: [
      {
        id: "act-1",
        title: "Application Submitted",
        date: "October 2, 2026",
        description: "Vendor submitted the registration application.",
        type: "submission",
      },
      {
        id: "act-2",
        title: "Application Under Review",
        date: "October 2, 2026",
        description: "Administrator started reviewing the application.",
        type: "review",
      },
    ],
  },
];

export function getApplicationById(id: string): AdminApplication {
  const found = MOCK_APPLICATIONS.find(
    (app) => app.id.toLowerCase() === id.toLowerCase()
  );
  if (found) {
    return found;
  }
  // Return Juan Dela Cruz with the requested id as default mock
  return {
    ...MOCK_APPLICATIONS[0],
    id: id || "BVR-2026-001248",
  };
}

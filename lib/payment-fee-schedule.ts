/**
 * Butuan City Vendor Registration Fee Assessment & Payment Configuration
 *
 * Provides official regulatory fee schedules, payment method definitions,
 * fee calculation logic, and gateway integration requirements based on
 * the Butuan City Revenue Code (Tax Ordinance No. 132 as amended) and
 * the City Government of Butuan E-TRACS system.
 */

import { FeeItem, PaymentInformation, PaymentStatus } from "./types/vendor-application";

// ─── Gateway Integration Configuration ────────────────────────────────────────

export interface GatewayIntegrationConfig {
  providerName: string;
  officialPortal: string;
  status: "connected" | "not_connected" | "maintenance";
  isConfigured: boolean;
  missingRequirements: string[];
  publicNotice: string;
}

export const BUTUAN_PAYMENT_GATEWAY_CONFIG: GatewayIntegrationConfig = {
  providerName: "Maya (Butuan City E-TRACS Official Partner)",
  officialPortal: "https://etracs.butuan.gov.ph",
  status: "not_connected",
  isConfigured: false,
  missingRequirements: [
    "Maya Public API Key & Secret API Key (server-side environment variable)",
    "City of Butuan Merchant Account ID",
    "Server-side checkout session creation endpoint (/api/payment/maya/create-checkout)",
    "Secure Webhook verification endpoint with HMAC signature check (/api/payment/maya/webhook)",
    "Production SSL certificate & LGU merchant callback registration",
  ],
  publicNotice:
    "Official Maya online checkout is currently in setup mode awaiting municipal credentials and backend webhook endpoints. Applications submitted online will retain an 'Unpaid' or 'Pending Assessment' status until officially verified by the City Treasurer's Office (CTO) cashier or connected gateway.",
};

// ─── Payment Methods ──────────────────────────────────────────────────────────

export interface PaymentMethodOption {
  id: string;
  name: string;
  category: "e_wallet" | "card" | "online_banking" | "otc";
  categoryLabel: "A. E-wallets" | "B. ATM and bank cards" | "C. Online banking and bank transfer" | "D. Over-the-counter payments";
  description: string;
  iconName: "Wallet" | "CreditCard" | "Building" | "Store";
  supportedByProvider: boolean;
  channelDetails: string;
  instructions: string;
}

export const PAYMENT_METHODS: PaymentMethodOption[] = [
  // A. E-wallets
  {
    id: "maya",
    name: "Maya",
    category: "e_wallet",
    categoryLabel: "A. E-wallets",
    description: "Official digital wallet partner for Butuan City E-TRACS portal",
    iconName: "Wallet",
    supportedByProvider: true,
    channelDetails: "Maya Wallet • Maya QR Ph",
    instructions: "Pay instantly using your registered Maya account or scan the official LGU QR Ph code.",
  },
  {
    id: "gcash",
    name: "GCash",
    category: "e_wallet",
    categoryLabel: "A. E-wallets",
    description: "Supported through Maya Checkout QR Ph interoperability",
    iconName: "Wallet",
    supportedByProvider: true,
    channelDetails: "GCash App • QR Ph Interoperable",
    instructions: "Scan the Maya-generated QR Ph dynamic code via your GCash app scanner.",
  },

  // B. ATM and bank cards
  {
    id: "debit_card",
    name: "ATM / Debit Card",
    category: "card",
    categoryLabel: "B. ATM and bank cards",
    description: "BancNet, Visa, and Mastercard debit cards",
    iconName: "CreditCard",
    supportedByProvider: true,
    channelDetails: "BancNet • Visa Debit • Mastercard Debit",
    instructions: "Process securely via provider's hosted payment screen. ATM PIN is never requested or stored.",
  },
  {
    id: "credit_card",
    name: "Credit Card",
    category: "card",
    categoryLabel: "B. ATM and bank cards",
    description: "Visa and Mastercard credit cards via secure gateway",
    iconName: "CreditCard",
    supportedByProvider: true,
    channelDetails: "Visa • Mastercard",
    instructions: "Encrypted card checkout processed exclusively on the provider's PCI-DSS compliant page.",
  },

  // C. Online banking and bank transfer
  {
    id: "landbank_linkbiz",
    name: "Landbank Link.BizPortal",
    category: "online_banking",
    categoryLabel: "C. Online banking and bank transfer",
    description: "Official government payment portal for Landbank account holders",
    iconName: "Building",
    supportedByProvider: true,
    channelDetails: "Landbank Accounts • BancNet Member Banks",
    instructions: "Select City Government of Butuan as merchant on Landbank Link.BizPortal and enter your Assessment Reference.",
  },
  {
    id: "online_bank_transfer",
    name: "Participating Online Banking",
    category: "online_banking",
    categoryLabel: "C. Online banking and bank transfer",
    description: "BDO, BPI, UnionBank, RCBC via Maya Online Banking gateway",
    iconName: "Building",
    supportedByProvider: true,
    channelDetails: "Direct Bank Login via Secure Gateway Redirect",
    instructions: "Authorize transfer directly in your banking app using your bank's two-factor authentication.",
  },

  // D. Over-the-counter payments
  {
    id: "cto_cashier",
    name: "City Treasurer's Office (CTO) Cashier",
    category: "otc",
    categoryLabel: "D. Over-the-counter payments",
    description: "In-person cash payment at Butuan City Hall BOSS / Treasury counter",
    iconName: "Store",
    supportedByProvider: true,
    channelDetails: "City Hall Treasury Cashier • Robinsons BOSS Center",
    instructions: "Present your Application Number and Assessment Slip at the CTO Cashier window to pay and receive your official municipal receipt.",
  },
  {
    id: "otc_payment_centers",
    name: "Authorized Payment Centers",
    category: "otc",
    categoryLabel: "D. Over-the-counter payments",
    description: "Bayad Center, M Lhuillier, and partner branches nationwide",
    iconName: "Store",
    supportedByProvider: true,
    channelDetails: "Bayad Center • M Lhuillier • Cebuana Lhuillier",
    instructions: "Present your 12-digit Assessment Reference slip at any authorized payment center counter.",
  },
];

// ─── Fee Schedule & Pricing Rules ─────────────────────────────────────────────

export interface BusinessCategoryFeeSchedule {
  categoryKey: string;
  displayName: string;
  description: string;
  isAssessmentRequired: boolean;
  notes: string;
  fees: FeeItem[];
}

export const BUTUAN_FEE_SCHEDULES: Record<string, BusinessCategoryFeeSchedule> = {
  food_stall: {
    categoryKey: "food_stall",
    displayName: "Food & Refreshment / Eatery / Market Stall",
    description: "Food preparation, cooked meals, carinderia, refreshments, and wet market food stalls",
    isAssessmentRequired: false,
    notes:
      "Subject to annual Sanitary Inspection Fee by the City Health Office pursuant to the Sanitation Code and Butuan Revenue Code.",
    fees: [
      {
        id: "mayors-permit",
        name: "Mayor's Permit / Local Business Registration",
        description: "City Business Permits and Licensing Department (CBPLD) municipal authorization",
        amount: 500,
        isRegulatory: true,
        notes: "City Tax Ordinance No. 132 as amended",
      },
      {
        id: "barangay-clearance",
        name: "Barangay Clearance Regulatory Fee",
        description: "Consolidated barangay business clearance collected at City BOSS",
        amount: 100,
        isRegulatory: true,
        notes: "RA 11032 Ease of Doing Business integration",
      },
      {
        id: "sanitary-inspection",
        name: "Sanitary Inspection & Health Clearance Fee",
        description: "City Health Office annual sanitation inspection and food handler regulatory fee",
        amount: 250,
        isRegulatory: true,
        notes: "Mandatory for all food & beverage establishments",
      },
      {
        id: "zoning-clearance",
        name: "Zoning & Locational Clearance Fee",
        description: "City Planning & Development Office (CPDO) land use and stall zoning verification",
        amount: 200,
        isRegulatory: true,
      },
      {
        id: "fire-safety-inspection",
        name: "Annual Fire Safety Inspection Fee (AFSIF)",
        description: "Bureau of Fire Protection (BFP) regulatory inspection assessment",
        amount: 200,
        isRegulatory: true,
        notes: "BFP Fire Code of the Philippines compliance",
      },
      {
        id: "solid-waste-enro",
        name: "City Garbage & Solid Waste Environmental Fee",
        description: "City Environment & Natural Resources Office (ENRO) regulatory compliance fee",
        amount: 200,
        isRegulatory: true,
      },
    ],
  },

  market_produce: {
    categoryKey: "market_produce",
    displayName: "Agricultural Produce / Fish & Meat Stand",
    description: "Fresh fruits, vegetables, native produce, raw fish, and meat stands in designated vendor areas",
    isAssessmentRequired: false,
    notes: "Agricultural produce stalls benefit from streamlined local market vendor regulatory schedules.",
    fees: [
      {
        id: "mayors-permit",
        name: "Mayor's Permit / Local Business Registration",
        description: "CBPLD local registration fee for market produce vendors",
        amount: 400,
        isRegulatory: true,
      },
      {
        id: "barangay-clearance",
        name: "Barangay Clearance Regulatory Fee",
        description: "Local barangay clearance consolidated via City BOSS",
        amount: 100,
        isRegulatory: true,
      },
      {
        id: "sanitary-inspection",
        name: "Sanitary Inspection & Wet Goods Clearance",
        description: "City Health Office sanitary inspection for fresh produce & perishable food handling",
        amount: 250,
        isRegulatory: true,
      },
      {
        id: "zoning-clearance",
        name: "Zoning & Locational Clearance Fee",
        description: "CPDO locational clearance for market stalls",
        amount: 150,
        isRegulatory: true,
      },
      {
        id: "fire-safety-inspection",
        name: "Annual Fire Safety Inspection Fee (AFSIF)",
        description: "BFP annual market vendor fire inspection",
        amount: 150,
        isRegulatory: true,
      },
      {
        id: "solid-waste-enro",
        name: "City Garbage & Solid Waste Environmental Fee",
        description: "City ENRO market solid waste regulatory fee",
        amount: 200,
        isRegulatory: true,
      },
    ],
  },

  retail_sarisari: {
    categoryKey: "retail_sarisari",
    displayName: "Retail / Sari-Sari Store / General Merchandise",
    description: "Neighborhood convenience, sari-sari stores, and small non-food retail merchandise",
    isAssessmentRequired: false,
    notes:
      "Non-food retail establishments are exempt from food handling sanitary inspections. Only standard regulatory fees apply.",
    fees: [
      {
        id: "mayors-permit",
        name: "Mayor's Permit / Local Business Registration",
        description: "CBPLD retail vendor registration fee",
        amount: 400,
        isRegulatory: true,
      },
      {
        id: "barangay-clearance",
        name: "Barangay Clearance Regulatory Fee",
        description: "Barangay clearance consolidated through City BOSS",
        amount: 100,
        isRegulatory: true,
      },
      {
        id: "zoning-clearance",
        name: "Zoning & Locational Clearance Fee",
        description: "CPDO locational compliance for retail location",
        amount: 200,
        isRegulatory: true,
      },
      {
        id: "fire-safety-inspection",
        name: "Annual Fire Safety Inspection Fee (AFSIF)",
        description: "BFP fire safety inspection assessment",
        amount: 200,
        isRegulatory: true,
      },
      {
        id: "solid-waste-enro",
        name: "City Garbage & Solid Waste Environmental Fee",
        description: "City ENRO solid waste collection fee",
        amount: 150,
        isRegulatory: true,
      },
    ],
  },

  dry_goods_services: {
    categoryKey: "dry_goods_services",
    displayName: "Dry Goods / Tailoring / Repair & Services",
    description: "Apparel, footwear, tailoring, shoe repair, electronics repair, and artisanal services",
    isAssessmentRequired: false,
    notes: "Service and dry goods vendors are exempt from food sanitary fees.",
    fees: [
      {
        id: "mayors-permit",
        name: "Mayor's Permit / Local Business Registration",
        description: "CBPLD business registration for dry goods & small services",
        amount: 350,
        isRegulatory: true,
      },
      {
        id: "barangay-clearance",
        name: "Barangay Clearance Regulatory Fee",
        description: "Barangay clearance consolidated via City BOSS",
        amount: 100,
        isRegulatory: true,
      },
      {
        id: "zoning-clearance",
        name: "Zoning & Locational Clearance Fee",
        description: "CPDO locational clearance for service stall",
        amount: 200,
        isRegulatory: true,
      },
      {
        id: "fire-safety-inspection",
        name: "Annual Fire Safety Inspection Fee (AFSIF)",
        description: "BFP fire safety regulatory inspection",
        amount: 150,
        isRegulatory: true,
      },
      {
        id: "solid-waste-enro",
        name: "City Garbage & Solid Waste Environmental Fee",
        description: "City ENRO waste regulatory fee",
        amount: 150,
        isRegulatory: true,
      },
    ],
  },

  custom_assessment: {
    categoryKey: "custom_assessment",
    displayName: "Other Category / Specialized Commercial Activity",
    description: "Commercial operations requiring custom municipal appraisal or capital evaluation",
    isAssessmentRequired: true,
    notes:
      "Fee assessment required: The exact regulatory charges must be formally evaluated and confirmed by the City Business Permits and Licensing Department (CBPLD) and City Treasurer's Office (CTO).",
    fees: [],
  },
};

// ─── Assessment Calculator ───────────────────────────────────────────────────

export interface AssessmentResult {
  categoryKey: string;
  categoryDisplayName: string;
  isAssessmentRequired: boolean;
  totalAmount: number;
  formattedTotal: string;
  fees: FeeItem[];
  notes: string;
  assessmentStatus: "assessed" | "assessment_required";
}

/**
 * Maps a business category text string or key to the official Butuan City schedule.
 */
export function resolveCategorySchedule(
  categoryInput?: string
): BusinessCategoryFeeSchedule {
  if (!categoryInput) {
    return BUTUAN_FEE_SCHEDULES.food_stall;
  }

  const normalized = categoryInput.toLowerCase();

  if (
    normalized.includes("produce") ||
    normalized.includes("fruit") ||
    normalized.includes("vegetable") ||
    normalized.includes("fish") ||
    normalized.includes("meat") ||
    normalized.includes("agriculture")
  ) {
    return BUTUAN_FEE_SCHEDULES.market_produce;
  }

  if (
    normalized.includes("food") ||
    normalized.includes("eatery") ||
    normalized.includes("carinderia") ||
    normalized.includes("snack") ||
    normalized.includes("refreshment") ||
    normalized.includes("beverage")
  ) {
    return BUTUAN_FEE_SCHEDULES.food_stall;
  }

  if (
    normalized.includes("sari-sari") ||
    normalized.includes("grocery") ||
    normalized.includes("retail") ||
    normalized.includes("convenience")
  ) {
    return BUTUAN_FEE_SCHEDULES.retail_sarisari;
  }

  if (
    normalized.includes("dry goods") ||
    normalized.includes("tailor") ||
    normalized.includes("repair") ||
    normalized.includes("apparel") ||
    normalized.includes("service")
  ) {
    return BUTUAN_FEE_SCHEDULES.dry_goods_services;
  }

  if (
    normalized.includes("other") ||
    normalized.includes("special") ||
    normalized.includes("custom")
  ) {
    return BUTUAN_FEE_SCHEDULES.custom_assessment;
  }

  // Default fallback to standard vendor schedule
  return BUTUAN_FEE_SCHEDULES.food_stall;
}

/**
 * Calculates the itemized fee assessment for an applicant.
 */
export function calculateFeeAssessment(categoryInput?: string): AssessmentResult {
  const schedule = resolveCategorySchedule(categoryInput);

  if (schedule.isAssessmentRequired) {
    return {
      categoryKey: schedule.categoryKey,
      categoryDisplayName: schedule.displayName,
      isAssessmentRequired: true,
      totalAmount: 0,
      formattedTotal: "Fee Assessment Required",
      fees: [],
      notes: schedule.notes,
      assessmentStatus: "assessment_required",
    };
  }

  const total = schedule.fees.reduce((acc, item) => acc + item.amount, 0);

  return {
    categoryKey: schedule.categoryKey,
    categoryDisplayName: schedule.displayName,
    isAssessmentRequired: false,
    totalAmount: total,
    formattedTotal: formatPhpCurrency(total),
    fees: schedule.fees,
    notes: schedule.notes,
    assessmentStatus: "assessed",
  };
}

/**
 * Formats a numeric amount into Philippine Pesos (PHP).
 */
export function formatPhpCurrency(amount?: number | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return "₱0.00";
  }
  return `₱${amount.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Generates an official assessment tracking reference number.
 */
export function generateAssessmentReference(appNumber?: string): string {
  if (appNumber && appNumber.trim()) {
    const cleanNum = appNumber.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
    return `PAY-${cleanNum}`;
  }
  const randomSuffix = Math.floor(100000 + Math.random() * 900000);
  return `PAY-BVR-2026-${randomSuffix}`;
}

// ─── LGU Official Payment Channel Instructions ──────────────────────────────

export const LGU_EWALLET_INSTRUCTIONS = {
  accountName: "LGU BUTUAN",
  accountNumber: "09674382253",
  providerNotice: "Maya / GCash QR Ph (Official LGU Butuan Merchant Account)",
  instructions:
    "1. Open your Maya or GCash app.\n2. Enter the official LGU E-Wallet number 09674382253 or scan the verified LGU QR code.\n3. Verify that the recipient name displays 'LGU BUTUAN'.\n4. Enter the exact assessed amount in Philippine Pesos (PHP).\n5. Complete the payment and take a screenshot or download the official transaction receipt showing the reference number and date.",
  qrCodePlaceholderLabel: "Official LGU Butuan E-Wallet QR Code Placeholder — Administrator can upload official verified QR code image here",
  isOfficialQrAvailable: false, // Explicitly false per instruction: do not invent fake QR code
};

export const LGU_BANK_TRANSFER_INSTRUCTIONS = {
  bankName: "Land Bank of the Philippines (Landbank)",
  accountName: "LGU BUTUAN",
  accountNumber: "Bank details to be provided by the administrator.", // Required fallback per specification
  paymentReferenceRequirement: "Application Reference (e.g. PAY-BVR-...) or Registered Business Name",
  instructions:
    "1. Transfer via Landbank Link.BizPortal, online banking, or over-the-counter bank deposit.\n2. Ensure recipient account name matches 'LGU BUTUAN'.\n3. Input your Application Reference in the transfer description or remarks.\n4. Save the transaction confirmation receipt, bank slip, or deposit voucher for upload.",
};

/**
 * Returns human-readable label and styling badge classes for payment statuses.
 */
export function getPaymentStatusBadgeConfig(status?: PaymentStatus | string): {
  label: string;
  badgeClass: string;
  dotColor: string;
} {
  const norm = (status || "unpaid").toLowerCase().replace(/[\s-]+/g, "_");
  switch (norm) {
    case "verified":
    case "paid":
      return {
        label: "Verified",
        badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold",
        dotColor: "bg-emerald-500",
      };
    case "pending_verification":
    case "pending":
      return {
        label: "Pending Verification",
        badgeClass: "bg-amber-50 text-amber-800 border-amber-300 font-semibold",
        dotColor: "bg-amber-500",
      };
    case "rejected":
      return {
        label: "Rejected",
        badgeClass: "bg-rose-50 text-rose-700 border-rose-300 font-semibold",
        dotColor: "bg-rose-500",
      };
    case "failed":
      return {
        label: "Failed",
        badgeClass: "bg-rose-50 text-rose-700 border-rose-300 font-semibold",
        dotColor: "bg-rose-500",
      };
    case "cancelled":
      return {
        label: "Cancelled",
        badgeClass: "bg-slate-100 text-slate-700 border-slate-300 font-medium",
        dotColor: "bg-slate-400",
      };
    case "refunded":
      return {
        label: "Refunded",
        badgeClass: "bg-purple-50 text-purple-700 border-purple-300 font-semibold",
        dotColor: "bg-purple-500",
      };
    case "unpaid":
    default:
      return {
        label: "Unpaid",
        badgeClass: "bg-slate-100 text-slate-700 border-slate-300 font-semibold",
        dotColor: "bg-slate-500",
      };
  }
}

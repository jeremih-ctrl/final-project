"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HelpCircle,
  Search,
  X,
  ChevronDown,
  ArrowLeft,
  FileText,
  Clock,
  UploadCloud,
  LayoutDashboard,
  Bell,
  Lock,
  Building2,
  AlertTriangle,
  Info,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  ExternalLink,
  LifeBuoy,
  RefreshCw,
  SlidersHorizontal,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// ─── TYPES ───────────────────────────────────────────────────────────────────

export type SupportCategory =
  | "all"
  | "registration"
  | "status"
  | "documents"
  | "dashboard"
  | "notifications"
  | "login"
  | "profile"
  | "errors"
  | "general";

interface TroubleshootingItem {
  id: string;
  category: SupportCategory;
  categoryName: string;
  problem: string;
  causes: string[];
  solution: string[];
  verifiedNote?: string;
}

interface FAQItem {
  id: number;
  question: string;
  category: SupportCategory;
  categoryName: string;
  answer: string[];
  tips?: string;
}

// ─── 9 PROBLEM CATEGORIES & TROUBLESHOOTING DATA ─────────────────────────────

const TROUBLESHOOTING_GUIDES: TroubleshootingItem[] = [
  {
    id: "ts-reg",
    category: "registration",
    categoryName: "Registration and Submission",
    problem: "The registration form cannot be submitted.",
    causes: [
      "Required fields are missing (e.g. Owner Name, Mobile Number, or Barangay).",
      "A field contains invalid formatting (such as an incorrect mobile phone structure).",
      "Government ID was not uploaded, or the uploaded file exceeds 5MB.",
      "Required agreement checkboxes (Terms and Privacy Policy) were not checked.",
    ],
    solution: [
      "Navigate through Steps 1 to 4 using the step indicators to check for red error alerts.",
      "Verify your phone number follows the Philippine format (09XXXXXXXXX or +639XXXXXXXXX).",
      "Ensure your uploaded ID is a PNG, JPG, or PDF file smaller than 5MB.",
      "Confirm that both 'Terms & Conditions' and 'Data Privacy Policy' boxes are checked.",
      "Click 'Submit Registration'. If an error message persists, record the message text and contact the Licensing Helpdesk.",
    ],
    verifiedNote:
      "The system automatically validates each step before allowing final submission. No duplicate application is required.",
  },
  {
    id: "ts-status",
    category: "status",
    categoryName: "Application Status and Approval",
    problem: "Application status is not updating or appears delayed.",
    causes: [
      "The latest status has not yet refreshed in your active browser session.",
      "The municipal assessor has not finished reviewing your uploaded credentials.",
      "Applications submitted over weekends or holidays are queued for the next working day.",
    ],
    solution: [
      "Refresh your browser page once or reopen 'Application Status' to fetch the latest state.",
      "Check your Notifications feed to see if an assessor requested corrections.",
      "Do NOT submit another registration solely because the status appears unchanged.",
      "Allow 1 to 3 official municipal business days for full administrative review.",
    ],
    verifiedNote:
      "Submitting duplicate applications causes administrative review conflicts and may delay your verification.",
  },
  {
    id: "ts-docs",
    category: "documents",
    categoryName: "Document Upload",
    problem: "Document upload fails or is rejected.",
    causes: [
      "Unsupported file format (only PNG, JPG/JPEG, and PDF are supported).",
      "File size exceeds the 5MB maximum limit.",
      "The image is blurry, unreadable, or missing critical identification numbers.",
      "Temporary network interruption occurred during file transfer.",
    ],
    solution: [
      "Verify the file type matches .png, .jpg, or .pdf before selecting.",
      "Resize or compress images exceeding 5MB.",
      "Ensure all 4 corners of your ID are visible and text is sharp with no camera flash glare.",
      "Navigate to 'Documents' (/dashboard/documents), click 'Replace Document', and upload a clear file.",
    ],
    verifiedNote:
      "The portal accepts PhilSys National ID, Driver's License, Voter's ID, Postal ID, Passport, and UMID.",
  },
  {
    id: "ts-dash",
    category: "dashboard",
    categoryName: "Vendor Dashboard and Navigation",
    problem: "Clicking Help/Support redirects to the public Home page or exits the dashboard.",
    causes: [
      "Outdated navigation link pointing to '/' instead of the dedicated portal route.",
      "Accidentally clicking the public home logo or logging out.",
    ],
    solution: [
      "The Help/Support sidebar link has been repaired to open '/dashboard/help' directly within the Vendor Portal.",
      "You will remain logged in and can return to the main overview at any time by clicking 'Dashboard' (/dashboard).",
      "If you ever find yourself on the public home page while logged in, simply click 'Dashboard' in the top navbar.",
    ],
    verifiedNote:
      "Your session remains active; navigation within the portal never triggers an automatic logout.",
  },
  {
    id: "ts-notif",
    category: "notifications",
    categoryName: "Notifications",
    problem: "A notification opens the wrong page or shows unexpected timestamps.",
    causes: [
      "Outdated route target on an old notification action link.",
      "Device system clock out of sync, affecting relative timestamp calculation.",
    ],
    solution: [
      "Return to Notifications (/dashboard/notifications) and review the notification item.",
      "Use the primary sidebar navigation (Documents, Business Profile, or Settings) to open the target tool.",
      "Ensure your device time and timezone (GMT+8) are set correctly.",
    ],
    verifiedNote:
      "All application alerts and correction requests are permanently retained in your Notifications history.",
  },
  {
    id: "ts-login",
    category: "login",
    categoryName: "Login and Session Problems",
    problem: "Unexpectedly logged out or unable to sign in.",
    causes: [
      "Accidentally clicking the red 'Logout' button at the bottom of the sidebar.",
      "Session storage cleared by browser privacy settings or incognito mode reset.",
      "Entering an incorrect email or mobile number during login.",
    ],
    solution: [
      "Sign in again at the Vendor Login page (/login) using your registered email or phone and password.",
      "Check Caps Lock when typing your password (passwords are case-sensitive).",
      "Ensure you click 'Help / Support' or other portal links rather than the red 'Logout' action.",
      "If locked out, contact the City Licensing Helpdesk or ICTD administrator for account recovery.",
    ],
    verifiedNote:
      "Do not clear application cookies or local storage unless instructed by technical support.",
  },
  {
    id: "ts-profile",
    category: "profile",
    categoryName: "Business Profile",
    problem: "Business profile information appears incorrect or changes fail to save.",
    causes: [
      "Unsaved draft edits in the Business Profile modal.",
      "Attempting to modify locked fields (such as city jurisdiction, which is fixed to Butuan City).",
      "Unstable internet connection while saving profile updates.",
    ],
    solution: [
      "Open 'Business Profile' (/dashboard/business-profile) and click 'Edit Information'.",
      "Modify the desired fields and click 'Save Changes' to commit the update.",
      "Verify the green confirmation notice appears confirming changes were saved.",
      "For locked municipal records (e.g. registered legal entity name), contact the City Licensing Office.",
    ],
    verifiedNote:
      "Jurisdiction is locked to Butuan City, Agusan del Norte, Region XIII Caraga by municipal ordinance.",
  },
  {
    id: "ts-errors",
    category: "errors",
    categoryName: "Website Errors and Performance",
    problem: "A page displays an error card or does not load properly.",
    causes: [
      "Temporary network lag or cached browser assets.",
      "Slow cellular or local Wi-Fi connection.",
    ],
    solution: [
      "Try refreshing the page once (Ctrl+F5 or reload button).",
      "Check your internet connectivity.",
      "If an error card appears, click 'Return to Dashboard' to reset client state safely.",
      "Record the error message or take a screenshot if the problem persists.",
    ],
    verifiedNote:
      "Do not clear application data or reset your browser account as a first troubleshooting step.",
  },
  {
    id: "ts-gen",
    category: "general",
    categoryName: "General Questions",
    problem: "Cannot find an answer to your specific vendor question.",
    causes: [
      "Special permit case, specific market stall reassignment, or custom municipal licensing ordinance inquiry.",
    ],
    solution: [
      "Review the 40 Frequently Asked Questions below using the FAQ Search field.",
      "Visit the City Hall Complex, J.P. Rosales Ave., Butuan City (Licensing & Permit Division).",
      "Call the licensing helpdesk at (085) 341-2000 during office hours (Mon-Fri, 8 AM - 5 PM).",
      "Send an email with your Application Reference Number to vendors-support@butuan.gov.ph.",
    ],
    verifiedNote:
      "Always have your Application Reference Number (e.g. BVR-2026-XXXXXX) ready when inquiring.",
  },
];

// ─── 40 FREQUENTLY ASKED QUESTIONS DATA ──────────────────────────────────────

const ALL_FAQS: FAQItem[] = [
  // ── Registration (1-7)
  {
    id: 1,
    question: "How do I register as a vendor?",
    category: "registration",
    categoryName: "Registration",
    answer: [
      "Step 1: Go to the public registration page by clicking 'Register as Vendor' on the home page or navigating to /register.",
      "Step 2 (Business Information): Enter your registered Trade / Business Name, Operator Name, and an optional description.",
      "Step 3 (Contact & Address): Provide your Philippine mobile number (09XXXXXXXXX), email, street address, and select your operating Butuan City barangay.",
      "Step 4 (Verification): Select your government-issued ID type, enter your ID number, and upload an image or PDF of your ID (up to 5MB).",
      "Step 5 (Account Security): Create a strong password (minimum 8 characters with at least 1 uppercase letter and 1 number) and agree to the Terms and Privacy Policy.",
      "Step 6 (Review & Submit): Review your entered details on the final step and click 'Submit Registration'. Save your unique Application Reference Number.",
    ],
    tips: "Keep your Application Reference Number (e.g. BVR-2026-001248) safe for tracking your progress.",
  },
  {
    id: 2,
    question: "What information must I provide?",
    category: "registration",
    categoryName: "Registration",
    answer: [
      "1. Business Details: Registered Business Name, Full Legal Owner Name, and Business Description.",
      "2. Contact Information: Valid Philippine mobile phone number (09XXXXXXXXX) and email address.",
      "3. Operating Address: House/stall number, street name, and registered Butuan City barangay.",
      "4. Identity Verification: Valid government-issued ID type, official ID number, and uploaded file copy.",
      "5. Security Credentials: Account password adhering to security complexity standards.",
    ],
  },
  {
    id: 3,
    question: "Why is a government-issued ID required?",
    category: "registration",
    categoryName: "Registration",
    answer: [
      "Identity verification is mandated by the City Government of Butuan to verify the legal identity of sole proprietors and vendors operating in public markets and commercial zones.",
      "This process protects vendors against identity theft, prevents duplicate or fraudulent registrations, and ensures compliance with local municipal licensing ordinances.",
    ],
  },
  {
    id: 4,
    question: "Which government-issued IDs are accepted?",
    category: "registration",
    categoryName: "Registration",
    answer: [
      "The system accepts the following government-issued IDs:",
      "1. PhilSys National ID (Philippine Identification System)",
      "2. Driver's License (Land Transportation Office)",
      "3. Voter's ID / COMELEC Voter Certification",
      "4. Postal ID (PhilPost)",
      "5. Philippine Passport (Department of Foreign Affairs)",
      "6. UMID (Unified Multi-Purpose ID)",
      "7. Other valid government-issued photo ID (subject to city assessor review)",
    ],
  },
  {
    id: 5,
    question: "What should I do if a required field is missing?",
    category: "registration",
    categoryName: "Registration",
    answer: [
      "Step 1: Check the red error messages displayed directly beneath any input field.",
      "Step 2: Enter the required information according to the expected format (for example, choosing a barangay from the dropdown or providing an 11-digit mobile number).",
      "Step 3: Once corrected, the validation error disappears and you can proceed to the next step.",
    ],
  },
  {
    id: 6,
    question: "What should I do if I cannot submit my registration?",
    category: "registration",
    categoryName: "Registration",
    answer: [
      "Step 1: Click back through Steps 1 to 4 to verify that all required fields are filled and have no validation warnings.",
      "Step 2: Confirm that your uploaded ID file is in PNG, JPG, or PDF format and does not exceed the 5MB size limit.",
      "Step 3: Ensure that both checkboxes ('Agree to Terms and Conditions' and 'Agree to Data Privacy Policy') in Step 4 are checked.",
      "Step 4: If submission still fails, verify your internet connection and retry clicking 'Submit Registration'.",
    ],
  },
  {
    id: 7,
    question: "How can I avoid submitting duplicate applications?",
    category: "registration",
    categoryName: "Registration",
    answer: [
      "Submit your registration once. Upon successful submission, you are immediately shown the Registration Success screen containing your unique Application Reference Number (e.g. BVR-2026-001248).",
      "Do not fill out a new registration form while an existing application is Under Review. Instead, use 'Check Status' (/application-status) or your Vendor Dashboard to monitor progress.",
    ],
  },

  // ── Application Status (8-15)
  {
    id: 8,
    question: "How do I check my application status?",
    category: "status",
    categoryName: "Application Status",
    answer: [
      "Method 1 (Public Status Check): Visit /application-status, enter your Application Reference Number, and click 'Check Status'.",
      "Method 2 (Vendor Portal): Sign in to your Vendor Dashboard (/dashboard) or click 'My Application' from the sidebar to view your real-time status card and processing timeline.",
    ],
  },
  {
    id: 9,
    question: "Where can I find my application reference number?",
    category: "status",
    categoryName: "Application Status",
    answer: [
      "1. On the Registration Success screen immediately after completing your registration.",
      "2. Displayed prominently at the top of your Vendor Dashboard banner.",
      "3. Listed under your Business Profile (/dashboard/business-profile) and inside official notification messages.",
    ],
    tips: "Reference numbers follow the format BVR-YYYY-XXXXXX (e.g. BVR-2026-001248).",
  },
  {
    id: 10,
    question: "What does Under Review mean?",
    category: "status",
    categoryName: "Application Status",
    answer: [
      "'Under Review' means your application has been received by the City Government of Butuan Licensing and Permit Division.",
      "An administrative evaluator is actively verifying your submitted business details, barangay location, and identity documentation.",
    ],
  },
  {
    id: 11,
    question: "What does Needs Correction mean?",
    category: "status",
    categoryName: "Application Status",
    answer: [
      "'Needs Correction' means an administrative reviewer identified an issue requiring your attention (such as an unreadable ID document or mismatched business name).",
      "An alert appears in your Vendor Dashboard with specific reviewer remarks. You can click 'Submit Correction' to update the flagged field or re-upload your document without losing your spot in the queue.",
    ],
  },
  {
    id: 12,
    question: "What should I do if my application is rejected?",
    category: "status",
    categoryName: "Application Status",
    answer: [
      "Step 1: Check the rejection remarks in your Vendor Dashboard or Notification feed to understand the specific reason (such as zoning non-compliance or duplicate application).",
      "Step 2: If the issue can be remedied, contact the City Licensing Office or prepare the required documents before filing a new application.",
      "Step 3: Visit the City Hall Complex for in-person appeals or assistance.",
    ],
  },
  {
    id: 13,
    question: "How will I know if my application has been approved?",
    category: "status",
    categoryName: "Application Status",
    answer: [
      "When approved, your dashboard status badge changes to 'Approved' with a green checkmark, and your account gains the 'Verified' status badge.",
      "You will also receive an in-app confirmation notification with instructions regarding your official vendor credentials.",
    ],
  },
  {
    id: 14,
    question: "What does Verified mean in my Vendor Dashboard?",
    category: "status",
    categoryName: "Application Status",
    answer: [
      "'Verified' indicates that your identity and business credentials have been officially authenticated and confirmed by the City Government of Butuan.",
      "It confirms that your vendor profile is certified for operating within designated city commercial zones.",
    ],
  },
  {
    id: 15,
    question: "Why has my application status not changed?",
    category: "status",
    categoryName: "Application Status",
    answer: [
      "Applications are processed during official municipal business hours (Monday to Friday, 8:00 AM – 5:00 PM).",
      "If your status has not changed, your application is currently queued for evaluation. Please allow 1 to 3 business days before inquiring. Do not submit a duplicate application.",
    ],
  },

  // ── Documents (16-20)
  {
    id: 16,
    question: "What documents must I submit?",
    category: "documents",
    categoryName: "Documents",
    answer: [
      "At minimum, one valid government-issued ID is required during initial registration (PhilSys National ID, Driver's License, Voter's ID, Postal ID, Passport, or UMID).",
      "Additional municipal clearances (such as Barangay Business Clearance or Sanitary Permit) may be requested depending on your specific business category during review.",
    ],
  },
  {
    id: 17,
    question: "What should I do if a document upload fails?",
    category: "documents",
    categoryName: "Documents",
    answer: [
      "Step 1: Verify the file extension is supported: .png, .jpg, .jpeg, or .pdf.",
      "Step 2: Check that the file size is less than 5 Megabytes (5MB).",
      "Step 3: Ensure the file is not password-protected or corrupted.",
      "Step 4: Retry the upload with a stable internet connection.",
    ],
  },
  {
    id: 18,
    question: "What file formats and sizes are accepted?",
    category: "documents",
    categoryName: "Documents",
    answer: [
      "• Accepted Formats: PNG (.png), JPG/JPEG (.jpg, .jpeg), and PDF (.pdf).",
      "• Maximum File Size: 5MB (Megabytes) per document.",
    ],
  },
  {
    id: 19,
    question: "How can I replace an incorrect document?",
    category: "documents",
    categoryName: "Documents",
    answer: [
      "Step 1: Open 'Documents' (/dashboard/documents) from the sidebar.",
      "Step 2: If a document requires replacement or was flagged by an assessor, click the 'Replace Document' button.",
      "Step 3: Select your updated file and confirm the upload. Your record will immediately update to 'Submitted'.",
    ],
  },
  {
    id: 20,
    question: "Why is my document marked missing or incomplete?",
    category: "documents",
    categoryName: "Documents",
    answer: [
      "A document is marked incomplete if the uploaded image is blurry, cropped, has glare obscuring vital information, or if an expired identification was submitted.",
      "Check your Notifications for specific remarks from the evaluator and upload a clear, legible replacement.",
    ],
  },

  // ── Vendor Dashboard (21-25)
  {
    id: 21,
    question: "What can I do from my dashboard?",
    category: "dashboard",
    categoryName: "Vendor Dashboard",
    answer: [
      "• Track your overall application status and verification badge in real-time.",
      "• Manage and replace uploaded documents (/dashboard/documents).",
      "• View and update your business profile details (/dashboard/business-profile).",
      "• Read official notices and assessor updates (/dashboard/notifications).",
      "• Adjust notification preferences and security settings (/dashboard/settings).",
      "• Access interactive troubleshooting and Help & Support (/dashboard/help).",
    ],
  },
  {
    id: 22,
    question: "How do I update my business profile?",
    category: "dashboard",
    categoryName: "Vendor Dashboard",
    answer: [
      "Step 1: In the dashboard sidebar, click 'Business Profile' (/dashboard/business-profile).",
      "Step 2: Under Business Information, click the 'Edit Information' button.",
      "Step 3: Modify your business name, operator name, or business description in the modal dialog.",
      "Step 4: Click 'Save Changes' to commit the update.",
    ],
  },
  {
    id: 23,
    question: "Why can't I access a dashboard page?",
    category: "dashboard",
    categoryName: "Vendor Dashboard",
    answer: [
      "Dashboard routes require an authenticated vendor session.",
      "If you are redirected to the Login screen (/login), your session may have ended. Sign in again with your registered email/phone and password to restore access.",
    ],
  },
  {
    id: 24,
    question: "Why am I being redirected to the public Home page?",
    category: "dashboard",
    categoryName: "Vendor Dashboard",
    answer: [
      "Previously, clicking Help/Support directed users to the public home page due to a placeholder link. This navigation defect has been completely resolved: Help/Support now navigates directly to this support window (/dashboard/help).",
      "If you ever find yourself on the public home page while logged in, click 'Dashboard' in the top navbar to return to your portal without needing to log in again.",
    ],
  },
  {
    id: 25,
    question: "What should I do if a page does not load?",
    category: "dashboard",
    categoryName: "Vendor Dashboard",
    answer: [
      "Step 1: Check your network connection.",
      "Step 2: Refresh your browser tab once.",
      "Step 3: If an error card appears, click 'Return to Dashboard' to reload your dashboard state.",
    ],
  },

  // ── Notifications (26-30)
  {
    id: 26,
    question: "How do I view my notifications?",
    category: "notifications",
    categoryName: "Notifications",
    answer: [
      "Click 'Notifications' in the sidebar or click the notification bell icon in the top header.",
      "You can filter between All Notifications, Unread, or specific categories.",
    ],
  },
  {
    id: 27,
    question: "What does an unread notification mean?",
    category: "notifications",
    categoryName: "Notifications",
    answer: [
      "An unread notification indicates a new municipal alert, status update, or correction request that you have not yet opened.",
      "A blue dot and counter badge in the sidebar reflect your current unread count.",
    ],
  },
  {
    id: 28,
    question: "How do I mark notifications as read?",
    category: "notifications",
    categoryName: "Notifications",
    answer: [
      "Open 'Notifications' (/dashboard/notifications).",
      "Click on individual unread items to mark them as read, or click the 'Mark all as read' button at the top right of the notification list.",
    ],
  },
  {
    id: 29,
    question: "Why is a notification timestamp missing or incorrect?",
    category: "notifications",
    categoryName: "Notifications",
    answer: [
      "Relative timestamps (such as 'Just now', '5 minutes ago', or 'Yesterday') are calculated using your local device clock and the recorded alert timestamp.",
      "If your device clock is set incorrectly, relative timestamps may appear shifted. Ensure your system time is set to Philippine Standard Time (GMT+8).",
    ],
  },
  {
    id: 30,
    question: "What should I do if a notification link does not open the correct page?",
    category: "notifications",
    categoryName: "Notifications",
    answer: [
      "Step 1: Return to Notifications and review the target document or status mentioned in the alert.",
      "Step 2: Use the primary sidebar navigation (e.g. Documents, Business Profile) to reach the intended screen directly.",
    ],
  },

  // ── Account and Security (31-35)
  {
    id: 31,
    question: "What should I do if I am unexpectedly logged out?",
    category: "login",
    categoryName: "Account & Security",
    answer: [
      "Step 1: Confirm you did not accidentally click the red 'Logout' button at the bottom of the sidebar.",
      "Step 2: Return to the Login page (/login) and sign in using your registered credentials.",
      "Step 3: If you previously clicked Help/Support, note that the link has been fixed and will no longer log you out.",
    ],
  },
  {
    id: 32,
    question: "What should I do if I cannot sign in?",
    category: "login",
    categoryName: "Account & Security",
    answer: [
      "Step 1: Verify you are typing the exact email address or 11-digit mobile number used during registration.",
      "Step 2: Ensure password case and characters are correct.",
      "Step 3: If you cannot recall your credentials, contact the City Licensing Helpdesk or ICTD administrator at City Hall.",
    ],
  },
  {
    id: 33,
    question: "How can I protect my account?",
    category: "login",
    categoryName: "Account & Security",
    answer: [
      "• Never share your account password with unauthorized third parties.",
      "• Use a unique, strong password containing letters, numbers, and symbols.",
      "• Always click 'Logout' when using shared, municipal, or public computers.",
    ],
  },
  {
    id: 34,
    question: "What should I do if I notice incorrect information in my account?",
    category: "profile",
    categoryName: "Account & Security",
    answer: [
      "Step 1: Navigate to 'Business Profile' (/dashboard/business-profile).",
      "Step 2: Use the supported editing controls to modify your business and contact details.",
      "Step 3: For locked municipal records (e.g. approved business permit registration numbers), contact City Hall with your supporting documents.",
    ],
  },
  {
    id: 35,
    question: "How do I log out safely?",
    category: "login",
    categoryName: "Account & Security",
    answer: [
      "Click the red 'Logout' button at the bottom of the dashboard sidebar, or click your profile avatar in the top right header and select 'Logout'.",
      "This terminates your active session safely and redirects you to the Login screen.",
    ],
  },

  // ── General Website Issues (36-40)
  {
    id: 36,
    question: "What should I do if the website displays an error?",
    category: "errors",
    categoryName: "Website Issues",
    answer: [
      "Step 1: Check the specific error message text displayed on screen.",
      "Step 2: Refresh the browser page once to reload the application.",
      "Step 3: Click 'Return to Dashboard' to navigate back to your safe overview.",
      "Step 4: If the error recurs, note the steps that led to it and report it to technical support.",
    ],
  },
  {
    id: 37,
    question: "What should I do if a button does not respond?",
    category: "errors",
    categoryName: "Website Issues",
    answer: [
      "Step 1: Check if any form fields have outstanding validation errors or missing entries.",
      "Step 2: Look for loading spinners indicating that a background request is in progress.",
      "Step 3: Refresh the page and try clicking the action again.",
    ],
  },
  {
    id: 38,
    question: "What should I do if the website is slow?",
    category: "errors",
    categoryName: "Website Issues",
    answer: [
      "Step 1: Verify the strength and speed of your internet connection.",
      "Step 2: Close extra browser tabs and ensure file uploads are under the 5MB limit.",
      "Step 3: Refresh the browser window.",
    ],
  },
  {
    id: 39,
    question: "What should I do if information is not updating?",
    category: "errors",
    categoryName: "Website Issues",
    answer: [
      "Step 1: Refresh your dashboard view once to pull updated state.",
      "Step 2: Confirm that you clicked 'Save Changes' or 'Submit' and saw a confirmation toast or banner.",
      "Step 3: Check your Notifications to verify whether an administrator action is pending.",
    ],
  },
  {
    id: 40,
    question: "How can I contact support about an unresolved problem?",
    category: "general",
    categoryName: "Support Inquiries",
    answer: [
      "For issues requiring official city assistance, reach out through confirmed municipal channels:",
      "• In-Person Assistance: City Hall Complex, J.P. Rosales Ave., Butuan City, Agusan del Norte.",
      "• Phone Helpdesk: (085) 341-2000 (Licensing & Permits Division).",
      "• Vendor Support Email: vendors-support@butuan.gov.ph",
      "• Technical & Account Lockout Email: ictd@butuan.gov.ph (City ICTD)",
      "• Office Hours: Monday to Friday, 8:00 AM – 5:00 PM (excluding public holidays).",
    ],
    tips: "Always include your Application Reference Number (BVR-YYYY-XXXXXX) when requesting assistance.",
  },
];

// ─── CATEGORY FILTER PILLS DEFINITION ────────────────────────────────────────

const CATEGORIES: { id: SupportCategory; label: string; icon: any }[] = [
  { id: "all", label: "All Topics", icon: SlidersHorizontal },
  { id: "registration", label: "Registration & Submission", icon: FileText },
  { id: "status", label: "Application Status & Approval", icon: Clock },
  { id: "documents", label: "Document Upload", icon: UploadCloud },
  { id: "dashboard", label: "Dashboard & Navigation", icon: LayoutDashboard },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "login", label: "Login & Session Problems", icon: Lock },
  { id: "profile", label: "Business Profile", icon: Building2 },
  { id: "errors", label: "Website Errors & Performance", icon: AlertTriangle },
  { id: "general", label: "General Questions & Inquiries", icon: LifeBuoy },
];

// ─── COMPONENT ───────────────────────────────────────────────────────────────

export default function HelpSupportPage({ portal }: { portal?: "admin" | "vendor" }) {
  const pathname = usePathname();
  const isAdmin = portal === "admin" || (pathname ? pathname.startsWith("/admin") : false);
  const dashboardHref = isAdmin ? "/admin" : "/dashboard";

  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<SupportCategory>("all");
  const [openFaqIds, setOpenFaqIds] = useState<Record<number, boolean>>({ 1: true });
  const [activeView, setActiveView] = useState<"faqs" | "troubleshooting">("faqs");

  // Toggle single FAQ accordion
  const toggleFaq = (id: number) => {
    setOpenFaqIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Expand all / Collapse all
  const expandAll = () => {
    const allOpen: Record<number, boolean> = {};
    filteredFaqs.forEach((f) => {
      allOpen[f.id] = true;
    });
    setOpenFaqIds(allOpen);
  };

  const collapseAll = () => {
    setOpenFaqIds({});
  };

  // Filter FAQs based on search and category
  const filteredFaqs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return ALL_FAQS.filter((item) => {
      const matchesCategory =
        activeCategory === "all" || item.category === activeCategory;
      if (!matchesCategory) return false;

      if (!query) return true;

      const inQuestion = item.question.toLowerCase().includes(query);
      const inAnswer = item.answer.some((line) => line.toLowerCase().includes(query));
      const inTips = item.tips ? item.tips.toLowerCase().includes(query) : false;
      const inCatName = item.categoryName.toLowerCase().includes(query);

      return inQuestion || inAnswer || inTips || inCatName;
    });
  }, [searchQuery, activeCategory]);

  // Filter Troubleshooting guides based on search and category
  const filteredTroubleshooting = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return TROUBLESHOOTING_GUIDES.filter((item) => {
      const matchesCategory =
        activeCategory === "all" || item.category === activeCategory;
      if (!matchesCategory) return false;

      if (!query) return true;

      const inProblem = item.problem.toLowerCase().includes(query);
      const inCauses = item.causes.some((c) => c.toLowerCase().includes(query));
      const inSolution = item.solution.some((s) => s.toLowerCase().includes(query));
      const inCat = item.categoryName.toLowerCase().includes(query);

      return inProblem || inCauses || inSolution || inCat;
    });
  }, [searchQuery, activeCategory]);

  return (
    <div className="space-y-6 pb-12">
      {/* ── 1. HEADER & DASHBOARD RETURN ───────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-2">
            <LifeBuoy className="w-3.5 h-3.5" />
            <span>{isAdmin ? "Admin Support Center" : "Vendor Support Center"}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Help & Support
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            {isAdmin
              ? "Administrator reference, troubleshooting guidance, and municipal system support."
              : "Find answers to common questions and get guidance for using the Butuan Vendors Registration System."}
          </p>
        </div>

        <div>
          <Link
            href={dashboardHref}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors shadow-2xs focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-hidden"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>
        </div>
      </div>

      {/* ── 2. SEARCH BAR ───────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs space-y-4">
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <Input
            id="faq-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search FAQs, issues, requirements, or keywords (e.g. ID, status, upload, password)..."
            className="h-12 pl-11 pr-10 bg-slate-50/70 border-slate-300 text-sm sm:text-base focus:bg-white focus:border-blue-500 rounded-xl"
            aria-label="Search FAQs and troubleshooting guides"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category Filter Pills */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
            <span>Filter by Category:</span>
            {searchQuery && (
              <span className="text-blue-600 font-medium">
                Showing results for &ldquo;{searchQuery}&rdquo;
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer border",
                    isActive
                      ? "bg-blue-600 text-white border-blue-600 shadow-2xs font-semibold"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-900"
                  )}
                >
                  <Icon className={cn("w-3.5 h-3.5", isActive ? "text-white" : "text-slate-500")} />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── 3. VIEW TABS (FAQs vs. Troubleshooting Guides) ──────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div className="inline-flex p-1 bg-slate-200/70 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveView("faqs")}
            className={cn(
              "px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer",
              activeView === "faqs"
                ? "bg-white text-slate-900 shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            Frequently Asked Questions ({filteredFaqs.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveView("troubleshooting")}
            className={cn(
              "px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer",
              activeView === "troubleshooting"
                ? "bg-white text-slate-900 shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            Troubleshooting Guides ({filteredTroubleshooting.length})
          </button>
        </div>

        {activeView === "faqs" && filteredFaqs.length > 0 && (
          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={expandAll}
              className="px-2.5 py-1 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 font-medium transition-colors cursor-pointer"
            >
              Expand All
            </button>
            <span className="text-slate-300">•</span>
            <button
              type="button"
              onClick={collapseAll}
              className="px-2.5 py-1 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 font-medium transition-colors cursor-pointer"
            >
              Collapse All
            </button>
          </div>
        )}
      </div>

      {/* ── 4. FAQS VIEW ────────────────────────────────────────────────────── */}
      {activeView === "faqs" && (
        <div className="space-y-3">
          {filteredFaqs.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800">
                No matching questions found
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                We could not find any FAQ matching &ldquo;{searchQuery}&rdquo;. Try using different keywords, clearing the search, or checking the troubleshooting tab.
              </p>
              <div className="pt-2 flex justify-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSearchQuery("")}
                >
                  Clear Search
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveCategory("all")}
                >
                  Show All Topics
                </Button>
              </div>
            </div>
          ) : (
            filteredFaqs.map((faq) => {
              const isOpen = Boolean(openFaqIds[faq.id]);
              return (
                <div
                  key={faq.id}
                  className={cn(
                    "bg-white rounded-xl border transition-all overflow-hidden",
                    isOpen
                      ? "border-blue-300 shadow-xs ring-1 ring-blue-100"
                      : "border-slate-200 hover:border-slate-300"
                  )}
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(faq.id)}
                    aria-expanded={isOpen}
                    className="w-full text-left p-4 sm:p-4.5 flex items-start justify-between gap-3 cursor-pointer select-none focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <span className="shrink-0 w-6 h-6 rounded-full bg-blue-50 text-blue-700 text-xs font-bold flex items-center justify-center border border-blue-200">
                        {faq.id}
                      </span>
                      <div>
                        <h2 className="text-sm sm:text-base font-semibold text-slate-900 leading-snug">
                          {faq.question}
                        </h2>
                        <span className="inline-block mt-1 text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                          {faq.categoryName}
                        </span>
                      </div>
                    </div>
                    <div className="shrink-0 pt-0.5 text-slate-400">
                      <ChevronDown
                        className={cn(
                          "w-5 h-5 transition-transform duration-200",
                          isOpen && "rotate-180 text-blue-600"
                        )}
                      />
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-4 sm:px-6 sm:pb-5 pt-1 border-t border-slate-100 bg-slate-50/40 space-y-2.5">
                      <div className="text-xs sm:text-sm text-slate-700 leading-relaxed space-y-1.5 pt-2">
                        {faq.answer.map((line, idx) => (
                          <p key={idx}>{line}</p>
                        ))}
                      </div>

                      {faq.tips && (
                        <div className="mt-3 p-2.5 rounded-lg bg-blue-50/70 border border-blue-200/70 text-xs text-blue-900 flex items-start gap-2">
                          <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                          <span className="leading-relaxed">{faq.tips}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── 5. TROUBLESHOOTING GUIDES VIEW ─────────────────────────────────── */}
      {activeView === "troubleshooting" && (
        <div className="space-y-4">
          {filteredTroubleshooting.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800">
                No troubleshooting guides match your filter
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Try clearing your search query or selecting &ldquo;All Topics&rdquo; above.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setActiveCategory("all");
                }}
              >
                Reset Filters
              </Button>
            </div>
          ) : (
            filteredTroubleshooting.map((guide) => (
              <Card
                key={guide.id}
                className="border-slate-200 shadow-xs hover:border-slate-300 transition-colors"
              >
                <CardHeader className="pb-3 border-b border-slate-100">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-xs font-semibold">
                        {guide.categoryName}
                      </Badge>
                    </div>
                  </div>
                  <CardTitle className="text-base sm:text-lg font-bold text-slate-900 mt-1">
                    Problem: {guide.problem}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  {/* Possible Causes */}
                  <div className="rounded-xl bg-amber-50/60 border border-amber-200/80 p-3.5 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Possible Causes:</span>
                    </div>
                    <ul className="list-disc list-inside text-xs text-amber-900/90 space-y-1 pl-1">
                      {guide.causes.map((cause, i) => (
                        <li key={i} className="leading-relaxed">
                          {cause}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Actionable Solution */}
                  <div className="rounded-xl bg-emerald-50/60 border border-emerald-200/80 p-3.5 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Actionable Solution:</span>
                    </div>
                    <ol className="list-decimal list-inside text-xs text-emerald-900/90 space-y-1 pl-1">
                      {guide.solution.map((step, i) => (
                        <li key={i} className="leading-relaxed">
                          {step}
                        </li>
                      ))}
                    </ol>
                  </div>

                  {/* System note */}
                  {guide.verifiedNote && (
                    <p className="text-[11px] text-slate-500 italic pl-1">
                      Note: {guide.verifiedNote}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* ── 6. OFFICIAL CONTACT & ESCALATION NOTICE ────────────────────────── */}
      <div className="bg-slate-900 text-slate-200 rounded-2xl p-6 sm:p-8 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-950 border border-blue-800 text-blue-300 text-[11px] font-semibold">
              <LifeBuoy className="w-3 h-3" />
              <span>Official Municipal Support</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white">
              Still Need Assistance?
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
              If your inquiry requires direct administrative evaluation, contact the City Government of Butuan Licensing and Permit Division through verified city channels.
            </p>
          </div>

          <Link
            href={dashboardHref}
            className="self-start inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-500 transition-colors shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2 text-xs">
          <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/80 space-y-1">
            <div className="flex items-center gap-2 font-bold text-white">
              <MapPin className="w-4 h-4 text-blue-400" />
              <span>In-Person Office</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              City Hall Complex, J.P. Rosales Ave., Butuan City, Agusan del Norte
            </p>
            <span className="text-[10px] text-slate-400 block pt-1">
              Mon – Fri: 8:00 AM – 5:00 PM
            </span>
          </div>

          <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/80 space-y-1">
            <div className="flex items-center gap-2 font-bold text-white">
              <Phone className="w-4 h-4 text-emerald-400" />
              <span>Licensing Helpdesk</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed font-mono">
              (085) 341-2000
            </p>
            <span className="text-[10px] text-slate-400 block pt-1">
              Direct City Government Hotline
            </span>
          </div>

          <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/80 space-y-1">
            <div className="flex items-center gap-2 font-bold text-white">
              <Mail className="w-4 h-4 text-indigo-400" />
              <span>Official Email</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed truncate">
              vendors-support@butuan.gov.ph
            </p>
            <span className="text-[10px] text-slate-400 block pt-1">
              ICTD: ictd@butuan.gov.ph
            </span>
          </div>
        </div>

        <div className="text-[11px] text-slate-400 border-t border-slate-800 pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <p>
            Important: Actual ticket resolution and account modification require authorized city administrator verification.
          </p>
          <span className="text-slate-500 shrink-0">
            System Jurisdiction: Butuan City, Philippines
          </span>
        </div>
      </div>
    </div>
  );
}

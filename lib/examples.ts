import type { EstimateInput } from "./pricing";

export interface Example {
  id: string;
  label: string;
  input: Partial<EstimateInput>;
}

export const EXAMPLES: Example[] = [
  {
    id: "clinic",
    label: "Clinic site + booking",
    input: {
      description:
        "Dental clinic in Pune with 2 branches wants a website with doctor profiles, treatments, online appointment booking with slot selection, WhatsApp/SMS reminders, Google reviews, and a simple admin to manage appointments.",
      projectType: "business",
      features: ["booking", "notifications", "seo", "admin", "maps"],
      pages: 12,
    },
  },
  {
    id: "d2c",
    label: "D2C fashion store",
    input: {
      description:
        "Ethnic-wear D2C brand needs an online store with ~300 products, size variants, Razorpay & COD, Shiprocket shipping, discount coupons, GST invoices, Instagram feed, and a mobile-first premium design.",
      projectType: "ecommerce",
      features: ["payments", "catalog", "gst", "seo", "notifications", "reviews"],
      pages: 15,
      design: "premium",
      ecomPlatform: "shopify",
    },
  },
  {
    id: "marketplace",
    label: "Grocery marketplace",
    input: {
      description:
        "Multi-vendor grocery marketplace for a Tier-2 city: customer app & website, vendor panel to manage inventory, delivery partner app with live tracking, wallet & UPI payments, commission management, and admin analytics.",
      projectType: "platform",
      features: ["auth", "admin", "payments", "multivendor", "mobile", "maps", "notifications", "analytics", "search"],
      pages: 40,
      scale: "growth",
      vendor: "mid",
      mobileApps: 3,
    },
  },
  {
    id: "school",
    label: "School ERP portal",
    input: {
      description:
        "CBSE school group with 3 campuses wants a portal for admissions, fee collection with receipts, attendance, timetable, report cards, parent-teacher communication and a parent mobile app. ~4,000 students.",
      projectType: "webapp",
      features: ["auth", "admin", "roles", "payments", "notifications", "mobile", "analytics", "migration"],
      pages: 30,
      vendor: "small",
    },
  },
];

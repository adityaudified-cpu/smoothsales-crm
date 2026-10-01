/**
 * SmoothSales.ai Products & Services Catalog Mock Data
 * NOTE: Connects directly to the Proposal Generator built in Prompt #7, Part E.
 * Products and services configured here populate the line-item selector in quotations and proposals.
 */

export const INITIAL_PRODUCTS_SERVICES = {
  interior_design: [
    {
      id: "ps_1",
      name: "Turnkey Residential Interior Execution",
      type: "Service",
      category: "Full Execution",
      unitPrice: 1850,
      unit: "sq.ft",
      enabled: true,
    },
    {
      id: "ps_2",
      name: "Modular Kitchen — Acrylic High Gloss",
      type: "Product",
      category: "Cabinetry",
      unitPrice: 165000,
      unit: "set",
      enabled: true,
    },
    {
      id: "ps_3",
      name: "Wardrobe Suite — Fluted Glass & Matte Laminate",
      type: "Product",
      category: "Storage",
      unitPrice: 78000,
      unit: "unit",
      enabled: true,
    },
    {
      id: "ps_4",
      name: "False Ceiling & Ambient LED Lighting Design",
      type: "Service",
      category: "Civil & Electrical",
      unitPrice: 140,
      unit: "sq.ft",
      enabled: true,
    },
    {
      id: "ps_5",
      name: "3D Photorealistic Architectural Renderings (3 Views)",
      type: "Service",
      category: "Design Consultation",
      unitPrice: 25000,
      unit: "package",
      enabled: true,
    },
    {
      id: "ps_6",
      name: "Hardwood & Italian Marble Flooring Installation",
      type: "Service",
      category: "Flooring",
      unitPrice: 380,
      unit: "sq.ft",
      enabled: true,
    },
    {
      id: "ps_7",
      name: "Smart Automation Hub & Motorized Curtains",
      type: "Product",
      category: "Home Automation",
      unitPrice: 92000,
      unit: "kit",
      enabled: true,
    },
    {
      id: "ps_8",
      name: "Site Supervision & Project Management Fee",
      type: "Service",
      category: "Supervision",
      unitPrice: 45000,
      unit: "month",
      enabled: false,
    },
  ],
};

export function getProductsServices(verticalOrDescription = "") {
  return JSON.parse(JSON.stringify(INITIAL_PRODUCTS_SERVICES.interior_design));
}

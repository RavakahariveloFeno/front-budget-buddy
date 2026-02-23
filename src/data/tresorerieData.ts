// ── Static data for "Suivi de trésorerie" module ──

export interface Encaissement {
  id: string;
  date: string;
  source: string;
  montant: number;
  mode: string;
  reference?: string;
}

export interface Decaissement {
  id: string;
  date: string;
  beneficiaire: string;
  montant: number;
  categorie: string;
  reference?: string;
}

export interface PrevisionTresorerie {
  id: string;
  mois: string;
  encaissementsPrevus: number;
  decaissementsPrevus: number;
  soldePrevu: number;
}

export interface RapportTresorerie {
  id: string;
  periode: string;
  totalEncaissements: number;
  totalDecaissements: number;
  soldeNet: number;
  variation: number;
}

// ── Static encaissements ──
export const STATIC_ENCAISSEMENTS: Encaissement[] = [
  { id: "enc1", date: "2025-06-15", source: "Vente marchandises", montant: 315000, mode: "Virement", reference: "FAC-001" },
  { id: "enc2", date: "2025-06-14", source: "Prestation service", montant: 450000, mode: "Chèque", reference: "FAC-005" },
  { id: "enc3", date: "2025-06-12", source: "Encaissement client Andria", montant: 210000, mode: "Espèces" },
  { id: "enc4", date: "2025-06-10", source: "Remboursement avance", montant: 50000, mode: "Mobile money" },
  { id: "enc5", date: "2025-06-08", source: "Vente produits", montant: 180000, mode: "Virement", reference: "FAC-008" },
  { id: "enc6", date: "2025-06-05", source: "Intérêts bancaires", montant: 12000, mode: "Virement" },
];

// ── Static décaissements ──
export const STATIC_DECAISSEMENTS: Decaissement[] = [
  { id: "dec1", date: "2025-06-14", beneficiaire: "Fournisseur Madio", montant: 85000, categorie: "Achats", reference: "ACH-012" },
  { id: "dec2", date: "2025-06-13", beneficiaire: "Employés", montant: 1200000, categorie: "Salaires", reference: "PAI-06" },
  { id: "dec3", date: "2025-06-10", beneficiaire: "Propriétaire local", montant: 800000, categorie: "Loyer", reference: "LOY-06" },
  { id: "dec4", date: "2025-06-09", beneficiaire: "JIRAMA", montant: 120000, categorie: "Charges", reference: "UTIL-06" },
  { id: "dec5", date: "2025-06-07", beneficiaire: "Assurance MAMA", montant: 95000, categorie: "Assurance" },
  { id: "dec6", date: "2025-06-05", beneficiaire: "Transport Express", montant: 45000, categorie: "Transport" },
];

// ── Static prévisions ──
export const STATIC_PREVISIONS: PrevisionTresorerie[] = [
  { id: "pv1", mois: "2025-07", encaissementsPrevus: 2500000, decaissementsPrevus: 2100000, soldePrevu: 3850000 },
  { id: "pv2", mois: "2025-08", encaissementsPrevus: 2800000, decaissementsPrevus: 2300000, soldePrevu: 4350000 },
  { id: "pv3", mois: "2025-09", encaissementsPrevus: 3000000, decaissementsPrevus: 2500000, soldePrevu: 4850000 },
  { id: "pv4", mois: "2025-10", encaissementsPrevus: 2700000, decaissementsPrevus: 2400000, soldePrevu: 5150000 },
];

// ── Static rapports ──
export const STATIC_RAPPORTS: RapportTresorerie[] = [
  { id: "rp1", periode: "2025-03", totalEncaissements: 2100000, totalDecaissements: 1950000, soldeNet: 150000, variation: 3.2 },
  { id: "rp2", periode: "2025-04", totalEncaissements: 2400000, totalDecaissements: 2200000, soldeNet: 200000, variation: 5.1 },
  { id: "rp3", periode: "2025-05", totalEncaissements: 2650000, totalDecaissements: 2100000, soldeNet: 550000, variation: 12.4 },
  { id: "rp4", periode: "2025-06", totalEncaissements: 1217000, totalDecaissements: 2345000, soldeNet: -1128000, variation: -8.7 },
];

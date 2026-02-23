// ── Static data for "Gestion de paie" module ──

export type StatutEmploye = "ACTIF" | "INACTIF" | "EN_CONGE";
export type StatutConge = "APPROUVE" | "EN_ATTENTE" | "REFUSE";

export interface Employe {
  id: string;
  nom: string;
  poste: string;
  departement: string;
  dateEmbauche: string;
  salaireBase: number;
  statut: StatutEmploye;
}

export interface FichePaie {
  id: string;
  employeId: string;
  mois: string;
  salaireBase: number;
  primes: number;
  deductions: number;
  netAPayer: number;
}

export interface ChargeSociale {
  id: string;
  libelle: string;
  taux: number;
  base: string;
  montant: number;
  mois: string;
}

export interface Conge {
  id: string;
  employeId: string;
  type: string;
  dateDebut: string;
  dateFin: string;
  jours: number;
  statut: StatutConge;
  motif?: string;
}

// ── Static employés ──
export const STATIC_EMPLOYES: Employe[] = [
  { id: "emp1", nom: "Randria Paul", poste: "Comptable", departement: "Finance", dateEmbauche: "2022-03-01", salaireBase: 800000, statut: "ACTIF" },
  { id: "emp2", nom: "Rasoa Nadia", poste: "Vendeuse", departement: "Commercial", dateEmbauche: "2023-01-15", salaireBase: 500000, statut: "ACTIF" },
  { id: "emp3", nom: "Rakoto Fidy", poste: "Magasinier", departement: "Logistique", dateEmbauche: "2021-06-10", salaireBase: 450000, statut: "EN_CONGE" },
  { id: "emp4", nom: "Rabe Tiana", poste: "Directeur", departement: "Direction", dateEmbauche: "2020-01-01", salaireBase: 1500000, statut: "ACTIF" },
  { id: "emp5", nom: "Nirina Haja", poste: "Assistant", departement: "Administration", dateEmbauche: "2024-02-20", salaireBase: 400000, statut: "ACTIF" },
];

// ── Static fiches de paie ──
export const STATIC_FICHES_PAIE: FichePaie[] = [
  { id: "fp1", employeId: "emp1", mois: "2025-06", salaireBase: 800000, primes: 50000, deductions: 68000, netAPayer: 782000 },
  { id: "fp2", employeId: "emp2", mois: "2025-06", salaireBase: 500000, primes: 30000, deductions: 42400, netAPayer: 487600 },
  { id: "fp3", employeId: "emp3", mois: "2025-06", salaireBase: 450000, primes: 0, deductions: 36000, netAPayer: 414000 },
  { id: "fp4", employeId: "emp4", mois: "2025-06", salaireBase: 1500000, primes: 200000, deductions: 136000, netAPayer: 1564000 },
  { id: "fp5", employeId: "emp5", mois: "2025-06", salaireBase: 400000, primes: 20000, deductions: 33600, netAPayer: 386400 },
];

// ── Static charges sociales ──
export const STATIC_CHARGES: ChargeSociale[] = [
  { id: "cs1", libelle: "CNaPS employeur", taux: 13, base: "Salaire brut", montant: 409500, mois: "2025-06" },
  { id: "cs2", libelle: "CNaPS salarié", taux: 1, base: "Salaire brut", montant: 31500, mois: "2025-06" },
  { id: "cs3", libelle: "OSTIE employeur", taux: 5, base: "Salaire brut", montant: 157500, mois: "2025-06" },
  { id: "cs4", libelle: "OSTIE salarié", taux: 1, base: "Salaire brut", montant: 31500, mois: "2025-06" },
  { id: "cs5", libelle: "IRSA", taux: 20, base: "Salaire imposable", montant: 95500, mois: "2025-06" },
];

// ── Static congés ──
export const STATIC_CONGES: Conge[] = [
  { id: "cg1", employeId: "emp3", type: "Annuel", dateDebut: "2025-06-10", dateFin: "2025-06-24", jours: 14, statut: "APPROUVE", motif: "Congé annuel" },
  { id: "cg2", employeId: "emp1", type: "Maladie", dateDebut: "2025-05-20", dateFin: "2025-05-22", jours: 3, statut: "APPROUVE", motif: "Certificat médical" },
  { id: "cg3", employeId: "emp2", type: "Personnel", dateDebut: "2025-07-01", dateFin: "2025-07-03", jours: 3, statut: "EN_ATTENTE", motif: "Raison familiale" },
  { id: "cg4", employeId: "emp5", type: "Annuel", dateDebut: "2025-08-01", dateFin: "2025-08-15", jours: 14, statut: "EN_ATTENTE" },
];

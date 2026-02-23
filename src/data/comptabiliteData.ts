// ── Static data for "Comptabilité" module ──

export type TypeEcriture = "DEBIT" | "CREDIT";

export interface EcritureJournal {
  id: string;
  date: string;
  libelle: string;
  compteDebit: string;
  compteCredit: string;
  montant: number;
  reference?: string;
}

export interface CompteComptable {
  id: string;
  numero: string;
  libelle: string;
  classe: string;
  solde: number;
}

export interface BilanLigne {
  id: string;
  libelle: string;
  categorie: "ACTIF" | "PASSIF";
  montant: number;
}

export interface MouvementTresorerie {
  id: string;
  date: string;
  type: "ENTREE" | "SORTIE";
  libelle: string;
  montant: number;
  soldeApres: number;
}

// ── Static écritures ──
export const STATIC_ECRITURES: EcritureJournal[] = [
  { id: "ej1", date: "2025-06-15", libelle: "Vente marchandises", compteDebit: "411", compteCredit: "701", montant: 315000, reference: "FAC-2025-001" },
  { id: "ej2", date: "2025-06-14", libelle: "Achat fournitures", compteDebit: "601", compteCredit: "401", montant: 45000, reference: "ACH-2025-012" },
  { id: "ej3", date: "2025-06-13", libelle: "Paiement salaires", compteDebit: "641", compteCredit: "512", montant: 1200000, reference: "PAI-2025-06" },
  { id: "ej4", date: "2025-06-12", libelle: "Encaissement client", compteDebit: "512", compteCredit: "411", montant: 210000, reference: "ENC-2025-003" },
  { id: "ej5", date: "2025-06-10", libelle: "Loyer bureau", compteDebit: "613", compteCredit: "512", montant: 800000, reference: "LOY-2025-06" },
  { id: "ej6", date: "2025-06-08", libelle: "Vente services", compteDebit: "411", compteCredit: "706", montant: 450000, reference: "FAC-2025-005" },
];

// ── Static plan comptable ──
export const STATIC_COMPTES: CompteComptable[] = [
  { id: "cc1", numero: "101", libelle: "Capital social", classe: "1 - Capitaux", solde: 5000000 },
  { id: "cc2", numero: "401", libelle: "Fournisseurs", classe: "4 - Tiers", solde: -320000 },
  { id: "cc3", numero: "411", libelle: "Clients", classe: "4 - Tiers", solde: 975000 },
  { id: "cc4", numero: "512", libelle: "Banque", classe: "5 - Financier", solde: 3450000 },
  { id: "cc5", numero: "601", libelle: "Achats marchandises", classe: "6 - Charges", solde: 1800000 },
  { id: "cc6", numero: "613", libelle: "Loyers", classe: "6 - Charges", solde: 4800000 },
  { id: "cc7", numero: "641", libelle: "Rémunérations", classe: "6 - Charges", solde: 7200000 },
  { id: "cc8", numero: "701", libelle: "Ventes marchandises", classe: "7 - Produits", solde: 12500000 },
  { id: "cc9", numero: "706", libelle: "Prestations de services", classe: "7 - Produits", solde: 3600000 },
];

// ── Static bilan ──
export const STATIC_BILAN: BilanLigne[] = [
  { id: "b1", libelle: "Immobilisations", categorie: "ACTIF", montant: 8500000 },
  { id: "b2", libelle: "Stocks", categorie: "ACTIF", montant: 2300000 },
  { id: "b3", libelle: "Créances clients", categorie: "ACTIF", montant: 975000 },
  { id: "b4", libelle: "Banque & Caisse", categorie: "ACTIF", montant: 3450000 },
  { id: "b5", libelle: "Capital", categorie: "PASSIF", montant: 5000000 },
  { id: "b6", libelle: "Résultat", categorie: "PASSIF", montant: 2300000 },
  { id: "b7", libelle: "Dettes fournisseurs", categorie: "PASSIF", montant: 320000 },
  { id: "b8", libelle: "Emprunts", categorie: "PASSIF", montant: 7605000 },
];

// ── Static trésorerie ──
export const STATIC_MOUVEMENTS_TRESORERIE: MouvementTresorerie[] = [
  { id: "mt1", date: "2025-06-15", type: "ENTREE", libelle: "Encaissement vente", montant: 315000, soldeApres: 3765000 },
  { id: "mt2", date: "2025-06-14", type: "SORTIE", libelle: "Paiement fournisseur", montant: 45000, soldeApres: 3450000 },
  { id: "mt3", date: "2025-06-13", type: "SORTIE", libelle: "Salaires", montant: 1200000, soldeApres: 3495000 },
  { id: "mt4", date: "2025-06-12", type: "ENTREE", libelle: "Encaissement client", montant: 210000, soldeApres: 4695000 },
  { id: "mt5", date: "2025-06-10", type: "SORTIE", libelle: "Loyer", montant: 800000, soldeApres: 4485000 },
  { id: "mt6", date: "2025-06-08", type: "ENTREE", libelle: "Encaissement services", montant: 450000, soldeApres: 5285000 },
];

// ── Static data for "Gestion de vente" module ──

export interface Produit {
  id: string;
  nom: string;
  reference: string;
  prixAchat: number;
  prixVente: number;
  categorie: string;
}

export interface StockItem {
  id: string;
  produitId: string;
  quantite: number;
  seuilAlerte: number;
  emplacement: string;
  derniereMaj: string;
  paymentType?: "CASH" | "CARD";
}

export interface Client {
  id: string;
  nom: string;
  email: string;
  telephone: string;
  adresse: string;
  totalAchats: number;
}

export interface LigneFacture {
  produitId: string;
  quantite: number;
  prixUnitaire: number;
}

export type FactureStatut = "PAYÉE" | "EN_ATTENTE" | "ANNULÉE";

export interface Facture {
  id: string;
  numero: string;
  clientId: string;
  date: string;
  lignes: LigneFacture[];
  statut: FactureStatut;
  total: number;
  paymentType?: "CASH" | "CARD";
}

// ── Static produits ──
export const STATIC_PRODUITS: Produit[] = [
  { id: "p1", nom: "Riz 50kg", reference: "RIZ-050", prixAchat: 85000, prixVente: 105000, categorie: "Alimentaire" },
  { id: "p2", nom: "Huile 5L", reference: "HUI-005", prixAchat: 22000, prixVente: 28000, categorie: "Alimentaire" },
  { id: "p3", nom: "Sucre 1kg", reference: "SUC-001", prixAchat: 4500, prixVente: 6000, categorie: "Alimentaire" },
  { id: "p4", nom: "Savon lessive", reference: "SAV-001", prixAchat: 3000, prixVente: 4500, categorie: "Ménage" },
  { id: "p5", nom: "Cahier 200p", reference: "CAH-200", prixAchat: 2000, prixVente: 3500, categorie: "Fourniture" },
  { id: "p6", nom: "Stylo BIC", reference: "STY-BIC", prixAchat: 500, prixVente: 1000, categorie: "Fourniture" },
];

// ── Static stock ──
export const STATIC_STOCK: StockItem[] = [
  { id: "s1", produitId: "p1", quantite: 45, seuilAlerte: 10, emplacement: "Entrepôt A", derniereMaj: "2025-06-15" },
  { id: "s2", produitId: "p2", quantite: 120, seuilAlerte: 20, emplacement: "Entrepôt A", derniereMaj: "2025-06-14" },
  { id: "s3", produitId: "p3", quantite: 200, seuilAlerte: 50, emplacement: "Entrepôt B", derniereMaj: "2025-06-13" },
  { id: "s4", produitId: "p4", quantite: 8, seuilAlerte: 15, emplacement: "Entrepôt B", derniereMaj: "2025-06-12" },
  { id: "s5", produitId: "p5", quantite: 350, seuilAlerte: 30, emplacement: "Magasin", derniereMaj: "2025-06-11" },
  { id: "s6", produitId: "p6", quantite: 500, seuilAlerte: 100, emplacement: "Magasin", derniereMaj: "2025-06-10" },
];

// ── Static clients ──
export const STATIC_CLIENTS: Client[] = [
  { id: "c1", nom: "Rakoto Jean", email: "rakoto@mail.mg", telephone: "034 12 345 67", adresse: "Analakely, Antananarivo", totalAchats: 1250000 },
  { id: "c2", nom: "Rabe Marie", email: "rabe.m@mail.mg", telephone: "033 98 765 43", adresse: "Antsahabe, Antananarivo", totalAchats: 870000 },
  { id: "c3", nom: "Andria Luc", email: "andria.l@mail.mg", telephone: "032 55 123 89", adresse: "Ambohipo, Antananarivo", totalAchats: 2100000 },
  { id: "c4", nom: "Rasoa Hanta", email: "rasoa.h@mail.mg", telephone: "034 77 456 12", adresse: "Ivandry, Antananarivo", totalAchats: 430000 },
];

// ── Static factures ──
export const STATIC_FACTURES: Facture[] = [
  {
    id: "f1", numero: "FAC-2025-001", clientId: "c1", date: "2025-06-15", statut: "PAYÉE", total: 315000,
    lignes: [{ produitId: "p1", quantite: 3, prixUnitaire: 105000 }],
  },
  {
    id: "f2", numero: "FAC-2025-002", clientId: "c2", date: "2025-06-14", statut: "EN_ATTENTE", total: 62000,
    lignes: [{ produitId: "p2", quantite: 1, prixUnitaire: 28000 }, { produitId: "p3", quantite: 4, prixUnitaire: 6000 }, { produitId: "p4", quantite: 2, prixUnitaire: 4500 }],
  },
  {
    id: "f3", numero: "FAC-2025-003", clientId: "c3", date: "2025-06-12", statut: "PAYÉE", total: 210000,
    lignes: [{ produitId: "p1", quantite: 2, prixUnitaire: 105000 }],
  },
  {
    id: "f4", numero: "FAC-2025-004", clientId: "c4", date: "2025-06-10", statut: "ANNULÉE", total: 7000,
    lignes: [{ produitId: "p5", quantite: 2, prixUnitaire: 3500 }],
  },
  {
    id: "f5", numero: "FAC-2025-005", clientId: "c1", date: "2025-06-08", statut: "EN_ATTENTE", total: 56000,
    lignes: [{ produitId: "p2", quantite: 2, prixUnitaire: 28000 }],
  },
];

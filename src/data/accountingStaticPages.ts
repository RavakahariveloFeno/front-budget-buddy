export interface AccountingStaticRow {
  id: string;
  values: string[];
  amount?: number;
  status?: string;
}

export interface AccountingStaticPageData {
  title: string;
  summary: { label: string; value: string; tone?: "primary" | "revenue" | "expense" | "warning" }[];
  headers: string[];
  rows: AccountingStaticRow[];
}

export const STATIC_ACCOUNTING_PAGES: Record<string, AccountingStaticPageData> = {
  balance: {
    title: "Balance comptable",
    summary: [
      { label: "Total débits", value: "28 940 000 MGA", tone: "revenue" },
      { label: "Total crédits", value: "28 940 000 MGA", tone: "primary" },
      { label: "Écart", value: "0 MGA", tone: "warning" },
    ],
    headers: ["Compte", "Libellé", "Débit", "Crédit"],
    rows: [
      { id: "bal1", values: ["101", "Capital social", "0 MGA", "5 000 000 MGA"], status: "Équilibré" },
      { id: "bal2", values: ["411", "Clients", "975 000 MGA", "0 MGA"], status: "Actif" },
      { id: "bal3", values: ["512", "Banque", "3 450 000 MGA", "0 MGA"], status: "Actif" },
      { id: "bal4", values: ["701", "Ventes marchandises", "0 MGA", "12 500 000 MGA"], status: "Produit" },
    ],
  },
  "centres-cout": {
    title: "Centres de coût",
    summary: [
      { label: "Centres actifs", value: "4", tone: "primary" },
      { label: "Charges réparties", value: "9 870 000 MGA", tone: "expense" },
      { label: "Budget restant", value: "1 430 000 MGA", tone: "revenue" },
    ],
    headers: ["Centre", "Responsable", "Budget", "Consommé"],
    rows: [
      { id: "ccout1", values: ["Production", "Rado", "4 500 000 MGA", "3 820 000 MGA"], status: "Suivi" },
      { id: "ccout2", values: ["Commercial", "Miora", "3 200 000 MGA", "2 940 000 MGA"], status: "Suivi" },
      { id: "ccout3", values: ["Administration", "Niry", "2 100 000 MGA", "1 950 000 MGA"], status: "Stable" },
    ],
  },
  projets: {
    title: "Projets analytiques",
    summary: [
      { label: "Projets", value: "5", tone: "primary" },
      { label: "Marge moyenne", value: "27%", tone: "revenue" },
      { label: "Coûts engagés", value: "6 640 000 MGA", tone: "expense" },
    ],
    headers: ["Projet", "Client", "Revenus", "Coûts"],
    rows: [
      { id: "proj1", values: ["Refonte boutique", "Andria SARL", "4 200 000 MGA", "2 950 000 MGA"], status: "Rentable" },
      { id: "proj2", values: ["Campagne terrain", "Mada Services", "2 800 000 MGA", "2 120 000 MGA"], status: "En cours" },
      { id: "proj3", values: ["Audit stock", "Retail Plus", "1 500 000 MGA", "980 000 MGA"], status: "Clôturé" },
    ],
  },
  repartition: {
    title: "Répartition analytique",
    summary: [
      { label: "Clés utilisées", value: "3", tone: "primary" },
      { label: "Charges directes", value: "7 120 000 MGA", tone: "expense" },
      { label: "Charges indirectes", value: "2 750 000 MGA", tone: "warning" },
    ],
    headers: ["Charge", "Clé", "Activité", "Montant"],
    rows: [
      { id: "rep1", values: ["Loyer", "Surface", "Boutique", "520 000 MGA"], status: "Mensuel" },
      { id: "rep2", values: ["Électricité", "Consommation", "Atelier", "310 000 MGA"], status: "Mensuel" },
      { id: "rep3", values: ["Transport", "Volume", "Livraison", "445 000 MGA"], status: "Variable" },
    ],
  },
  rentabilite: {
    title: "Rentabilité",
    summary: [
      { label: "CA analysé", value: "18 600 000 MGA", tone: "revenue" },
      { label: "Résultat", value: "4 180 000 MGA", tone: "primary" },
      { label: "Marge nette", value: "22,5%", tone: "revenue" },
    ],
    headers: ["Activité", "Chiffre d'affaires", "Charges", "Marge"],
    rows: [
      { id: "rent1", values: ["Vente détail", "9 800 000 MGA", "7 100 000 MGA", "27,6%"], status: "Bon" },
      { id: "rent2", values: ["Services", "5 600 000 MGA", "3 950 000 MGA", "29,5%"], status: "Bon" },
      { id: "rent3", values: ["Livraison", "3 200 000 MGA", "3 370 000 MGA", "-5,3%"], status: "À surveiller" },
    ],
  },
  "tva-collectee": {
    title: "TVA collectée",
    summary: [
      { label: "Base taxable", value: "14 900 000 MGA", tone: "primary" },
      { label: "TVA collectée", value: "2 980 000 MGA", tone: "revenue" },
      { label: "Factures", value: "18", tone: "warning" },
    ],
    headers: ["Date", "Facture", "Client", "TVA"],
    rows: [
      { id: "tvc1", values: ["15 juin", "FAC-2025-001", "Andria SARL", "630 000 MGA"], status: "Déclarable" },
      { id: "tvc2", values: ["12 juin", "FAC-2025-005", "Mada Services", "900 000 MGA"], status: "Déclarable" },
      { id: "tvc3", values: ["08 juin", "FAC-2025-008", "Retail Plus", "360 000 MGA"], status: "Déclarable" },
    ],
  },
  "tva-deductible": {
    title: "TVA déductible",
    summary: [
      { label: "Base achats", value: "6 450 000 MGA", tone: "primary" },
      { label: "TVA déductible", value: "1 290 000 MGA", tone: "expense" },
      { label: "Pièces", value: "12", tone: "warning" },
    ],
    headers: ["Date", "Pièce", "Fournisseur", "TVA"],
    rows: [
      { id: "tvd1", values: ["14 juin", "ACH-2025-012", "Fournisseur Madio", "170 000 MGA"], status: "Validée" },
      { id: "tvd2", values: ["10 juin", "LOY-2025-06", "Propriétaire local", "160 000 MGA"], status: "Validée" },
      { id: "tvd3", values: ["09 juin", "UTIL-06", "JIRAMA", "24 000 MGA"], status: "Validée" },
    ],
  },
  declarations: {
    title: "Déclarations fiscales",
    summary: [
      { label: "Période", value: "Juin 2025", tone: "primary" },
      { label: "TVA nette", value: "1 690 000 MGA", tone: "warning" },
      { label: "Statut", value: "Préparée", tone: "revenue" },
    ],
    headers: ["Déclaration", "Période", "Montant", "Échéance"],
    rows: [
      { id: "decf1", values: ["TVA", "Juin 2025", "1 690 000 MGA", "20 juillet"], status: "Préparée" },
      { id: "decf2", values: ["Acompte IR", "T2 2025", "850 000 MGA", "31 juillet"], status: "À valider" },
      { id: "decf3", values: ["Retenue à la source", "Juin 2025", "210 000 MGA", "15 juillet"], status: "Préparée" },
    ],
  },
  "rapports-fiscaux": {
    title: "Rapports fiscaux",
    summary: [
      { label: "Rapports", value: "4", tone: "primary" },
      { label: "Taxes suivies", value: "3", tone: "warning" },
      { label: "Dernière clôture", value: "30 juin", tone: "revenue" },
    ],
    headers: ["Rapport", "Période", "Base", "Taxe"],
    rows: [
      { id: "rf1", values: ["Synthèse TVA", "Juin", "21 350 000 MGA", "1 690 000 MGA"], status: "Disponible" },
      { id: "rf2", values: ["Livre fiscal ventes", "Juin", "14 900 000 MGA", "2 980 000 MGA"], status: "Disponible" },
      { id: "rf3", values: ["Livre fiscal achats", "Juin", "6 450 000 MGA", "1 290 000 MGA"], status: "Disponible" },
    ],
  },
  facturation: {
    title: "Facturation client",
    summary: [
      { label: "Factures", value: "24", tone: "primary" },
      { label: "Montant facturé", value: "18 320 000 MGA", tone: "revenue" },
      { label: "Impayés", value: "2 150 000 MGA", tone: "warning" },
    ],
    headers: ["Facture", "Client", "Date", "Montant"],
    rows: [
      { id: "fac1", values: ["FAC-2025-001", "Andria SARL", "15 juin", "3 150 000 MGA"], status: "Payée" },
      { id: "fac2", values: ["FAC-2025-005", "Mada Services", "12 juin", "4 500 000 MGA"], status: "Partielle" },
      { id: "fac3", values: ["FAC-2025-008", "Retail Plus", "08 juin", "1 800 000 MGA"], status: "En attente" },
    ],
  },
  creances: {
    title: "Créances clients",
    summary: [
      { label: "Créances ouvertes", value: "7", tone: "warning" },
      { label: "Total dû", value: "4 875 000 MGA", tone: "expense" },
      { label: "Échu", value: "1 250 000 MGA", tone: "expense" },
    ],
    headers: ["Client", "Facture", "Échéance", "Restant dû"],
    rows: [
      { id: "cre1", values: ["Mada Services", "FAC-2025-005", "30 juin", "1 200 000 MGA"], status: "Partielle" },
      { id: "cre2", values: ["Retail Plus", "FAC-2025-008", "25 juin", "1 800 000 MGA"], status: "Échue" },
      { id: "cre3", values: ["Soa Market", "FAC-2025-010", "05 juillet", "875 000 MGA"], status: "À venir" },
    ],
  },
  "reglements-clients": {
    title: "Règlements clients",
    summary: [
      { label: "Règlements", value: "16", tone: "primary" },
      { label: "Encaissé", value: "11 240 000 MGA", tone: "revenue" },
      { label: "Moyen principal", value: "Virement", tone: "warning" },
    ],
    headers: ["Date", "Client", "Mode", "Montant"],
    rows: [
      { id: "regc1", values: ["15 juin", "Andria SARL", "Virement", "3 150 000 MGA"], status: "Lettré" },
      { id: "regc2", values: ["14 juin", "Mada Services", "Chèque", "2 100 000 MGA"], status: "Lettré" },
      { id: "regc3", values: ["12 juin", "Soa Market", "Mobile money", "650 000 MGA"], status: "À lettrer" },
    ],
  },
  relances: {
    title: "Relances clients",
    summary: [
      { label: "Relances prévues", value: "5", tone: "warning" },
      { label: "Montant concerné", value: "3 925 000 MGA", tone: "expense" },
      { label: "Promesses", value: "2", tone: "revenue" },
    ],
    headers: ["Client", "Niveau", "Dernier contact", "Montant"],
    rows: [
      { id: "rel1", values: ["Retail Plus", "Relance 2", "18 juin", "1 800 000 MGA"], status: "Urgent" },
      { id: "rel2", values: ["Mada Services", "Relance 1", "17 juin", "1 200 000 MGA"], status: "Planifiée" },
      { id: "rel3", values: ["Soa Market", "Courtoisie", "16 juin", "875 000 MGA"], status: "Planifiée" },
    ],
  },
  "bons-commande": {
    title: "Bons de commande",
    summary: [
      { label: "Commandes", value: "9", tone: "primary" },
      { label: "Engagé", value: "7 480 000 MGA", tone: "expense" },
      { label: "À réceptionner", value: "3", tone: "warning" },
    ],
    headers: ["BC", "Fournisseur", "Date", "Montant"],
    rows: [
      { id: "bc1", values: ["BC-2025-018", "Fournisseur Madio", "14 juin", "1 850 000 MGA"], status: "Reçu" },
      { id: "bc2", values: ["BC-2025-019", "Papeterie Plus", "12 juin", "620 000 MGA"], status: "En attente" },
      { id: "bc3", values: ["BC-2025-020", "Transport Express", "10 juin", "950 000 MGA"], status: "Validé" },
    ],
  },
  dettes: {
    title: "Dettes fournisseurs",
    summary: [
      { label: "Fournisseurs", value: "6", tone: "primary" },
      { label: "Total dettes", value: "5 320 000 MGA", tone: "expense" },
      { label: "Échu", value: "980 000 MGA", tone: "warning" },
    ],
    headers: ["Fournisseur", "Facture", "Échéance", "Solde"],
    rows: [
      { id: "det1", values: ["Fournisseur Madio", "FF-2025-044", "28 juin", "1 450 000 MGA"], status: "À payer" },
      { id: "det2", values: ["JIRAMA", "UTIL-06", "20 juin", "120 000 MGA"], status: "Échu" },
      { id: "det3", values: ["Transport Express", "TR-2025-021", "05 juillet", "450 000 MGA"], status: "À venir" },
    ],
  },
  "factures-fournisseurs": {
    title: "Factures fournisseurs",
    summary: [
      { label: "Factures", value: "17", tone: "primary" },
      { label: "Total achats", value: "9 760 000 MGA", tone: "expense" },
      { label: "TVA récupérable", value: "1 290 000 MGA", tone: "revenue" },
    ],
    headers: ["Facture", "Fournisseur", "Catégorie", "Montant"],
    rows: [
      { id: "ff1", values: ["FF-2025-044", "Fournisseur Madio", "Achats", "1 450 000 MGA"], status: "Validée" },
      { id: "ff2", values: ["UTIL-06", "JIRAMA", "Charges", "120 000 MGA"], status: "Validée" },
      { id: "ff3", values: ["LOY-06", "Propriétaire local", "Loyer", "800 000 MGA"], status: "Payée" },
    ],
  },
  paiements: {
    title: "Paiements fournisseurs",
    summary: [
      { label: "Paiements", value: "11", tone: "primary" },
      { label: "Décaissé", value: "4 440 000 MGA", tone: "expense" },
      { label: "En attente", value: "2", tone: "warning" },
    ],
    headers: ["Date", "Fournisseur", "Mode", "Montant"],
    rows: [
      { id: "pay1", values: ["14 juin", "Fournisseur Madio", "Virement", "850 000 MGA"], status: "Exécuté" },
      { id: "pay2", values: ["10 juin", "Propriétaire local", "Virement", "800 000 MGA"], status: "Exécuté" },
      { id: "pay3", values: ["09 juin", "JIRAMA", "Mobile money", "120 000 MGA"], status: "Planifié" },
    ],
  },
  acquisitions: {
    title: "Acquisitions immobilisations",
    summary: [
      { label: "Biens", value: "8", tone: "primary" },
      { label: "Valeur brute", value: "12 850 000 MGA", tone: "revenue" },
      { label: "Nouvelles entrées", value: "2", tone: "warning" },
    ],
    headers: ["Bien", "Date", "Compte", "Valeur"],
    rows: [
      { id: "acq1", values: ["Ordinateurs caisse", "03 juin", "2183", "2 400 000 MGA"], status: "Actif" },
      { id: "acq2", values: ["Rayonnage magasin", "21 mai", "2181", "3 200 000 MGA"], status: "Actif" },
      { id: "acq3", values: ["Moto livraison", "10 avril", "2182", "4 800 000 MGA"], status: "Actif" },
    ],
  },
  amortissements: {
    title: "Amortissements",
    summary: [
      { label: "Dotation mensuelle", value: "385 000 MGA", tone: "expense" },
      { label: "Cumul amorti", value: "3 180 000 MGA", tone: "warning" },
      { label: "Biens amortis", value: "8", tone: "primary" },
    ],
    headers: ["Bien", "Durée", "Dotation", "Cumul"],
    rows: [
      { id: "amo1", values: ["Ordinateurs caisse", "3 ans", "66 667 MGA", "200 000 MGA"], status: "Linéaire" },
      { id: "amo2", values: ["Rayonnage magasin", "5 ans", "53 333 MGA", "320 000 MGA"], status: "Linéaire" },
      { id: "amo3", values: ["Moto livraison", "4 ans", "100 000 MGA", "900 000 MGA"], status: "Linéaire" },
    ],
  },
  cessions: {
    title: "Cessions immobilisations",
    summary: [
      { label: "Cessions", value: "2", tone: "primary" },
      { label: "Produit de cession", value: "1 150 000 MGA", tone: "revenue" },
      { label: "Plus-value", value: "180 000 MGA", tone: "warning" },
    ],
    headers: ["Bien", "Date", "Prix", "Résultat"],
    rows: [
      { id: "ces1", values: ["Ancien PC bureau", "05 juin", "450 000 MGA", "80 000 MGA"], status: "Cédé" },
      { id: "ces2", values: ["Imprimante", "28 mai", "700 000 MGA", "100 000 MGA"], status: "Cédé" },
    ],
  },
  vnc: {
    title: "Valeur nette comptable",
    summary: [
      { label: "Valeur brute", value: "12 850 000 MGA", tone: "primary" },
      { label: "Amortissements", value: "3 180 000 MGA", tone: "expense" },
      { label: "VNC totale", value: "9 670 000 MGA", tone: "revenue" },
    ],
    headers: ["Bien", "Brut", "Amorti", "VNC"],
    rows: [
      { id: "vnc1", values: ["Ordinateurs caisse", "2 400 000 MGA", "200 000 MGA", "2 200 000 MGA"], status: "Actif" },
      { id: "vnc2", values: ["Rayonnage magasin", "3 200 000 MGA", "320 000 MGA", "2 880 000 MGA"], status: "Actif" },
      { id: "vnc3", values: ["Moto livraison", "4 800 000 MGA", "900 000 MGA", "3 900 000 MGA"], status: "Actif" },
    ],
  },
};

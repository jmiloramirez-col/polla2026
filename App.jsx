import React, { useState, useEffect, createContext, useContext } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, onSnapshot, updateDoc } from "firebase/firestore";

// FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyDL2FV0gfT5b58f5mXmAPJMqSbwKde0IV0",
  authDomain: "mundial2026-2026.firebaseapp.com",
  projectId: "mundial2026-2026",
  storageBucket: "mundial2026-2026.firebasestorage.app",
  messagingSenderId: "76029862427",
  appId: "1:76029862427:web:23f21566a32e1c40610ebe"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const PARTICIPANTS_DOC = doc(db, "tournament", "participants");
const MATCHES_DOC = doc(db, "tournament", "matches");
const SETTINGS_DOC = doc(db, "tournament", "settings");
const INVOICES_DOC = doc(db, "tournament", "invoices");
const PIN_REQUESTS_DOC = doc(db, "tournament", "pinRequests");

// ERROR BOUNDARY — catches silent white screens
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(e) { return { error: e }; }
  render() {
    if (this.state.error) return (
      <div style={{padding:30,fontFamily:"monospace",color:"#dc2626",background:"#fff5f5",minHeight:"100vh"}}>
        <h2>⚠️ Error en la aplicación</h2>
        <pre style={{whiteSpace:"pre-wrap",fontSize:"0.8rem"}}>{this.state.error?.message}</pre>
        <pre style={{whiteSpace:"pre-wrap",fontSize:"0.7rem",color:"#6b7280"}}>{this.state.error?.stack}</pre>
        <button onClick={()=>window.location.reload()} style={{marginTop:16,padding:"8px 16px",background:"#dc2626",color:"#fff",border:"none",borderRadius:6,cursor:"pointer"}}>Recargar</button>
      </div>
    );
    return this.props.children;
  }
}

// LANG CONTEXT
const LangContext = createContext("fr");
const useLang = () => useContext(LangContext);
const T = {
  es: {
    nav: { inicio:"Inicio", clasificacion:"Clasificación", reglamento:"Reglamento", resultados:"Resultados", admin:"Admin" },
    status: { loading:"CARGANDO...", participants:"PARTICIPANTES", matches:"PARTIDOS" },
    clasificacion: {
      title:"CLASIFICACIÓN GENERAL", participants:"PARTICIPANTES",
      noParticipants:"Aun no hay participantes",
      exactos:"exactos", acertados:"acertados", ptsFact:"pts facturas", ptsClas:"pts clasificados",
      validOk:"Tu participación es válida — factura aprobada con producto elegible.",
      pendingTitle:"Factura pendiente de aprobación",
      pendingMsg:"Tu factura de $50+ con producto elegible está siendo revisada por el administrador.",
      invalidTitle:"Participación no válida",
      noProductMsg:"Tienes una factura de $50+ pero no confirmaste que incluye un producto elegible. Edítala en Mi Perfil.",
      invalidMsg:"Registra una factura de $50 o más que incluya alguno de los productos elegibles* para validar tu participación.",
    },
    profile: {
      totalPts:"TOTAL DE PUNTOS", position:"POSICIÓN",
      pronosticos:"Pronósticos", clasificados:"Clasificados", facturas:"Facturas",
      validOk:"Factura aprobada con producto elegible. Estás participando correctamente.",
      validTitle:"Participación válida",
      pendingTitle:"Pendiente de aprobación", pendingMsg:"Tu factura de $50+ con producto elegible está siendo revisada por el administrador.",
      noProductTitle:"Producto elegible no confirmado", noProductMsg:"Tienes una factura de $50+ pero no confirmaste que incluye un producto elegible. Sin esto tu participación no es válida.",
      invalidTitle:"Participación no válida", invalidMsg:"Necesitas una factura de $50+ con producto elegible* aprobada para participar. Registra tu compra abajo.",
      misDatos:"Mis datos", nombre:"NOMBRE", apellido:"APELLIDO", email:"CORREO", tel:"TELÉFONO", sucursal:"SUCURSAL", pin:"NUEVO PIN", pin2:"CONFIRMAR PIN",
      editarPerfil:"Editar Perfil", guardar:"Guardar", cancelar:"Cancelar", perfilActualizado:"✅ Perfil actualizado",
      registrarFactura:"Registrar Factura", numFactura:"NUMERO DE FACTURA", monto:"MONTO (CAD $)",
      facturaVale:"Esta factura vale", puntos:"puntos", siAprobada:"si es aprobada",
      productoCheck:"Esta factura incluye uno de los productos participantes* del concurso",
      sinProductoTitle:"Sin producto participante, esta factura", sinProductoMsg:"no valida tu participación aunque sea de $50+. Igual genera puntos.",
      conProductoMsg:"Esta factura valida tu participación si es aprobada por el administrador.",
      facturaSent:"Factura enviada! Pendiente de aprobacion por el administrador.",
      enviarFactura:"Enviar Factura", enviando:"Enviando...",
      misFacturas:"MIS FACTURAS", ptsAcumulados:"puntos acumulados",
      aprobada:"Aprobada", rechazada:"Rechazada", pendiente:"Pendiente",
      productoIncluido:"✅ Producto participante incluido", sinProducto:"⚠️ Sin producto participante",
      facturaMinima:"El monto minimo es $10 CAD", facturaRepetida:"Esta factura ya fue registrada", facturaNum:"Ingresa el numero de factura",
    },
    login: {
      login:"Iniciar Sesión", register:"Registrarse", logout:"Cerrar Sesión",
      email:"CORREO ELECTRÓNICO", pin:"PIN (4 dígitos)", nombre:"NOMBRE", apellido:"APELLIDO", tel:"TELÉFONO", sucursal:"SUCURSAL",
      btnLogin:"Entrar", btnRegister:"Crear Cuenta", btnLogout:"Cerrar Sesión",
      forgotPin:"¿Olvidaste tu PIN?", backLogin:"← Volver al inicio de sesión",
      noAccount:"¿No tienes cuenta?", hasAccount:"¿Ya tienes cuenta?",
    },
    invoice: { approuved:"Aprobada", rejected:"Rechazada", pending:"Pendiente", withProduct:"✅ Producto elegible", noProduct:"⚠️ Sin producto elegible" },
  },
  fr: {
    nav: { inicio:"Accueil", clasificacion:"Classement", reglamento:"Règlement", resultados:"Résultats", admin:"Admin" },
    status: { loading:"CHARGEMENT...", participants:"PARTICIPANTS", matches:"MATCHS" },
    clasificacion: {
      title:"CLASSEMENT GÉNÉRAL", participants:"PARTICIPANTS",
      noParticipants:"Aucun participant pour l'instant",
      exactos:"exacts", acertados:"corrects", ptsFact:"pts factures", ptsClas:"pts classés",
      validOk:"Ta participation est valide — facture approuvée avec produit éligible.",
      pendingTitle:"Facture en attente d'approbation",
      pendingMsg:"Ta facture de 50 $+ avec produit éligible est en cours de vérification par l'administrateur.",
      invalidTitle:"Participation non valide",
      noProductMsg:"Tu as une facture de 50 $+ mais tu n'as pas confirmé qu'elle inclut un produit éligible. Modifie-la dans Mon Profil.",
      invalidMsg:"Enregistre une facture de 50 $ ou plus incluant un des produits éligibles* pour valider ta participation.",
    },
    profile: {
      totalPts:"TOTAL DE POINTS", position:"POSITION",
      pronosticos:"Pronostics", clasificados:"Classés", facturas:"Factures",
      validOk:"Facture approuvée avec produit éligible. Tu participes correctement.",
      validTitle:"Participation valide",
      pendingTitle:"En attente d'approbation", pendingMsg:"Ta facture de 50 $+ avec produit éligible est en cours de vérification par l'administrateur.",
      noProductTitle:"Produit éligible non confirmé", noProductMsg:"Tu as une facture de 50 $+ mais tu n'as pas confirmé qu'elle inclut un produit éligible. Sans cela, ta participation n'est pas valide.",
      invalidTitle:"Participation non valide", invalidMsg:"Tu as besoin d'une facture de 50 $+ avec produit éligible* approuvée pour participer. Enregistre ton achat ci-dessous.",
      misDatos:"Mes informations", nombre:"PRÉNOM", apellido:"NOM", email:"COURRIEL", tel:"TÉLÉPHONE", sucursal:"SUCCURSALE", pin:"NOUVEAU NIP", pin2:"CONFIRMER NIP",
      editarPerfil:"Modifier le profil", guardar:"Enregistrer", cancelar:"Annuler", perfilActualizado:"✅ Profil mis à jour",
      registrarFactura:"Enregistrer une facture", numFactura:"NUMÉRO DE FACTURE", monto:"MONTANT (CAD $)",
      facturaVale:"Cette facture vaut", puntos:"points", siAprobada:"si elle est approuvée",
      productoCheck:"Cette facture inclut un des produits participants* du concours",
      sinProductoTitle:"Sans produit participant, cette facture", sinProductoMsg:"ne valide pas ta participation même si elle est de 50 $+. Elle génère quand même des points.",
      conProductoMsg:"Cette facture valide ta participation si elle est approuvée par l'administrateur.",
      facturaSent:"Facture envoyée ! En attente d'approbation de l'administrateur.",
      enviarFactura:"Envoyer la facture", enviando:"Envoi en cours...",
      misFacturas:"MES FACTURES", ptsAcumulados:"points accumulés",
      aprobada:"Approuvée", rechazada:"Rejetée", pendiente:"En attente",
      productoIncluido:"✅ Produit participant inclus", sinProducto:"⚠️ Sans produit participant",
      facturaMinima:"Le montant minimum est de 10 $ CAD", facturaRepetida:"Cette facture a déjà été enregistrée", facturaNum:"Entrez le numéro de facture",
    },
    login: {
      login:"Connexion", register:"S'inscrire", logout:"Déconnexion",
      email:"ADRESSE COURRIEL", pin:"NIP (4 chiffres)", nombre:"PRÉNOM", apellido:"NOM", tel:"TÉLÉPHONE", sucursal:"SUCCURSALE",
      btnLogin:"Entrer", btnRegister:"Créer un compte", btnLogout:"Se déconnecter",
      forgotPin:"Mot de passe oublié ?", backLogin:"← Retour à la connexion",
      noAccount:"Pas encore de compte ?", hasAccount:"Déjà un compte ?",
    },
    invoice: { approuved:"Approuvée", rejected:"Rejetée", pending:"En attente", withProduct:"✅ Produit éligible", noProduct:"⚠️ Sans produit éligible" },
  },
};

// GROUPS
const GROUPS = {
  A: ["México","Corea del Sur","Sudáfrica","Dinamarca*"],
  B: ["Canadá","Suiza","Catar","Italia*"],
  C: ["Brasil","Haití","Marruecos","Escocia"],
  D: ["Estados Unidos","Australia","Paraguay","Turquía*"],
  E: ["Alemania","Costa de Marfil","Ecuador","Curazao"],
  F: ["Países Bajos","Japón","Túnez","Ucrania*"],
  G: ["Bélgica","Irán","Egipto","Nueva Zelanda"],
  H: ["España","Arabia Saudí","Uruguay","Cabo Verde"],
  I: ["Francia","Noruega","Senegal","Irak*"],
  J: ["Argentina","Austria","Argelia","Jordania"],
  K: ["Portugal","Uzbekistán","Colombia","Jamaica*"],
  L: ["Inglaterra","Croacia","Ghana","Panamá"],
}

const GROUP_COLORS = {
  A:"#e63946", B:"#2a9d8f", C:"#e76f51", D:"#457b9d",
  E:"#6a4c93", F:"#f4a261", G:"#2d6a4f", H:"#e9c46a",
  I:"#1d3557", J:"#c77dff", K:"#06d6a0", L:"#ef476f",
};

const LOCK_DATES = {
  groups:  new Date("2026-06-10T00:00:00"),
  round32: new Date("2026-06-28T00:00:00"),
  round16: new Date("2026-07-04T00:00:00"),
  quarters:new Date("2026-07-09T00:00:00"),
  semis:   new Date("2026-07-14T00:00:00"),
  third:   new Date("2026-07-18T00:00:00"),
  final:   new Date("2026-07-19T00:00:00"),
};

// INVOICE POINTS SCALE (CAD)
function calcInvoicePoints(amount) {
  const a = parseFloat(amount);
  if (isNaN(a) || a < 10) return 0;
  if (a <= 50)  return 1;
  if (a <= 100) return 3;
  if (a <= 150) return 6;
  if (a <= 200) return 9;
  return 12;
}

function isPhaseLocked(phase, adminUnlocked = {}) {
  if (adminUnlocked[phase+"_forced"]) return true;
  if (adminUnlocked[phase]) return false;
  const lockDate = LOCK_DATES[phase];
  if (!lockDate) return false;
  return new Date() >= lockDate;
}

function isMatchLocked(match, adminUnlocked = {}) {
  if (!match) return false;
  // Groups: locked globally on June 10
  if (match.phase === "groups") {
    if (adminUnlocked["groups"]) return false;
    if (adminUnlocked["groups_forced"]) return true;
    return new Date() >= LOCK_DATES["groups"];
  }
  // Elimination: check per-match manual lock first, then auto 24h before lockTime
  if (adminUnlocked["match_"+match.id]) return false;       // manually unlocked
  if (adminUnlocked["match_"+match.id+"_forced"]) return true; // manually locked
  if (adminUnlocked[match.phase]) return false;
  if (adminUnlocked[match.phase+"_forced"]) return true;
  if (match.lockTime) return new Date() >= new Date(new Date(match.lockTime).getTime() - 24*60*60*1000);
  return isPhaseLocked(match.phase, adminUnlocked);
}

function generateGroupMatches() {
  // Official FIFA 2026 schedule - all 72 group matches
  const matches = [
    // GRUPO A
    {id:1,  phase:"groups",group:"A",date:"11 Jun",home:"México",            away:"Sudáfrica",         realHome:null,realAway:null,lockTime:"2026-06-11T15:00:00"},
    {id:2,  phase:"groups",group:"A",date:"11 Jun",home:"Corea del Sur",     away:"Dinamarca*",        realHome:null,realAway:null,lockTime:"2026-06-11T18:00:00"},
    {id:3,  phase:"groups",group:"A",date:"18 Jun",home:"Dinamarca*",        away:"Sudáfrica",         realHome:null,realAway:null,lockTime:"2026-06-18T15:00:00"},
    {id:4,  phase:"groups",group:"A",date:"18 Jun",home:"México",            away:"Corea del Sur",     realHome:null,realAway:null,lockTime:"2026-06-18T18:00:00"},
    {id:5,  phase:"groups",group:"A",date:"24 Jun",home:"Dinamarca*",        away:"México",            realHome:null,realAway:null,lockTime:"2026-06-24T15:00:00"},
    {id:6,  phase:"groups",group:"A",date:"24 Jun",home:"Sudáfrica",         away:"Corea del Sur",     realHome:null,realAway:null,lockTime:"2026-06-24T15:00:00"},
    // GRUPO B
    {id:7,  phase:"groups",group:"B",date:"12 Jun",home:"Canadá",            away:"Italia*",           realHome:null,realAway:null,lockTime:"2026-06-12T15:00:00"},
    {id:8,  phase:"groups",group:"B",date:"13 Jun",home:"Catar",             away:"Suiza",             realHome:null,realAway:null,lockTime:"2026-06-13T15:00:00"},
    {id:9,  phase:"groups",group:"B",date:"18 Jun",home:"Suiza",             away:"Italia*",           realHome:null,realAway:null,lockTime:"2026-06-18T12:00:00"},
    {id:10, phase:"groups",group:"B",date:"18 Jun",home:"Canadá",            away:"Catar",             realHome:null,realAway:null,lockTime:"2026-06-18T21:00:00"},
    {id:11, phase:"groups",group:"B",date:"24 Jun",home:"Suiza",             away:"Canadá",            realHome:null,realAway:null,lockTime:"2026-06-24T18:00:00"},
    {id:12, phase:"groups",group:"B",date:"24 Jun",home:"Italia*",           away:"Catar",             realHome:null,realAway:null,lockTime:"2026-06-24T18:00:00"},
    // GRUPO C
    {id:13, phase:"groups",group:"C",date:"13 Jun",home:"Brasil",            away:"Marruecos",         realHome:null,realAway:null,lockTime:"2026-06-13T18:00:00"},
    {id:14, phase:"groups",group:"C",date:"13 Jun",home:"Haití",             away:"Escocia",           realHome:null,realAway:null,lockTime:"2026-06-13T21:00:00"},
    {id:15, phase:"groups",group:"C",date:"19 Jun",home:"Escocia",           away:"Marruecos",         realHome:null,realAway:null,lockTime:"2026-06-19T15:00:00"},
    {id:16, phase:"groups",group:"C",date:"19 Jun",home:"Brasil",            away:"Haití",             realHome:null,realAway:null,lockTime:"2026-06-19T18:00:00"},
    {id:17, phase:"groups",group:"C",date:"24 Jun",home:"Brasil",            away:"Escocia",           realHome:null,realAway:null,lockTime:"2026-06-25T15:00:00"},
    {id:18, phase:"groups",group:"C",date:"24 Jun",home:"Marruecos",         away:"Haití",             realHome:null,realAway:null,lockTime:"2026-06-25T15:00:00"},
    // GRUPO D
    {id:19, phase:"groups",group:"D",date:"12 Jun",home:"Estados Unidos",    away:"Paraguay",          realHome:null,realAway:null,lockTime:"2026-06-12T18:00:00"},
    {id:20, phase:"groups",group:"D",date:"12 Jun",home:"Australia",         away:"Turquía*",          realHome:null,realAway:null,lockTime:"2026-06-12T21:00:00"},
    {id:21, phase:"groups",group:"D",date:"18 Jun",home:"Turquía*",          away:"Paraguay",          realHome:null,realAway:null,lockTime:"2026-06-18T18:00:00"},
    {id:22, phase:"groups",group:"D",date:"19 Jun",home:"Estados Unidos",    away:"Australia",         realHome:null,realAway:null,lockTime:"2026-06-19T21:00:00"},
    {id:23, phase:"groups",group:"D",date:"25 Jun",home:"Turquía*",          away:"Estados Unidos",    realHome:null,realAway:null,lockTime:"2026-06-25T18:00:00"},
    {id:24, phase:"groups",group:"D",date:"25 Jun",home:"Paraguay",          away:"Australia",         realHome:null,realAway:null,lockTime:"2026-06-25T18:00:00"},
    // GRUPO E
    {id:25, phase:"groups",group:"E",date:"14 Jun",home:"Alemania",          away:"Curazao",           realHome:null,realAway:null,lockTime:"2026-06-14T15:00:00"},
    {id:26, phase:"groups",group:"E",date:"14 Jun",home:"Costa de Marfil",   away:"Ecuador",           realHome:null,realAway:null,lockTime:"2026-06-14T18:00:00"},
    {id:27, phase:"groups",group:"E",date:"20 Jun",home:"Alemania",          away:"Costa de Marfil",   realHome:null,realAway:null,lockTime:"2026-06-20T15:00:00"},
    {id:28, phase:"groups",group:"E",date:"20 Jun",home:"Ecuador",           away:"Curazao",           realHome:null,realAway:null,lockTime:"2026-06-20T18:00:00"},
    {id:29, phase:"groups",group:"E",date:"25 Jun",home:"Curazao",           away:"Costa de Marfil",   realHome:null,realAway:null,lockTime:"2026-06-26T15:00:00"},
    {id:30, phase:"groups",group:"E",date:"25 Jun",home:"Ecuador",           away:"Alemania",          realHome:null,realAway:null,lockTime:"2026-06-26T15:00:00"},
    // GRUPO F
    {id:31, phase:"groups",group:"F",date:"14 Jun",home:"Países Bajos",      away:"Japón",             realHome:null,realAway:null,lockTime:"2026-06-15T15:00:00"},
    {id:32, phase:"groups",group:"F",date:"14 Jun",home:"Ucrania*",          away:"Túnez",             realHome:null,realAway:null,lockTime:"2026-06-15T18:00:00"},
    {id:33, phase:"groups",group:"F",date:"19 Jun",home:"Túnez",             away:"Japón",             realHome:null,realAway:null,lockTime:"2026-06-20T21:00:00"},
    {id:34, phase:"groups",group:"F",date:"20 Jun",home:"Países Bajos",      away:"Ucrania*",          realHome:null,realAway:null,lockTime:"2026-06-21T15:00:00"},
    {id:35, phase:"groups",group:"F",date:"25 Jun",home:"Japón",             away:"Ucrania*",          realHome:null,realAway:null,lockTime:"2026-06-26T18:00:00"},
    {id:36, phase:"groups",group:"F",date:"25 Jun",home:"Túnez",             away:"Países Bajos",      realHome:null,realAway:null,lockTime:"2026-06-26T18:00:00"},
    // GRUPO G
    {id:37, phase:"groups",group:"G",date:"15 Jun",home:"Bélgica",           away:"Egipto",            realHome:null,realAway:null,lockTime:"2026-06-15T21:00:00"},
    {id:38, phase:"groups",group:"G",date:"15 Jun",home:"Irán",              away:"Nueva Zelanda",     realHome:null,realAway:null,lockTime:"2026-06-16T15:00:00"},
    {id:39, phase:"groups",group:"G",date:"21 Jun",home:"Bélgica",           away:"Irán",              realHome:null,realAway:null,lockTime:"2026-06-21T18:00:00"},
    {id:40, phase:"groups",group:"G",date:"21 Jun",home:"Nueva Zelanda",     away:"Egipto",            realHome:null,realAway:null,lockTime:"2026-06-21T21:00:00"},
    {id:41, phase:"groups",group:"G",date:"26 Jun",home:"Egipto",            away:"Irán",              realHome:null,realAway:null,lockTime:"2026-06-26T21:00:00"},
    {id:42, phase:"groups",group:"G",date:"26 Jun",home:"Nueva Zelanda",     away:"Bélgica",           realHome:null,realAway:null,lockTime:"2026-06-26T21:00:00"},
    // GRUPO H
    {id:43, phase:"groups",group:"H",date:"15 Jun",home:"España",            away:"Cabo Verde",        realHome:null,realAway:null,lockTime:"2026-06-16T18:00:00"},
    {id:44, phase:"groups",group:"H",date:"15 Jun",home:"Arabia Saudí",      away:"Uruguay",           realHome:null,realAway:null,lockTime:"2026-06-16T21:00:00"},
    {id:45, phase:"groups",group:"H",date:"21 Jun",home:"España",            away:"Arabia Saudí",      realHome:null,realAway:null,lockTime:"2026-06-22T15:00:00"},
    {id:46, phase:"groups",group:"H",date:"21 Jun",home:"Uruguay",           away:"Cabo Verde",        realHome:null,realAway:null,lockTime:"2026-06-22T18:00:00"},
    {id:47, phase:"groups",group:"H",date:"26 Jun",home:"Cabo Verde",        away:"Arabia Saudí",      realHome:null,realAway:null,lockTime:"2026-06-27T15:00:00"},
    {id:48, phase:"groups",group:"H",date:"26 Jun",home:"Uruguay",           away:"España",            realHome:null,realAway:null,lockTime:"2026-06-27T15:00:00"},
    // GRUPO I
    {id:49, phase:"groups",group:"I",date:"16 Jun",home:"Francia",           away:"Senegal",           realHome:null,realAway:null,lockTime:"2026-06-17T15:00:00"},
    {id:50, phase:"groups",group:"I",date:"16 Jun",home:"Irak*",             away:"Noruega",           realHome:null,realAway:null,lockTime:"2026-06-17T18:00:00"},
    {id:51, phase:"groups",group:"I",date:"22 Jun",home:"Francia",           away:"Irak*",             realHome:null,realAway:null,lockTime:"2026-06-22T21:00:00"},
    {id:52, phase:"groups",group:"I",date:"22 Jun",home:"Noruega",           away:"Senegal",           realHome:null,realAway:null,lockTime:"2026-06-23T15:00:00"},
    {id:53, phase:"groups",group:"I",date:"26 Jun",home:"Noruega",           away:"Francia",           realHome:null,realAway:null,lockTime:"2026-06-27T18:00:00"},
    {id:54, phase:"groups",group:"I",date:"26 Jun",home:"Senegal",           away:"Irak*",             realHome:null,realAway:null,lockTime:"2026-06-27T18:00:00"},
    // GRUPO J
    {id:55, phase:"groups",group:"J",date:"15 Jun",home:"Austria",           away:"Jordania",          realHome:null,realAway:null,lockTime:"2026-06-17T21:00:00"},
    {id:56, phase:"groups",group:"J",date:"16 Jun",home:"Argentina",         away:"Argelia",           realHome:null,realAway:null,lockTime:"2026-06-18T15:00:00"},
    {id:57, phase:"groups",group:"J",date:"22 Jun",home:"Argentina",         away:"Austria",           realHome:null,realAway:null,lockTime:"2026-06-23T18:00:00"},
    {id:58, phase:"groups",group:"J",date:"22 Jun",home:"Jordania",          away:"Argelia",           realHome:null,realAway:null,lockTime:"2026-06-23T21:00:00"},
    {id:59, phase:"groups",group:"J",date:"27 Jun",home:"Argelia",           away:"Austria",           realHome:null,realAway:null,lockTime:"2026-06-27T21:00:00"},
    {id:60, phase:"groups",group:"J",date:"27 Jun",home:"Jordania",          away:"Argentina",         realHome:null,realAway:null,lockTime:"2026-06-27T21:00:00"},
    // GRUPO K
    {id:61, phase:"groups",group:"K",date:"17 Jun",home:"Portugal",          away:"Jamaica*",          realHome:null,realAway:null,lockTime:"2026-06-17T12:00:00"},
    {id:62, phase:"groups",group:"K",date:"17 Jun",home:"Uzbekistán",        away:"Colombia",          realHome:null,realAway:null,lockTime:"2026-06-17T21:00:00"},
    {id:63, phase:"groups",group:"K",date:"23 Jun",home:"Portugal",          away:"Uzbekistán",        realHome:null,realAway:null,lockTime:"2026-06-23T12:00:00"},
    {id:64, phase:"groups",group:"K",date:"23 Jun",home:"Colombia",          away:"Jamaica*",          realHome:null,realAway:null,lockTime:"2026-06-23T18:00:00"},
    {id:65, phase:"groups",group:"K",date:"27 Jun",home:"Colombia",          away:"Portugal",          realHome:null,realAway:null,lockTime:"2026-06-28T12:00:00"},
    {id:66, phase:"groups",group:"K",date:"27 Jun",home:"Jamaica*",          away:"Uzbekistán",        realHome:null,realAway:null,lockTime:"2026-06-28T12:00:00"},
    // GRUPO L
    {id:67, phase:"groups",group:"L",date:"17 Jun",home:"Inglaterra",        away:"Croacia",           realHome:null,realAway:null,lockTime:"2026-06-17T15:00:00"},
    {id:68, phase:"groups",group:"L",date:"17 Jun",home:"Ghana",             away:"Panamá",            realHome:null,realAway:null,lockTime:"2026-06-17T18:00:00"},
    {id:69, phase:"groups",group:"L",date:"23 Jun",home:"Inglaterra",        away:"Ghana",             realHome:null,realAway:null,lockTime:"2026-06-23T15:00:00"},
    {id:70, phase:"groups",group:"L",date:"23 Jun",home:"Panamá",            away:"Croacia",           realHome:null,realAway:null,lockTime:"2026-06-23T21:00:00"},
    {id:71, phase:"groups",group:"L",date:"27 Jun",home:"Panamá",            away:"Inglaterra",        realHome:null,realAway:null,lockTime:"2026-06-28T15:00:00"},
    {id:72, phase:"groups",group:"L",date:"27 Jun",home:"Croacia",           away:"Ghana",             realHome:null,realAway:null,lockTime:"2026-06-28T15:00:00"},
  ];
  return matches;
}

function generateElimMatches() {
  // Official FIFA 2026 playoff bracket
  // * = pending UEFA/IC playoff confirmation
  return [
    // ── DIECISEISAVOS (Ronda de 32) ─────────────────────────────────────
    {id:1001,phase:"round32",label:"Ronda de 32",matchNum:1, date:"28 Jun",desc:"2º Grupo A vs 2º Grupo B",        home:"2º Grupo A",    away:"2º Grupo B",    realHome:null,realAway:null},
    {id:1002,phase:"round32",label:"Ronda de 32",matchNum:2, date:"29 Jun",desc:"1º Grupo E vs 3º A/B/C/D/F",     home:"1º Grupo E",    away:"3º A/B/C/D/F",  realHome:null,realAway:null},
    {id:1003,phase:"round32",label:"Ronda de 32",matchNum:3, date:"29 Jun",desc:"1º Grupo F vs 2º Grupo C",       home:"1º Grupo F",    away:"2º Grupo C",    realHome:null,realAway:null},
    {id:1004,phase:"round32",label:"Ronda de 32",matchNum:4, date:"29 Jun",desc:"1º Grupo C vs 2º Grupo F",       home:"1º Grupo C",    away:"2º Grupo F",    realHome:null,realAway:null},
    {id:1005,phase:"round32",label:"Ronda de 32",matchNum:5, date:"30 Jun",desc:"1º Grupo I vs 3º C/D/F/G/H",     home:"1º Grupo I",    away:"3º C/D/F/G/H",  realHome:null,realAway:null},
    {id:1006,phase:"round32",label:"Ronda de 32",matchNum:6, date:"30 Jun",desc:"2º Grupo E vs 2º Grupo I",       home:"2º Grupo E",    away:"2º Grupo I",    realHome:null,realAway:null},
    {id:1007,phase:"round32",label:"Ronda de 32",matchNum:7, date:"30 Jun",desc:"1º Grupo A vs 3º C/E/F/H/I",     home:"1º Grupo A",    away:"3º C/E/F/H/I",  realHome:null,realAway:null},
    {id:1008,phase:"round32",label:"Ronda de 32",matchNum:8, date:"1 Jul", desc:"1º Grupo L vs 3º E/H/I/J/K",     home:"1º Grupo L",    away:"3º E/H/I/J/K",  realHome:null,realAway:null},
    {id:1009,phase:"round32",label:"Ronda de 32",matchNum:9, date:"1 Jul", desc:"1º Grupo D vs 3º B/E/F/I/J",     home:"1º Grupo D",    away:"3º B/E/F/I/J",  realHome:null,realAway:null},
    {id:1010,phase:"round32",label:"Ronda de 32",matchNum:10,date:"1 Jul", desc:"1º Grupo G vs 3º A/E/H/I/J",     home:"1º Grupo G",    away:"3º A/E/H/I/J",  realHome:null,realAway:null},
    {id:1011,phase:"round32",label:"Ronda de 32",matchNum:11,date:"2 Jul", desc:"2º Grupo K vs 2º Grupo L",       home:"2º Grupo K",    away:"2º Grupo L",    realHome:null,realAway:null},
    {id:1012,phase:"round32",label:"Ronda de 32",matchNum:12,date:"2 Jul", desc:"1º Grupo H vs 2º Grupo J",       home:"1º Grupo H",    away:"2º Grupo J",    realHome:null,realAway:null},
    {id:1013,phase:"round32",label:"Ronda de 32",matchNum:13,date:"2 Jul", desc:"1º Grupo B vs 3º E/F/G/I/J",     home:"1º Grupo B",    away:"3º E/F/G/I/J",  realHome:null,realAway:null},
    {id:1014,phase:"round32",label:"Ronda de 32",matchNum:14,date:"2 Jul", desc:"1º Grupo J vs 2º Grupo H",       home:"1º Grupo J",    away:"2º Grupo H",    realHome:null,realAway:null},
    {id:1015,phase:"round32",label:"Ronda de 32",matchNum:15,date:"3 Jul", desc:"1º Grupo K vs 3º D/E/I/J/L",     home:"1º Grupo K",    away:"3º D/E/I/J/L",  realHome:null,realAway:null},
    {id:1016,phase:"round32",label:"Ronda de 32",matchNum:16,date:"3 Jul", desc:"2º Grupo D vs 2º Grupo G",       home:"2º Grupo D",    away:"2º Grupo G",    realHome:null,realAway:null},
    // ── OCTAVOS (Ronda de 16) ────────────────────────────────────────────
    {id:1017,phase:"round16",label:"Octavos de Final",matchNum:1,date:"4 Jul",desc:"Gan. P74 vs Gan. P77",  home:"Gan. P74",away:"Gan. P77",realHome:null,realAway:null},
    {id:1018,phase:"round16",label:"Octavos de Final",matchNum:2,date:"4 Jul",desc:"Gan. P73 vs Gan. P75",  home:"Gan. P73",away:"Gan. P75",realHome:null,realAway:null},
    {id:1019,phase:"round16",label:"Octavos de Final",matchNum:3,date:"5 Jul",desc:"Gan. P76 vs Gan. P78",  home:"Gan. P76",away:"Gan. P78",realHome:null,realAway:null},
    {id:1020,phase:"round16",label:"Octavos de Final",matchNum:4,date:"5 Jul",desc:"Gan. P79 vs Gan. P80",  home:"Gan. P79",away:"Gan. P80",realHome:null,realAway:null},
    {id:1021,phase:"round16",label:"Octavos de Final",matchNum:5,date:"6 Jul",desc:"Gan. P83 vs Gan. P84",  home:"Gan. P83",away:"Gan. P84",realHome:null,realAway:null},
    {id:1022,phase:"round16",label:"Octavos de Final",matchNum:6,date:"6 Jul",desc:"Gan. P81 vs Gan. P82",  home:"Gan. P81",away:"Gan. P82",realHome:null,realAway:null},
    {id:1023,phase:"round16",label:"Octavos de Final",matchNum:7,date:"7 Jul",desc:"Gan. P86 vs Gan. P88",  home:"Gan. P86",away:"Gan. P88",realHome:null,realAway:null},
    {id:1024,phase:"round16",label:"Octavos de Final",matchNum:8,date:"7 Jul",desc:"Gan. P85 vs Gan. P87",  home:"Gan. P85",away:"Gan. P87",realHome:null,realAway:null},
    // ── CUARTOS DE FINAL ────────────────────────────────────────────────
    {id:1025,phase:"quarters",label:"Cuartos de Final",matchNum:1,date:"9 Jul", desc:"Gan. P89 vs Gan. P90",home:"Gan. P89",away:"Gan. P90",realHome:null,realAway:null},
    {id:1026,phase:"quarters",label:"Cuartos de Final",matchNum:2,date:"10 Jul",desc:"Gan. P93 vs Gan. P94",home:"Gan. P93",away:"Gan. P94",realHome:null,realAway:null},
    {id:1027,phase:"quarters",label:"Cuartos de Final",matchNum:3,date:"11 Jul",desc:"Gan. P91 vs Gan. P92",home:"Gan. P91",away:"Gan. P92",realHome:null,realAway:null},
    {id:1028,phase:"quarters",label:"Cuartos de Final",matchNum:4,date:"11 Jul",desc:"Gan. P95 vs Gan. P96",home:"Gan. P95",away:"Gan. P96",realHome:null,realAway:null},
    // ── SEMIFINALES ─────────────────────────────────────────────────────
    {id:1029,phase:"semis",label:"Semifinales",matchNum:1,date:"14 Jul",desc:"Gan. P97 vs Gan. P98",  home:"Gan. CF-1",away:"Gan. CF-2",realHome:null,realAway:null},
    {id:1030,phase:"semis",label:"Semifinales",matchNum:2,date:"15 Jul",desc:"Gan. P99 vs Gan. P100", home:"Gan. CF-3",away:"Gan. CF-4",realHome:null,realAway:null},
    // ── TERCER LUGAR ────────────────────────────────────────────────────
    {id:1031,phase:"third",label:"Tercer Lugar",matchNum:1,date:"18 Jul",desc:"Per. SF1 vs Per. SF2", home:"Per. SF-1",away:"Per. SF-2",realHome:null,realAway:null},
    // ── GRAN FINAL ──────────────────────────────────────────────────────
    {id:1032,phase:"final",label:"Gran Final",matchNum:1,date:"19 Jul",desc:"Gan. SF1 vs Gan. SF2",  home:"Gan. SF-1",away:"Gan. SF-2",realHome:null,realAway:null},
  ];
}

const INITIAL_MATCHES = [...generateGroupMatches(), ...generateElimMatches()];

// SCORING
function calcPoints(predH, predA, realH, realA) {
  if (realH===null||realA===null||predH===null||predA===null) return null;
  const ph=Number(predH),pa=Number(predA),rh=Number(realH),ra=Number(realA);
  if (isNaN(ph)||isNaN(pa)||isNaN(rh)||isNaN(ra)) return null;
  if (ph===rh&&pa===ra) return 5;
  const pw=ph>pa?"H":ph<pa?"A":"D";
  const rw=rh>ra?"H":rh<ra?"A":"D";
  if (pw===rw) return 3;
  return 0;
}

// Calculate group standings from a set of match results (either real or predicted)
function calcGroupStandings(groupName, allMatches, getScore) {
  const teams = GROUPS[groupName];
  const standings = {};
  teams.forEach(t => { standings[t] = {team:t, pts:0, gf:0, ga:0, gd:0, played:0}; });

  allMatches.filter(m => m.phase==="groups" && m.group===groupName).forEach(m => {
    const score = getScore(m);
    if (!score) return;
    const {h, a} = score;
    if (h===null||a===null||isNaN(h)||isNaN(a)) return;
    if (!standings[m.home]||!standings[m.away]) return;
    standings[m.home].played++; standings[m.away].played++;
    standings[m.home].gf+=h; standings[m.home].ga+=a;
    standings[m.away].gf+=a; standings[m.away].ga+=h;
    standings[m.home].gd+=h-a; standings[m.away].gd+=a-h;
    if (h>a) { standings[m.home].pts+=3; }
    else if (h<a) { standings[m.away].pts+=3; }
    else { standings[m.home].pts+=1; standings[m.away].pts+=1; }
  });

  return Object.values(standings)
    .sort((a,b) => b.pts-a.pts || b.gd-a.gd || b.gf-a.gf);
}

// Get top 2 + best 3rd for each group
function calcAllClassified(allMatches, getScore) {
  const result = { byGroup:{}, thirdPlaces:[] };
  Object.keys(GROUPS).forEach(grp => {
    const standings = calcGroupStandings(grp, allMatches, getScore);
    // Only count if group has enough played matches
    const played = standings.filter(s=>s.played>0);
    if (played.length < 2) return;
    result.byGroup[grp] = standings;
    if (standings[0]?.played>0) result.byGroup[grp+"_1st"] = standings[0].team;
    if (standings[1]?.played>0) result.byGroup[grp+"_2nd"] = standings[1].team;
    if (standings[2]?.played>0) result.thirdPlaces.push({...standings[2], group:grp});
  });
  // Best 8 third places
  result.top8thirds = result.thirdPlaces
    .sort((a,b) => b.pts-a.pts || b.gd-a.gd || b.gf-a.gf)
    .slice(0,8)
    .map(t=>t.team);
  return result;
}

// Calculate bonus points for classification predictions
function calcClassificationBonus(predictions, allMatches) {
  // Check if real results have enough data
  const realGroupMatches = allMatches.filter(m=>m.phase==="groups"&&m.realHome!==null);
  if (realGroupMatches.length === 0) return {bonus:0, details:[]};

  // Real classified
  const realClassified = calcAllClassified(allMatches, m=>({h:m.realHome, a:m.realAway}));

  // Predicted classified (from participant's predictions)
  const predClassified = calcAllClassified(allMatches, m=>{
    const pred = predictions?.[m.id];
    if (!pred||pred.home===null||pred.away===null) return null;
    return {h:Number(pred.home), a:Number(pred.away)};
  });

  let bonus = 0;
  const details = [];

  // Check 1st and 2nd place for each group
  Object.keys(GROUPS).forEach(grp => {
    ["1st","2nd"].forEach(pos => {
      const key = grp+"_"+pos;
      const real = realClassified.byGroup[key];
      const pred = predClassified.byGroup[key];
      if (!real||!pred) return;
      if (pred===real) {
        bonus+=10;
        details.push({type:"group_pos", grp, pos, team:real, pts:10, msg:"Acerto "+pos+" del Grupo "+grp+": "+real+" (10pts)"});
      } else {
        // Check if predicted team classified but wrong position
        const realGrp = realClassified.byGroup[grp];
        if (realGrp && realGrp.slice(0,2).some(s=>s.team===pred)) {
          bonus+=5;
          details.push({type:"group_team", grp, pos, team:pred, pts:5, msg:"Acerto clasificado Grupo "+grp+": "+pred+" (5pts)"});
        }
      }
    });
  });

  // Check best 8 thirds
  const realTop8 = realClassified.top8thirds;
  const predTop8 = predClassified.top8thirds;
  if (realTop8.length>0 && predTop8.length>0) {
    predTop8.forEach((team,i) => {
      if (realTop8[i]===team) {
        bonus+=10;
        details.push({type:"third_pos", team, pts:10, msg:"Acerto mejor 3ro posicion "+(i+1)+": "+team+" (10pts)"});
      } else if (realTop8.includes(team)) {
        bonus+=5;
        details.push({type:"third_team", team, pts:5, msg:"Acerto mejor 3ro: "+team+" (5pts)"});
      }
    });
  }

  return {bonus, details};
}

function calcParticipantPoints(predictions, matches, invoices) {
  let total=0, exact=0, correct=0;
  matches.forEach(m => {
    const pred=predictions?.[m.id];
    if (!pred) return;
    const pts=calcPoints(pred.home,pred.away,m.realHome,m.realAway);
    if (pts===null) return;
    total+=pts;
    if (pts===5) exact++;
    if (pts>=3) correct++;
  });
  const invPts = (invoices||[])
    .filter(inv=>inv.status==="approved")
    .reduce((sum,inv)=>sum+calcInvoicePoints(inv.amount),0);
  total += invPts;
  return {total, exact, correct, invPts};
}

// BRAND
const BRAND = {
  red: "#d3172e",
  redDark: "#a8101f",
  redLight: "#f5e6e8",
  white: "#ffffff",
  gray50: "#f9fafb",
  gray100: "#f3f4f6",
  gray200: "#e5e7eb",
  gray400: "#9ca3af",
  gray600: "#4b5563",
  gray900: "#111827",
  black: "#0a0a0a",
};

// STYLES
const S = {
  app: {
    minHeight:"100vh",
    background:BRAND.gray50,
    fontFamily:"'Segoe UI', system-ui, sans-serif",
    color:BRAND.gray900,
  },
  header: {
    background:BRAND.white,
    borderBottom:"3px solid "+BRAND.red,
    position:"sticky", top:0, zIndex:100,
    boxShadow:"0 2px 12px rgba(0,0,0,0.08)",
  },
  headerInner: {
    maxWidth:1000, margin:"0 auto",
    display:"flex", alignItems:"center", justifyContent:"space-between",
    padding:"10px 16px", flexWrap:"wrap", gap:8,
  },
  logo: {
    display:"flex", alignItems:"center", gap:10,
  },
  nav: {display:"flex", gap:4, flexWrap:"wrap"},
  navBtn: (active) => ({
    background: active?BRAND.red:"transparent",
    color: active?"#ffffff":"#111827",
    border:"1.5px solid "+(active?BRAND.red:BRAND.gray200),
    borderRadius:6, padding:"6px 14px",
    cursor:"pointer", fontSize:"0.78rem",
    fontWeight:700, letterSpacing:0.5,
    transition:"all .15s",
  }),
  main: {maxWidth:1000, margin:"0 auto", padding:"20px 14px"},
  card: {
    background:BRAND.white,
    border:"1px solid "+BRAND.gray200,
    borderRadius:12, padding:18, marginBottom:14,
    boxShadow:"0 1px 4px rgba(0,0,0,0.05)",
  },
  sectionTitle: {
    fontSize:"0.85rem", fontWeight:800, letterSpacing:2,
    color:BRAND.red, borderBottom:"2px solid "+BRAND.gray100,
    paddingBottom:8, marginBottom:14,
    textTransform:"uppercase",
  },
  input: {
    background:BRAND.gray50, border:"1.5px solid "+BRAND.gray200,
    color:BRAND.gray900, borderRadius:8, padding:"9px 12px",
    fontSize:"0.95rem", width:"100%",
    fontFamily:"inherit", outline:"none",
    boxSizing:"border-box",
    transition:"border .15s",
  },
  scoreInput: {
    background:BRAND.gray50, border:"1.5px solid "+BRAND.gray200,
    color:BRAND.gray900, borderRadius:6, padding:"5px 0",
    fontSize:"1rem", fontWeight:700, width:46,
    textAlign:"center", fontFamily:"inherit", outline:"none",
  },
  btn: (color=BRAND.red, outline=false) => ({
    background: outline?"transparent":color,
    color: outline?color:BRAND.white,
    border:"2px solid "+color,
    borderRadius:8, padding:"8px 18px",
    cursor:"pointer", fontSize:"0.85rem",
    fontWeight:700, fontFamily:"inherit",
    transition:"opacity .15s",
  }),
  matchRow: {
    display:"grid",
    gridTemplateColumns:"1fr 46px 10px 46px 1fr",
    gap:5, alignItems:"center",
    background:BRAND.gray50, border:"1px solid "+BRAND.gray200,
    borderRadius:8, padding:"7px 10px", marginBottom:5,
  },
  badge: (pts) => ({
    display:"inline-block",
    background:pts===5?"#16a34a":pts===3?"#2563eb":pts===0?"#dc2626":BRAND.gray200,
    color:pts===null?BRAND.gray600:"#fff",
    borderRadius:20, padding:"2px 8px",
    fontSize:"0.78rem", fontWeight:700,
    minWidth:26, textAlign:"center",
  }),
  leaderRow: (i) => ({
    background:i===0?"#fff0f2":i===1?"#fafafa":i===2?"#fffbf0":BRAND.white,
    border:"1.5px solid "+(i===0?BRAND.red:i===1?"#9ca3af":i===2?"#d4a017":BRAND.gray200),
    borderRadius:10, padding:"10px 16px",
    display:"flex", alignItems:"center", gap:12,
    marginBottom:7,
  }),
  groupHeader: (color) => ({
    background:color+"15", borderLeft:"4px solid "+color,
    padding:"6px 12px", borderRadius:"0 8px 8px 0",
    marginBottom:7, marginTop:14,
    fontSize:"0.85rem", fontWeight:800,
    letterSpacing:2, color:color,
  }),
  phaseHeader: (color) => ({
    background:color, borderRadius:8,
    padding:"8px 14px", fontSize:"0.85rem",
    fontWeight:800, letterSpacing:2,
    marginBottom:8, marginTop:16,
    color:"#fff",
  }),
  invoiceCard: (status) => ({
    background:BRAND.gray50,
    border:"1px solid "+(status==="approved"?"#16a34a44":status==="rejected"?"#dc262644":BRAND.red+"44"),
    borderRadius:8, padding:"12px 14px", marginBottom:8,
    display:"flex", alignItems:"center", justifyContent:"space-between", gap:10,
    flexWrap:"wrap",
  }),
  statusBadge: (status) => ({
    display:"inline-block",
    background:status==="approved"?"#16a34a":status==="rejected"?"#dc2626":"#d97706",
    color:"#fff", borderRadius:20,
    padding:"3px 10px", fontSize:"0.75rem", fontWeight:700,
  }),
};

const FontStyle = () => (
  <style>{`
    * { box-sizing:border-box; color:inherit; }
    body { color:#111827; background:#f9fafb; }
    input, button, select, textarea { font-family:inherit; }
    input[type=number]::-webkit-inner-spin-button { -webkit-appearance:none; }
    input[type=number] { -moz-appearance:textfield; }
    ::-webkit-scrollbar { width:5px; }
    ::-webkit-scrollbar-thumb { background:#e5e7eb; border-radius:3px; }
    @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
    .fi { animation:fadeIn .3s ease forwards; }
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
    .pulse { animation:pulse 2s infinite; }
    button:hover { opacity:.82; }
    input:focus { border-color:#d3172e !important; box-shadow:0 0 0 3px #d3172e18; }
    button { color:inherit; }
  `}</style>
);

// LEADERBOARD
// REGLAMENTO VIEW
function ReglamentoView() {
  const lang = useLang();

  const T = {
    fr: {
      toggle: "Ver en Español",
      title: "RÈGLEMENT OFFICIEL — CONCOURS MUNDIAL 2026",
      subtitle: "Sabor Latino · mundial26.vercel.app",
      s1: "1. Objectif du concours",
      s1b: "Le Concours Mundial 2026 de Sabor Latino est une compétition de pronostics sportifs dans laquelle les participants prédisent les résultats des matchs de la Coupe du Monde de Football 2026. Le participant ayant le plus grand nombre de points à la fin du tournoi sera déclaré gagnant.",
      s2: "2. Conditions de participation",
      s2intro: "Pour participer de façon valide au concours, TOUTES les conditions suivantes doivent être remplies :",
      s2items: [
        "S'inscrire sur la plateforme officielle (mundial26.vercel.app) avant le 10 juin 2026.",
        "Avoir effectué au moins UN achat de 50,00 $ CAD ou plus chez Sabor Latino.",
        "La facture de 50,00 $ CAD ou plus doit inclure au moins un des produits participants au concours*. La liste sera publiée prochainement.",
        "Si le participant remporte un prix, il doit accepter qu'une photo le montrant en train de recevoir son prix soit publiée sur les réseaux sociaux officiels de Sabor Latino.",
      ],
      s2note1: "⚠️ IMPORTANT : Les achats inférieurs à 50,00 $ CAD génèrent des points supplémentaires, mais NE valident PAS la participation. Si un gagnant ne dispose pas d'une facture de 50,00 $ + incluant un produit participant, son prix ne lui sera pas remis et passera au suivant au classement.",
      s2note2: "* Les produits participants seront publiés prochainement sur les réseaux sociaux de Sabor Latino.",
      s3: "3. Prix",
      s3b: "Les prix seront annoncés prochainement sur les réseaux sociaux et la plateforme du concours.",
      s3items: ["1re place : Prix à annoncer *", "2e place : Prix à annoncer *", "3e place : Prix à annoncer *"],
      s4: "4. Système de points",
      s4a: "4.1  Pronostics de matchs",
      s4aRows: [["Résultat exact (score correct)","5 pts"],["Vainqueur correct (nul, domicile ou extérieur)","3 pts"],["Pronostic incorrect","0 pt"]],
      s4b: "4.2  Équipes qualifiées de la phase de groupes",
      s4bRows: [["Équipe correcte + position exacte (1re ou 2e du groupe)","10 pts"],["Équipe correcte, mauvaise position","5 pts"],["Meilleur 3e : position exacte","10 pts"],["Meilleur 3e : équipe correcte, mauvaise position","5 pts"]],
      s4c: "4.3  Points par factures (CAD $)",
      s4cRows: [["10 $ – 50 $","1 pt"],["51 $ – 100 $","3 pts"],["101 $ – 150 $","6 pts"],["151 $ – 200 $","9 pts"],["201 $ ou plus","12 pts"]],
      s4note: "Les factures doivent être enregistrées sur la plateforme. Seules les factures approuvées par l'administrateur génèrent des points.",
      s5: "5. Enregistrement des factures",
      s5items: [
        "Enregistrer les factures dans la section « Mon Profil » sur la plateforme.",
        "Saisir le numéro de facture et le montant total en dollars canadiens (CAD).",
        "L'administrateur approuvera ou rejettera chaque facture enregistrée.",
        "Une même facture ne peut pas être enregistrée deux fois.",
        "Montant minimum pour obtenir des points : 10,00 $ CAD.",
      ],
      s6: "6. Clôture des pronostics",
      s6items: [
        "Phase de groupes : tous les pronostics doivent être saisis avant le 10 juin 2026 à 00 h 00. Aucune modification acceptée après cette heure.",
        "Phases éliminatoires : chaque match sera verrouillé 24 heures avant son heure de coup d'envoi officielle.",
      ],
      s7: "7. Conditions générales",
      s7items: [
        "Sabor Latino se réserve le droit de modifier, suspendre ou annuler le concours en cas de force majeure.",
        "La décision de l'administrateur sur la validité des factures et pronostics est définitive.",
        "En cas d'égalité : (1) plus de résultats exacts, (2) plus de vainqueurs corrects, (3) score de factures le plus élevé.",
        "En participant, le concurrent accepte toutes les conditions du présent règlement.",
      ],
    },
    es: {
      toggle: "Voir en Français",
      title: "REGLAMENTO OFICIAL — CONCURSO MUNDIAL 2026",
      subtitle: "Sabor Latino · mundial26.vercel.app",
      s1: "1. Objetivo del concurso",
      s1b: "El Concurso Mundial 2026 de Sabor Latino es una competencia de pronósticos deportivos en la que los participantes predicen los resultados de los partidos de la Copa Mundial de Fútbol 2026. El participante con mayor puntaje al finalizar el torneo será declarado ganador.",
      s2: "2. Requisitos de participación",
      s2intro: "Para participar de forma válida en el concurso, se deben cumplir TODOS los siguientes requisitos:",
      s2items: [
        "Registrarse en la plataforma oficial (mundial26.vercel.app) antes del 10 de junio de 2026.",
        "Haber realizado al menos UNA compra de $50.00 CAD o más en Sabor Latino.",
        "La factura de $50.00 CAD o más debe incluir al menos uno de los productos participantes del concurso*. La lista será publicada próximamente.",
        "Si el participante resulta ganador de algún premio, debe permitir que una fotografía recibiendo el premio sea publicada en las redes sociales oficiales de Sabor Latino.",
      ],
      s2note1: "⚠️ IMPORTANTE: Las compras menores de $50.00 CAD generan puntos adicionales, pero NO validan la participación. Si un ganador no cuenta con una factura de $50.00+ que incluya un producto participante, su premio no será entregado y pasará al siguiente clasificado.",
      s2note2: "* Los productos participantes serán publicados próximamente en las redes sociales de Sabor Latino.",
      s3: "3. Premios",
      s3b: "Los premios serán anunciados próximamente en las redes sociales y en la plataforma del concurso.",
      s3items: ["1er lugar: Premio por anunciar *", "2do lugar: Premio por anunciar *", "3er lugar: Premio por anunciar *"],
      s4: "4. Sistema de puntos",
      s4a: "4.1  Pronósticos de partidos",
      s4aRows: [["Resultado exacto (marcador correcto)","5 pts"],["Ganador correcto (empate, local o visitante)","3 pts"],["Pronóstico incorrecto","0 pts"]],
      s4b: "4.2  Clasificados de grupos",
      s4bRows: [["Equipo correcto + posición exacta (1° o 2° del grupo)","10 pts"],["Equipo correcto, posición equivocada","5 pts"],["Mejor tercero: posición exacta","10 pts"],["Mejor tercero: equipo correcto, posición equivocada","5 pts"]],
      s4c: "4.3  Puntos por facturas (CAD $)",
      s4cRows: [["$10 – $50","1 pt"],["$51 – $100","3 pts"],["$101 – $150","6 pts"],["$151 – $200","9 pts"],["$201 o más","12 pts"]],
      s4note: "Las facturas deben registrarse en la plataforma. Solo las facturas aprobadas por el administrador generan puntos.",
      s5: "5. Registro de facturas",
      s5items: [
        "Registrar las facturas en la sección \"Mi Perfil\" dentro de la plataforma.",
        "Ingresar el número de factura y el monto total en dólares canadienses (CAD).",
        "El administrador aprobará o rechazará cada factura registrada.",
        "Una misma factura no puede ser registrada dos veces.",
        "Monto mínimo para obtener puntos: $10.00 CAD.",
      ],
      s6: "6. Cierre de pronósticos",
      s6items: [
        "Fase de grupos: todos los pronósticos deben ingresarse antes del 10 de junio de 2026 a las 00:00. Sin cambios después de esa hora.",
        "Fases eliminatorias: cada partido se bloqueará 24 horas antes de su horario oficial de juego.",
      ],
      s7: "7. Condiciones generales",
      s7items: [
        "Sabor Latino se reserva el derecho de modificar, suspender o cancelar el concurso en caso de fuerza mayor.",
        "La decisión del administrador sobre la validez de facturas y pronósticos es definitiva.",
        "En caso de empate: (1) mayor número de resultados exactos, (2) mayor número de ganadores correctos, (3) mayor puntaje en facturas.",
        "Al participar, el concursante acepta todas las condiciones de este reglamento.",
      ],
    }
  };

  const t = T[lang];

  const Section = ({title, children}) => (
    <div style={{marginBottom:22}}>
      <div style={{fontWeight:800,fontSize:"0.95rem",color:BRAND.red,borderBottom:"2px solid "+BRAND.red,paddingBottom:5,marginBottom:10,letterSpacing:0.5}}>
        {title}
      </div>
      {children}
    </div>
  );

  const BulletItem = ({text}) => (
    <div style={{display:"flex",gap:8,marginBottom:6,alignItems:"flex-start"}}>
      <span style={{color:BRAND.red,fontWeight:800,flexShrink:0,marginTop:1}}>•</span>
      <span style={{fontSize:"0.85rem",color:"#374151",lineHeight:1.6}}>{text}</span>
    </div>
  );

  const Note = ({text}) => (
    <div style={{background:"#fff5f5",border:"1px solid #fca5a5",borderRadius:8,padding:"10px 14px",marginTop:8,marginBottom:8}}>
      <span style={{fontSize:"0.8rem",color:"#991b1b",lineHeight:1.6}}>{text}</span>
    </div>
  );

  const PointsTable = ({rows}) => (
    <div style={{border:"1px solid #e5e7eb",borderRadius:10,overflow:"hidden",marginBottom:8}}>
      {rows.map(([desc,pts],i)=>(
        <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 14px",background:i%2===0?"#fff":"#f9fafb",borderBottom:i<rows.length-1?"1px solid #f3f4f6":"none"}}>
          <span style={{fontSize:"0.83rem",color:"#374151"}}>{desc}</span>
          <span style={{fontWeight:800,color:BRAND.red,fontSize:"0.9rem",flexShrink:0,marginLeft:12}}>{pts}</span>
        </div>
      ))}
    </div>
  );

  return (
    <div className="fi" style={{maxWidth:600,margin:"0 auto"}}>
      {/* Header */}
      <div style={{background:"linear-gradient(135deg,#d3172e,#a01020)",borderRadius:14,padding:"18px 20px",marginBottom:18,textAlign:"center",color:"#fff"}}>
        <div style={{fontSize:"0.7rem",letterSpacing:3,opacity:0.8,marginBottom:6}}>SABOR LATINO</div>
        <div style={{fontSize:"1rem",fontWeight:800,letterSpacing:1,lineHeight:1.3}}>{t.title}</div>
        <div style={{fontSize:"0.72rem",opacity:0.75,marginTop:6}}>{t.subtitle}</div>
      </div>

      {/* Sections */}
      <div style={{background:"#fff",borderRadius:14,border:"1px solid #e5e7eb",padding:"20px 18px"}}>

        <Section title={t.s1}>
          <p style={{fontSize:"0.85rem",color:"#374151",lineHeight:1.7,margin:0}}>{t.s1b}</p>
        </Section>

        <Section title={t.s2}>
          <p style={{fontSize:"0.85rem",color:"#374151",marginBottom:8,fontWeight:600}}>{t.s2intro}</p>
          {t.s2items.map((item,i)=><BulletItem key={i} text={item}/>)}
          <Note text={t.s2note1}/>
          <Note text={t.s2note2}/>
        </Section>

        <Section title={t.s3}>
          <p style={{fontSize:"0.85rem",color:"#374151",marginBottom:8}}>{t.s3b}</p>
          {t.s3items.map((item,i)=><BulletItem key={i} text={item}/>)}
        </Section>

        <Section title={t.s4}>
          <div style={{fontWeight:700,fontSize:"0.82rem",color:"#374151",marginBottom:6,marginTop:4}}>{t.s4a}</div>
          <PointsTable rows={t.s4aRows}/>
          <div style={{fontWeight:700,fontSize:"0.82rem",color:"#374151",marginBottom:6,marginTop:12}}>{t.s4b}</div>
          <PointsTable rows={t.s4bRows}/>
          <div style={{fontWeight:700,fontSize:"0.82rem",color:"#374151",marginBottom:6,marginTop:12}}>{t.s4c}</div>
          <PointsTable rows={t.s4cRows}/>
          <Note text={t.s4note}/>
        </Section>

        <Section title={t.s5}>
          {t.s5items.map((item,i)=><BulletItem key={i} text={item}/>)}
        </Section>

        <Section title={t.s6}>
          {t.s6items.map((item,i)=><BulletItem key={i} text={item}/>)}
        </Section>

        <Section title={t.s7}>
          {t.s7items.map((item,i)=><BulletItem key={i} text={item}/>)}
        </Section>

      </div>
    </div>
  );
}

// Helper: verifica si un participante tiene participación válida
function getParticipationStatus(participantId, invoices) {
  const myInv = (invoices||[]).filter(inv=>inv.participantId===participantId);
  // Válida: $50+ con producto elegible Y aprobada
  if (myInv.find(inv=>parseFloat(inv.amount)>=50 && inv.hasProduct && inv.status==="approved"))
    return "valid";
  // Pendiente: $50+ con producto elegible pero aún pendiente
  if (myInv.find(inv=>parseFloat(inv.amount)>=50 && inv.hasProduct && inv.status==="pending"))
    return "pending";
  // Sin producto: tiene $50+ pero sin marcar producto elegible
  if (myInv.find(inv=>parseFloat(inv.amount)>=50 && !inv.hasProduct))
    return "no_product";
  // Sin factura válida (incluye casos donde fue rechazada)
  return "invalid";
}

function ClasificacionView({ participants, matches, invoices, currentUser }) {
  const lang = useLang(); const tc = T[lang].clasificacion;
  const ranked = [...participants]
    .map(p => {
      const userInvoices = (invoices||[]).filter(inv => inv.participantId === p.id && inv.status === "approved");
      const invPts = userInvoices.reduce((sum, inv) => sum + calcInvoicePoints(inv.amount), 0);
      let gamePts = 0, exact = 0, correct = 0;
      matches.forEach(m => {
        const pred = p.predictions?.[m.id];
        if (!pred) return;
        const pts = calcPoints(pred.home, pred.away, m.realHome, m.realAway);
        if (pts === null) return;
        gamePts += pts;
        if (pts === 5) exact++;
        if (pts >= 3) correct++;
      });
      const {bonus: classPts} = calcClassificationBonus(p.predictions, matches);
      return {...p, total: gamePts + invPts + classPts, gamePts, exact, correct, invPts, classPts};
    })
    .sort((a,b) => b.total - a.total || b.exact - a.exact);

  return (
    <div className="fi">
      {currentUser && (()=>{
        const ps = getParticipationStatus(currentUser.id, invoices);
        if (ps==="valid") return (
          <div style={{background:"#f0fdf4",border:"1px solid #86efac",borderRadius:12,padding:"12px 16px",marginBottom:12,display:"flex",gap:10,alignItems:"center"}}>
            <span style={{fontSize:"1.2rem"}}>✅</span>
            <div style={{fontWeight:700,fontSize:"0.85rem",color:"#166534"}}>{tc.validOk}</div>
          </div>
        );
        if (ps==="pending") return (
          <div style={{background:"#eff6ff",border:"1px solid #93c5fd",borderRadius:12,padding:"12px 16px",marginBottom:12,display:"flex",gap:10,alignItems:"flex-start"}}>
            <span style={{fontSize:"1.2rem",flexShrink:0}}>🕐</span>
            <div>
              <div style={{fontWeight:700,fontSize:"0.85rem",color:"#1e40af",marginBottom:2}}>Factura pendiente de aprobación</div>
              <div style={{fontSize:"0.8rem",color:"#1e40af",lineHeight:1.5}}>{tc.pendingMsg}</div>
            </div>
          </div>
        );
        const msg = ps==="no_product"
          ? tc.noProductMsg
          : tc.invalidMsg;
        return (
          <div style={{background:"#fffbeb",border:"1px solid #f59e0b",borderRadius:12,padding:"12px 16px",marginBottom:12,display:"flex",gap:10,alignItems:"flex-start"}}>
            <span style={{fontSize:"1.2rem",flexShrink:0}}>⚠️</span>
            <div>
              <div style={{fontWeight:700,fontSize:"0.85rem",color:"#92400e",marginBottom:2}}>{tc.invalidTitle}</div>
              <div style={{fontSize:"0.8rem",color:"#92400e",lineHeight:1.5}}>{msg}</div>
            </div>
          </div>
        );
      })()}
      <div style={{...S.card, padding:0, overflow:"hidden"}}>
        <div style={{background:BRAND.red, padding:"12px 18px"}}>
          <div style={{color:"#fff", fontWeight:800, fontSize:"1rem", letterSpacing:1}}>{tc.title} — {ranked.length} {tc.participants}</div>
        </div>
        {ranked.length===0 && (
          <div style={{textAlign:"center", color:"#9ca3af", padding:30}}>Aun no hay participantes</div>
        )}
        {ranked.map((p, i) => (
          <div key={p.id} style={{
            display:"flex", alignItems:"center", gap:12,
            padding:"10px 18px",
            background: i%2===0 ? "#fff" : BRAND.gray50,
            borderBottom:"1px solid "+BRAND.gray100,
          }}>
            <div style={{
              width:32, height:32, borderRadius:"50%",
              background: i===0?BRAND.red:i===1?"#9ca3af":i===2?"#d97706":BRAND.gray100,
              color: i<3?"#fff":BRAND.gray600,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontWeight:800, fontSize:"0.85rem", flexShrink:0,
            }}>{i+1}</div>
            <div style={{flex:1}}>
              <div style={{fontWeight:700, fontSize:"0.95rem", color:BRAND.gray900}}>{p.name}</div>
              <div style={{fontSize:"0.72rem", color:"#9ca3af", marginTop:1}}>
                {p.exact} {tc.exactos} · {p.correct} {tc.acertados}
                {p.invPts > 0 && <span style={{color:BRAND.red}}> · +{p.invPts} {tc.ptsFact}</span>}
                {p.classPts > 0 && <span style={{color:"#7c3aed"}}> · +{p.classPts} {tc.ptsClas}</span>}
              </div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:"1.4rem", fontWeight:800, color: i===0?BRAND.red:BRAND.gray900}}>{p.total}</div>
              <div style={{fontSize:"0.65rem", color:"#9ca3af"}}>PTS</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// INVOICE FORM
function InvoiceForm({ currentUser, invoices, setInvoices }) {
  const lang = useLang(); const tp = T[lang].profile;
  const [invoiceNum, setInvoiceNum] = useState("");
  const [amount, setAmount] = useState("");
  const [hasProduct, setHasProduct] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const myInvoices = invoices.filter(inv=>inv.participantId===currentUser.id);
  const approvedPts = myInvoices.filter(inv=>inv.status==="approved")
    .reduce((sum,inv)=>sum+calcInvoicePoints(inv.amount),0);

  async function handleSubmit() {
    if (!invoiceNum.trim()) { alert(tp.facturaNum); return; }
    if (!amount || parseFloat(amount)<10) { alert(tp.facturaMinima); return; }
    const alreadyExists = invoices.find(inv=>inv.invoiceNum===invoiceNum.trim());
    if (alreadyExists) { alert(tp.facturaRepetida); return; }

    setSaving(true);
    try {
      const newInvoice = {
        id: Date.now(),
        participantId: currentUser.id,
        participantName: currentUser.name,
        invoiceNum: invoiceNum.trim(),
        amount: parseFloat(amount),
        points: calcInvoicePoints(amount),
        hasProduct: hasProduct,
        status: "pending",
        createdAt: new Date().toISOString(),
      };
      const updated = [...invoices, newInvoice];
      await setDoc(INVOICES_DOC, {list: updated});
      setInvoices(updated);
      setInvoiceNum("");
      setAmount("");
      setHasProduct(false);
      setSuccess(true);
      setTimeout(()=>setSuccess(false), 3000);
    } catch(e) {
      alert("Error: "+e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={S.card}>
      <div style={S.sectionTitle}>Registrar Factura</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
        <div>
          <label style={{fontSize:"0.75rem",color:"#d3172e",letterSpacing:2,display:"block",marginBottom:5}}>
            NUMERO DE FACTURA
          </label>
          <input style={S.input} placeholder="Ej: FAC-001234"
            value={invoiceNum} onChange={e=>setInvoiceNum(e.target.value)} />
        </div>
        <div>
          <label style={{fontSize:"0.75rem",color:"#d3172e",letterSpacing:2,display:"block",marginBottom:5}}>
            MONTO (CAD $)
          </label>
          <input style={S.input} type="number" min="10" placeholder="Ej: 150.00"
            value={amount} onChange={e=>setAmount(e.target.value)} />
        </div>
      </div>
      {amount && parseFloat(amount)>=10 && (
        <div style={{background:"#0d2215",border:"1px solid #27ae6044",borderRadius:8,padding:"10px 14px",marginBottom:12,fontSize:"0.85rem"}}>
          {tp.facturaVale} <strong style={{color:"#16a34a",fontSize:"1rem"}}>{calcInvoicePoints(amount)} {tp.puntos}</strong> {tp.siAprobada}
        </div>
      )}

      {/* Producto participante checkbox - solo mostrar si monto >= 50 */}
      {amount && parseFloat(amount)>=50 && (
        <div style={{marginBottom:14}}>
          <label style={{display:"flex",alignItems:"flex-start",gap:10,cursor:"pointer",userSelect:"none"}}>
            <input
              type="checkbox"
              checked={hasProduct}
              onChange={e=>setHasProduct(e.target.checked)}
              style={{marginTop:3,accentColor:"#d3172e",width:16,height:16,flexShrink:0}}
            />
            <span style={{fontSize:"0.83rem",color:"#374151",lineHeight:1.5}}>
              {tp.productoCheck}
            </span>
          </label>
          {!hasProduct && (
            <div style={{marginTop:8,background:"#fffbeb",border:"1px solid #f59e0b",borderRadius:8,padding:"9px 12px",display:"flex",gap:8,alignItems:"flex-start"}}>
              <span style={{fontSize:"1rem",flexShrink:0}}>⚠️</span>
              <span style={{fontSize:"0.78rem",color:"#92400e",lineHeight:1.5}}>
                Sin producto participante, esta factura <strong>no valida tu participación</strong> aunque sea de $50+. Igual genera puntos.
              </span>
            </div>
          )}
          {hasProduct && (
            <div style={{marginTop:8,background:"#f0fdf4",border:"1px solid #86efac",borderRadius:8,padding:"9px 12px",display:"flex",gap:8,alignItems:"center"}}>
              <span style={{fontSize:"1rem"}}>✅</span>
              <span style={{fontSize:"0.78rem",color:"#166534",lineHeight:1.5}}>
                {tp.conProductoMsg}
              </span>
            </div>
          )}
        </div>
      )}

      {success && (
        <div style={{background:"#0d2215",border:"1px solid #27ae60",borderRadius:8,padding:"10px 14px",marginBottom:12,color:"#16a34a",fontSize:"0.85rem",fontWeight:700}}>
          Factura enviada! Pendiente de aprobacion por el administrador.
        </div>
      )}
      <button style={S.btn()} onClick={handleSubmit} disabled={saving}>
        {saving?tp.enviando:tp.enviarFactura}
      </button>

      {myInvoices.length>0 && (
        <div style={{marginTop:20}}>
          <div style={{fontSize:"0.8rem",color:"#d3172e",fontWeight:700,letterSpacing:1,marginBottom:10}}>
            MIS FACTURAS ({myInvoices.length}) — {approvedPts} {tp.ptsAcumulados}
          </div>
          {myInvoices.map(inv=>(
            <div key={inv.id} style={S.invoiceCard(inv.status)}>
              <div>
                <div style={{fontWeight:700,fontSize:"0.9rem"}}>{inv.invoiceNum}</div>
                <div style={{color:"#6b7280",fontSize:"0.78rem",marginTop:2}}>
                  ${inv.amount} CAD &nbsp;|&nbsp; {inv.points} pts potenciales
                </div>
                {inv.amount>=50 && (
                  <div style={{fontSize:"0.72rem",marginTop:3,fontWeight:600,color:inv.hasProduct?"#16a34a":"#f59e0b"}}>
                    {inv.hasProduct?tp.productoIncluido:tp.sinProducto}
                  </div>
                )}
              </div>
              <div style={S.statusBadge(inv.status)}>
                {inv.status==="approved"?tp.aprobada:inv.status==="rejected"?tp.rechazada:tp.pendiente}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


// REUSABLE GROUP TABLE COMPONENT
function GroupTable({ grp, table, hasData, emptyMsg }) {
  const gColor = GROUP_COLORS[grp];
  return (
    <div style={{...{background:"#ffffff",border:"1px solid #e5e7eb",borderRadius:12,padding:0,marginBottom:12},overflow:"hidden"}}>
      <div style={{background:gColor,padding:"7px 14px"}}>
        <span style={{color:"#fff",fontWeight:800,fontSize:"0.82rem",letterSpacing:1}}>GRUPO {grp}</span>
      </div>
      {!hasData ? (
        <div style={{padding:"12px 14px",color:"#9ca3af",fontSize:"0.8rem",textAlign:"center"}}>{emptyMsg}</div>
      ) : (
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:"0.76rem"}}>
            <thead>
              <tr style={{background:"#f9fafb",borderBottom:"2px solid #e5e7eb"}}>
                {["Pos","Equipo","PJ","G","E","P","GF","GC","GD","Pts"].map(h=>(
                  <th key={h} style={{padding:"5px 7px",textAlign:h==="Equipo"?"left":"center",color:"#4b5563",fontWeight:700,whiteSpace:"nowrap"}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.map((s,i)=>{
                const gd=s.gf-s.gc;
                return (
                  <tr key={s.team} style={{borderBottom:"1px solid #f3f4f6",background:i<2?"#f0fdf4":i===2?"#fffbeb":"#fff"}}>
                    <td style={{padding:"6px 7px",textAlign:"center",fontWeight:800,color:i<2?"#d3172e":i===2?"#d97706":"#9ca3af"}}>{i+1}</td>
                    <td style={{padding:"6px 7px",fontWeight:700,color:"#111827",whiteSpace:"nowrap"}}>
                      <span style={{display:"inline-block",width:7,height:7,borderRadius:"50%",background:i<2?"#16a34a":i===2?"#d97706":"#e5e7eb",marginRight:5,verticalAlign:"middle"}}></span>
                      {s.team}
                    </td>
                    <td style={{padding:"6px 7px",textAlign:"center",color:"#4b5563"}}>{s.pj}</td>
                    <td style={{padding:"6px 7px",textAlign:"center",color:"#16a34a",fontWeight:600}}>{s.g}</td>
                    <td style={{padding:"6px 7px",textAlign:"center",color:"#4b5563"}}>{s.e}</td>
                    <td style={{padding:"6px 7px",textAlign:"center",color:"#dc2626"}}>{s.p}</td>
                    <td style={{padding:"6px 7px",textAlign:"center",color:"#4b5563"}}>{s.gf}</td>
                    <td style={{padding:"6px 7px",textAlign:"center",color:"#4b5563"}}>{s.gc}</td>
                    <td style={{padding:"6px 7px",textAlign:"center",fontWeight:700,color:gd>0?"#16a34a":gd<0?"#dc2626":"#4b5563"}}>{gd>0?"+"+gd:gd}</td>
                    <td style={{padding:"6px 7px",textAlign:"center",fontWeight:800,color:"#d3172e"}}>{s.pts}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div style={{padding:"4px 12px",fontSize:"0.68rem",color:"#9ca3af",borderTop:"1px solid #f3f4f6"}}>
            Verde = clasificado · Amarillo = posible mejor 3ro
          </div>
        </div>
      )}
    </div>
  );
}

// PARTICIPANT FORM
const SUCURSALES = ["St-Hubert", "St-Laurent", "Brossard"];


function ProfileTab({ currentUser, setCurrentUser, participants, setParticipants, matches, invoices, setInvoices, preds }) {
  const lang = useLang(); const tp = T[lang].profile;
  const [editMode, setEditMode] = useState(false);
  const [editNombre, setEditNombre] = useState(currentUser.nombre||"");
  const [editApellido, setEditApellido] = useState(currentUser.apellido||"");
  const [editTel, setEditTel] = useState(currentUser.telefono||"");
  const [editPin, setEditPin] = useState("");
  const [editPin2, setEditPin2] = useState("");
  const [editErr, setEditErr] = useState("");
  const [editOk, setEditOk] = useState(false);

  const userInv = (invoices||[]).filter(inv=>inv.participantId===currentUser.id&&inv.status==="approved");
  const invPts = userInv.reduce((sum,inv)=>sum+calcInvoicePoints(inv.amount), 0);
  let gamePts = 0;
  matches.forEach(m=>{const pred=preds[m.id];if(!pred)return;const pts=calcPoints(pred.home,pred.away,m.realHome,m.realAway);if(pts!==null)gamePts+=pts;});
  const {bonus:classPts} = calcClassificationBonus(preds, matches);
  const total = gamePts + invPts + classPts;

  const ranked = [...participants].map(p=>{
    const ui=(invoices||[]).filter(i=>i.participantId===p.id&&i.status==="approved");
    const ip=ui.reduce((s,i)=>s+calcInvoicePoints(i.amount),0);
    let gp=0; matches.forEach(m=>{const pr=p.predictions?.[m.id];if(!pr)return;const pts=calcPoints(pr.home,pr.away,m.realHome,m.realAway);if(pts!==null)gp+=pts;});
    const {bonus:cp}=calcClassificationBonus(p.predictions||{},matches);
    return {...p,_total:gp+ip+cp};
  }).sort((a,b)=>b._total-a._total);
  const pos = ranked.findIndex(p=>p.id===currentUser.id)+1;

  async function saveProfile() {
    setEditErr("");
    if(!editNombre.trim()||!editApellido.trim()){setEditErr("Nombre y apellido requeridos");return;}
    if(editPin&&editPin.length<6){setEditErr("PIN minimo 6 digitos");return;}
    if(editPin&&editPin!==editPin2){setEditErr("Los PINs no coinciden");return;}
    const updated={...currentUser,nombre:editNombre.trim(),apellido:editApellido.trim(),name:editNombre.trim()+" "+editApellido.trim(),telefono:editTel.trim(),...(editPin?{pin:editPin}:{})};
    const newList=[...participants.filter(p=>p.id!==currentUser.id),updated];
    await setDoc(PARTICIPANTS_DOC,{list:newList});
    setParticipants(newList);
    setCurrentUser(updated);
    try{localStorage.setItem("sl_user",JSON.stringify(updated));}catch(e){}
    setEditOk(true);setEditMode(false);setTimeout(()=>setEditOk(false),3000);
  }

  return (
    <div style={{maxWidth:480,margin:"0 auto"}}>
      <div style={{background:"linear-gradient(135deg,#d3172e,#a01020)",borderRadius:16,padding:"24px 20px",marginBottom:16,color:"#fff",textAlign:"center"}}>
        <div style={{width:64,height:64,borderRadius:"50%",background:"rgba(255,255,255,0.2)",margin:"0 auto 12px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.8rem",fontWeight:800}}>
          {(currentUser.nombre||"?")[0].toUpperCase()}
        </div>
        <div style={{fontSize:"1.3rem",fontWeight:800}}>{currentUser.nombre} {currentUser.apellido}</div>
        <div style={{fontSize:"0.85rem",opacity:0.85,marginTop:4}}>{currentUser.email}</div>
        <div style={{fontSize:"0.8rem",opacity:0.75,marginTop:2}}>{currentUser.sucursal}</div>
        <div style={{marginTop:12,display:"flex",justifyContent:"center"}}>
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:"1.8rem",fontWeight:900}}>#{pos}</div>
            <div style={{fontSize:"0.7rem",opacity:0.8}}>POSICIÓN</div>
          </div>
        </div>
      </div>
      <div style={{borderRadius:14,overflow:"hidden",border:"1px solid #e5e7eb",marginBottom:16}}>
        <div style={{background:"linear-gradient(90deg,#d3172e,#a01020)",padding:"14px 20px",textAlign:"center"}}>
          <div style={{fontSize:"0.7rem",color:"rgba(255,255,255,0.8)",letterSpacing:3,fontWeight:700,marginBottom:4}}>TOTAL DE PUNTOS</div>
          <div style={{fontSize:"2.6rem",fontWeight:900,color:"#fff",lineHeight:1}}>{total}</div>
        </div>
        <div style={{background:"#fff",display:"grid",gridTemplateColumns:"1fr 1fr 1fr",padding:"14px 10px"}}>
          {[[tp.pronosticos,gamePts,"#2563eb"],[tp.clasificados,classPts,"#7c3aed"],[tp.facturas,invPts,"#16a34a"]].map(([l,v,c],i,arr)=>(
            <div key={l} style={{textAlign:"center",borderRight:i<arr.length-1?"1px solid #f3f4f6":"none"}}>
              <div style={{fontSize:"1.5rem",fontWeight:800,color:c}}>{v}</div>
              <div style={{fontSize:"0.68rem",color:"#6b7280",marginTop:3}}>{l}</div>
            </div>
          ))}
        </div>
      </div>
      {/* INDICADOR DE PARTICIPACIÓN VÁLIDA */}
      {(()=>{
        const ps = getParticipationStatus(currentUser.id, invoices);
        const cfg = {
          valid:      { icon:"✅", color:"#166534", bg:"#f0fdf4", border:"#86efac", title:tp.validTitle,            msg:tp.validOk },
          pending:    { icon:"🕐", color:"#1e40af", bg:"#eff6ff", border:"#93c5fd", title:tp.pendingTitle,    msg:tp.pendingMsg },
          no_product: { icon:"⚠️", color:"#92400e", bg:"#fffbeb", border:"#f59e0b", title:tp.noProductTitle, msg:tp.noProductMsg },
          invalid:    { icon:"🔴", color:"#991b1b", bg:"#fff5f5", border:"#fca5a5", title:tp.invalidTitle,   msg:tp.invalidMsg },
        }[ps];
        return (
          <div style={{background:cfg.bg,border:"1px solid "+cfg.border,borderRadius:12,padding:"12px 16px",marginBottom:16,display:"flex",gap:10,alignItems:"flex-start"}}>
            <span style={{fontSize:"1.2rem",flexShrink:0}}>{cfg.icon}</span>
            <div>
              <div style={{fontWeight:700,fontSize:"0.85rem",color:cfg.color,marginBottom:3}}>{cfg.title}</div>
              <div style={{fontSize:"0.78rem",color:cfg.color,lineHeight:1.5}}>{cfg.msg}</div>
            </div>
          </div>
        );
      })()}
      {editOk && <div style={{background:"#f0fdf4",border:"1px solid #16a34a",borderRadius:10,padding:"10px 14px",marginBottom:12,color:"#16a34a",fontWeight:600,fontSize:"0.85rem"}}>{tp.perfilActualizado}</div>}
      {!editMode ? (
        <div style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:12,padding:16}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <div style={{fontWeight:700,fontSize:"0.95rem"}}>{tp.misDatos}</div>
            <button style={{...S.btn("#2563eb",true),fontSize:"0.78rem",padding:"5px 12px"}} onClick={()=>setEditMode(true)}>{tp.editarPerfil}</button>
          </div>
          {[[tp.nombre.charAt(0)+tp.nombre.slice(1).toLowerCase(),currentUser.nombre+" "+currentUser.apellido],[tp.email.charAt(0)+tp.email.slice(1).toLowerCase(),currentUser.email],[tp.tel.charAt(0)+tp.tel.slice(1).toLowerCase(),currentUser.telefono||"-"],[tp.sucursal.charAt(0)+tp.sucursal.slice(1).toLowerCase(),currentUser.sucursal||"-"]].map(([l,v])=>(
            <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid #f3f4f6",fontSize:"0.85rem"}}>
              <span style={{color:"#6b7280"}}>{l}</span>
              <span style={{fontWeight:600,color:"#111827"}}>{v}</span>
            </div>
          ))}
        </div>
      ) : (
        <div style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:12,padding:16}}>
          <div style={{fontWeight:700,fontSize:"0.95rem",marginBottom:12}}>{tp.editarPerfil}</div>
          {editErr && <div style={{color:"#e74c3c",fontSize:"0.82rem",marginBottom:8}}>{editErr}</div>}
          {[["Nombre",editNombre,setEditNombre],["Apellido",editApellido,setEditApellido],["Teléfono",editTel,setEditTel]].map(([l,v,sv])=>(
            <div key={l} style={{marginBottom:10}}>
              <label style={{fontSize:"0.75rem",color:BRAND.red,fontWeight:700,display:"block",marginBottom:4}}>{l.toUpperCase()}</label>
              <input style={S.input} value={v} onChange={e=>sv(e.target.value)} />
            </div>
          ))}
          <div style={{marginBottom:10}}>
            <label style={{fontSize:"0.75rem",color:BRAND.red,fontWeight:700,display:"block",marginBottom:4}}>NUEVO PIN (dejar vacío para no cambiar)</label>
            <input style={S.input} type="password" placeholder="Mínimo 6 dígitos" value={editPin} onChange={e=>setEditPin(e.target.value)} />
          </div>
          {editPin && (
            <div style={{marginBottom:10}}>
              <label style={{fontSize:"0.75rem",color:BRAND.red,fontWeight:700,display:"block",marginBottom:4}}>CONFIRMAR NUEVO PIN</label>
              <input style={S.input} type="password" value={editPin2} onChange={e=>setEditPin2(e.target.value)} />
            </div>
          )}
          <div style={{display:"flex",gap:8,marginTop:4}}>
            <button style={{...S.btn("#6b7280",true),flex:1}} onClick={()=>{setEditMode(false);setEditErr("");}}>Cancelar</button>
            <button style={{...S.btn(),flex:1}} onClick={saveProfile}>Guardar</button>
          </div>
        </div>
      )}
      <div style={{marginTop:20}}>
        <InvoiceForm currentUser={currentUser} invoices={invoices} setInvoices={setInvoices} />
      </div>
    </div>
  );
}

function ParticipantForm({ participants, setParticipants, matches, adminUnlocked, invoices, setInvoices, currentUser, setCurrentUser, setView, initialStep }) {
  const lang = useLang(); const tp = T[lang].profile;
  const [step, setStep] = useState(initialStep || (currentUser ? "form" : "login"));
  const [isNew, setIsNew] = useState(false);
  // Login
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPin, setLoginPin] = useState("");
  // Register
  const [regNombre, setRegNombre] = useState("");
  const [regApellido, setRegApellido] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regTel, setRegTel] = useState("");
  const [regSucursal, setRegSucursal] = useState("");
  const [regPin, setRegPin] = useState("");
  const [regPin2, setRegPin2] = useState("");
  const [preds, setPreds] = useState(currentUser?.predictions||{});
  const [activeGroup, setActiveGroup] = useState("A");
  const [activePhase, setActivePhase] = useState("groups");
  const [activePh, setActivePh] = useState("round32");
  const [activeTab, setActiveTab] = useState("pronosticos");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Sync preds if participants reload from Firebase
  useEffect(() => {
    if (currentUser) {
      const fresh = participants.find(p=>p.id===currentUser.id);
      if (fresh) setPreds(fresh.predictions||{});
    }
  }, [participants]);

  const groupMatches = matches.filter(m=>m.phase==="groups");
  const elimMatches = matches.filter(m=>m.phase!=="groups");
  const phases = [...new Set(elimMatches.map(m=>m.phase))];
  const phaseLabels = {round32:"Ronda 32",round16:"Ronda 16",quarters:"Cuartos",semis:"Semis",third:"3er Lugar",final:"Final"};
  const phaseColors = {round32:"#0369a1",round16:"#7c3aed",quarters:"#c0392b",semis:"#e67e22",third:"#2980b9",final:"#d3172e"};

  const groupsLocked = isPhaseLocked("groups", adminUnlocked);

  function getLockMsg(phase) {
    const locked = isPhaseLocked(phase, adminUnlocked);
    if (!locked) {
      const d = LOCK_DATES[phase];
      if (d) {
        const diff = Math.ceil((d-new Date())/(1000*60*60*24));
        if (diff>0) return {locked:false, msg:"Abierto - se bloquea en "+diff+" dia"+(diff!==1?"s":"")};
      }
      return {locked:false, msg:"Abierto"};
    }
    return {locked:true, msg:"Bloqueado"};
  }

  function handleLogin() {
    setError("");
    if (!loginEmail.trim()) { setError("Ingresa tu correo"); return; }
    if (!loginPin.trim()||loginPin.length<4) { setError("PIN minimo 4 digitos"); return; }
    const existing = participants.find(p=>p.email&&p.email.toLowerCase()===loginEmail.trim().toLowerCase());
    if (!existing) { setError("Correo no registrado. Crea una cuenta nueva."); return; }
    if (existing.pin!==loginPin) { setError("PIN incorrecto"); return; }
    setCurrentUser(existing);
    setPreds(existing.predictions||{});
    setStep("form");
    setView?.("predictions");
  }

  async function handleRegister() {
    setError("");
    if (!regNombre.trim()) { setError("Ingresa tu nombre"); return; }
    if (!regApellido.trim()) { setError("Ingresa tu apellido"); return; }
    if (!regEmail.trim()||!regEmail.includes("@")) { setError("Ingresa un correo valido"); return; }
    if (!regTel.trim()) { setError("Ingresa tu telefono"); return; }
    if (!regSucursal) { setError("Selecciona una sucursal"); return; }
    if (!regPin.trim()||regPin.length<6) { setError("PIN minimo 6 digitos"); return; }
    if (regPin!==regPin2) { setError("Los PINs no coinciden"); return; }
    const exists = participants.find(p=>p.email&&p.email.toLowerCase()===regEmail.trim().toLowerCase());
    if (exists) { setError("Este correo ya esta registrado. Inicia sesion."); return; }
    setSaving(true);
    try {
      const newUser = {
        id: Date.now(),
        nombre: regNombre.trim(),
        apellido: regApellido.trim(),
        name: regNombre.trim()+" "+regApellido.trim(),
        email: regEmail.trim().toLowerCase(),
        telefono: regTel.trim(),
        sucursal: regSucursal,
        pin: regPin,
        predictions: {},
        createdAt: new Date().toISOString(),
      };
      const newParticipants = [...participants, newUser];
      await setDoc(PARTICIPANTS_DOC, {list: newParticipants});
      setParticipants(newParticipants);
      setCurrentUser(newUser);
      setPreds({});
      try { localStorage.setItem("sl_user", JSON.stringify(newUser)); } catch(e){}
      setStep("form");
      setView?.("predictions");
    } catch(e) {
      setError("Error al registrar: "+e.message);
    } finally {
      setSaving(false);
    }
  }

  function setPred(matchId, side, val) {
    const v = val===""?null:Math.max(0,parseInt(val)||0);
    setPreds(prev=>({...prev, [matchId]:{...(prev[matchId]||{}), [side]:v}}));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const updatedUser = {...currentUser, predictions:preds};
      const newParticipants = [...participants.filter(p=>p.id!==currentUser.id), updatedUser];
      await setDoc(PARTICIPANTS_DOC, {list: newParticipants});
      setParticipants(newParticipants);
      try { localStorage.setItem("sl_user", JSON.stringify(updatedUser)); } catch(e){}
      setStep("done");
    } catch(e) {
      alert("Error al guardar: "+e.message);
    } finally {
      setSaving(false);
    }
  }

  function renderMatchRow(m, locked=false) {
    const pred = preds[m.id]||{};
    const pts = calcPoints(pred.home, pred.away, m.realHome, m.realAway);
    const lockTime = m.lockTime ? new Date(m.lockTime) : null;
    const now = new Date();
    const minutesLeft = lockTime ? Math.round((lockTime - now) / 60000) : null;
    const closingSoon = minutesLeft !== null && minutesLeft > 0 && minutesLeft <= 60;
    return (
      <div key={m.id} style={{...S.matchRow, opacity:(m.home==="Por definir"||m.home?.startsWith("Gan.")||m.home?.startsWith("Per."))?.55:1}}>
        <div style={{textAlign:"right",fontSize:"0.85rem",fontWeight:600}}>{m.home}</div>
        <input type="number" min="0" max="99" placeholder="-"
          style={{...S.scoreInput, background:locked?"#f9fafb":"#f3f4f6", cursor:locked?"not-allowed":"text"}}
          value={pred.home??""} disabled={locked}
          onChange={e=>!locked&&setPred(m.id,"home",e.target.value)} />
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
          <div style={{textAlign:"center",color:"#9ca3af",fontSize:"0.68rem",fontWeight:700}}>VS</div>
          {locked && <div style={{fontSize:"0.58rem",color:"#e74c3c",fontWeight:700}}>🔒</div>}
          {closingSoon && <div style={{fontSize:"0.58rem",color:"#e67e22",fontWeight:700}}>⏱{minutesLeft}m</div>}
        </div>
        <input type="number" min="0" max="99" placeholder="-"
          style={{...S.scoreInput, background:locked?"#f9fafb":"#f3f4f6", cursor:locked?"not-allowed":"text"}}
          value={pred.away??""} disabled={locked}
          onChange={e=>!locked&&setPred(m.id,"away",e.target.value)} />
        <div style={{textAlign:"left",fontSize:"0.85rem",fontWeight:600}}>{m.away}</div>
        {pts!==null && <div style={{...S.badge(pts),marginLeft:6}}>{pts}pts</div>}
      </div>
    );
  }

  const selectStyle = {...S.input, appearance:"none", WebkitAppearance:"none", cursor:"pointer"};

  if (step==="login") return (
    <div className="fi" style={{maxWidth:460,margin:"0 auto"}}>
      <div style={S.card}>
        <div style={{display:"flex",borderBottom:"2px solid "+BRAND.gray100,marginBottom:20}}>
          {[["login","Ya tengo cuenta"],["register","Registrarme"]].map(([t,l])=>(
            <button key={t} onClick={()=>{setIsNew(t==="register");setError("");}}
              style={{flex:1,padding:"10px",border:"none",background:"transparent",
                fontWeight:700,fontSize:"0.85rem",cursor:"pointer",
                color:(!isNew&&t==="login")||(isNew&&t==="register")?BRAND.red:"#9ca3af",
                borderBottom:"2px solid "+((!isNew&&t==="login")||(isNew&&t==="register")?BRAND.red:"transparent"),
                marginBottom:"-2px",
              }}>{l}</button>
          ))}
        </div>

        {!isNew && (
          <>
            <div style={S.sectionTitle}>Iniciar Sesion</div>
            <div style={{marginBottom:12}}>
              <label style={{fontSize:"0.72rem",color:BRAND.red,letterSpacing:1,display:"block",marginBottom:5,fontWeight:700}}>CORREO ELECTRONICO</label>
              <input style={S.input} type="email" placeholder="tu@correo.com"
                value={loginEmail} onChange={e=>setLoginEmail(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&handleLogin()} />
            </div>
            <div style={{marginBottom:16}}>
              <label style={{fontSize:"0.72rem",color:BRAND.red,letterSpacing:1,display:"block",marginBottom:5,fontWeight:700}}>PIN</label>
              <input style={S.input} type="password" placeholder="****"
                value={loginPin} onChange={e=>setLoginPin(e.target.value.replace(/\D/g,""))}
                onKeyDown={e=>e.key==="Enter"&&handleLogin()} />
            </div>
            {error && <div style={{color:"#dc2626",marginBottom:12,fontSize:"0.85rem",background:"#fef2f2",padding:"8px 12px",borderRadius:6}}>{error}</div>}
            <button style={{...S.btn(),width:"100%"}} onClick={handleLogin}>Entrar</button>
            <button style={{...S.btn("#6b7280",true),width:"100%",marginTop:8}} onClick={()=>{setIsNew(true);setError("");}}>Crear cuenta nueva</button>
            <button style={{background:"transparent",border:"none",color:"#2563eb",fontSize:"0.82rem",marginTop:10,cursor:"pointer",textDecoration:"underline",width:"100%",textAlign:"center"}}
              onClick={async ()=>{
                const email=loginEmail.trim().toLowerCase();
                if(!email||!email.includes("@")){setError("Ingresa tu correo primero para recuperar el PIN");return;}
                const user=participants.find(p=>p.email&&p.email.toLowerCase()===email);
                if(!user){setError("No encontramos ese correo registrado");return;}
                setError("");
                try {
                  const snap = await import("firebase/firestore").then(({getDoc})=>getDoc(PIN_REQUESTS_DOC));
                  const existing = snap.exists() ? snap.data().list||[] : [];
                  const already = existing.find(r=>r.email===email&&r.status==="pending");
                  if(already){setError("Ya tienes una solicitud pendiente. El administrador te contactará pronto.");return;}
                  const newReq = {id:Date.now(), email, name:user.name||user.nombre+" "+user.apellido, telefono:user.telefono||"", status:"pending", createdAt:new Date().toISOString()};
                  await import("firebase/firestore").then(({setDoc})=>setDoc(PIN_REQUESTS_DOC,{list:[...existing,newReq]}));
                  setError("");
                  alert("✅ Solicitud enviada. El administrador revisará tu caso y te contactará para darte tu nuevo PIN.");
                } catch(e){ setError("Error al enviar solicitud. Intenta de nuevo."); }
              }}>
              ¿Olvidaste tu PIN?
            </button>
            <div style={{marginTop:12,textAlign:"center",color:"#9ca3af",fontSize:"0.78rem"}}>
              {participants.length} participante{participants.length!==1?"s":""} registrado{participants.length!==1?"s":""}
            </div>
          </>
        )}

        {isNew && (
          <>
            <div style={S.sectionTitle}>Crear Cuenta</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
              <div>
                <label style={{fontSize:"0.72rem",color:BRAND.red,letterSpacing:1,display:"block",marginBottom:4,fontWeight:700}}>NOMBRE</label>
                <input style={S.input} placeholder="Juan" value={regNombre} onChange={e=>setRegNombre(e.target.value)} />
              </div>
              <div>
                <label style={{fontSize:"0.72rem",color:BRAND.red,letterSpacing:1,display:"block",marginBottom:4,fontWeight:700}}>APELLIDO</label>
                <input style={S.input} placeholder="Perez" value={regApellido} onChange={e=>setRegApellido(e.target.value)} />
              </div>
            </div>
            <div style={{marginBottom:10}}>
              <label style={{fontSize:"0.72rem",color:BRAND.red,letterSpacing:1,display:"block",marginBottom:4,fontWeight:700}}>CORREO ELECTRONICO</label>
              <input style={S.input} type="email" placeholder="tu@correo.com" value={regEmail} onChange={e=>setRegEmail(e.target.value)} />
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
              <div>
                <label style={{fontSize:"0.72rem",color:BRAND.red,letterSpacing:1,display:"block",marginBottom:4,fontWeight:700}}>TELEFONO</label>
                <input style={S.input} placeholder="514-000-0000" value={regTel} onChange={e=>setRegTel(e.target.value)} />
              </div>
              <div>
                <label style={{fontSize:"0.72rem",color:BRAND.red,letterSpacing:1,display:"block",marginBottom:4,fontWeight:700}}>SUCURSAL</label>
                <select style={selectStyle} value={regSucursal} onChange={e=>setRegSucursal(e.target.value)}>
                  <option value="">Seleccionar...</option>
                  {SUCURSALES.map(s=><option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
              <div>
                <label style={{fontSize:"0.72rem",color:BRAND.red,letterSpacing:1,display:"block",marginBottom:4,fontWeight:700}}>PIN (min. 4 dig.)</label>
                <input style={S.input} type="password" placeholder="****" value={regPin} onChange={e=>setRegPin(e.target.value.replace(/\D/g,""))} />
              </div>
              <div>
                <label style={{fontSize:"0.72rem",color:BRAND.red,letterSpacing:1,display:"block",marginBottom:4,fontWeight:700}}>CONFIRMAR PIN</label>
                <input style={S.input} type="password" placeholder="****" value={regPin2} onChange={e=>setRegPin2(e.target.value.replace(/\D/g,""))} />
              </div>
            </div>
            {error && <div style={{color:"#dc2626",marginBottom:12,fontSize:"0.85rem",background:"#fef2f2",padding:"8px 12px",borderRadius:6}}>{error}</div>}
            <button style={{...S.btn(),width:"100%"}} onClick={handleRegister} disabled={saving}>
              {saving?"Registrando...":"Crear Cuenta y Participar"}
            </button>
          </>
        )}
      </div>
    </div>
  );

  if (step==="done") return (
    <div className="fi" style={{maxWidth:440,margin:"0 auto",textAlign:"center"}}>
      <div style={S.card}>
        <div style={{fontSize:"3rem",marginBottom:10}}>OK</div>
        <div style={{fontSize:"1.2rem",fontWeight:800,color:"#d3172e",marginBottom:8}}>Guardado!</div>
        <div style={{color:"#6b7280",marginBottom:16}}>Hola <strong style={{color:"#111827"}}>{currentUser?.name}</strong></div>
        <div style={{display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap"}}>
          <button style={S.btn()} onClick={()=>setStep("form")}>Editar Pronosticos</button>
          <button style={S.btn("#6b7280",true)} onClick={()=>{if(window.confirm(lang==="fr"?"Voulez-vous vraiment vous déconnecter ?":"¿Seguro que deseas cerrar sesión?")){setStep("login");setCurrentUser(null);try{localStorage.removeItem("sl_user");}catch(e){}setLoginEmail("");setLoginPin("");setView?.("clasificacion");}}}>Cambiar Usuario</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fi">
      {/* Welcome banner */}
      <div style={{background:"linear-gradient(135deg,#d3172e 0%,#a0122a 100%)",borderRadius:12,padding:"14px 18px",marginBottom:16,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
        <div>
          <div style={{color:"rgba(255,255,255,0.8)",fontSize:"0.72rem",letterSpacing:1,fontWeight:600,textTransform:"uppercase"}}>{lang==="fr"?"Bienvenue":"Bienvenido"}</div>
          <div style={{color:"#fff",fontWeight:800,fontSize:"1.1rem"}}>{currentUser?.nombre ? currentUser.nombre+" "+currentUser.apellido : currentUser?.name}</div>
        </div>
        <div style={{display:"flex",gap:10}}>
          <div style={{background:"rgba(255,255,255,0.15)",borderRadius:8,padding:"6px 14px",textAlign:"center"}}>
            <div style={{color:"#fff",fontWeight:800,fontSize:"1.2rem"}}>{Object.keys(preds).length}</div>
            <div style={{color:"rgba(255,255,255,0.8)",fontSize:"0.68rem",letterSpacing:0.5}}>{lang==="fr"?"pronostics":"pronósticos"}</div>
          </div>
          <div style={{background:"rgba(255,255,255,0.15)",borderRadius:8,padding:"6px 14px",textAlign:"center"}}>
            <div style={{color:"#fff",fontWeight:800,fontSize:"1.2rem"}}>{matches.length}</div>
            <div style={{color:"rgba(255,255,255,0.8)",fontSize:"0.68rem",letterSpacing:0.5}}>{lang==="fr"?"matchs total":"partidos total"}</div>
          </div>
        </div>
        <div style={{display:"flex",gap:8}}>
          <button style={{...S.btn("#27ae60"),fontSize:"0.8rem",padding:"6px 14px"}} onClick={handleSave} disabled={saving}>
            {saving?"Guardando...":"Guardar Todo"}
          </button>
          <button style={{background:"rgba(255,255,255,0.15)",border:"1px solid rgba(255,255,255,0.3)",color:"#fff",borderRadius:8,padding:"6px 12px",fontSize:"0.8rem",cursor:"pointer",fontWeight:600}} onClick={()=>{if(window.confirm(lang==="fr"?"Voulez-vous vraiment vous déconnecter ?":"¿Seguro que deseas cerrar sesión?")){setStep("login");setCurrentUser(null);try{localStorage.removeItem("sl_user");}catch(e){}setLoginEmail("");setLoginPin("");setView?.("clasificacion");}}}>
            {lang==="fr"?"Déconnexion":"Salir"}
          </button>
        </div>
      </div>

      <div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap"}}>
        {[["pronosticos","Pronósticos"],["perfil","Mi Perfil"]].map(([t,l])=>(
          <button key={t} style={S.navBtn(activeTab===t)} onClick={()=>setActiveTab(t)}>{l}</button>
        ))}
      </div>

      {activeTab==="perfil" && (
        <ProfileTab currentUser={currentUser} setCurrentUser={setCurrentUser} participants={participants} setParticipants={setParticipants} matches={matches} invoices={invoices} setInvoices={setInvoices} preds={preds} />
      )}

      {activeTab==="tablas" && (
        <div className="fi">
          <div style={{padding:"10px 14px",marginBottom:14,background:"#eff6ff",border:"1px solid #bfdbfe",borderRadius:10}}>
            <div style={{fontSize:"0.8rem",color:"#1d4ed8",fontWeight:600}}>Tablas de posiciones con resultados reales</div>
          </div>
          {Object.keys(GROUPS).map(grp => {
            const grpMatches = matches.filter(m=>m.phase==="groups"&&m.group===grp);
            // Build team list from actual match data
            const teamSet = new Set();
            grpMatches.forEach(m=>{if(m.home)teamSet.add(m.home);if(m.away)teamSet.add(m.away);});
            const stats={};
            teamSet.forEach(t=>{stats[t]={team:t,pj:0,g:0,e:0,p:0,gf:0,gc:0,pts:0};});
            grpMatches.forEach(m=>{
              if(m.realHome===null||m.realAway===null) return;
              const h=Number(m.realHome),a=Number(m.realAway);
              if(!stats[m.home]||!stats[m.away]) return;
              stats[m.home].pj++;stats[m.away].pj++;
              stats[m.home].gf+=h;stats[m.home].gc+=a;
              stats[m.away].gf+=a;stats[m.away].gc+=h;
              if(h>a){stats[m.home].g++;stats[m.home].pts+=3;stats[m.away].p++;}
              else if(h<a){stats[m.away].g++;stats[m.away].pts+=3;stats[m.home].p++;}
              else{stats[m.home].e++;stats[m.away].e++;stats[m.home].pts++;stats[m.away].pts++;}
            });
            const table=Object.values(stats).sort((a,b)=>b.pts-a.pts||(b.gf-b.gc)-(a.gf-a.gc)||b.gf-a.gf);
            const hasData=table.some(s=>s.pj>0);
            return <GroupTable key={grp} grp={grp} table={table} hasData={hasData} emptyMsg="Aun no hay resultados para este grupo" />;
          })}
        </div>
      )}

      {activeTab==="pronosticos" && (
        <>
          {/* Invoice status banner */}
          {(()=>{
            const status = getParticipationStatus(currentUser?.id, invoices);
            if (status === "valid") return null;
            const cfg = {
              invalid:  { bg:"#fff5f5", border:"#fca5a5", icon:"🧾", color:"#991b1b", msg: lang==="fr" ? "Tu n'as pas encore de facture valide. Enregistre un achat de 50 $+ avec produit éligible pour participer." : "No tienes una factura válida aún. Registra una compra de $50+ con producto elegible para participar.", btn: lang==="fr"?"Enregistrer ma facture":"Registrar mi factura" },
              no_product:{ bg:"#fffbeb", border:"#f59e0b", icon:"⚠️", color:"#92400e", msg: lang==="fr" ? "Ta facture de 50 $+ n'a pas de produit éligible confirmé. Modifie-la dans Mon Profil." : "Tu factura de $50+ no tiene producto elegible confirmado. Edítala en Mi Perfil.", btn: lang==="fr"?"Voir Mon Profil":"Ver Mi Perfil" },
              pending:  { bg:"#eff6ff", border:"#93c5fd", icon:"🕐", color:"#1e40af", msg: lang==="fr" ? "Ta facture est en attente d'approbation par l'administrateur." : "Tu factura está pendiente de aprobación por el administrador.", btn: null },
            };
            const c = cfg[status];
            if (!c) return null;
            return (
              <div style={{background:c.bg,border:`1px solid ${c.border}`,borderRadius:10,padding:"12px 16px",marginBottom:14,display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,flexWrap:"wrap"}}>
                <div style={{display:"flex",gap:10,alignItems:"center"}}>
                  <span style={{fontSize:"1.3rem"}}>{c.icon}</span>
                  <span style={{fontSize:"0.82rem",color:c.color,fontWeight:600,lineHeight:1.4}}>{c.msg}</span>
                </div>
                {c.btn && <button style={{...S.btn(BRAND.red),fontSize:"0.78rem",padding:"6px 14px",whiteSpace:"nowrap"}} onClick={()=>setActiveTab("perfil")}>{c.btn}</button>}
              </div>
            );
          })()}
          <div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap"}}>
            {["groups","elim"].map(ph=>(
              <button key={ph} style={S.navBtn(activePhase===ph)} onClick={()=>setActivePhase(ph)}>
                {ph==="groups"?"Grupos":"Playoffs"}
              </button>
            ))}
          </div>

          {activePhase==="groups" && (
            <>
              <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:12}}>
                {Object.keys(GROUPS).map(g=>(
                  <button key={g} style={{
                    ...S.navBtn(activeGroup===g),
                    background:activeGroup===g?GROUP_COLORS[g]:"transparent",
                    borderColor:GROUP_COLORS[g], color:activeGroup===g?"#fff":GROUP_COLORS[g],
                    padding:"4px 10px",fontSize:"0.75rem",
                  }} onClick={()=>setActiveGroup(g)}>Grp {g}</button>
                ))}
              </div>
              {(()=>{const lk=getLockMsg("groups"); return(
                <div style={{background:lk.locked?"#fef2f2":"#f0fdf4",border:"1px solid "+(lk.locked?"#dc262688":"#16a34a66"),borderRadius:7,padding:"7px 12px",marginBottom:10,fontSize:"0.8rem",color:lk.locked?"#e74c3c":"#2ecc71"}}>
                  {lk.locked?"Pronosticos de grupos cerrados":lk.msg}
                </div>
              );})()}
              <div style={S.groupHeader(GROUP_COLORS[activeGroup])}>GRUPO {activeGroup}</div>
              {groupMatches.filter(m=>m.group===activeGroup).map(m=>renderMatchRow(m,isMatchLocked(m,adminUnlocked)))}
              {!isPhaseLocked("groups",adminUnlocked) && (
                <div style={{display:"flex",justifyContent:"flex-end",marginTop:10}}>
                  <button style={{...S.btn("#16a34a"),fontSize:"0.8rem"}} onClick={handleSave} disabled={saving}>
                    {saving?"Guardando...":tp.guardar}
                  </button>
                </div>
              )}
              {(()=>{
                const curMatches=groupMatches.filter(m=>m.group===activeGroup);
                const teamSet=new Set();
                curMatches.forEach(m=>{if(m.home)teamSet.add(m.home);if(m.away)teamSet.add(m.away);});
                const stats={};
                teamSet.forEach(t=>{stats[t]={team:t,pj:0,g:0,e:0,p:0,gf:0,gc:0,pts:0};});
                curMatches.forEach(m=>{
                  const pred=preds[m.id];
                  if(!pred||pred.home===null||pred.away===null) return;
                  const h=Number(pred.home),a=Number(pred.away);
                  if(isNaN(h)||isNaN(a)) return;
                  if(!stats[m.home]||!stats[m.away]) return;
                  stats[m.home].pj++;stats[m.away].pj++;
                  stats[m.home].gf+=h;stats[m.home].gc+=a;
                  stats[m.away].gf+=a;stats[m.away].gc+=h;
                  if(h>a){stats[m.home].g++;stats[m.home].pts+=3;stats[m.away].p++;}
                  else if(h<a){stats[m.away].g++;stats[m.away].pts+=3;stats[m.home].p++;}
                  else{stats[m.home].e++;stats[m.away].e++;stats[m.home].pts++;stats[m.away].pts++;}
                });
                const table=Object.values(stats).sort((a,b)=>b.pts-a.pts||(b.gf-b.gc)-(a.gf-a.gc)||b.gf-a.gf);
                const hasData=table.some(s=>s.pj>0);
                return <GroupTable grp={activeGroup} table={table} hasData={hasData} emptyMsg="Ingresa tus pronosticos para ver la tabla" />;
              })()}
            </>
          )}

          {activePhase==="elim" && (
            <>
              <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:12}}>
                {phases.map(ph=>(
                  <button key={ph} style={{
                    ...S.navBtn(activePh===ph),
                    background:activePh===ph?phaseColors[ph]:"transparent",
                    borderColor:phaseColors[ph]+"88", color:activePh===ph?"#fff":phaseColors[ph],
                    fontSize:"0.75rem",padding:"4px 10px",
                  }} onClick={()=>setActivePh(ph)}>{phaseLabels[ph]}</button>
                ))}
              </div>
              {(()=>{const lk=getLockMsg(activePh); return(
                <div style={{background:lk.locked?"#fef2f2":"#f0fdf4",border:"1px solid "+(lk.locked?"#dc262688":"#16a34a66"),borderRadius:7,padding:"7px 12px",marginBottom:10,fontSize:"0.8rem",color:lk.locked?"#e74c3c":"#2ecc71"}}>
                  {lk.locked?"Cerrado":lk.msg}
                </div>
              );})()}
              {(()=>{const phaseLocked=isPhaseLocked(activePh,adminUnlocked); return(
                <>
                  {elimMatches.filter(m=>m.phase===activePh).map(m=>renderMatchRow(m,isMatchLocked(m,adminUnlocked)))}
                  {!phaseLocked && (
                    <div style={{display:"flex",justifyContent:"flex-end",marginTop:10}}>
                      <button style={{...S.btn("#27ae60"),fontSize:"0.8rem"}} onClick={handleSave} disabled={saving}>
                        {saving?"Guardando...":tp.guardar}
                      </button>
                    </div>
                  )}
                </>
              );})()}
            </>
          )}
        </>
      )}
    </div>
  );
}

// FIXTURE VIEW
function FixtureView({ matches }) {
  const [activeGroup, setActiveGroup] = useState("A");
  const [activePhase, setActivePhase] = useState("groups");
  const phaseColors = {round32:"#0369a1",round16:"#7c3aed",quarters:"#c0392b",semis:"#e67e22",third:"#2980b9",final:"#d3172e"};
  const phaseLabels = {round32:"Ronda 32",round16:"Ronda 16",quarters:"Cuartos de Final",semis:"Semifinales",third:"Tercer Lugar",final:"Gran Final"};
  const groupMatches = matches.filter(m=>m.phase==="groups");
  const elimMatches = matches.filter(m=>m.phase!=="groups");
  const phases = [...new Set(elimMatches.map(m=>m.phase))];

  function renderMatch(m) {
    const hasResult = m.realHome!==null&&m.realAway!==null;
    return (
      <div key={m.id} style={{...S.matchRow,gridTemplateColumns:"1fr auto auto auto 1fr",opacity:(m.home==="Por definir"||m.home?.startsWith("Gan.")||m.home?.startsWith("Per."))?.5:1}}>
        <div style={{textAlign:"right",fontWeight:600,fontSize:"0.85rem"}}>{m.home}</div>
        <div style={{background:hasResult?"#f0fdf4":"#f3f4f6",border:"1px solid "+(hasResult?"#16a34a66":"#d1d5db"),borderRadius:6,padding:"3px 8px",fontSize:"1rem",fontWeight:800,color:hasResult?"#27ae60":"#9ca3af",minWidth:32,textAlign:"center"}}>
          {hasResult?m.realHome:"-"}
        </div>
        <div style={{color:"#9ca3af",fontWeight:700,fontSize:"0.68rem",padding:"0 3px"}}>VS</div>
        <div style={{background:hasResult?"#f0fdf4":"#f3f4f6",border:"1px solid "+(hasResult?"#16a34a66":"#d1d5db"),borderRadius:6,padding:"3px 8px",fontSize:"1rem",fontWeight:800,color:hasResult?"#27ae60":"#9ca3af",minWidth:32,textAlign:"center"}}>
          {hasResult?m.realAway:"-"}
        </div>
        <div style={{textAlign:"left",fontWeight:600,fontSize:"0.85rem"}}>{m.away}</div>
      </div>
    );
  }

  return (
    <div className="fi">
      <div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap"}}>
        {["groups","elim"].map(ph=>(
          <button key={ph} style={S.navBtn(activePhase===ph)} onClick={()=>setActivePhase(ph)}>
            {ph==="groups"?"Grupos":"Playoffs"}
          </button>
        ))}
      </div>
      {activePhase==="groups" && (
        <>
          <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:12}}>
            {Object.keys(GROUPS).map(g=>(
              <button key={g} style={{...S.navBtn(activeGroup===g),background:activeGroup===g?GROUP_COLORS[g]:"transparent",borderColor:GROUP_COLORS[g],color:activeGroup===g?"#fff":GROUP_COLORS[g],padding:"4px 10px",fontSize:"0.75rem"}} onClick={()=>setActiveGroup(g)}>Grp {g}</button>
            ))}
          </div>
          <div style={S.groupHeader(GROUP_COLORS[activeGroup])}>GRUPO {activeGroup}</div>
          {groupMatches.filter(m=>m.group===activeGroup).map(m=>(
            <div key={m.id} style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
              <span style={{color:"#9ca3af",fontSize:"0.72rem",minWidth:38}}>{m.date}</span>
              {renderMatch(m)}
            </div>
          ))}
          {(()=>{
            const grpMatches=groupMatches.filter(m=>m.group===activeGroup);
            const teamSet=new Set();
            grpMatches.forEach(m=>{if(m.home)teamSet.add(m.home);if(m.away)teamSet.add(m.away);});
            const stats={};
            teamSet.forEach(t=>{stats[t]={team:t,pj:0,g:0,e:0,p:0,gf:0,gc:0,pts:0};});
            grpMatches.forEach(m=>{
              if(m.realHome===null||m.realAway===null) return;
              const h=Number(m.realHome),a=Number(m.realAway);
              if(!stats[m.home]||!stats[m.away]) return;
              stats[m.home].pj++;stats[m.away].pj++;
              stats[m.home].gf+=h;stats[m.home].gc+=a;
              stats[m.away].gf+=a;stats[m.away].gc+=h;
              if(h>a){stats[m.home].g++;stats[m.home].pts+=3;stats[m.away].p++;}
              else if(h<a){stats[m.away].g++;stats[m.away].pts+=3;stats[m.home].p++;}
              else{stats[m.home].e++;stats[m.away].e++;stats[m.home].pts++;stats[m.away].pts++;}
            });
            const table=Object.values(stats).sort((a,b)=>b.pts-a.pts||(b.gf-b.gc)-(a.gf-a.gc)||b.gf-a.gf);
            const hasData=table.some(s=>s.pj>0);
            return <GroupTable grp={activeGroup} table={table} hasData={hasData} emptyMsg="Aun no hay resultados para este grupo" />;
          })()}
        </>
      )}
      {activePhase==="elim" && (
        <>
          {phases.map(ph=>(
            <div key={ph}>
              <div style={S.phaseHeader(phaseColors[ph])}>{phaseLabels[ph]}</div>
              {elimMatches.filter(m=>m.phase===ph).map(m=>(
                <div key={m.id} style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
                  <span style={{color:"#9ca3af",fontSize:"0.72rem",minWidth:38}}>{m.date}</span>
                  {renderMatch(m)}
                </div>
              ))}
            </div>
          ))}
        </>
      )}
    </div>
  );
}


// Auto-resolve Round32 team names from group standings
function resolveRound32Teams(matches) {
  // 1. Calculate standings for each group
  const standings = {};
  Object.keys(GROUPS).forEach(grp => {
    const grpMatches = matches.filter(m => m.phase === "groups" && m.group === grp);
    const teamSet = new Set();
    grpMatches.forEach(m => { if(m.home) teamSet.add(m.home); if(m.away) teamSet.add(m.away); });
    const stats = {};
    teamSet.forEach(t => { stats[t] = {team:t, pj:0, g:0, e:0, p:0, gf:0, gc:0, pts:0}; });
    grpMatches.forEach(m => {
      if(m.realHome === null || m.realAway === null) return;
      const h = Number(m.realHome), a = Number(m.realAway);
      if(!stats[m.home] || !stats[m.away]) return;
      stats[m.home].pj++; stats[m.away].pj++;
      stats[m.home].gf += h; stats[m.home].gc += a;
      stats[m.away].gf += a; stats[m.away].gc += h;
      if(h > a){ stats[m.home].g++; stats[m.home].pts += 3; stats[m.away].p++; }
      else if(h < a){ stats[m.away].g++; stats[m.away].pts += 3; stats[m.home].p++; }
      else { stats[m.home].e++; stats[m.away].e++; stats[m.home].pts++; stats[m.away].pts++; }
    });
    standings[grp] = Object.values(stats).sort((a,b) =>
      b.pts - a.pts || (b.gf - b.gc) - (a.gf - a.gc) || b.gf - a.gf
    );
  });

  // Helper: get team by position in group (1-indexed)
  function pos(grp, position) {
    const s = standings[grp];
    if (!s || s.length < position) return null;
    // Only return if the group has played enough matches to determine this position
    if (s[position-1].pj === 0) return null;
    return s[position-1].team;
  }

  // 2. Determine best 3rd place teams
  // Rank all thirds by pts, gd, gf
  const thirds = Object.keys(GROUPS).map(grp => {
    const s = standings[grp];
    if (!s || s.length < 3 || s[2].pj === 0) return null;
    return { grp, ...s[2] };
  }).filter(Boolean).sort((a,b) =>
    b.pts - a.pts || (b.gf - b.gc) - (a.gf - a.gc) || b.gf - a.gf
  );

  // Best 8 thirds (FIFA 2026 has 32 teams in round of 32, 8 thirds qualify)
  const best8thirds = thirds.slice(0, 8);

  // Helper: find best 3rd from specific groups
  function best3rd(groupList) {
    const groups = groupList.split("/");
    const candidates = best8thirds.filter(t => groups.includes(t.grp));
    return candidates.length > 0 ? candidates[0].team : null;
  }

  // 3. Map round32 placeholders to real team names
  // Only update if we have the data, otherwise keep placeholder
  const round32Map = {
    // Match 1001: 2º A vs 2º B
    1001: { home: pos("A",2), away: pos("B",2) },
    // Match 1002: 1º E vs 3º A/B/C/D/F
    1002: { home: pos("E",1), away: best3rd("A/B/C/D/F") },
    // Match 1003: 1º F vs 2º C
    1003: { home: pos("F",1), away: pos("C",2) },
    // Match 1004: 1º C vs 2º F
    1004: { home: pos("C",1), away: pos("F",2) },
    // Match 1005: 1º I vs 3º C/D/F/G/H
    1005: { home: pos("I",1), away: best3rd("C/D/F/G/H") },
    // Match 1006: 2º E vs 2º I
    1006: { home: pos("E",2), away: pos("I",2) },
    // Match 1007: 1º A vs 3º C/E/F/H/I
    1007: { home: pos("A",1), away: best3rd("C/E/F/H/I") },
    // Match 1008: 1º L vs 3º E/H/I/J/K
    1008: { home: pos("L",1), away: best3rd("E/H/I/J/K") },
    // Match 1009: 1º D vs 3º B/E/F/I/J
    1009: { home: pos("D",1), away: best3rd("B/E/F/I/J") },
    // Match 1010: 1º G vs 3º A/E/H/I/J
    1010: { home: pos("G",1), away: best3rd("A/E/H/I/J") },
    // Match 1011: 2º K vs 2º L
    1011: { home: pos("K",2), away: pos("L",2) },
    // Match 1012: 1º H vs 2º J
    1012: { home: pos("H",1), away: pos("J",2) },
    // Match 1013: 1º B vs 3º E/F/G/I/J
    1013: { home: pos("B",1), away: best3rd("E/F/G/I/J") },
    // Match 1014: 1º J vs 2º H
    1014: { home: pos("J",1), away: pos("H",2) },
    // Match 1015: 1º K vs 3º D/E/I/J/L
    1015: { home: pos("K",1), away: best3rd("D/E/I/J/L") },
    // Match 1016: 2º D vs 2º G
    1016: { home: pos("D",2), away: pos("G",2) },
  };

  // 4. Apply updates to matches
  return matches.map(m => {
    if (m.phase !== "round32") return m;
    const update = round32Map[m.id];
    if (!update) return m;
    return {
      ...m,
      home: update.home || m.home,
      away: update.away || m.away,
    };
  });
}


function AdminParticipantRow({ p, i, participants, setParticipants, invoices, matches, removeParticipant }) {
  const [editing, setEditing] = useState(false);
  const [eNombre, setENombre] = useState(p.nombre||p.name||"");
  const [eApellido, setEApellido] = useState(p.apellido||"");
  const [eTel, setETel] = useState(p.telefono||"");
  const [ePin, setEPin] = useState("");

  const status = getParticipationStatus(p.id, invoices);
  const statusCfg = {
    valid:      { icon:"✅", label:"Válida",    color:"#166534", bg:"#dcfce7" },
    pending:    { icon:"🕐", label:"Pendiente", color:"#1e40af", bg:"#dbeafe" },
    no_product: { icon:"⚠️", label:"Sin producto", color:"#92400e", bg:"#fef3c7" },
    invalid:    { icon:"🔴", label:"No válida", color:"#991b1b", bg:"#fee2e2" },
  };
  const sc = statusCfg[status] || statusCfg.invalid;

  async function saveEdit() {
    const updated = {...p, nombre:eNombre.trim(), apellido:eApellido.trim(), name:eNombre.trim()+" "+eApellido.trim(), telefono:eTel.trim(), ...(ePin.length>=6?{pin:ePin}:{})};
    const newList = [...participants.filter(x=>x.id!==p.id), updated];
    await setDoc(PARTICIPANTS_DOC, {list: newList});
    setParticipants(newList);
    setEditing(false);
  }

  return (
    <div style={{...S.leaderRow(i), flexDirection:"column", alignItems:"stretch", gap:6}}>
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
        <div style={{display:"flex", alignItems:"center", gap:10}}>
          <span style={{color:"#9ca3af", fontWeight:700, minWidth:24}}>#{i+1}</span>
          <div>
            <div style={{display:"flex", alignItems:"center", gap:6}}>
              <span style={{fontWeight:700, color:BRAND.gray900}}>{p.name}</span>
              <span style={{background:sc.bg, color:sc.color, borderRadius:6, padding:"1px 7px", fontSize:"0.68rem", fontWeight:700}}>{sc.icon} {sc.label}</span>
            </div>
            <div style={{fontSize:"0.72rem", color:"#9ca3af"}}>
              {p.email && <span>{p.email} &nbsp;|&nbsp; </span>}
              {p.sucursal && <span style={{color:BRAND.red, fontWeight:600}}>{p.sucursal} &nbsp;|&nbsp; </span>}
              {Object.keys(p.predictions||{}).length} pronosticos &nbsp;|&nbsp; {p._totalInv} facturas
              {p._invPts>0 && <span style={{color:BRAND.red}}> | +{p._invPts}pts</span>}
              {p._classPts>0 && <span style={{color:"#7c3aed"}}> | +{p._classPts}pts</span>}
            </div>
          </div>
        </div>
        <div style={{display:"flex", alignItems:"center", gap:6}}>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:"1.3rem", fontWeight:800, color:BRAND.red}}>{p._total}</div>
            <div style={{fontSize:"0.68rem", color:"#9ca3af"}}>pts</div>
          </div>
          <button onClick={()=>setEditing(e=>!e)}
            style={{background:editing?"#f3f4f6":"transparent", border:"1px solid #2563eb44", color:"#2563eb", borderRadius:6, padding:"3px 8px", cursor:"pointer", fontSize:"0.78rem"}}>
            ✏️
          </button>
          <button onClick={()=>removeParticipant(p.id)}
            style={{background:"transparent", border:"1px solid #dc262644", color:"#dc2626", borderRadius:6, padding:"3px 8px", cursor:"pointer", fontSize:"0.78rem"}}>
            X
          </button>
        </div>
      </div>
      {editing && (
        <div style={{background:"#f9fafb", borderRadius:8, padding:"10px 12px", display:"flex", flexWrap:"wrap", gap:8, alignItems:"flex-end"}}>
          {[["Nombre",eNombre,setENombre],["Apellido",eApellido,setEApellido],["Teléfono",eTel,setETel]].map(([l,v,sv])=>(
            <div key={l} style={{flex:"1 1 120px"}}>
              <label style={{fontSize:"0.7rem", color:"#6b7280", display:"block", marginBottom:3}}>{l}</label>
              <input style={{...S.input, padding:"5px 8px", fontSize:"0.82rem"}} value={v} onChange={e=>sv(e.target.value)} />
            </div>
          ))}
          <div style={{flex:"1 1 120px"}}>
            <label style={{fontSize:"0.7rem", color:"#6b7280", display:"block", marginBottom:3}}>Nuevo PIN</label>
            <input style={{...S.input, padding:"5px 8px", fontSize:"0.82rem"}} type="password" placeholder="min 6 dígitos" value={ePin} onChange={e=>setEPin(e.target.value)} />
          </div>
          <button style={{...S.btn(), padding:"6px 14px", fontSize:"0.82rem"}} onClick={saveEdit}>Guardar</button>
          <button style={{...S.btn("#6b7280",true), padding:"6px 10px", fontSize:"0.82rem"}} onClick={()=>setEditing(false)}>✕</button>
        </div>
      )}
    </div>
  );
}

// ADMIN PANEL
function AdminInvoicesTab({ invoices, handleInvoice, pendingInvoices }) {
  const lang = useLang(); const ti = T[lang].invoice;
  const [editingId, setEditingId] = useState(null);
  const [filter, setFilter] = useState("all");

  const filtered = invoices.filter(inv =>
    filter==="all" ? true : filter==="pending" ? inv.status==="pending" : filter==="approved" ? inv.status==="approved" : inv.status==="rejected"
  );

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexWrap:"wrap",gap:8}}>
        <div style={S.sectionTitle}>Gestión de Facturas</div>
        <div style={{display:"flex",gap:5}}>
          {[["all","Todas"],["pending","Pendientes"],["approved","Aprobadas"],["rejected","Rechazadas"]].map(([v,l])=>(
            <button key={v} style={{...S.navBtn(filter===v),fontSize:"0.75rem",padding:"4px 10px"}} onClick={()=>setFilter(v)}>
              {l}{v==="pending"&&pendingInvoices.length>0?` (${pendingInvoices.length})`:""}
            </button>
          ))}
        </div>
      </div>
      {filtered.length===0 && (
        <div style={{color:"#9ca3af",padding:20,textAlign:"center"}}>No hay facturas en esta categoría</div>
      )}
      {filtered.map(inv=>(
        <div key={inv.id}>
          <div style={S.invoiceCard(inv.status)}>
            <div style={{flex:1}}>
              <div style={{fontWeight:700,fontSize:"0.9rem"}}>{inv.participantName}</div>
              <div style={{color:"#6b7280",fontSize:"0.78rem",marginTop:2}}>
                Factura: <strong style={{color:"#111827"}}>{inv.invoiceNum}</strong>
                &nbsp;|&nbsp; Monto: <strong style={{color:"#d3172e"}}>${inv.amount} CAD</strong>
                &nbsp;|&nbsp; Pts: <strong style={{color:"#16a34a"}}>{inv.points}</strong>
              </div>
              <div style={{fontSize:"0.72rem",marginTop:3,display:"flex",gap:8,flexWrap:"wrap"}}>
                <span style={{color:"#9ca3af"}}>{new Date(inv.createdAt).toLocaleDateString()}</span>
                {inv.amount>=50 && (
                  <span style={{fontWeight:600,color:inv.hasProduct?"#16a34a":"#f59e0b"}}>
                    {inv.hasProduct ? ti.withProduct : ti.noProduct}
                  </span>
                )}
              </div>
            </div>
            <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
              <div style={S.statusBadge(inv.status)}>
                {inv.status==="approved"?ti.approuved:inv.status==="rejected"?ti.rejected:ti.pending}
              </div>
              {inv.status==="pending" && (
                <>
                  <button style={{...S.btn("#27ae60"),fontSize:"0.78rem",padding:"5px 12px"}}
                    onClick={()=>handleInvoice(inv.id,"approved")}>Aprobar</button>
                  <button style={{...S.btn("#c0392b",true),fontSize:"0.78rem",padding:"5px 12px"}}
                    onClick={()=>handleInvoice(inv.id,"rejected")}>Rechazar</button>
                </>
              )}
              {inv.status!=="pending" && (
                <button
                  style={{...S.btn(editingId===inv.id?"#6b7280":"#d97706",true),fontSize:"0.78rem",padding:"5px 12px"}}
                  onClick={()=>setEditingId(editingId===inv.id?null:inv.id)}>
                  {editingId===inv.id?lang==="fr"?"Annuler":"Cancelar":"✏️ Corregir"}
                </button>
              )}
            </div>
          </div>
          {editingId===inv.id && (
            <div style={{background:"#fffbeb",border:"1px solid #f59e0b",borderRadius:"0 0 10px 10px",padding:"12px 16px",marginTop:-6,marginBottom:8,display:"flex",flexDirection:"column",gap:8}}>
              <div style={{fontSize:"0.8rem",color:"#92400e",fontWeight:600}}>
                ⚠️ Corrigiendo factura <strong>{inv.invoiceNum}</strong> — actualmente: <strong>{inv.status==="approved"?"Aprobada":"Rechazada"}</strong>
              </div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {inv.status==="approved" && (
                  <button style={{...S.btn("#c0392b",true),fontSize:"0.82rem",padding:"7px 16px"}}
                    onClick={()=>{handleInvoice(inv.id,"rejected");setEditingId(null);}}>
                    Cambiar a Rechazada
                  </button>
                )}
                {inv.status==="rejected" && (
                  <button style={{...S.btn("#27ae60"),fontSize:"0.82rem",padding:"7px 16px"}}
                    onClick={()=>{handleInvoice(inv.id,"approved");setEditingId(null);}}>
                    Cambiar a Aprobada
                  </button>
                )}
                <button style={{...S.btn("#6b7280",true),fontSize:"0.82rem",padding:"7px 16px"}}
                  onClick={()=>{handleInvoice(inv.id,"pending");setEditingId(null);}}>
                  Volver a Pendiente
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function AdminPanel({ matches, setMatches, participants, setParticipants, adminUnlocked, setAdminUnlocked, invoices, setInvoices, pinRequests, setPinRequests }) {
  const [authed, setAuthed] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [activeGroup, setActiveGroup] = useState("A");
  const [activePhase, setActivePhase] = useState("groups");
  const [activePh, setActivePh] = useState("round32");
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState("results");
  const ADMIN = "2026";

  const phaseColors = {round32:"#0369a1",round16:"#7c3aed",quarters:"#c0392b",semis:"#e67e22",third:"#2980b9",final:"#d3172e"};
  const phaseLabels = {round32:"Ronda 32",round16:"Ronda 16",quarters:"Cuartos de Final",semis:"Semifinales",third:"Tercer Lugar",final:"Gran Final"};
  const groupMatches = matches.filter(m=>m.phase==="groups");
  const elimMatches = matches.filter(m=>m.phase!=="groups");
  const phases = [...new Set(elimMatches.map(m=>m.phase))];
  const pendingInvoices = invoices.filter(inv=>inv.status==="pending");
  const pendingPinReqs = (pinRequests||[]).filter(r=>r.status==="pending");

  function setResult(matchId, side, val) {
    const v = val===""?null:Math.max(0,parseInt(val)||0);
    setMatches(prev=>prev.map(m=>m.id===matchId?{...m,[side==="home"?"realHome":"realAway"]:v}:m));
  }

  function setTeamName(matchId, side, val) {
    setMatches(prev=>prev.map(m=>m.id===matchId?{...m,[side==="home"?"home":"away"]:val}:m));
  }

  async function handleSave() {
    try {
      // Auto-fill Round32 teams from group standings before saving
      const resolved = resolveRound32Teams(matches);
      setMatches(resolved);
      await setDoc(MATCHES_DOC, {list: resolved});
      setSaved(true);
      setTimeout(()=>setSaved(false),2000);
    } catch(e) { alert("Error: "+e.message); }
  }

  async function toggleUnlock(phase) {
    const updated = {...adminUnlocked, [phase]:!adminUnlocked[phase]};
    setAdminUnlocked(updated);
    await setDoc(SETTINGS_DOC, {adminUnlocked: updated});
  }

  async function handleInvoice(invoiceId, action) {
    const updated = invoices.map(inv=>
      inv.id===invoiceId ? {...inv, status:action, reviewedAt:new Date().toISOString()} : inv
    );
    await setDoc(INVOICES_DOC, {list: updated});
    setInvoices(updated);
  }

  function removeParticipant(id) {
    if (!window.confirm("Eliminar este participante?")) return;
    const updated = participants.filter(p=>p.id!==id);
    setParticipants(updated);
    setDoc(PARTICIPANTS_DOC, {list: updated});
  }

  if (!authed) return (
    <div style={{maxWidth:360,margin:"0 auto"}}>
      <div style={S.card}>
        <div style={S.sectionTitle}>Panel de Administrador</div>
        <input style={{...S.input,marginBottom:14}} type="password" placeholder="PIN administrador"
          value={pinInput} onChange={e=>setPinInput(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&(pinInput===ADMIN?setAuthed(true):alert("PIN incorrecto"))} />
        <button style={S.btn()} onClick={()=>pinInput===ADMIN?setAuthed(true):alert("PIN incorrecto")}>
          Entrar como Admin
        </button>
      </div>
    </div>
  );

  return (
    <div className="fi">
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14,flexWrap:"wrap",gap:8}}>
        <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
          {[["results","Resultados"],["invoices","Facturas"+(pendingInvoices.length>0?" ("+pendingInvoices.length+")":"")],["pinreqs","PIN"+(pendingPinReqs.length>0?" ("+pendingPinReqs.length+")":"")],["teams","Equipos"],["locks","Bloqueos"],["users","Participantes"]].map(([t,l])=>(
            <button key={t} style={{...S.navBtn(activeTab===t),background:t==="invoices"&&pendingInvoices.length>0&&activeTab!==t?"#e67e2222":undefined}} onClick={()=>setActiveTab(t)}>{l}</button>
          ))}
        </div>
        <button style={{...S.btn(saved?"#27ae60":"#d3172e"),fontSize:"0.8rem"}} onClick={handleSave}>
          {saved?"Guardado!":"Guardar Resultados"}
        </button>
      </div>

      {activeTab==="invoices" && (
        <AdminInvoicesTab invoices={invoices} handleInvoice={handleInvoice} pendingInvoices={pendingInvoices} />
      )}

      {activeTab==="results" && (
        <>
          <div style={{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap"}}>
            {["groups","elim"].map(ph=>(
              <button key={ph} style={S.navBtn(activePhase===ph)} onClick={()=>setActivePhase(ph)}>
                {ph==="groups"?"Grupos":"Playoffs"}
              </button>
            ))}
          </div>
          {activePhase==="groups" && (
            <>
              <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:12}}>
                {Object.keys(GROUPS).map(g=>(
                  <button key={g} style={{...S.navBtn(activeGroup===g),background:activeGroup===g?GROUP_COLORS[g]:"transparent",borderColor:GROUP_COLORS[g],color:activeGroup===g?"#fff":GROUP_COLORS[g],padding:"4px 10px",fontSize:"0.75rem"}} onClick={()=>setActiveGroup(g)}>Grp {g}</button>
                ))}
              </div>
              <div style={S.groupHeader(GROUP_COLORS[activeGroup])}>GRUPO {activeGroup}</div>
              {groupMatches.filter(m=>m.group===activeGroup).map(m=>(
                <div key={m.id} style={{display:"grid",gridTemplateColumns:"38px 1fr 46px 12px 46px 1fr 24px",gap:5,alignItems:"center",background:"#f9fafb",border:"1px solid #1e2d4a",borderRadius:8,padding:"6px 10px",marginBottom:5}}>
                  <span style={{color:"#9ca3af",fontSize:"0.7rem"}}>{m.date}</span>
                  <div style={{textAlign:"right",fontWeight:600,fontSize:"0.82rem"}}>{m.home}</div>
                  <input type="number" min="0" max="99" placeholder="-" style={S.scoreInput}
                    value={m.realHome??""} onChange={e=>setResult(m.id,"home",e.target.value)} />
                  <span style={{color:"#9ca3af",fontSize:"0.68rem",textAlign:"center"}}>VS</span>
                  <input type="number" min="0" max="99" placeholder="-" style={S.scoreInput}
                    value={m.realAway??""} onChange={e=>setResult(m.id,"away",e.target.value)} />
                  <div style={{fontWeight:600,fontSize:"0.82rem"}}>{m.away}</div>
                  <span style={{fontSize:"0.8rem",color:m.realHome!==null?"#27ae60":"#9ca3af"}}>
                    {m.realHome!==null?"OK":"..."}
                  </span>
                </div>
              ))}
            </>
          )}
          {activePhase==="elim" && (
            <>
              <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:12}}>
                {phases.map(ph=>(
                  <button key={ph} style={{...S.navBtn(activePh===ph),background:activePh===ph?phaseColors[ph]:"transparent",borderColor:phaseColors[ph]+"88",color:activePh===ph?"#fff":phaseColors[ph],fontSize:"0.75rem",padding:"4px 10px"}} onClick={()=>setActivePh(ph)}>{phaseLabels[ph]}</button>
                ))}
              </div>
              <div style={S.phaseHeader(phaseColors[activePh])}>{phaseLabels[activePh]}</div>
              {elimMatches.filter(m=>m.phase===activePh).map(m=>(
                <div key={m.id} style={{display:"grid",gridTemplateColumns:"38px 1fr 46px 12px 46px 1fr 24px",gap:5,alignItems:"center",background:"#f9fafb",border:"1px solid #1e2d4a",borderRadius:8,padding:"6px 10px",marginBottom:5}}>
                  <span style={{color:"#9ca3af",fontSize:"0.7rem"}}>{m.date}</span>
                  <div style={{textAlign:"right",fontWeight:600,fontSize:"0.82rem",color:"#6b7280"}}>{m.home}</div>
                  <input type="number" min="0" max="99" placeholder="-" style={S.scoreInput}
                    value={m.realHome??""} onChange={e=>setResult(m.id,"home",e.target.value)} />
                  <span style={{color:"#9ca3af",fontSize:"0.68rem",textAlign:"center"}}>VS</span>
                  <input type="number" min="0" max="99" placeholder="-" style={S.scoreInput}
                    value={m.realAway??""} onChange={e=>setResult(m.id,"away",e.target.value)} />
                  <div style={{fontWeight:600,fontSize:"0.82rem",color:"#6b7280"}}>{m.away}</div>
                  <span style={{fontSize:"0.8rem",color:m.realHome!==null?"#27ae60":"#9ca3af"}}>
                    {m.realHome!==null?"OK":"..."}
                  </span>
                </div>
              ))}
            </>
          )}
        </>
      )}

      {activeTab==="teams" && (
        <div>
          <p style={{color:"#6b7280",marginBottom:14,fontSize:"0.85rem"}}>Actualiza los equipos eliminatorias.</p>
          {phases.map(ph=>(
            <div key={ph}>
              <div style={S.phaseHeader(phaseColors[ph])}>{phaseLabels[ph]}</div>
              {elimMatches.filter(m=>m.phase===ph).map((m)=>(
                <div key={m.id} style={{display:"grid",gridTemplateColumns:"1fr 30px 1fr",gap:6,alignItems:"center",marginBottom:7}}>
                  <input style={{...S.input,textAlign:"right",marginBottom:0}} value={m.home}
                    onChange={e=>setTeamName(m.id,"home",e.target.value)} />
                  <div style={{textAlign:"center",color:"#9ca3af",fontWeight:700}}>VS</div>
                  <input style={{...S.input,marginBottom:0}} value={m.away}
                    onChange={e=>setTeamName(m.id,"away",e.target.value)} />
                </div>
              ))}
            </div>
          ))}
          <button style={{...S.btn(),marginTop:14}} onClick={handleSave}>Guardar Equipos</button>
        </div>
      )}

      {activeTab==="locks" && (
        <div>
          <p style={{color:"#6b7280",marginBottom:14,fontSize:"0.85rem"}}>Bloquea o desbloquea manualmente cada fase para pruebas o correcciones.</p>


          {/* GRUPOS - bloqueo general */}
          {(()=>{
            const phase="groups";
            const color="#1F618D";
            const manLocked=!!adminUnlocked[phase+"_forced"];
            const autoLocked=isPhaseLocked(phase,adminUnlocked);
            const manUnlocked=!!adminUnlocked[phase];
            const isLocked = manLocked || (autoLocked && !manUnlocked);
            return (
              <div style={{marginBottom:20}}>
                <div style={{fontWeight:800,fontSize:"0.8rem",color:"#6b7280",letterSpacing:2,marginBottom:8}}>FASE DE GRUPOS</div>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:"#f9fafb",border:"1px solid "+color+"44",borderRadius:10,padding:"12px 16px",flexWrap:"wrap",gap:8}}>
                  <div>
                    <div style={{fontWeight:700,fontSize:"0.95rem",color:"#111827"}}>Todos los grupos</div>
                    <div style={{fontSize:"0.75rem",color:"#9ca3af",marginTop:2}}>Bloqueo automático: 10 Jun 2026 00:00</div>
                    <div style={{fontSize:"0.8rem",marginTop:3,fontWeight:600,color:isLocked?"#e74c3c":"#16a34a"}}>
                      {isLocked ? "🔒 BLOQUEADO" : "🔓 ABIERTO"}
                    </div>
                  </div>
                  <button
                    style={{...S.btn(isLocked?"#16a34a":"#e74c3c",true),fontSize:"0.78rem",padding:"6px 14px"}}
                    onClick={async ()=>{
                      const updated = isLocked
                        ? {...adminUnlocked, [phase]:true, [phase+"_forced"]:false}
                        : {...adminUnlocked, [phase]:false, [phase+"_forced"]:true};
                      setAdminUnlocked(updated);
                      await setDoc(SETTINGS_DOC, {adminUnlocked: updated});
                    }}>
                    {isLocked ? "Desbloquear" : "Bloquear"}
                  </button>
                </div>
              </div>
            );
          })()}

          {/* ELIMINATORIAS - bloqueo por partido */}
          {[
            {phase:"round32",label:"Ronda de 32",color:"#0369a1",lockDate:"28 Jun 2026"},
            {phase:"round16",label:"Ronda de 16",color:"#7c3aed",lockDate:"4 Jul 2026"},
            {phase:"quarters",label:"Cuartos de Final",color:"#c0392b",lockDate:"9 Jul 2026"},
            {phase:"semis",label:"Semifinales",color:"#e67e22",lockDate:"14 Jul 2026"},
            {phase:"third",label:"Tercer Lugar",color:"#2980b9",lockDate:"18 Jul 2026"},
            {phase:"final",label:"Gran Final",color:"#d3172e",lockDate:"19 Jul 2026"},
          ].map(({phase,label,color,lockDate})=>{
            const phaseMatches = matches.filter(m=>m.phase===phase);
            const phaseManLocked=!!adminUnlocked[phase+"_forced"];
            const phaseAutoLocked=isPhaseLocked(phase,adminUnlocked);
            const phaseManUnlocked=!!adminUnlocked[phase];
            const phaseLocked = phaseManLocked || (phaseAutoLocked && !phaseManUnlocked);
            return (
              <div key={phase} style={{marginBottom:20}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8,flexWrap:"wrap",gap:6}}>
                  <div style={{fontWeight:800,fontSize:"0.8rem",color:"#6b7280",letterSpacing:2}}>{label.toUpperCase()}</div>
                  <div style={{display:"flex",gap:6,alignItems:"center"}}>
                    <span style={{fontSize:"0.72rem",color:"#9ca3af"}}>Auto: {lockDate}</span>
                    <button
                      style={{...S.btn(phaseLocked?"#16a34a":"#e74c3c",true),fontSize:"0.72rem",padding:"4px 10px"}}
                      onClick={async ()=>{
                        const updated = phaseLocked
                          ? {...adminUnlocked, [phase]:true, [phase+"_forced"]:false}
                          : {...adminUnlocked, [phase]:false, [phase+"_forced"]:true};
                        setAdminUnlocked(updated);
                        await setDoc(SETTINGS_DOC, {adminUnlocked: updated});
                      }}>
                      {phaseLocked ? "Desbloquear todo" : "Bloquear todo"}
                    </button>
                  </div>
                </div>
                {phaseMatches.map(m=>{
                  const matchManLocked=!!adminUnlocked["match_"+m.id+"_forced"];
                  const matchManUnlocked=!!adminUnlocked["match_"+m.id];
                  const matchLocked = isMatchLocked(m, adminUnlocked);
                  return (
                    <div key={m.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:"#f9fafb",border:"1px solid "+color+"33",borderRadius:8,padding:"9px 12px",marginBottom:6,flexWrap:"wrap",gap:6}}>
                      <div>
                        <div style={{fontWeight:600,fontSize:"0.85rem",color:"#111827"}}>P{m.matchNum} · {m.date} · {m.home} vs {m.away}</div>
                        <div style={{fontSize:"0.72rem",marginTop:2,fontWeight:600,color:matchLocked?"#e74c3c":"#16a34a"}}>
                          {matchLocked ? "🔒 Bloqueado" : "🔓 Abierto"}
                          {matchManLocked && <span style={{color:"#9ca3af"}}> (manual)</span>}
                          {matchManUnlocked && <span style={{color:"#9ca3af"}}> (desbloqueado)</span>}
                        </div>
                      </div>
                      <button
                        style={{...S.btn(matchLocked?"#16a34a":"#e74c3c",true),fontSize:"0.72rem",padding:"4px 10px"}}
                        onClick={async ()=>{
                          let updated;
                          if (matchLocked) {
                            updated = {...adminUnlocked, ["match_"+m.id]:true, ["match_"+m.id+"_forced"]:false};
                          } else {
                            updated = {...adminUnlocked, ["match_"+m.id]:false, ["match_"+m.id+"_forced"]:true};
                          }
                          setAdminUnlocked(updated);
                          await setDoc(SETTINGS_DOC, {adminUnlocked: updated});
                        }}>
                        {matchLocked ? "Desbloquear" : "Bloquear"}
                      </button>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {activeTab==="pinreqs" && (
        <div>
          <div style={S.sectionTitle}>Solicitudes de Recuperación de PIN</div>
          {pendingPinReqs.length===0 && (
            <div style={{color:"#9ca3af",padding:20,textAlign:"center"}}>No hay solicitudes pendientes</div>
          )}
          {(pinRequests||[]).map(req=>(
            <div key={req.id} style={{...S.card, marginBottom:10, borderLeft:"4px solid "+(req.status==="pending"?"#f59e0b":req.status==="resolved"?"#16a34a":"#9ca3af")}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:8}}>
                <div>
                  <div style={{fontWeight:700,fontSize:"0.95rem",color:"#111827"}}>{req.name}</div>
                  <div style={{fontSize:"0.78rem",color:"#6b7280",marginTop:2}}>{req.email}</div>
                  {req.telefono && <div style={{fontSize:"0.78rem",color:"#6b7280"}}>{req.telefono}</div>}
                  <div style={{fontSize:"0.72rem",color:"#9ca3af",marginTop:4}}>{new Date(req.createdAt).toLocaleString()}</div>
                </div>
                <div style={{display:"flex",gap:6,alignItems:"center"}}>
                  <span style={{background:req.status==="pending"?"#fef3c7":req.status==="resolved"?"#f0fdf4":"#f3f4f6",color:req.status==="pending"?"#b45309":req.status==="resolved"?"#16a34a":"#9ca3af",borderRadius:20,padding:"3px 10px",fontSize:"0.72rem",fontWeight:700}}>
                    {req.status==="pending"?"Pendiente":req.status==="resolved"?"Resuelto":"Descartado"}
                  </span>
                  {req.status==="pending" && (
                    <>
                      <button
                        style={{...S.btn("#16a34a"),fontSize:"0.78rem",padding:"5px 12px"}}
                        onClick={async ()=>{
                          const user = participants.find(p=>p.email&&p.email.toLowerCase()===req.email.toLowerCase());
                          if(!user){alert("Usuario no encontrado");return;}
                          const newPin = "1234";
                          const updatedUser = {...user, pin:newPin};
                          const newParticipants = [...participants.filter(p=>p.id!==user.id), updatedUser];
                          await setDoc(PARTICIPANTS_DOC, {list:newParticipants});
                          setParticipants(newParticipants);
                          const updatedReqs = (pinRequests||[]).map(r=>r.id===req.id?{...r,status:"resolved",resolvedAt:new Date().toISOString(),newPin}:r);
                          await setDoc(PIN_REQUESTS_DOC, {list:updatedReqs});
                          setPinRequests(updatedReqs);
                          alert("✅ PIN reseteado a 1234 para "+req.name+". Notifica al usuario.");
                        }}>
                        Resetear PIN a 1234
                      </button>
                      <button
                        style={{...S.btn("#6b7280",true),fontSize:"0.78rem",padding:"5px 10px"}}
                        onClick={async ()=>{
                          const updatedReqs = (pinRequests||[]).map(r=>r.id===req.id?{...r,status:"dismissed"}:r);
                          await setDoc(PIN_REQUESTS_DOC, {list:updatedReqs});
                          setPinRequests(updatedReqs);
                        }}>
                        Descartar
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab==="users" && (
        <div>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14,flexWrap:"wrap",gap:8}}>
            <div style={{...S.sectionTitle,marginBottom:0,borderBottom:"none"}}>{participants.length} Participantes</div>
            <button style={{...S.btn("#16a34a"),fontSize:"0.8rem",padding:"7px 14px"}} onClick={()=>{
              const ranked = [...participants].map(p=>{
                const userInv=(invoices||[]).filter(inv=>inv.participantId===p.id&&inv.status==="approved");
                const invPts=userInv.reduce((sum,inv)=>sum+calcInvoicePoints(inv.amount),0);
                let gamePts=0;
                matches.forEach(m=>{const pred=p.predictions?.[m.id];if(!pred)return;const pts=calcPoints(pred.home,pred.away,m.realHome,m.realAway);if(pts!==null)gamePts+=pts;});
                const {bonus:classPts}=calcClassificationBonus(p.predictions,matches);
                return {...p,_total:gamePts+invPts+classPts,_invPts:invPts,_classPts:classPts};
              }).sort((a,b)=>b._total-a._total);
              const headers = ["Posicion","Nombre","Apellido","Correo","Telefono","Sucursal","Puntos Pronosticos","Puntos Clasificados","Puntos Facturas","Total Puntos","Facturas Registradas","Fecha Registro"];
              const rows = ranked.map((p,i)=>[
                i+1,
                p.nombre||p.name||"",
                p.apellido||"",
                p.email||"",
                p.telefono||"",
                p.sucursal||"",
                p._total-p._invPts-p._classPts,
                p._classPts||0,
                p._invPts,
                p._total,
                (invoices||[]).filter(inv=>inv.participantId===p.id).length,
                p.createdAt?new Date(p.createdAt).toLocaleDateString():"",
              ]);
              const csv = [headers,...rows].map(r=>r.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(",")).join("\n");
              const blob = new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8;"});
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href=url; a.download="participantes-mundial2026.csv"; a.click();
              URL.revokeObjectURL(url);
            }}>
              Exportar a Excel (CSV)
            </button>
          </div>
          {participants.length===0 && <div style={{color:"#9ca3af",padding:16}}>Sin participantes</div>}
          {[...participants].map(p=>{
            const userInv=(invoices||[]).filter(inv=>inv.participantId===p.id&&inv.status==="approved");
            const invPts=userInv.reduce((sum,inv)=>sum+calcInvoicePoints(inv.amount),0);
            const totalInv=(invoices||[]).filter(inv=>inv.participantId===p.id).length;
            let gamePts=0,exact=0,correct=0;
            matches.forEach(m=>{const pred=p.predictions?.[m.id];if(!pred)return;const pts=calcPoints(pred.home,pred.away,m.realHome,m.realAway);if(pts===null)return;gamePts+=pts;if(pts===5)exact++;if(pts>=3)correct++;});
            const {bonus:classPts}=calcClassificationBonus(p.predictions,matches);
            return {...p,_total:gamePts+invPts+classPts,_invPts:invPts,_classPts:classPts,_exact:exact,_correct:correct,_totalInv:totalInv};
          }).sort((a,b)=>b._total-a._total).map((p,i)=>(
            <AdminParticipantRow key={p.id} p={p} i={i} participants={participants} setParticipants={setParticipants} invoices={invoices} matches={matches} removeParticipant={removeParticipant} />
          ))}
        </div>
      )}
    </div>
  );
}

// MAIN APP
export default function App() {
  const isAdmin = typeof window !== "undefined" && window.location.search.includes("admin");
  const [view, setView] = useState("leaderboard");
  const [lang, setLang] = useState("fr");
  const [matches, setMatches] = useState(INITIAL_MATCHES);
  const [participants, setParticipants] = useState([]);
  const [adminUnlocked, setAdminUnlocked] = useState({});
  const [invoices, setInvoices] = useState([]);
  const [pinRequests, setPinRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  // Global session - survives tab navigation
  const [currentUser, setCurrentUser] = useState(() => {
    try { const s=localStorage.getItem("sl_user"); return s?JSON.parse(s):null; } catch(e){return null;}
  });

  useEffect(() => {
    const unsubP = onSnapshot(PARTICIPANTS_DOC, snap => {
      if (snap.exists()) setParticipants(snap.data().list || []);
    });
    const unsubM = onSnapshot(MATCHES_DOC, snap => {
      if (snap.exists()) {
        const saved = snap.data().list || [];
        // Merge: keep new match structure but restore saved results & team names for elim
        const merged = INITIAL_MATCHES.map(m => {
          const old = saved.find(s => s.id === m.id);
          if (!old) return m;
          if (m.phase === "groups") {
            // Groups: keep new team names, only restore real results
            return {...m, realHome: old.realHome, realAway: old.realAway};
          } else {
            // Playoffs: restore team names + results (admin edits them)
            return {...m, home: old.home||m.home, away: old.away||m.away, realHome: old.realHome, realAway: old.realAway};
          }
        });
        setMatches(merged);
      } else {
        setMatches(INITIAL_MATCHES);
      }
    });
    const unsubS = onSnapshot(SETTINGS_DOC, snap => {
      if (snap.exists()) setAdminUnlocked(snap.data().adminUnlocked || {});
    });
    const unsubI = onSnapshot(INVOICES_DOC, snap => {
      if (snap.exists()) setInvoices(snap.data().list || []);
      setLoading(false);
    });
    const unsubR = onSnapshot(PIN_REQUESTS_DOC, snap => {
      if (snap.exists()) setPinRequests(snap.data().list || []);
    });
    setTimeout(() => setLoading(false), 3000);
    return () => { unsubP(); unsubM(); unsubS(); unsubI(); unsubR(); };
  }, []);

  const t = T[lang];
  const tabs = [
    ...(currentUser ? [{id:"predictions", label:t.nav.inicio}] : []),
    {id:"clasificacion", label:t.nav.clasificacion},
    {id:"leaderboard", label:t.nav.reglamento},
    {id:"fixture", label:t.nav.resultados},
    ...(isAdmin ? [{id:"admin", label:t.nav.admin}] : []),
  ];

  const totalMatches = matches.filter(m=>m.realHome!==null).length;
  const pendingInv = invoices.filter(i=>i.status==="pending").length;

  if (loading) return (
    <LangContext.Provider value={lang}>
    <div style={{...S.app,display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh"}}>
      <FontStyle />
      <div style={{textAlign:"center"}}>
        <img src="data:image/jpeg;base64"
          alt="Sabor Latino" style={{height:60,marginBottom:16,opacity:.8}} />
        <div style={{fontSize:"2rem",marginBottom:8,color:BRAND.red}} className="pulse">...</div>
        <div style={{color:BRAND.gray400,fontSize:"0.85rem",letterSpacing:3}}>{t.status.loading}</div>
      </div>
    </div>
    </LangContext.Provider>
  );

  return (
    <LangContext.Provider value={lang}>
    <div style={S.app}>
      <FontStyle />
      <header style={S.header}>
        <div style={S.headerInner}>
          <div style={S.logo}>
            <img
              src="data:image/jpeg;base64"
              alt="Sabor Latino"
              style={{height:44, width:"auto", objectFit:"contain", borderRadius:4}}
              onError={e=>{e.target.style.display="none";}}
            />
            <div>
              <div style={{fontSize:"0.65rem",color:BRAND.red,fontWeight:800,letterSpacing:2,textTransform:"uppercase"}}>Concurso</div>
              <div style={{fontSize:"1rem",fontWeight:800,color:BRAND.gray900,letterSpacing:1}}>Mundial 2026</div>
            </div>
          </div>
          <nav style={{...S.nav, alignItems:"center"}}>
            {tabs.map(t=>(
              <button key={t.id} style={S.navBtn(view===t.id)} onClick={()=>setView(t.id)}>
                {t.label}
                {t.id==="admin"&&pendingInv>0 && (
                  <span style={{background:BRAND.red,color:"#fff",borderRadius:"50%",padding:"1px 6px",fontSize:"0.7rem",marginLeft:5}}>{pendingInv}</span>
                )}
              </button>
            ))}
            {!currentUser ? (
              <button
                title="Iniciar Sesion"
                onClick={()=>setView("login")}
                style={{background:"none",border:"none",cursor:"pointer",padding:"6px 8px",display:"flex",alignItems:"center",color:view==="login"?BRAND.red:"#6b7280",borderRadius:6,transition:"color 0.15s",marginLeft:2}}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="8" r="4"/>
                  <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                </svg>
              </button>
            ) : (
              <button
                title={currentUser.name}
                onClick={()=>setView("predictions")}
                style={{background:(view==="login"||view==="predictions")?BRAND.red:"#e5e7eb",border:"none",cursor:"pointer",borderRadius:"50%",width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:"0.85rem",color:(view==="login"||view==="predictions")?"#fff":BRAND.gray900,marginLeft:4,transition:"background 0.15s"}}
              >
                {(currentUser.nombre||currentUser.name||"?")[0].toUpperCase()}
              </button>
            )}
            {/* Lang toggle */}
            <button
              onClick={()=>setLang(l=>l==="fr"?"es":"fr")}
              title={lang==="fr"?"Ver en Español":"Voir en Français"}
              style={{marginLeft:6,background:"none",border:"1px solid #e5e7eb",borderRadius:6,cursor:"pointer",padding:"4px 8px",fontSize:"0.72rem",fontWeight:700,color:BRAND.gray600,letterSpacing:0.5,lineHeight:1.2,transition:"all 0.15s"}}
            >
              {lang==="fr"?"ES":"FR"}
            </button>
          </nav>
        </div>
        <div style={{background:BRAND.red,padding:"4px 16px",textAlign:"center",fontSize:"0.7rem",color:"rgba(255,255,255,0.85)",letterSpacing:1}}>
          {participants.length} {t.status.participants} &nbsp;|&nbsp; {totalMatches} {t.status.matches} &nbsp;|&nbsp; 11 JUN - 19 JUL 2026
          {(() => {
            const diff = Math.ceil((new Date("2026-06-11") - new Date()) / (1000*60*60*24));
            if (diff > 0) return <> &nbsp;|&nbsp; 🏆 {diff} {lang==="fr"?`jour${diff!==1?"s":""} avant le Mondial`:`día${diff!==1?"s":""} para el Mundial`}</>;
            if (diff === 0) return <> &nbsp;|&nbsp; 🏆 {lang==="fr"?"Le Mondial commence aujourd'hui !":"¡El Mundial empieza hoy!"}</>;
            return null;
          })()}
        </div>
      </header>

      <main style={S.main}>
        <ErrorBoundary>
        {view==="clasificacion" && <ClasificacionView participants={participants} matches={matches} invoices={invoices} currentUser={currentUser} />}
        {view==="leaderboard" && <ReglamentoView />}
        {(view==="predictions"||view==="login") && <ParticipantForm participants={participants} setParticipants={setParticipants} matches={matches} adminUnlocked={adminUnlocked} invoices={invoices} setInvoices={setInvoices} currentUser={currentUser} setCurrentUser={setCurrentUser} setView={setView} initialStep={view==="login"?"login":undefined} />}
        {view==="fixture" && <FixtureView matches={matches} />}
        {view==="admin" && <AdminPanel matches={matches} setMatches={setMatches} participants={participants} setParticipants={setParticipants} adminUnlocked={adminUnlocked} setAdminUnlocked={setAdminUnlocked} invoices={invoices} setInvoices={setInvoices} pinRequests={pinRequests} setPinRequests={setPinRequests} />}
        </ErrorBoundary>
      </main>
    </div>
    </LangContext.Provider>
  );
}

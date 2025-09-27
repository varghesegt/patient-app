import { useState, useRef } from "react";

export const SYMPTOMS = {
  General: [
    "Fever", "Fatigue", "Weakness", "Loss of appetite", "Night sweats", "Chills",
    "Weight loss", "Malaise", "Swelling", "Dehydration", "Excessive sweating",
    "Paleness", "Generalized body pain",
  ],
  Cardiac: [
    "Chest pain", "Shortness of breath", "Palpitations", "Dizziness", "Fainting",
    "Rapid heartbeat", "Irregular heartbeat", "Swelling in legs", "Cold extremities",
    "Blue lips", "Chest pressure", "Orthopnea",
  ],
  Respiratory: [
    "Cough", "Sore throat", "Wheezing", "Difficulty breathing", "Runny nose",
    "Nasal congestion", "Sneezing", "Chest tightness", "Bloody cough", "Hoarseness",
    "Stridor", "Rapid breathing",
  ],
  Neurological: [
    "Headache", "Confusion", "Seizures", "Slurred speech", "Numbness", "Tingling",
    "Weakness on one side", "Memory loss", "Tremors", "Loss of consciousness",
    "Dizziness", "Balance problems", "Vision problems", "Difficulty concentrating",
    "Sleep disturbances", "Facial droop",
  ],
  Gastrointestinal: [
    "Nausea", "Vomiting", "Diarrhea", "Loose motion", "Abdominal pain",
    "Constipation", "Heartburn", "Indigestion", "Bloating", "Blood in stool",
    "Loss of appetite", "Difficulty swallowing", "Acid reflux", "Rectal pain",
    "Black/tarry stool",
  ],
  Musculoskeletal: [
    "Joint pain", "Back pain", "Neck pain", "Shoulder pain", "Knee pain", "Foot pain",
    "Ankle pain", "Hip pain", "Elbow pain", "Wrist pain", "Muscle weakness",
    "Muscle pain", "Stiffness", "Swelling of joints", "Cramps", "Limited mobility",
    "Bone pain",
  ],
  Dermatology: [
    "Rash", "Itching", "Skin dryness", "Bruising easily", "Redness", "Swelling",
    "Hives", "Hair loss", "Acne", "Skin peeling", "Ulcers", "Skin darkening",
    "Skin lightening", "Blisters", "Scaly patches",
  ],
  Endocrine: [
    "Excessive thirst", "Frequent urination", "Heat intolerance", "Cold intolerance",
    "Weight gain", "Weight loss", "Hair thinning", "Sweating",
    "Increased appetite", "Goiter",
  ],
  MentalHealth: [
    "Anxiety", "Depression", "Insomnia", "Irritability", "Mood swings",
    "Hallucinations", "Paranoia", "Loss of interest", "Poor concentration",
    "Social withdrawal", "Suicidal thoughts",
  ],
  Ophthalmology: [
    "Blurred vision", "Double vision", "Eye pain", "Red eyes", "Watery eyes",
    "Light sensitivity", "Loss of vision", "Itchy eyes", "Swollen eyelids",
    "Floaters", "Dry eyes",
  ],
  ENT: [
    "Ear pain", "Hearing loss", "Ringing in ears", "Vertigo", "Nasal blockage",
    "Postnasal drip", "Loss of smell", "Sinus pain", "Nosebleeds", "Sore mouth",
    "Swollen tonsils",
  ],
  Urology: [
    "Painful urination", "Blood in urine", "Frequent urination", "Urgency",
    "Incontinence", "Difficulty urinating", "Lower abdominal pain", "Flank pain",
    "Weak urine stream", "Urinary retention",
  ],
  Gynecology: [
    "Irregular periods", "Heavy bleeding", "Pelvic pain", "Vaginal discharge",
    "Pain during intercourse", "Missed period", "Breast tenderness",
    "Menstrual cramps", "Hot flashes",
  ],
  Pediatrics: [
    "Irritability in child", "Poor feeding", "Failure to thrive", "Developmental delay",
    "Seizures in child", "Persistent crying", "Delayed speech",
    "Recurrent infections", "Feeding difficulties",
  ],
  Orthopedics: [
    "Fracture", "Dislocation", "Swelling of bone", "Difficulty walking",
    "Stiff joints", "Shoulder stiffness", "Hip stiffness",
  ],
};


const symptomWeights = {
  // General
  Fever: 20, Fatigue: 10, Weakness: 15, "Loss of appetite": 10, "Night sweats": 15,
  Chills: 15, "Weight loss": 25, Malaise: 10, Swelling: 30, Dehydration: 25,
  "Excessive sweating": 10, Paleness: 20, "Generalized body pain": 15,

  // Cardiac
  "Chest pain": 70, "Chest pressure": 70, "Shortness of breath": 50,
  Palpitations: 25, Dizziness: 40, Fainting: 60, "Rapid heartbeat": 40,
  "Irregular heartbeat": 40, "Swelling in legs": 30, "Cold extremities": 70,
  "Blue lips": 70, Orthopnea: 50,

  // Respiratory
  "Difficulty breathing": 70, Wheezing: 30, Cough: 10, "Bloody cough": 50,
  "Chest tightness": 40, Stridor: 60, "Rapid breathing": 30, "Sore throat": 10,
  "Runny nose": 5, "Nasal congestion": 5, Sneezing: 5, Hoarseness: 10,

  // Neurological
  "Slurred speech": 70, Seizures: 70, "Weakness on one side": 70,
  "Facial droop": 70, Confusion: 40, "Loss of consciousness": 80,
  Headache: 20, "Vision problems": 30, Dizziness: 25, "Balance problems": 25,
  "Memory loss": 20, Tingling: 15, Numbness: 20, Tremors: 15,

  // Gastrointestinal
  "Abdominal pain": 40, Vomiting: 15, "Persistent vomiting": 30,
  Diarrhea: 20, "Loose motion": 20, Constipation: 10, "Heartburn": 10,
  "Indigestion": 10, Bloating: 10, "Blood in stool": 50,
  "Black/tarry stool": 50, "Difficulty swallowing": 40,

  // Musculoskeletal
  "Joint pain": 10, "Back pain": 10, "Neck pain": 10, "Shoulder pain": 10,
  "Knee pain": 10, "Foot pain": 10, "Ankle pain": 10, "Hip pain": 10,
  "Elbow pain": 10, "Wrist pain": 10, "Muscle weakness": 20, "Muscle pain": 10,
  Stiffness: 10, "Swelling of joints": 15, Cramps: 10, "Limited mobility": 30,
  "Bone pain": 20, Fracture: 70, Dislocation: 70,

  // Dermatology
  Rash: 10, Itching: 5, "Skin dryness": 5, "Bruising easily": 15, Redness: 5,
  "Hives": 40, "Hair loss": 10, Acne: 5, "Skin peeling": 10, Ulcers: 20,
  "Skin darkening": 10, "Skin lightening": 10, Blisters: 15, "Scaly patches": 10,

  // Endocrine
  "Excessive thirst": 20, "Frequent urination": 20, "Heat intolerance": 15,
  "Cold intolerance": 15, "Weight gain": 15, "Goiter": 25,

  // Mental Health
  Anxiety: 10, Depression: 10, Insomnia: 10, Irritability: 10, "Mood swings": 10,
  Hallucinations: 30, Paranoia: 30, "Suicidal thoughts": 70,

  // Ophthalmology
  "Blurred vision": 20, "Double vision": 20, "Eye pain": 40, "Loss of vision": 70,
  "Light sensitivity": 15, "Red eyes": 10, "Dry eyes": 5,

  // ENT
  "Hearing loss": 20, "Ringing in ears": 10, Vertigo: 30,
  "Swollen tonsils": 20, "Nosebleeds": 20,

  // Urology
  "Painful urination": 20, "Blood in urine": 40, "Urinary retention": 30,
  "Difficulty urinating": 25, Incontinence: 20,

  // Gynecology
  "Heavy bleeding": 40, "Pelvic pain": 40, "Vaginal discharge": 20,
  "Missed period": 10, "Menstrual cramps": 15,

  // Pediatrics
  "Seizures in child": 70, "Failure to thrive": 30, "Persistent crying": 20,

  // Orthopedics
  "Swelling of bone": 30, "Difficulty walking": 30,
};

/** ================================
 *  Special Rule-based Emergencies
 *  ================================ */
const symptomRules = [
  // 🔴 General Emergencies
  { pattern: /fever.*rash/i, category: "General", weight: 40, reason: "Fever with rash — possible meningitis or sepsis" },
  { pattern: /high fever.*stiff neck/i, category: "Neurological", weight: 80, reason: "Fever with stiff neck — possible meningitis" },
  { pattern: /weight loss.*night sweats/i, category: "General", weight: 50, reason: "Unexplained weight loss with night sweats — possible TB or cancer" },
  { pattern: /sudden collapse/i, category: "General", weight: 95, reason: "Sudden collapse — possible cardiac arrest" },

  // ❤️ Cardiac
  { pattern: /chest (pain|tightness).*faint/i, category: "Cardiac", weight: 90, reason: "Chest pain with fainting — high risk of heart attack" },
  { pattern: /chest (pain|pressure).*sweating/i, category: "Cardiac", weight: 90, reason: "Chest pain with sweating — possible myocardial infarction" },
  { pattern: /shortness of breath.*chest pain/i, category: "Cardiac", weight: 80, reason: "Shortness of breath with chest pain — possible heart failure or embolism" },
  { pattern: /palpitations.*dizziness/i, category: "Cardiac", weight: 70, reason: "Palpitations with dizziness — possible arrhythmia" },
  { pattern: /sudden cardiac arrest|no pulse/i, category: "Cardiac", weight: 100, reason: "No pulse — cardiac arrest, needs CPR" },

  // 🫁 Respiratory
  { pattern: /difficulty breathing.*blue lips/i, category: "Respiratory", weight: 90, reason: "Difficulty breathing with blue lips — severe hypoxia" },
  { pattern: /cough.*blood/i, category: "Respiratory", weight: 70, reason: "Coughing blood — possible TB or lung cancer" },
  { pattern: /asthma.*not improving/i, category: "Respiratory", weight: 85, reason: "Severe asthma attack — life threatening" },
  { pattern: /stridor|noisy breathing/i, category: "Respiratory", weight: 85, reason: "Noisy breathing — airway obstruction" },
  { pattern: /sudden shortness of breath.*leg swelling/i, category: "Respiratory", weight: 85, reason: "Possible pulmonary embolism" },

  // 🧠 Neurological
  { pattern: /unconscious|not waking up/i, category: "Neurological", weight: 95, reason: "Unconscious — life threatening emergency" },
  { pattern: /sudden weakness.*one side/i, category: "Neurological", weight: 90, reason: "Sudden weakness on one side — possible stroke" },
  { pattern: /slurred speech.*facial droop/i, category: "Neurological", weight: 90, reason: "Slurred speech with facial droop — possible stroke" },
  { pattern: /seizure.*continuous|status epilepticus/i, category: "Neurological", weight: 95, reason: "Prolonged seizure — urgent emergency" },
  { pattern: /severe headache.*vomiting/i, category: "Neurological", weight: 80, reason: "Severe headache with vomiting — possible brain bleed" },
  { pattern: /confusion.*disoriented/i, category: "Neurological", weight: 75, reason: "Confusion/disorientation — possible delirium or brain injury" },

  // 🍽️ Gastrointestinal
  { pattern: /vomiting.*blood/i, category: "Gastrointestinal", weight: 80, reason: "Vomiting blood — GI bleed" },
  { pattern: /black.*stool/i, category: "Gastrointestinal", weight: 70, reason: "Black tarry stool — possible internal bleeding" },
  { pattern: /abdominal pain.*rigidity/i, category: "Gastrointestinal", weight: 85, reason: "Severe abdominal pain with rigidity — possible perforation" },
  { pattern: /yellow skin|jaundice/i, category: "Gastrointestinal", weight: 60, reason: "Jaundice — possible liver disease" },
  { pattern: /severe diarrhea.*dehydration/i, category: "Gastrointestinal", weight: 75, reason: "Severe diarrhea with dehydration — dangerous fluid loss" },

  // 🦵 Trauma / Musculoskeletal
  { pattern: /(severe injury|bleeding|hemorrhage)/i, category: "Trauma", weight: 85, reason: "Severe bleeding — urgent trauma care" },
  { pattern: /fracture.*bone exposed/i, category: "Trauma", weight: 90, reason: "Open fracture — immediate surgical emergency" },
  { pattern: /head injury.*loss of consciousness/i, category: "Trauma", weight: 90, reason: "Head injury with LOC — possible brain trauma" },
  { pattern: /burn.*blister.*large/i, category: "Trauma", weight: 85, reason: "Severe burns — fluid loss and infection risk" },

  // 🧪 Endocrine / Metabolic
  { pattern: /excessive thirst.*frequent urination/i, category: "Endocrine", weight: 50, reason: "Classic diabetes symptoms" },
  { pattern: /confusion.*sweating.*shaking/i, category: "Endocrine", weight: 80, reason: "Confusion with sweating/shaking — possible hypoglycemia" },
  { pattern: /vomiting.*abdominal pain.*diabetic/i, category: "Endocrine", weight: 90, reason: "Diabetic with vomiting + pain — possible ketoacidosis" },
  { pattern: /sudden weight gain.*swelling/i, category: "Endocrine", weight: 60, reason: "Fluid retention — possible thyroid/adrenal issue" },

  // 👁 Ophthalmology
  { pattern: /sudden vision loss/i, category: "Ophthalmology", weight: 90, reason: "Sudden vision loss — retinal artery occlusion or stroke" },
  { pattern: /eye pain.*blurred vision/i, category: "Ophthalmology", weight: 80, reason: "Eye pain with blurred vision — acute glaucoma" },
  { pattern: /flashes.*floaters.*vision loss/i, category: "Ophthalmology", weight: 85, reason: "Retinal detachment risk" },

  // 👶 Pediatrics
  { pattern: /child.*seizure/i, category: "Pediatrics", weight: 90, reason: "Seizure in child — urgent pediatric emergency" },
  { pattern: /infant.*not feeding/i, category: "Pediatrics", weight: 80, reason: "Infant refusing feeds — possible severe illness" },
  { pattern: /persistent crying.*fever/i, category: "Pediatrics", weight: 70, reason: "Persistent crying with fever — possible infection" },
  { pattern: /baby.*bulging fontanelle/i, category: "Pediatrics", weight: 85, reason: "Bulging fontanelle — possible meningitis or raised ICP" },

  // 🧠 Mental Health
  { pattern: /suicidal thoughts|want to die|kill myself/i, category: "MentalHealth", weight: 100, reason: "Suicidal ideation — immediate psychiatric emergency" },
  { pattern: /hallucinations.*aggression/i, category: "MentalHealth", weight: 70, reason: "Hallucinations with aggression — possible psychosis" },
  { pattern: /panic attack.*can't breathe/i, category: "MentalHealth", weight: 60, reason: "Severe panic attack — needs urgent reassurance/treatment" },
];

/** ================================
 *  Triage Hook
 *  ================================ */
export default function useTriage() {
  const [pendingAmbulance, setPendingAmbulance] = useState(null);
  const cancelRef = useRef(null);

  /** Mock ambulance request (replace with API) */
  const requestAmbulance = async ({ reason, urgency }) => {
    alert(`🚑 Ambulance requested!\nUrgency: ${urgency}\nReasons: ${reason.join(", ")}`);
    return true;
  };

  const normalize = (input) =>
    Array.isArray(input) ? input.join(" ").toLowerCase() : (input || "").toLowerCase();

  /** Main classifier */
  async function classify(input) {
    const text = normalize(input);
    let totalScore = 5;
    let reasons = [];
    let categoryScores = {};

    // Match dictionary symptoms
    Object.entries(symptomWeights).forEach(([symptom, weight]) => {
      if (text.includes(symptom.toLowerCase())) {
        totalScore += weight;
        reasons.push(`${symptom} detected`);
        // Find category
        Object.entries(SYMPTOMS).forEach(([cat, list]) => {
          if (list.includes(symptom)) {
            categoryScores[cat] = (categoryScores[cat] || 0) + weight;
          }
        });
      }
    });

    // Match rule-based emergencies
    symptomRules.forEach((rule) => {
      if (rule.pattern.test(text)) {
        totalScore += rule.weight;
        reasons.push(rule.reason);
        categoryScores[rule.category] = (categoryScores[rule.category] || 0) + rule.weight;
      }
    });

    totalScore = Math.min(100, totalScore);

    // Label assignment
    let label = "SAFE";
    if (totalScore >= 80) label = "CRITICAL";
    else if (totalScore >= 55) label = "URGENT";
    else if (totalScore >= 35) label = "CAUTION";

    const actionMap = {
      CRITICAL: { message: "🚨 Auto-booking ambulance in 10 seconds unless cancelled!", timeline: "Immediate (0–10 minutes)" },
      URGENT: { message: "⚠️ Seek ER/doctor within 2–4 hours — option to request ambulance", timeline: "Within few hours" },
      CAUTION: { message: "Book doctor appointment within 24 hrs", timeline: "Same/next day" },
      SAFE: { message: "Self-care / monitor at home", timeline: "Monitor over next 1–2 days" },
    };

    const confidence = Math.min(100, reasons.length * 12);

    // Handle auto-ambulance for critical cases
    if (label === "CRITICAL") {
      if (pendingAmbulance) clearTimeout(cancelRef.current);

      const timeoutId = setTimeout(() => {
        requestAmbulance({ reason: reasons, urgency: label });
        setPendingAmbulance(null);
      }, 10000);

      setPendingAmbulance({
        deadline: Date.now() + 10000,
        cancel: () => {
          clearTimeout(timeoutId);
          setPendingAmbulance(null);
        },
      });
      cancelRef.current = timeoutId;
    }

    return {
      score: totalScore,
      label,
      confidence,
      reasons,
      categoryBreakdown: categoryScores,
      suggestedAction: actionMap[label],
      pendingAmbulance,
    };
  }

  return { classify, pendingAmbulance };
}

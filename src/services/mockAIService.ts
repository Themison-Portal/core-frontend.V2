interface MockResponse {
  response: string;
  sources: Array<{
    section: string;
    page?: number;
    content: string;
  }>;
  downloadableTemplates?: Array<{
    title: string;
    type: 'worksheet' | 'checklist' | 'report';
    filename: string;
  }>;
  quickActions?: Array<{
    title: string;
    icon: string;
    action: string;
    type: 'download' | 'generate' | 'setup';
  }>;
}

interface MockResponses {
  [key: string]: MockResponse;
}

// Exact demo responses for BI Trial 1404-0002 Diabetes Protocol
const DIABETES_PROTOCOL_RESPONSES: MockResponses = {
  
  // Query 1: "Give me the inclusion/exclusion criteria for male patients 50-65 yo"
  "inclusion_exclusion_male": {
    response: `# Eligibility Checklist: Male Patients 50-65 years - BI Trial 1404-0002

## INCLUSION CRITERIA ✅
- [x] **Male patients 18-75 years** (Protocol Section 3.3.2 #2)
- [x] **T2DM diagnosis ≥6 months prior** (Protocol Section 3.3.2 #3)  
- [x] **HbA1c 7.0%-10.0% at screening** (Protocol Section 3.3.2 #4)
- [x] **Stable metformin ≥1000mg/day for ≥3 months** (Protocol Section 3.3.2 #5)
- [x] **BMI 25-50 kg/m² at screening** (Protocol Section 3.3.2 #6)
- [x] **Signed informed consent** (Protocol Section 3.3.2 #1)

## EXCLUSION CRITERIA ❌
- [ ] **Type 1 diabetes** (Protocol Section 3.3.3 #1)
- [ ] **HR >100 bpm or BP ≥160/95 mmHg** (Protocol Section 3.3.3 #7)
- [ ] **QT/QTc prolongation >450ms** (Protocol Section 3.3.3 #8)
- [ ] **Recent CV events within 6 months** (Protocol Section 3.3.3 #10)
- [ ] **eGFR <45 mL/min/1.73m²** (Protocol Section 3.3.3 #19)
- [ ] **ALT/AST >2.5x ULN** (Protocol Section 3.3.3 #21)

### Age-Specific Considerations (50-65 years):
- Enhanced cardiovascular screening required
- Consider additional cardiac monitoring
- Review medication interactions carefully`,
    sources: [
      {
        section: "Section 3.3.2 Inclusion Criteria",
        page: 15,
        content: "Male and female patients aged 18-75 years with T2DM diagnosis ≥6 months prior to screening."
      },
      {
        section: "Section 3.3.3 Exclusion Criteria", 
        page: 16,
        content: "Patients with Type 1 diabetes, recent cardiovascular events within 6 months, or significant renal impairment."
      }
    ],
    quickActions: [
      {
        title: "Generate Screening Checklist",
        icon: "FileDown",
        action: "male_eligibility_screening_checklist.pdf",
        type: "generate"
      },
      {
        title: "Setup Age-Based Alerts",
        icon: "Bell",
        action: "setup_age_based_monitoring",
        type: "setup"
      },
      {
        title: "Create Assessment Form",
        icon: "Settings",
        action: "male_assessment_form.pdf",
        type: "generate"
      }
    ]
  },

  // Query 2: "What are the required medical test checklist"
  "medical_test_checklist": {
    response: `# Medical Tests Checklist - BI Trial 1404-0002

## SCREENING VISIT (Week -2) 🩺
### Laboratory Tests Required:
- [ ] **HbA1c** (Central lab)
- [ ] **Complete Blood Count (CBC)**
- [ ] **Comprehensive Metabolic Panel (CMP)**
- [ ] **Liver Function Tests** (ALT, AST, Bilirubin)
- [ ] **Renal Function** (Creatinine, eGFR, BUN)
- [ ] **Lipid Profile** (Total, HDL, LDL, Triglycerides)
- [ ] **Urinalysis** + Microalbumin
- [ ] **TSH, Calcitonin**
- [ ] **Infectious Serology** (Hep B/C, HIV)

### Other Required Tests:
- [ ] **12-lead ECG** (triplicate)
- [ ] **Vital Signs** (BP, HR, temp, weight, height)
- [ ] **Physical Examination**
- [ ] **Pregnancy Test** (if applicable)
- [ ] **Urine Drug Screen**

## FOLLOW-UP VISITS (Weeks 2,4,8,12) 🔄
- [ ] **Safety Labs** (CBC, CMP, LFTs)
- [ ] **HbA1c** (Week 12 only)
- [ ] **Vital Signs & Weight**
- [ ] **ECG**

### Critical Values - Immediate Action Required:
- Glucose <50 or >400 mg/dL
- ALT/AST >5x ULN
- Creatinine >2x baseline`,
    sources: [
      {
        section: "Section 5.2.3 Laboratory Tests Flow Chart",
        page: 28,
        content: "Complete blood count, comprehensive metabolic panel, and liver function tests required at screening and safety visits."
      },
      {
        section: "Section 5.2.6 Critical Lab Values",
        page: 31,
        content: "Immediate action required for glucose <50 or >400 mg/dL, ALT/AST >5x ULN, or creatinine >2x baseline."
      }
    ],
    quickActions: [
      {
        title: "Add this checklist to a patient",
        icon: "UserPlus",
        action: "add_checklist_to_patient",
        type: "setup"
      },
      {
        title: "Generate Test Checklist",
        icon: "FileDown",
        action: "medical_tests_checklist.pdf",
        type: "generate"
      },
      {
        title: "Create Lab Tracking Form",
        icon: "Settings",
        action: "lab_results_tracking_form.pdf",
        type: "generate"
      },
      {
        title: "Setup Critical Value Alerts",
        icon: "Bell",
        action: "setup_critical_value_alerts",
        type: "setup"
      }
    ]
  },

  // Query 3: "What is the visit checklist for each patient?"
  "visit_checklist": {
    response: `# Visit Worksheet: Follow-up Visit - BI Trial 1404-0002
**Visit**: Week 4 Follow-up | **Patient ID**: [________] | **Date**: [____/____/____]

## PRE-VISIT PREPARATION 📋
- [ ] Confirm patient compliance via diary review
- [ ] Review concomitant medications
- [ ] Patient fasted for biomarker samples (if applicable)

## REQUIRED PROCEDURES ✅

### 1. COMPLIANCE ASSESSMENT
- [ ] **Pill count** - Record number returned
- [ ] **Patient diary review** - SMBG data, injection sites
- [ ] **Concomitant medication changes** - Document any

### 2. EFFICACY EVALUATIONS  
- [ ] **Glucose monitoring data** download from device
- [ ] **Body weight measurement** (same scale)
- [ ] **Waist circumference** (if Week 4/12)

### 3. SAFETY MONITORING
- [ ] **Vital signs** (BP, HR, weight) - seated, 5min rest
- [ ] **Adverse event assessment** - new/ongoing AEs
- [ ] **Physical examination** (Week 4/12 only)
- [ ] **Laboratory tests** (CBC, CMP, LFTs if Week 4/12)
- [ ] **12-lead ECG**

### 4. DRUG ADMINISTRATION & DISPENSING
- [ ] **Study drug administration** (in clinic)
- [ ] **Check injection site reactions**
- [ ] **Dispense next visit supply** 

### 5. DATA COLLECTION
- [ ] **C-SSRS questionnaire**
- [ ] **eCRF completion**
- [ ] **Schedule next visit**

## CRITICAL SAFETY ALERTS ⚠️
- FBG >240 mg/dL → Contact site immediately
- QTcF >500ms → Investigate, consider discontinuation
- Severe GI symptoms → Assess for dose adjustment`,
    sources: [
      {
        section: "Section 4.3 Visit Procedures Flow Chart",
        page: 22,
        content: "Each visit requires compliance assessment, safety monitoring, efficacy evaluations, and data collection procedures."
      },
      {
        section: "Section 5.2.8 Critical Safety Parameters",
        page: 33,
        content: "FBG >240 mg/dL or QTcF >500ms require immediate investigation and potential discontinuation."
      }
    ],
    quickActions: [
      {
        title: "Generate Visit Worksheet",
        icon: "FileDown",
        action: "visit_worksheet_template.pdf",
        type: "generate"
      },
      {
        title: "Create Visit Checklist",
        icon: "Settings",
        action: "patient_visit_checklist.pdf",
        type: "generate"
      },
      {
        title: "Setup Visit Reminders",
        icon: "Bell",
        action: "setup_visit_reminders",
        type: "setup"
      }
    ]
  },

  // Query 4: "Give me an overview of the safety monitoring requirements"
  "safety_monitoring": {
    response: `# Safety Monitoring Requirements - BI Trial 1404-0002

## IMMEDIATE REPORTING (Within 24h) 🚨
### Serious Adverse Events (SAEs):
- [ ] **Death, life-threatening events**
- [ ] **Hospitalization required**
- [ ] **Severe hypoglycemia** (<50 mg/dL with symptoms)
- [ ] **QTcF prolongation** >500ms or +60ms from baseline
- [ ] **Hepatic injury** (ALT/AST ≥3x ULN + Bilirubin ≥2x ULN)

### Adverse Events of Special Interest (AESIs):
- [ ] **Pancreatitis** 
- [ ] **Hepatic injury** (follow DILI checklist)

## ROUTINE MONITORING 📊
### Laboratory Safety (Weeks 4, 12):
**Critical Values Action Required**:
- Glucose <50 or >400 mg/dL
- Creatinine >2x baseline  
- ALT/AST >5x ULN
- Hemoglobin <8.0 g/dL

### Cardiovascular Monitoring:
- **ECG**: Triplicate at screening, then all visits
- **Vital Signs**: Every visit (BP <160/95, HR <100 bpm)
- **Discontinuation Criteria**: HR >120 bpm, QTcF >500ms

### Patient Self-Monitoring:
- **SMBG**: Weekly fasted measurements
- **Contact site if**: FBG >240 mg/dL or <70 mg/dL
- **Injection diary**: Date, time, site, reactions

## DATA SAFETY MONITORING BOARD (DSMB) 👥
- **Reviews**: Every 40 patients enrolled
- **Interim analysis**: At 50% enrollment  
- **Authority**: Can recommend study modification/termination

## EMERGENCY CONTACTS 📞
- **24/7 Emergency Line**: Available for severe hypoglycemia
- **Principal Investigator**: Immediate notification required
- **Medical Monitor**: Within 2 hours for SAEs`,
    sources: [
      {
        section: "Section 1.4.2 Safety Monitoring Overview",
        page: 8,
        content: "Comprehensive safety monitoring includes immediate SAE reporting, routine laboratory monitoring, and DSMB oversight."
      },
      {
        section: "Section 3.3.4.1 Discontinuation Criteria",
        page: 18,
        content: "QTcF >500ms or HR >120 bpm require immediate discontinuation consideration."
      },
      {
        section: "Section 5.2.6 Emergency Procedures",
        page: 31,
        content: "24/7 emergency contact required for severe hypoglycemia, immediate PI notification for all SAEs."
      }
    ],
    quickActions: [
      {
        title: "Generate Safety Checklist",
        icon: "FileDown",
        action: "safety_monitoring_checklist.pdf",
        type: "generate"
      },
      {
        title: "Create AE Report Form",
        icon: "Settings",
        action: "adverse_event_reporting_form.pdf",
        type: "generate"
      },
      {
        title: "Setup Safety Alerts",
        icon: "Bell",
        action: "setup_safety_alerts",
        type: "setup"
      }
    ]
  },

  // Query 5: "Generate a worksheet template for the schedule of activities in this protocol, including visits, procedures, and timelines."
  "generate_worksheet_template": {
    response: `# Visit Worksheet Template - Schedule of Activities

I've created a comprehensive **Visit Worksheet Template** specifically designed for BI Trial 1404-0002 follow-up visits. This template integrates all protocol-required procedures into an organized, easy-to-use format.

## 📋 **What This Template Contains:**

### **1. Visit Information Header**
- Study ID and protocol reference
- Visit number and timeline (Week 8 ±3 days)
- Patient ID and staff assignment fields
- Date and time tracking

### **2. Patient Preparation Section**
- Pre-visit compliance review checklist
- Fasting requirements (none for this visit)
- Materials preparation confirmation
- Space for notes and observations

### **3. Required Procedures Table**
The template includes a structured table with the following procedures:

| **Procedure** | **Protocol Reference** | **Critical Notes** |
|---|---|---|
| **Efficacy Evaluation** | Section 4.3 | Blood glucose monitoring with result fields |
| **Urine Test (Ketones)** | Section 4.3 | Positive/Negative checkboxes + other field |
| **Symptom Questionnaire** | Section 4.3 | Fatigue, nausea assessment scoring |
| **Vital Signs** | Section 4.3 | BP and HR with specific result fields |

### **4. Safety Monitoring Alerts**
- **Critical thresholds** highlighted in red boxes
- **Immediate action items** for values outside normal ranges
- **Contact information** for emergency reporting

### **5. Data Capture & Compliance**
- EDC upload confirmation checkboxes
- Protocol deviation tracking
- Next steps and follow-up scheduling
- Staff signature and date fields

## 🎯 **Key Features:**
- **Print-friendly format** optimized for clinical use
- **Large checkboxes** for easy marking
- **Generous spacing** for handwritten notes
- **Color-coded sections** for quick navigation
- **Professional GCP-compliant layout**

This template ensures consistent data collection across all follow-up visits while reducing administrative burden on clinical staff.`,
    sources: [
      {
        section: "Section 4.3 Visit Schedule and Procedures",
        page: 22,
        content: "Week 8 visit includes glucose monitoring, vital signs, symptom assessment, and adverse event monitoring."
      },
      {
        section: "Section 5.1 Data Collection Requirements",
        page: 26,
        content: "All visit data must be captured in EDC within 24 hours with source document verification."
      }
    ],
    downloadableTemplates: [
      {
        title: "Visit Worksheet Template",
        type: 'worksheet',
        filename: "visit_worksheet_week8_template.pdf"
      },
      {
        title: "Schedule of Activities",
        type: 'worksheet',
        filename: "schedule_of_activities_template.pdf"
      }
    ]
  },

  // Query 6: "Summarize inclusion/exclusion criteria for this protocol and generate a checklist for screening a patient with this profile: 45-year-old male, HbA1c 7.2%, history of hypertension"
  "patient_profile_checklist": {
    response: `# Patient Eligibility Assessment - 45-year-old Male Profile

I've analyzed the BI Trial 1404-0002 eligibility criteria and created a **patient-specific screening checklist** for your 45-year-old male patient with HbA1c 7.2% and hypertension history.

## 🎯 **Initial Profile Assessment:**

### **✅ Criteria Already Met:**
- **Age 45 years** → Within 18-65 range ✅
- **HbA1c 7.2%** → Within required 6.5-8.0% range ✅

### **⚠️ Risk Factor Identified:**
- **Hypertension history** → Requires careful BP monitoring (exclusion if >160/100 mmHg)

## 📋 **Generated Screening Checklist Contains:**

### **1. Inclusion Criteria Assessment**
- **Diabetes confirmation** with medical record verification
- **BMI measurement** (target 25-35 kg/m²)
- **Metformin therapy verification** (≥3 months stable dose)
- **Pre-marked favorable criteria** (age, HbA1c already confirmed)

### **2. Exclusion Criteria Screening**
- **Blood pressure measurement protocol** (critical due to hypertension history)
- **Renal function assessment** (GFR calculation required)
- **Cardiovascular event timeline** (6-month lookback period)
- **Liver function verification**
- **Diabetes type confirmation**

### **3. Risk-Stratified Actions**
The checklist prioritizes tasks based on this patient's profile:

| **Priority Level** | **Required Action** | **Rationale** |
|---|---|---|
| 🔴 **HIGH** | Blood pressure measurement | Hypertension history - exclusionary if >160/100 |
| 🟡 **MEDIUM** | Comprehensive lab panel | Standard screening requirements |
| 🟢 **LOW** | Medical history review | Routine documentation |

### **4. Decision Framework**
- **Preliminary eligibility status** tracking
- **Conditional approval pathways** based on BP results
- **Next steps guidance** for borderline cases

### **5. Documentation & Compliance**
- **Staff signature sections** for accountability
- **Protocol deviation tracking** if modifications needed
- **Source document references** for audit trail

## 🚨 **Key Alert for This Patient:**
The checklist specifically highlights **blood pressure monitoring** as the primary screening focus due to the patient's hypertension history. BP must be <160/100 mmHg for study eligibility.

This personalized approach ensures efficient screening while maintaining protocol compliance.`,
    sources: [
      {
        section: "Section 3.1 Inclusion Criteria",
        page: 14,
        content: "Patients aged 18-65 years with Type 2 diabetes, HbA1c 6.5-8.0%, and stable metformin therapy for ≥3 months."
      },
      {
        section: "Section 3.2 Exclusion Criteria",
        page: 15,
        content: "Uncontrolled hypertension (>160/100 mmHg), recent cardiovascular events, and severe renal impairment are exclusionary."
      }
    ],
    downloadableTemplates: [
      {
        title: "Patient Eligibility Screening",
        type: 'checklist',
        filename: "patient_eligibility_screening_45yo.pdf"
      },
      {
        title: "Hypertension Assessment Form",
        type: 'worksheet',
        filename: "hypertension_assessment_form.pdf"
      }
    ]
  }
};

export function getMockResponse(query: string, documentId?: string): MockResponse {
  const normalizedQuery = query.toLowerCase();
  
  // Exact matching for demo queries
  if (normalizedQuery.includes('inclusion') && normalizedQuery.includes('exclusion') && normalizedQuery.includes('male') && normalizedQuery.includes('50-65')) {
    return DIABETES_PROTOCOL_RESPONSES.inclusion_exclusion_male;
  }
  
  if (normalizedQuery.includes('required medical test') && normalizedQuery.includes('checklist')) {
    return DIABETES_PROTOCOL_RESPONSES.medical_test_checklist;
  }
  
  if (normalizedQuery.includes('visit checklist') && normalizedQuery.includes('each patient')) {
    return DIABETES_PROTOCOL_RESPONSES.visit_checklist;
  }
  
  if (normalizedQuery.includes('overview') && normalizedQuery.includes('safety monitoring requirements')) {
    return DIABETES_PROTOCOL_RESPONSES.safety_monitoring;
  }
  
  if (normalizedQuery.includes('generate') && normalizedQuery.includes('worksheet template') && normalizedQuery.includes('schedule of activities')) {
    return DIABETES_PROTOCOL_RESPONSES.generate_worksheet_template;
  }
  
  if (normalizedQuery.includes('summarize') && normalizedQuery.includes('45-year-old male') && normalizedQuery.includes('hba1c 7.2')) {
    return DIABETES_PROTOCOL_RESPONSES.patient_profile_checklist;
  }
  
  // Default response for BI Trial 1404-0002
  return {
    response: `# BI Trial 1404-0002 - Document AI Assistant

I can help you with specific information about the BI Trial 1404-0002 diabetes protocol. Here are the main areas I can assist with:

## Available Queries:
### Patient Eligibility:
- **"Give me the inclusion/exclusion criteria for male patients 50-65 yo"**
- **"Summarize inclusion/exclusion criteria...45-year-old male, HbA1c 7.2%"**

### Clinical Procedures:
- **"What are the required medical test checklist"**
- **"What is the visit checklist for each patient?"**
- **"Give me an overview of the safety monitoring requirements"**

### Template Generation:
- **"Generate a worksheet template for the schedule of activities"**

### Key Protocol Information:
- **Study ID**: BI Trial 1404-0002
- **Phase**: Phase III
- **Population**: Type 2 Diabetes patients
- **Primary Endpoint**: HbA1c reduction from baseline

Please ask me one of the specific questions above, and I'll provide detailed information with downloadable templates and document references.`,
    sources: [
      {
        section: "Protocol Title Page",
        page: 1,
        content: "BI Trial 1404-0002: A randomized, double-blind, placebo-controlled study in patients with Type 2 diabetes mellitus."
      }
    ],
    downloadableTemplates: [
      {
        title: "Protocol Quick Reference",
        type: 'worksheet',
        filename: "bi_trial_quick_reference.pdf"
      }
    ]
  };
}

export function generateMockDocument(template: { title: string; type: string; filename: string }): Blob {
  // Generate realistic document content based on template type
  const currentDate = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit' 
  });
  
  let content = '';
  
  // Generate specific content based on template type and title
  if (template.title.toLowerCase().includes('screening') || template.title.toLowerCase().includes('eligibility')) {
    content = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Patient Eligibility Screening</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; color: #333; }
        .header { background: #f8f9fa; padding: 20px; margin-bottom: 30px; border: 2px solid #e9ecef; }
        .header h1 { margin: 0; color: #2c3e50; font-size: 20px; }
        .header .study-info { margin-top: 10px; font-size: 14px; color: #666; }
        .form-fields { background: #fff; border: 1px solid #ddd; padding: 20px; margin-bottom: 20px; }
        .form-fields h3 { margin-top: 0; color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 5px; }
        .field-row { display: flex; margin-bottom: 15px; align-items: center; }
        .field-label { font-weight: bold; width: 200px; margin-right: 10px; }
        .field-input { border-bottom: 1px solid #333; flex: 1; min-height: 20px; }
        .criteria-section { margin-bottom: 30px; }
        .criteria-section h3 { background: #3498db; color: white; padding: 10px; margin: 0; font-size: 16px; }
        .criteria-list { background: #f8f9fa; border: 1px solid #3498db; border-top: none; padding: 20px; }
        .criteria-item { display: flex; align-items: flex-start; margin-bottom: 12px; }
        .checkbox { width: 20px; height: 20px; border: 2px solid #333; margin-right: 15px; flex-shrink: 0; margin-top: 2px; }
        .criteria-text { flex: 1; }
        .signature-section { margin-top: 40px; border-top: 2px solid #333; padding-top: 20px; }
        .signature-row { display: flex; justify-content: space-between; margin-bottom: 30px; }
        .signature-box { width: 45%; }
        .signature-line { border-bottom: 1px solid #333; height: 30px; margin-bottom: 5px; }
        .date-box { width: 150px; border-bottom: 1px solid #333; height: 25px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>PATIENT ELIGIBILITY SCREENING CHECKLIST</h1>
        <div class="study-info">
            <strong>Study Protocol:</strong> BI-1404-0002 | <strong>Generated:</strong> ${currentDate} | <strong>Version:</strong> 1.0
        </div>
    </div>

    <div class="form-fields">
        <h3>Patient Information</h3>
        <div class="field-row">
            <span class="field-label">Patient ID:</span>
            <div class="field-input"></div>
        </div>
        <div class="field-row">
            <span class="field-label">Date of Screening:</span>
            <div class="field-input"></div>
        </div>
        <div class="field-row">
            <span class="field-label">Staff Conducting Screening:</span>
            <div class="field-input"></div>
        </div>
    </div>

    <div class="criteria-section">
        <h3>INCLUSION CRITERIA</h3>
        <div class="criteria-list">
            <div class="criteria-item">
                <div class="checkbox"></div>
                <div class="criteria-text">Male or female patients aged 18-75 years</div>
            </div>
            <div class="criteria-item">
                <div class="checkbox"></div>
                <div class="criteria-text">Type 2 diabetes mellitus diagnosis ≥6 months prior to screening</div>
            </div>
            <div class="criteria-item">
                <div class="checkbox"></div>
                <div class="criteria-text">HbA1c 7.0%-10.0% at screening visit</div>
            </div>
            <div class="criteria-item">
                <div class="checkbox"></div>
                <div class="criteria-text">Stable metformin therapy ≥1000mg/day for ≥3 months</div>
            </div>
            <div class="criteria-item">
                <div class="checkbox"></div>
                <div class="criteria-text">BMI 25-50 kg/m² at screening visit</div>
            </div>
            <div class="criteria-item">
                <div class="checkbox"></div>
                <div class="criteria-text">Signed and dated informed consent</div>
            </div>
        </div>
    </div>

    <div class="criteria-section">
        <h3>EXCLUSION CRITERIA</h3>
        <div class="criteria-list">
            <div class="criteria-item">
                <div class="checkbox"></div>
                <div class="criteria-text">Type 1 diabetes mellitus</div>
            </div>
            <div class="criteria-item">
                <div class="checkbox"></div>
                <div class="criteria-text">Heart rate >100 bpm or BP ≥160/95 mmHg</div>
            </div>
            <div class="criteria-item">
                <div class="checkbox"></div>
                <div class="criteria-text">QT/QTc prolongation >450ms (males) or >470ms (females)</div>
            </div>
            <div class="criteria-item">
                <div class="checkbox"></div>
                <div class="criteria-text">Recent cardiovascular events within 6 months</div>
            </div>
            <div class="criteria-item">
                <div class="checkbox"></div>
                <div class="criteria-text">eGFR <45 mL/min/1.73m²</div>
            </div>
            <div class="criteria-item">
                <div class="checkbox"></div>
                <div class="criteria-text">ALT or AST >2.5x upper limit of normal</div>
            </div>
        </div>
    </div>

    <div class="form-fields">
        <h3>Assessment Results</h3>
        <div class="criteria-item">
            <div class="checkbox"></div>
            <div class="criteria-text"><strong>ELIGIBLE</strong> - All inclusion criteria met, no exclusion criteria</div>
        </div>
        <div class="criteria-item">
            <div class="checkbox"></div>
            <div class="criteria-text"><strong>INELIGIBLE</strong> - Reason: <span class="field-input" style="display: inline-block; width: 300px; margin-left: 10px;"></span></div>
        </div>
        <div class="criteria-item">
            <div class="checkbox"></div>
            <div class="criteria-text"><strong>PENDING</strong> - Additional tests required: <span class="field-input" style="display: inline-block; width: 250px; margin-left: 10px;"></span></div>
        </div>
    </div>

    <div class="signature-section">
        <div class="signature-row">
            <div class="signature-box">
                <div class="signature-line"></div>
                <div><strong>Staff Signature</strong></div>
            </div>
            <div class="signature-box">
                <div class="date-box"></div>
                <div><strong>Date</strong></div>
            </div>
        </div>
        <div class="signature-row">
            <div class="signature-box">
                <div class="signature-line"></div>
                <div><strong>Principal Investigator Review</strong></div>
            </div>
            <div class="signature-box">
                <div class="date-box"></div>
                <div><strong>Date</strong></div>
            </div>
        </div>
    </div>

    <div style="margin-top: 40px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #ddd; padding-top: 20px;">
        Generated by Themison Clinical AI Assistant | Document ID: ${template.filename.replace('.pdf', '')}_${Date.now()}
    </div>
</body>
</html>`;
  } else if (template.title.toLowerCase().includes('visit') || template.title.toLowerCase().includes('worksheet')) {
    content = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Visit Worksheet</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.5; color: #333; }
        .header { background: #f8f9fa; padding: 20px; margin-bottom: 30px; border: 2px solid #e9ecef; }
        .header h1 { margin: 0; color: #2c3e50; font-size: 20px; }
        .header .study-info { margin-top: 10px; font-size: 14px; color: #666; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
        .info-box { border: 1px solid #ddd; padding: 15px; background: #fff; }
        .info-box h3 { margin-top: 0; color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 5px; }
        .field-row { display: flex; margin-bottom: 12px; align-items: center; }
        .field-label { font-weight: bold; width: 120px; margin-right: 10px; font-size: 14px; }
        .field-input { border-bottom: 1px solid #333; flex: 1; min-height: 20px; }
        .procedures-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 14px; }
        .procedures-table th { background: #3498db; color: white; padding: 12px; text-align: left; font-weight: bold; }
        .procedures-table td { padding: 12px; border: 1px solid #ddd; vertical-align: top; }
        .procedures-table tr:nth-child(even) { background: #f8f9fa; }
        .checkbox-large { width: 18px; height: 18px; border: 2px solid #333; margin-right: 10px; }
        .procedure-section { margin-bottom: 25px; }
        .procedure-section h3 { background: #34495e; color: white; padding: 12px; margin: 0; font-size: 16px; }
        .procedure-list { background: #f8f9fa; border: 1px solid #34495e; border-top: none; padding: 20px; }
        .procedure-item { display: flex; align-items: flex-start; margin-bottom: 10px; }
        .safety-alert { background: #ffe6e6; border: 2px solid #e74c3c; padding: 15px; margin: 20px 0; }
        .safety-alert h3 { color: #c0392b; margin-top: 0; }
        .signature-section { margin-top: 40px; border-top: 2px solid #333; padding-top: 20px; }
        .signature-row { display: flex; justify-content: space-between; margin-bottom: 25px; }
        .signature-box { width: 45%; }
        .signature-line { border-bottom: 1px solid #333; height: 30px; margin-bottom: 5px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>VISIT WORKSHEET – ${template.title}</h1>
        <div class="study-info">
            <strong>Study Protocol:</strong> BI-1404-0002 | <strong>Generated:</strong> ${currentDate} | <strong>Version:</strong> 1.0
        </div>
    </div>

    <div class="info-grid">
        <div class="info-box">
            <h3>Visit Information</h3>
            <div class="field-row">
                <span class="field-label">Visit:</span>
                <div class="field-input"></div>
                <span style="margin: 0 10px;">(Follow-up)</span>
            </div>
            <div class="field-row">
                <span class="field-label">Timeline:</span>
                <div class="field-input"></div>
                <span style="margin-left: 10px;">(±3 days)</span>
            </div>
        </div>
        <div class="info-box">
            <h3>Patient & Staff</h3>
            <div class="field-row">
                <span class="field-label">Patient ID:</span>
                <div class="field-input"></div>
            </div>
            <div class="field-row">
                <span class="field-label">Date of Visit:</span>
                <div class="field-input"></div>
            </div>
            <div class="field-row">
                <span class="field-label">Staff Name:</span>
                <div class="field-input"></div>
            </div>
        </div>
    </div>

    <div class="procedure-section">
        <h3>1. Patient Preparation</h3>
        <div class="procedure-list">
            <div><strong>Instructions:</strong> Confirm patient compliance via diary review. No fasting required.</div>
            <div style="margin-top: 15px;">
                <strong>Notes/Observations:</strong>
                <div class="field-input" style="margin-top: 5px; min-height: 40px;"></div>
            </div>
        </div>
    </div>

    <div class="procedure-section">
        <h3>2. Required Procedures</h3>
        <table class="procedures-table">
            <thead>
                <tr>
                    <th style="width: 30px;">#</th>
                    <th style="width: 200px;">Procedure</th>
                    <th style="width: 250px;">Action</th>
                    <th style="width: 150px;">Result</th>
                    <th>Comments/Deviations</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>1</td>
                    <td><strong>Efficacy Evaluation</strong><br>(Glucose Monitoring)</td>
                    <td>Measure blood glucose levels per protocol Section 4.3</td>
                    <td><div class="field-input" style="min-height: 25px;"></div> mg/dL</td>
                    <td><div class="field-input" style="min-height: 25px;"></div></td>
                </tr>
                <tr>
                    <td>2</td>
                    <td><strong>Urine Test</strong><br>(Ketones)</td>
                    <td>Collect and analyze urine sample</td>
                    <td>
                        <div style="display: flex; gap: 5px; align-items: center;">
                            <div class="checkbox-large"></div> Positive
                            <div class="checkbox-large"></div> Negative
                        </div>
                        Other: <div class="field-input" style="width: 80px; display: inline-block;"></div>
                    </td>
                    <td><div class="field-input" style="min-height: 25px;"></div></td>
                </tr>
                <tr>
                    <td>3</td>
                    <td><strong>Symptom Questionnaire</strong></td>
                    <td>Administer questionnaire on symptoms (fatigue, nausea, etc.)</td>
                    <td><div class="field-input" style="min-height: 25px;"></div></td>
                    <td><div class="field-input" style="min-height: 25px;"></div></td>
                </tr>
                <tr>
                    <td>4</td>
                    <td><strong>Vital Signs</strong></td>
                    <td>Measure blood pressure (BP) and heart rate (HR)</td>
                    <td>
                        <div style="margin-bottom: 5px;">BP: <div class="field-input" style="width: 80px; display: inline-block;"></div> mmHg</div>
                        <div>HR: <div class="field-input" style="width: 80px; display: inline-block;"></div> bpm</div>
                    </td>
                    <td><div class="field-input" style="min-height: 25px;"></div></td>
                </tr>
            </tbody>
        </table>
    </div>

    <div class="procedure-section">
        <h3>3. Additional Instructions</h3>
        <div class="procedure-list">
            <div class="procedure-item">
                <div class="checkbox-large"></div>
                <div>Monitor for adverse events (AEs). Report any to PI immediately.</div>
            </div>
            <div class="procedure-item">
                <div class="checkbox-large"></div>
                <div>Provide next dose if applicable.</div>
            </div>
            <div style="margin-top: 15px;">
                <strong>Notes:</strong>
                <div class="field-input" style="margin-top: 5px; min-height: 40px;"></div>
            </div>
        </div>
    </div>

    <div class="safety-alert">
        <h3>⚠️ Critical Safety Alerts</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div>• FBG >240 mg/dL → Contact site immediately</div>
            <div>• QTcF >500ms → Investigate, consider discontinuation</div>
            <div>• Severe GI symptoms → Assess for dose adjustment</div>
            <div>• Any serious adverse event → Report within 24h</div>
        </div>
    </div>

    <div class="procedure-section">
        <h3>4. Data Capture Prompts</h3>
        <div class="procedure-list">
            <div class="procedure-item">
                <div class="checkbox-large"></div>
                <div><strong>Upload results to EDC:</strong></div>
                <div style="margin-left: 20px;">
                    <div class="checkbox-large"></div> Completed
                    <div class="checkbox-large"></div> Pending
                </div>
            </div>
            <div class="procedure-item">
                <div class="checkbox-large"></div>
                <div><strong>Record deviations:</strong></div>
                <div style="margin-left: 20px;">
                    <div class="checkbox-large"></div> None
                    <div class="checkbox-large"></div> Reported to: <div class="field-input" style="width: 150px; display: inline-block;"></div>
                </div>
            </div>
            <div style="margin-top: 15px;">
                <strong>Next Steps:</strong>
                <div class="field-input" style="margin-top: 5px; min-height: 40px;"></div>
            </div>
        </div>
    </div>

    <div class="signature-section">
        <div class="signature-row">
            <div class="signature-box">
                <div class="signature-line"></div>
                <div><strong>Staff Signature</strong></div>
            </div>
            <div class="signature-box">
                <div class="field-input" style="width: 120px; margin-bottom: 5px;"></div>
                <div><strong>Date Completed</strong></div>
            </div>
        </div>
    </div>

    <div style="margin-top: 30px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #ddd; padding-top: 15px;">
        <strong>Source:</strong> Protocol Section 4.3. Generated by Themison's RAG system, extracting visit-specific procedures and timelines from DIAB-2025-001 protocol.<br>
        Document ID: ${template.filename.replace('.pdf', '')}_${Date.now()}
    </div>
</body>
</html>`;
  } else if (template.title.toLowerCase().includes('test') || template.title.toLowerCase().includes('medical') || template.title.toLowerCase().includes('lab')) {
    content = `
BI TRIAL 1404-0002 - MEDICAL TESTS CHECKLIST
${template.title}

Study Protocol: BI-1404-0002
Date Generated: ${currentDate} ${currentTime}
Generated By: Themison Document AI Assistant

===============================================
MEDICAL TESTS CHECKLIST
===============================================

Patient ID: [____________________]
Visit Type: [____________________]
Date of Visit: [____/____/____]
Staff Name: [____________________]


SCREENING VISIT (Week -2) 🩺

Laboratory Tests Required:
☐ HbA1c (Central lab)
☐ Complete Blood Count (CBC) 
☐ Comprehensive Metabolic Panel (CMP)
☐ Liver Function Tests (ALT, AST, Bilirubin)
☐ Renal Function (Creatinine, eGFR, BUN)
☐ Lipid Profile (Total, HDL, LDL, Triglycerides)
☐ Urinalysis + Microalbumin
☐ TSH, Calcitonin
☐ Infectious Serology (Hep B/C, HIV)


Other Required Tests:
☐ 12-lead ECG (triplicate)
☐ Vital Signs (BP, HR, temp, weight, height)
☐ Physical Examination
☐ Pregnancy Test (if applicable)
☐ Urine Drug Screen


FOLLOW-UP VISITS (Weeks 2,4,8,12) 🔄

☐ Safety Labs (CBC, CMP, LFTs)
☐ HbA1c (Week 12 only)
☐ Vital Signs & Weight
☐ ECG


SAFETY ALERTS - Contact PI Immediately:

Critical Values Requiring Immediate Action:
• Glucose <50 or >400 mg/dL
• ALT/AST >5x ULN (Upper Limit of Normal)
• Creatinine >2x baseline value

These values indicate potential safety issues that require:
- Immediate physician notification
- Patient assessment within 2 hours
- Possible study drug discontinuation
- Additional monitoring as directed by PI


COMPLETION CHECKLIST:
☐ All required tests ordered
☐ Results reviewed by study staff
☐ Critical values addressed (if any)
☐ Results entered into EDC system
☐ Patient scheduled for next visit


Staff Signature: [____________________] Date: [____/____/____]
PI Review (for critical values): [____________________] Date: [____/____/____]
`;
  } else if (template.title.toLowerCase().includes('safety') || template.title.toLowerCase().includes('monitoring')) {
    content = `
BI TRIAL 1404-0002 - SAFETY MONITORING CHECKLIST
${template.title}

Study Protocol: BI-1404-0002
Date Generated: ${currentDate} ${currentTime}
Generated By: Themison Document AI Assistant

===============================================
SAFETY MONITORING CHECKLIST
===============================================

Patient ID: [____________________]
Monitoring Period: [____/____/____] to [____/____/____]
Staff Responsible: [____________________]

SERIOUS ADVERSE EVENTS (Report within 24h):
☐ Death or life-threatening events
☐ Hospitalization or prolonged hospitalization
☐ Persistent/significant disability
☐ Congenital anomaly/birth defect
☐ Other medically important events

ADVERSE EVENTS OF SPECIAL INTEREST:
☐ Severe hypoglycemia (<50 mg/dL with symptoms)
☐ Pancreatitis (confirm with lipase/amylase)
☐ Hepatic injury (ALT/AST ≥3x ULN + Bilirubin ≥2x ULN)
☐ QTcF prolongation >500ms or +60ms from baseline

LABORATORY SAFETY MONITORING:
Critical Values - Take Action:
☐ Glucose: [____] mg/dL (Action if <50 or >400)
☐ Creatinine: [____] mg/dL (Action if >2x baseline)
☐ ALT: [____] U/L (Action if >5x ULN)
☐ AST: [____] U/L (Action if >5x ULN)
☐ Hemoglobin: [____] g/dL (Action if <8.0)

CARDIOVASCULAR MONITORING:
☐ ECG completed: QTcF [____] ms
☐ Blood pressure: [____] mmHg (Target <160/95)
☐ Heart rate: [____] bpm (Target <100)

EMERGENCY CONTACTS:
24/7 Emergency Line: 1-800-TRIAL-HELP
Principal Investigator: [____________________]
Medical Monitor: [____________________]

Actions Taken:
☐ No action required
☐ Follow-up scheduled: [____/____/____]
☐ Study drug held: Reason [____________________]
☐ Emergency contact made: Time [____] Contact [____________________]

Staff Signature: [____________________] Date: [____/____/____]
PI Review: [____________________] Date: [____/____/____]
`;
  } else {
    // Default template
    content = `
BI TRIAL 1404-0002 - ${template.title.toUpperCase()}

Study Protocol: BI-1404-0002
Date Generated: ${currentDate} ${currentTime}
Generated By: Themison Document AI Assistant

===============================================
${template.title.toUpperCase()}
===============================================

This document contains protocol-specific information for BI Trial 1404-0002.

Document Type: ${template.type}
Study Phase: Phase III
Population: Type 2 Diabetes Mellitus

[Template content would be customized based on the specific request]

Staff Signature: [____________________]
Date: [____/____/____]
`;
  }

  content += `

===============================================
DOCUMENT INFORMATION
===============================================
Document ID: ${template.filename.replace('.pdf', '')}_${Date.now()}
Version: 1.0
Status: Active
Generated: ${currentDate} ${currentTime}

===============================================
Generated with Themison Clinical AI Assistant
Powered by advanced RAG technology for clinical trials
Contact: support@themison.ai | Available 24/7
===============================================
`;
  
  // Return HTML for better formatting, or plain text for simple templates
  const isHTML = content.startsWith('<!DOCTYPE html>');
  return new Blob([content], { 
    type: isHTML ? 'text/html' : 'text/plain' 
  });
}
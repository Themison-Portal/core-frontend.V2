// Unified AI Response Adapter
// Standardizes responses from different AI services for consistent UI consumption

export interface UnifiedSource {
  page: number;
  section: string;
  exactText: string;
  relevance: 'high' | 'medium' | 'low';
  context: string;
  highlightURL: string;
}

export interface UnifiedAIResponse {
  response: string;
  sources: UnifiedSource[];
  source: 'backend' | 'chatpdf' | 'anthropic' | 'anthropic-mockup';
  timestamp: number;
  cost?: number;
  model?: string;
}

/**
 * Adapts Backend/ChatPDF response to unified format
 */
export function adaptBackendResponse(backendResponse: any): UnifiedAIResponse {
  return {
    response: backendResponse.response,
    sources: (backendResponse.sources || []).map((source: any) => ({
      page: source.page || 0,
      section: source.section || 'Document Section',
      exactText: source.exactText || source.content || '',
      relevance: source.relevance || 'medium',
      context: source.context || 'Context from backend analysis',
      highlightURL: source.highlightURL || ''
    })),
    source: backendResponse.source || 'backend',
    timestamp: backendResponse.timestamp || Date.now(),
    cost: backendResponse.cost,
    model: backendResponse.model
  };
}

/**
 * Adapts ChatPDF response to unified format
 */
export function adaptChatPDFResponse(chatPDFResponse: any, documentUrl: string): UnifiedAIResponse {
  return {
    response: chatPDFResponse.response,
    sources: (chatPDFResponse.sources || []).map((source: any) => ({
      page: source.page || 0,
      section: source.section || 'Document Section',
      exactText: source.exactText || source.content || '',
      relevance: source.relevance || 'high',
      context: source.context || 'Context from ChatPDF analysis',
      highlightURL: source.highlightURL || `${documentUrl}#page=${source.page}`
    })),
    source: 'chatpdf',
    timestamp: chatPDFResponse.timestamp || Date.now(),
    cost: chatPDFResponse.cost,
    model: 'ChatPDF + OpenAI GPT-4o-mini'
  };
}

/**
 * Adapts Anthropic Claude response to unified format
 */
export function adaptAnthropicResponse(
  claudeResponse: any,
  documentUrl: string,
  inputTokens: number,
  outputTokens: number
): UnifiedAIResponse {
  const cost = (inputTokens * 0.8 + outputTokens * 4) / 1000000; // Haiku 3.5 pricing

  return {
    response: claudeResponse.content,
    sources: (claudeResponse.citations || []).map((citation: any) => ({
      page: citation.source?.chunk_index || 0,
      section: 'Claude Citation',
      exactText: citation.content || '',
      relevance: 'high',
      context: 'Citation from Claude analysis',
      highlightURL: `${documentUrl}#page=${citation.source?.chunk_index}`
    })),
    source: 'anthropic',
    timestamp: Date.now(),
    cost: cost,
    model: claudeResponse.model || 'claude-3-5-haiku-20241022'
  };
}

/**
 * Creates a mock Anthropic response using the EXACT structure from real Claude API
 * Mimics the actual response format seen in console logs
 */
export function createMockAnthropicResponse(question: string, documentName: string, documentUrl: string): UnifiedAIResponse {
  // REAL Claude API Response Structure (from console logs):
  const mockClaudeResponses = {
    'inclusion criteria': {
      content: `Based on the clinical trial protocol document, here are the key inclusion criteria for patient eligibility:

## Main Inclusion Criteria

1. **Informed Consent**: [Page 12: 'Signed and dated written informed consent in accordance with ICH GCP and local legislation']

2. **Age Range**: Male and female patients must be 18 years to 75 years (both inclusive) of age on the day of signing informed consent

3. **Diabetes Diagnosis**: Diagnosis of T2DM at least 6 months prior to informed consent

4. **HbA1c Level**: HbA1c 7.0%-10.0% (both inclusive) at screening

5. **Current Treatment**: Treatment with a stable dose of metformin ≥ 1000mg/day for at least 3 months prior to screening

6. **Body Mass Index**: [Page 13: 'Body mass index (BMI) 25 kg/m²-50 kg/m² (both inclusive) at screening']

7. **Contraception**: Women of childbearing potential must be ready and able to use highly effective methods of birth control

These inclusion criteria ensure that participants meet the specific demographic, medical, and treatment requirements necessary for the clinical trial, while ensuring safety and scientific validity of the study results.`,
      citations: [
        {
          content: "Signed and dated written informed consent in accordance with ICH GCP and local legislation",
          source: {
            chunk_index: 12,
            document_index: 0
          }
        },
        {
          content: "Body mass index (BMI) 25 kg/m²-50 kg/m² (both inclusive) at screening",
          source: {
            chunk_index: 13,
            document_index: 0
          }
        }
      ],
      model: "claude-3-5-haiku-20241022",
      usage: {
        input_tokens: 2847,
        output_tokens: 234
      }
    },
    'exclusion criteria': {
      content: `Based on the clinical trial protocol document, here are the key exclusion criteria that would disqualify patients from participation:

## Main Exclusion Criteria

1. **Diabetes Type**: [Page 14: 'Patients with type 1 diabetes']

2. **Previous Medications**: Exposure to semaglutide, or other GLP-1R agonists (including combination products) within 3 months prior to screening, or any previous exposure to BI 456906

3. **Additional Medications**: Any additional oral anti-hyperglycemic medication beyond metformin within 3 months prior to screening

4. **Insulin Use**: Use of insulin for glycemic control within 12 months prior to screening

5. **Cardiovascular Parameters**: [Page 15: 'Resting Heart Rate >100 bpm or blood pressure ≥160/95 mm Hg at screening']

6. **Cardiac Issues**: A marked prolongation of QT/QTc (Fridericia) interval or any other clinically significant ECG finding at screening

7. **Weight Changes**: Body weight change of +/- 5% or more in the past 3 months or on anti-obesity therapies at any time during the 6 months prior to screening

8. **Mental Health**: Any suicidal behavior in the past 2 years, any suicidal ideation of type 4 or 5 in the C-SSRS in the past 3 months at screening

9. **Pregnancy**: [Page 27: 'Women who are pregnant, nursing, or who plan to become pregnant while in the trial']

These exclusion criteria help ensure participant safety and maintain the integrity of the study by excluding conditions that could interfere with the trial results or pose additional risks.`,
      citations: [
        {
          content: "Patients with type 1 diabetes",
          source: {
            chunk_index: 14,
            document_index: 0
          }
        },
        {
          content: "Women who are pregnant, nursing, or who plan to become pregnant while in the trial",
          source: {
            chunk_index: 27,
            document_index: 0
          }
        }
      ],
      model: "claude-3-5-haiku-20241022",
      usage: {
        input_tokens: 2953,
        output_tokens: 298
      }
    },
    'pregnancy': {
      content: `Based on the clinical trial protocol, here are the relevant citations regarding pregnancy for a participant:

[Page 27: "Women of childbearing potential (WOCBP)1 must be ready and able to use highly effective methods of birth control per ICH M3 (R2) that result in a low failure rate of less than 1% per year when used consistently and correctly."]

[Page 21: "Females of childbearing potential who are pregnant, breast-feeding or intend to become pregnant or are not using an adequate contraceptive method throughout the trial including the 4-week follow-up period are excluded from the trial (section 4.2.2.3)"]

[Page 29: "27. Chronic or relevant acute infections (including but not limited to respiratory tract infections, urinary tract infection, bladder infection, diabetic foot syndrome)"]

Given these citations, the patient should be discontinued from the trial due to pregnancy. The protocol is clear that pregnant women are excluded from participation. The study team should be immediately notified, and the patient should be withdrawn from the trial while ensuring appropriate medical care and follow-up for her pregnancy and diabetes management.

The key steps would be:
1. Confirm the pregnancy
2. Discontinue the study treatment
3. Notify the study sponsor
4. Ensure continued medical care for her pregnancy and diabetes
5. Complete any necessary end-of-study procedures as outlined in the protocol`,
      citations: [
        {
          content: "Women of childbearing potential (WOCBP)1 must be ready and able to use highly effective methods of birth control per ICH M3 (R2) that result in a low failure rate of less than 1% per year when used consistently and correctly.",
          source: {
            chunk_index: 27,
            document_index: 0
          }
        },
        {
          content: "Females of childbearing potential who are pregnant, breast-feeding or intend to become pregnant or are not using an adequate contraceptive method throughout the trial including the 4-week follow-up period are excluded from the trial (section 4.2.2.3)",
          source: {
            chunk_index: 21,
            document_index: 0
          }
        },
        {
          content: "27. Chronic or relevant acute infections (including but not limited to respiratory tract infections, urinary tract infection, bladder infection, diabetic foot syndrome)",
          source: {
            chunk_index: 29,
            document_index: 0
          }
        }
      ],
      model: "claude-3-5-haiku-20241022",
      usage: {
        input_tokens: 3210,
        output_tokens: 312
      }
    }
  };

  // Find best matching mock response
  const lowerQuestion = question.toLowerCase();
  let selectedMockResponse = mockClaudeResponses['inclusion criteria']; // default

  if (lowerQuestion.includes('pregnant') || lowerQuestion.includes('pregnancy')) {
    selectedMockResponse = mockClaudeResponses['pregnancy'];
  } else if (lowerQuestion.includes('exclusion')) {
    selectedMockResponse = mockClaudeResponses['exclusion criteria'];
  } else if (lowerQuestion.includes('inclusion') || lowerQuestion.includes('eligib')) {
    selectedMockResponse = mockClaudeResponses['inclusion criteria'];
  }

  // Use the EXACT same adapter as real Anthropic responses
  return adaptAnthropicResponse(
    selectedMockResponse,
    documentUrl,
    selectedMockResponse.usage.input_tokens,
    selectedMockResponse.usage.output_tokens
  );
}
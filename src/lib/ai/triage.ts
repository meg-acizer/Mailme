import { executeAiCompletion } from "./llm-client";

export interface TriageResult {
  triageClass: "action" | "waiting" | "info" | "ignorable";
  oneLineSummary: string;
  extractedData?: {
    meeting?: string;
    invoiceOrAmount?: string;
    actionRequired?: string;
  };
  suggestedReplies: string[];
}

const TRIAGE_SYSTEM_PROMPT = `Eres el motor de Triage y Asistencia Inteligente de MailMe Workspace.
Tu trabajo es analizar correos entrantes de forma concisa, precisa y estructurada.

Debes responder SIEMPRE con un objeto JSON válido con este formato exacto:
{
  "triageClass": "action" | "waiting" | "info" | "ignorable",
  "oneLineSummary": "Resumen claro y directo en una sola frase (máximo 15 palabras) con lo más importante.",
  "extractedData": {
    "meeting": "Día y hora de reunión propuesta (si aplica, ej: Jueves 15:00 hs)",
    "invoiceOrAmount": "Monto o número de factura/presupuesto (si aplica)",
    "actionRequired": "Acción concreta que el usuario debe realizar (si aplica)"
  },
  "suggestedReplies": [
    "Respuesta sugerida 1 (breve y formal)",
    "Respuesta sugerida 2 (alternativa o solicitud de detalles)",
    "Respuesta sugerida 3 (declinación amable o contrapropuesta)"
  ]
}

Reglas:
1. "action": correos que exigen respuesta urgente o decisión del usuario.
2. "waiting": correos donde el usuario está a la espera de que la otra parte envíe algo.
3. "info": boletines, confirmaciones de servicio o avisos informativos.
4. "ignorable": spam leve, notificaciones automáticas secundarias.
5. NO incluyas markdown, solo el objeto JSON plano.`;

export async function analyzeEmailWithAI(
  email: {
    subject: string;
    from: string;
    body: string;
  },
  tenantSlug = "acme-corp"
): Promise<TriageResult> {
  const prompt = `Analiza el siguiente correo:
DE: ${email.from}
ASUNTO: ${email.subject}
CUERPO:
${email.body.slice(0, 2500)}`;

  try {
    const result = await executeAiCompletion({
      tenantSlug,
      systemPrompt: TRIAGE_SYSTEM_PROMPT,
      prompt,
      temperature: 0.2,
      maxTokens: 500,
    });

    // Clean any accidental markdown backticks
    let rawText = result.text.trim();
    if (rawText.startsWith("```json")) {
      rawText = rawText.replace(/^```json\s*/, "").replace(/```$/, "").trim();
    } else if (rawText.startsWith("```")) {
      rawText = rawText.replace(/^```\s*/, "").replace(/```$/, "").trim();
    }

    const parsed: TriageResult = JSON.parse(rawText);
    return parsed;
  } catch (error) {
    console.warn("Fallo en Triage IA con modelo configurado, aplicando fallback heurístico:", error);

    // Heuristic fallback if LLM has no key configured yet
    const isMeeting = /reuni[oó]n|llamada|call|zoom|meet|agenda|jueves|viernes/i.test(email.body + email.subject);
    const isInvoice = /factura|invoice|presupuesto|pago|\$|monto/i.test(email.body + email.subject);

    return {
      triageClass: isMeeting ? "action" : "info",
      oneLineSummary: email.subject || "Correo recibido sin asunto destacado.",
      extractedData: {
        meeting: isMeeting ? "Propuesta de reunión detectada" : undefined,
        invoiceOrAmount: isInvoice ? "Monto o comprobante adjunto" : undefined,
      },
      suggestedReplies: [
        "Perfecto, coordinamos para ese día.",
        "Gracias por la información, lo reviso y te confirmo.",
        "Por el momento no tengo disponibilidad, ¿podemos pasar a la próxima semana?",
      ],
    };
  }
}

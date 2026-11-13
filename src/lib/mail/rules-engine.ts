/**
 * Declarative, closed-list email rules engine.
 * Security requirement: Only predefined condition fields, operators, and actions
 * are evaluated. No dynamic expressions, regex DoS, or arbitrary callbacks.
 */

export type RuleConditionField = "from" | "to" | "subject" | "has_attachment" | "ai_category";
export type RuleConditionOperator = "contains" | "equals" | "ends_with";
export type RuleActionType =
  | "add_tag"
  | "move_to_folder"
  | "assign_to_user"
  | "mark_priority"
  | "notify_channel";

export interface ClosedEmailRule {
  id: string;
  name: string;
  conditionField: RuleConditionField;
  conditionOperator: RuleConditionOperator;
  conditionValue: string;
  actionType: RuleActionType;
  actionValue: string;
  isActive: boolean;
}

export interface EvaluableEmail {
  senderEmail: string;
  senderName?: string;
  to?: string[];
  subject: string;
  hasAttachment?: boolean;
  aiCategory?: string;
  tags?: string[];
  folder?: "inbox" | "archived" | "sent" | "spam" | "trash";
  assignedTo?: string;
  priority?: "high" | "normal" | "low";
}

function matchCondition(email: EvaluableEmail, rule: ClosedEmailRule): boolean {
  const needle = rule.conditionValue.trim().toLowerCase();
  if (!needle) return false;

  let target = "";
  switch (rule.conditionField) {
    case "from":
      target = `${email.senderName || ""} ${email.senderEmail}`.toLowerCase();
      break;
    case "to":
      target = (email.to || []).join(" ").toLowerCase();
      break;
    case "subject":
      target = (email.subject || "").toLowerCase();
      break;
    case "has_attachment":
      target = email.hasAttachment ? "true" : "false";
      break;
    case "ai_category":
      target = (email.aiCategory || "").toLowerCase();
      break;
    default:
      return false;
  }

  switch (rule.conditionOperator) {
    case "contains":
      return target.includes(needle);
    case "equals":
      return target === needle;
    case "ends_with":
      return target.endsWith(needle);
    default:
      return false;
  }
}

export function evaluateClosedRulesOnEmail<T extends EvaluableEmail>(
  email: T,
  rules: ClosedEmailRule[]
): { updatedEmail: T; appliedRuleNames: string[]; notifications: string[] } {
  const updated: T = { ...email, tags: [...(email.tags || [])] };
  const appliedRuleNames: string[] = [];
  const notifications: string[] = [];

  for (const rule of rules) {
    if (!rule.isActive) continue;
    if (!matchCondition(updated, rule)) continue;

    appliedRuleNames.push(rule.name);

    switch (rule.actionType) {
      case "add_tag": {
        const tag = rule.actionValue.startsWith("#") ? rule.actionValue : `#${rule.actionValue}`;
        if (!updated.tags?.includes(tag)) {
          updated.tags = [...(updated.tags || []), tag];
        }
        break;
      }
      case "move_to_folder": {
        if (
          rule.actionValue === "inbox" ||
          rule.actionValue === "sent" ||
          rule.actionValue === "spam" ||
          rule.actionValue === "trash"
        ) {
          updated.folder = rule.actionValue;
        }
        break;
      }
      case "assign_to_user": {
        updated.assignedTo = rule.actionValue;
        break;
      }
      case "mark_priority": {
        if (
          rule.actionValue === "high" ||
          rule.actionValue === "normal" ||
          rule.actionValue === "low"
        ) {
          updated.priority = rule.actionValue;
        }
        break;
      }
      case "notify_channel": {
        notifications.push(`Notificado en ${rule.actionValue}: "${updated.subject}"`);
        break;
      }
    }
  }

  return { updatedEmail: updated, appliedRuleNames, notifications };
}

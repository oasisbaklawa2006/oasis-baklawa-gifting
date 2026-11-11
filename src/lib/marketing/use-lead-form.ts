/**
 * ONE LEAD/SUBSCRIPTION PATH FOR EVERY CAPTURE SURFACE
 *
 * Newsletter, contact, corporate, wedding and rewards forms all submit through
 * this hook. Success is only reported when the server confirms the record was
 * persisted; anything else shows an honest retry state.
 */

import { useServerFn } from "@tanstack/react-start";
import { useCallback, useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { submitLead, type LeadResult, type LEAD_KINDS } from "@/lib/leads.functions";
import { approvedAttributionFields, readAttribution } from "./attribution";
import { track } from "./dispatch";
import type { EventName } from "./events";

type LeadKind = (typeof LEAD_KINDS)[number];

type Options = {
  kind: LeadKind;
  /** Where on the site the capture happened, e.g. "footer-newsletter". */
  source: string;
  event: EventName;
  /** Extra form fields kept as restrained profile properties. */
  properties?: string[];
  /** Fields combined into the message body. */
  messageFields?: string[];
  successMessage: string;
  /** Shown when nothing could be stored — never a false success. */
  failureMessage: string;
};

export type LeadFormState = {
  pending: boolean;
  status: "idle" | "saved" | "error";
  statusMessage: string | null;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

const str = (value: FormDataEntryValue | null) =>
  typeof value === "string" ? value.trim() : undefined;

export function useLeadForm(options: Options): LeadFormState {
  const send = useServerFn(submitLead);
  const submissionId = useRef<string | null>(null);
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const onSubmit = useCallback(
    (formEvent: FormEvent<HTMLFormElement>) => {
      formEvent.preventDefault();
      const form = formEvent.currentTarget;
      const data = new FormData(form);

      const properties: Record<string, string> = {};
      for (const field of options.properties ?? []) {
        const value = str(data.get(field));
        if (value) properties[field] = value;
      }

      const messageParts = (options.messageFields ?? ["message", "brief"])
        .map((field) => str(data.get(field)))
        .filter((value): value is string => Boolean(value));

      const isEnquiry = ["corporate", "wedding", "contact", "partnership"].includes(options.kind);
      if (isEnquiry && !submissionId.current) submissionId.current = crypto.randomUUID();
      const payload = {
        kind: options.kind,
        ...(isEnquiry && submissionId.current ? { submissionId: submissionId.current } : {}),
        ...(str(data.get("email")) ? { email: str(data.get("email"))! } : {}),
        ...(str(data.get("phone")) ? { phone: str(data.get("phone"))! } : {}),
        ...(str(data.get("name")) ? { name: str(data.get("name"))! } : {}),
        ...(str(data.get("company")) ? { company: str(data.get("company"))! } : {}),
        ...(messageParts.length ? { message: messageParts.join("\n\n") } : {}),
        source: options.source,
        marketingConsent: options.kind === "newsletter",
        attribution: approvedAttributionFields(readAttribution()),
        ...(Object.keys(properties).length ? { properties } : {}),
      };

      setPending(true);
      void (async () => {
        let result: LeadResult;
        try {
          result = await send({ data: payload });
        } catch {
          result = { status: "invalid", reason: options.failureMessage };
        }

        setPending(false);
        if (result.status === "saved") {
          submissionId.current = null;
          setStatus("saved");
          setStatusMessage(options.successMessage);
          form.reset();
          toast.success("Thank you", { description: options.successMessage });
          track({ name: options.event, params: { source: options.source } });
        } else {
          setStatus("error");
          setStatusMessage(result.reason);
          toast.error("Not sent", { description: result.reason });
        }
      })();
    },
    [options, send],
  );

  return { pending, status, statusMessage, onSubmit };
}

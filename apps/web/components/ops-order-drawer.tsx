"use client"

import Link from "next/link"
import { useEffect, useRef, useState, type ReactNode } from "react"

import {
  deleteOpsOrder,
  runOpsOrderAction,
  type OpsOrderAction,
} from "@/lib/client-api"
import { handoverConfirmedAt } from "@/lib/deliveries/handover-status"
import type { Delivery } from "@/lib/deliveries/types"
import { formatGhanaPhone } from "@/lib/phone"
import {
  formatWhen,
  isClosedOrder,
  orderWhenIso,
  PayPill,
  place,
  StatusPill,
} from "@/components/ops-shared"

type PayChannel = "cash" | "momo" | "bank"

const PAY_CHANNELS: Array<{ id: PayChannel; label: string }> = [
  { id: "cash", label: "Cash" },
  { id: "momo", label: "MoMo" },
  { id: "bank", label: "Bank" },
]

function whatsappHref(national: string) {
  const digits = national.replace(/\D/g, "")
  const intl = digits.startsWith("0") ? `233${digits.slice(1)}` : digits
  return `https://wa.me/${intl}`
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
      <path
        d="M5.6 2.5H3.8a1.3 1.3 0 0 0-1.3 1.4 10 10 0 0 0 9.6 9.6 1.3 1.3 0 0 0 1.4-1.3v-1.8l-2.6-1.1-1.2 1.2a6.6 6.6 0 0 1-3.1-3.1l1.2-1.2Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ChatIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
      <path
        d="M2.8 13.2 3.6 10.6a5.4 5.4 0 1 1 2 2Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function CopyIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
      <rect
        x="5.5"
        y="5.5"
        width="8"
        height="8"
        rx="1.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M10.5 3.6V3.4A1 1 0 0 0 9.5 2.5H3.4a1 1 0 0 0-.9.9v6.1a1 1 0 0 0 .9 1h.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

function Contact({
  role,
  tone,
  name,
  phone,
  email,
  address,
}: {
  role: string
  tone: "pickup" | "drop"
  name: string
  phone: string
  email: string
  address: string
}) {
  return (
    <div className="ops-drawer-contact">
      <span className={`ops-route-dot is-${tone}`} aria-hidden="true" />
      <div className="ops-drawer-contact-copy">
        <span className="ops-drawer-role">{role}</span>
        <strong>{name}</strong>
        <span className="ops-drawer-muted">{place(address)}</span>
        <span className="ops-drawer-muted">
          {formatGhanaPhone(phone)}
          {email ? ` · ${email}` : ""}
        </span>
      </div>
      <div className="ops-drawer-contact-actions">
        <a
          className="ops-icon-btn ops-drawer-icon"
          href={`tel:${phone}`}
          aria-label={`Call ${name}`}
          title="Call"
        >
          <PhoneIcon />
        </a>
        <a
          className="ops-icon-btn ops-drawer-icon"
          href={whatsappHref(phone)}
          target="_blank"
          rel="noreferrer"
          aria-label={`WhatsApp ${name}`}
          title="WhatsApp"
        >
          <ChatIcon />
        </a>
      </div>
    </div>
  )
}

export function OpsOrderDrawer({
  delivery,
  secret,
  assignSlot,
  onClose,
  onUpdated,
  onDeleted,
  onError,
}: {
  delivery: Delivery
  secret: string
  assignSlot: ReactNode
  onClose: () => void
  onUpdated: (delivery: Delivery, message: string) => void
  onDeleted: (trackingId: string) => void
  onError: (message: string) => void
}) {
  const [busy, setBusy] = useState<OpsOrderAction["action"] | "delete" | null>(
    null,
  )
  const [deleting, setDeleting] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState("")
  const [payChannel, setPayChannel] = useState<PayChannel>("cash")
  const [confirmingPaid, setConfirmingPaid] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [cancelReason, setCancelReason] = useState("")
  const [cancelError, setCancelError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const closeRef = useRef<HTMLButtonElement>(null)

  const closed = isClosedOrder(delivery)
  const paid = delivery.paymentStatus === "paid"
  const onTookan = Boolean(delivery.tookanJobId || delivery.tookanPickupJobId)
  const canResend =
    !paid && delivery.payer === "recipient" && Boolean(delivery.recipientEmail)
  // Paid orders are payment records; live Tookan jobs must be cancelled first.
  const canDelete = !paid && (!onTookan || closed)
  const handoverAt = handoverConfirmedAt(delivery)
  const events = [...delivery.events].reverse()

  useEffect(() => {
    closeRef.current?.focus()
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [onClose])

  async function run(input: OpsOrderAction, success: (d: Delivery, sentTo?: string) => string) {
    setBusy(input.action)
    try {
      const result = await runOpsOrderAction(secret, delivery.trackingId, input)
      onUpdated(result.delivery, success(result.delivery, result.sentTo))
      setConfirmingPaid(false)
      setCancelling(false)
      setCancelReason("")
    } catch (err) {
      onError(err instanceof Error ? err.message : "Action failed")
    } finally {
      setBusy(null)
    }
  }

  async function copyTracking() {
    try {
      await navigator.clipboard.writeText(delivery.trackingId)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      onError("Couldn’t copy — select the ID instead.")
    }
  }

  async function deleteOrder() {
    setBusy("delete")
    try {
      const result = await deleteOpsOrder(secret, delivery.trackingId)
      onDeleted(result.deleted)
    } catch (err) {
      onError(err instanceof Error ? err.message : "Delete failed")
      setBusy(null)
    }
  }

  function submitCancel() {
    const reason = cancelReason.trim()
    if (reason.length < 3) {
      setCancelError("Say why — the customer timeline shows it.")
      return
    }
    setCancelError(null)
    void run(
      { action: "cancel", reason },
      () => `Cancelled ${delivery.trackingId}.`,
    )
  }

  return (
    <>
      <div className="ops-drawer-scrim" onClick={onClose} aria-hidden="true" />
      <aside
        className="ops-drawer"
        role="dialog"
        aria-modal="false"
        aria-label={`Order ${delivery.trackingId}`}
      >
        <header className="ops-drawer-head">
          <div className="ops-drawer-head-copy">
            <span className="ops-kicker">Order</span>
            <div className="ops-drawer-id">
              <strong className="ops-code">{delivery.trackingId}</strong>
              <button
                type="button"
                className="ops-drawer-copy"
                onClick={() => void copyTracking()}
                aria-label="Copy tracking ID"
              >
                <CopyIcon />
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <div className="ops-drawer-pills">
              <StatusPill delivery={delivery} />
              <PayPill delivery={delivery} />
            </div>
          </div>
          <button
            ref={closeRef}
            type="button"
            className="ops-icon-btn"
            aria-label="Close order details"
            onClick={onClose}
          >
            ×
          </button>
        </header>

        <div className="ops-drawer-body">
          <section className="ops-drawer-hero">
            <div>
              <span className="ops-detail-label">Fare</span>
              <strong className="ops-drawer-fare">GHS {delivery.fareGhs}</strong>
              <span className="ops-drawer-muted">
                {delivery.payer === "recipient" ? "Recipient pays" : "Sender pays"}
                {delivery.paymentChannel ? ` · ${delivery.paymentChannel}` : ""}
                {delivery.paidAt ? ` · paid ${formatWhen(delivery.paidAt)}` : ""}
              </span>
            </div>
            <div className="ops-drawer-when">
              <span className="ops-detail-label">
                {delivery.pickupWindow === "schedule" ? "Scheduled" : "Same day"}
              </span>
              <strong>{formatWhen(orderWhenIso(delivery))}</strong>
              {delivery.etaLabel ? (
                <span className="ops-eta-chip">{delivery.etaLabel}</span>
              ) : null}
            </div>
          </section>

          <section className="ops-drawer-section">
            <h3 className="ops-detail-label">Rider</h3>
            {closed ? (
              <p className="ops-drawer-muted">
                {delivery.riderName || "No rider"} · order is closed
              </p>
            ) : (
              assignSlot
            )}
            {handoverAt ? (
              <p className="ops-drawer-note is-ok">
                Handover code confirmed {formatWhen(handoverAt)}
              </p>
            ) : null}
          </section>

          <section className="ops-drawer-section">
            <h3 className="ops-detail-label">Route</h3>
            <Contact
              role="Pickup · sender"
              tone="pickup"
              name={delivery.senderName}
              phone={delivery.senderPhone}
              email={delivery.senderEmail}
              address={delivery.pickup}
            />
            <Contact
              role="Drop-off · recipient"
              tone="drop"
              name={delivery.recipientName}
              phone={delivery.recipientPhone}
              email={delivery.recipientEmail}
              address={delivery.dropoff}
            />
          </section>

          <section className="ops-drawer-section">
            <h3 className="ops-detail-label">Package</h3>
            <dl className="ops-drawer-facts">
              <div>
                <dt>Type</dt>
                <dd>
                  {delivery.packageType} · {delivery.size}
                </dd>
              </div>
              {delivery.estimatedValue ? (
                <div>
                  <dt>Value</dt>
                  <dd>GHS {delivery.estimatedValue}</dd>
                </div>
              ) : null}
              {delivery.fragile || delivery.perishable ? (
                <div>
                  <dt>Handling</dt>
                  <dd>
                    {[delivery.fragile && "Fragile", delivery.perishable && "Perishable"]
                      .filter(Boolean)
                      .join(" · ")}
                  </dd>
                </div>
              ) : null}
              {delivery.notes ? (
                <div className="is-wide">
                  <dt>Notes</dt>
                  <dd>{delivery.notes}</dd>
                </div>
              ) : null}
            </dl>
          </section>

          {!paid && !closed ? (
            <section className="ops-drawer-section">
              <h3 className="ops-detail-label">Payment</h3>
              {confirmingPaid ? (
                <div className="ops-drawer-confirm">
                  <p>Record GHS {delivery.fareGhs} as received via</p>
                  <div className="ops-drawer-seg" role="radiogroup" aria-label="Payment channel">
                    {PAY_CHANNELS.map((channel) => (
                      <button
                        key={channel.id}
                        type="button"
                        role="radio"
                        aria-checked={payChannel === channel.id}
                        className={payChannel === channel.id ? "is-active" : ""}
                        onClick={() => setPayChannel(channel.id)}
                      >
                        {channel.label}
                      </button>
                    ))}
                  </div>
                  <div className="ops-drawer-row">
                    <button
                      type="button"
                      className="ops-btn"
                      disabled={busy !== null}
                      onClick={() =>
                        void run(
                          { action: "mark_paid", channel: payChannel },
                          () => `Marked ${delivery.trackingId} as paid.`,
                        )
                      }
                    >
                      {busy === "mark_paid" ? "Saving…" : "Confirm payment"}
                    </button>
                    <button
                      type="button"
                      className="ops-btn ops-btn-ghost"
                      onClick={() => setConfirmingPaid(false)}
                    >
                      Back
                    </button>
                  </div>
                </div>
              ) : (
                <div className="ops-drawer-row">
                  <button
                    type="button"
                    className="ops-btn ops-btn-ghost"
                    disabled={busy !== null}
                    onClick={() => setConfirmingPaid(true)}
                  >
                    Mark as paid
                  </button>
                  {canResend ? (
                    <button
                      type="button"
                      className="ops-btn ops-btn-ghost"
                      disabled={busy !== null}
                      onClick={() =>
                        void run({ action: "resend_pay_link" }, (_d, sentTo) =>
                          `Pay link sent to ${sentTo || delivery.recipientEmail}.`,
                        )
                      }
                    >
                      {busy === "resend_pay_link" ? "Sending…" : "Resend pay link"}
                    </button>
                  ) : null}
                </div>
              )}
            </section>
          ) : null}

          <section className="ops-drawer-section">
            <h3 className="ops-detail-label">Links</h3>
            <div className="ops-drawer-row">
              <Link
                className="ops-btn ops-btn-ghost"
                href={`/track?id=${encodeURIComponent(delivery.trackingId)}`}
                target="_blank"
              >
                Track page
              </Link>
              {delivery.tookanTrackingLink ? (
                <a
                  className="ops-btn ops-btn-ghost"
                  href={delivery.tookanTrackingLink}
                  target="_blank"
                  rel="noreferrer"
                >
                  Live map
                </a>
              ) : null}
              {!onTookan && !closed ? (
                <button
                  type="button"
                  className="ops-btn ops-btn-ghost"
                  disabled={busy !== null}
                  onClick={() =>
                    void run(
                      { action: "dispatch" },
                      () => `${delivery.trackingId} is on Tookan now.`,
                    )
                  }
                >
                  {busy === "dispatch" ? "Sending…" : "Push to Tookan"}
                </button>
              ) : null}
            </div>
            {onTookan ? (
              <code className="ops-detail-tookan">
                Tookan P {delivery.tookanPickupJobId ?? "—"} · D{" "}
                {delivery.tookanDeliveryJobId ?? delivery.tookanJobId}
              </code>
            ) : (
              <p className="ops-drawer-muted">Not on Tookan yet.</p>
            )}
          </section>

          <section className="ops-drawer-section">
            <h3 className="ops-detail-label">Timeline</h3>
            {events.length === 0 ? (
              <p className="ops-drawer-muted">No events yet.</p>
            ) : (
              <ol className="ops-timeline">
                {events.map((event) => (
                  <li key={event.id}>
                    <span className="ops-timeline-dot" aria-hidden="true" />
                    <div>
                      <strong>{event.title}</strong>
                      {event.detail ? <p>{event.detail}</p> : null}
                      <time dateTime={event.at}>{formatWhen(event.at)}</time>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>

          {!closed ? (
            <section className="ops-drawer-section ops-drawer-danger">
              {cancelling ? (
                <div className="ops-drawer-confirm">
                  <label className="ops-detail-label" htmlFor="ops-cancel-reason">
                    Reason for cancelling
                  </label>
                  <input
                    id="ops-cancel-reason"
                    className="ops-input"
                    value={cancelReason}
                    placeholder="e.g. Sender asked to cancel"
                    aria-invalid={cancelError ? true : undefined}
                    onChange={(event) => {
                      setCancelReason(event.target.value)
                      setCancelError(null)
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") submitCancel()
                    }}
                    autoFocus
                  />
                  {cancelError ? (
                    <p className="ops-drawer-field-error">{cancelError}</p>
                  ) : null}
                  <p className="ops-drawer-muted">
                    {onTookan
                      ? "Cancels the Tookan tasks too. This can’t be undone."
                      : "This can’t be undone."}
                  </p>
                  <div className="ops-drawer-row">
                    <button
                      type="button"
                      className="ops-btn ops-btn-danger"
                      disabled={busy !== null}
                      onClick={submitCancel}
                    >
                      {busy === "cancel" ? "Cancelling…" : "Cancel order"}
                    </button>
                    <button
                      type="button"
                      className="ops-btn ops-btn-ghost"
                      onClick={() => setCancelling(false)}
                    >
                      Keep order
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  className="ops-drawer-danger-link"
                  onClick={() => setCancelling(true)}
                >
                  Cancel this order…
                </button>
              )}
            </section>
          ) : null}

          {canDelete ? (
            <section className="ops-drawer-section ops-drawer-danger">
              {deleting ? (
                <div className="ops-drawer-confirm">
                  <label className="ops-detail-label" htmlFor="ops-delete-confirm">
                    Type {delivery.trackingId} to delete
                  </label>
                  <input
                    id="ops-delete-confirm"
                    className="ops-input ops-code"
                    value={deleteConfirm}
                    autoComplete="off"
                    spellCheck={false}
                    onChange={(event) => setDeleteConfirm(event.target.value)}
                    autoFocus
                  />
                  <p className="ops-drawer-muted">
                    Removes the order, its timeline and tracking link for good.
                  </p>
                  <div className="ops-drawer-row">
                    <button
                      type="button"
                      className="ops-btn ops-btn-danger"
                      disabled={
                        busy !== null ||
                        deleteConfirm.trim().toUpperCase() !==
                          delivery.trackingId.toUpperCase()
                      }
                      onClick={() => void deleteOrder()}
                    >
                      {busy === "delete" ? "Deleting…" : "Delete forever"}
                    </button>
                    <button
                      type="button"
                      className="ops-btn ops-btn-ghost"
                      onClick={() => {
                        setDeleting(false)
                        setDeleteConfirm("")
                      }}
                    >
                      Keep order
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  className="ops-drawer-danger-link"
                  onClick={() => setDeleting(true)}
                >
                  Delete this order…
                </button>
              )}
            </section>
          ) : !closed && onTookan ? null : paid ? (
            <p className="ops-drawer-muted ops-drawer-foot">
              Paid orders are kept as payment records and can’t be deleted.
            </p>
          ) : null}
        </div>
      </aside>
    </>
  )
}

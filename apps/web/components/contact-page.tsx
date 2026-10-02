"use client"

import { useMemo, useState, type FormEvent } from "react"

import { ChevronRight } from "@/components/about-icons"
import { GridRule, PageGrid } from "@/components/page-grid"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"

const topics = [
  {
    id: "support",
    label: "Delivery support",
    body: "A missed stop, a tracking question, or a package that needs a person.",
    email: "support@diatel.com",
  },
  {
    id: "business",
    label: "Business",
    body: "Repeating routes, bulk pickups, and coverage for a shop or warehouse.",
    email: "business@diatel.com",
  },
  {
    id: "riders",
    label: "Riders",
    body: "Ask about riding with Diatel across Accra.",
    email: "riders@diatel.com",
  },
  {
    id: "press",
    label: "Press",
    body: "Company questions, interviews, and media requests.",
    email: "press@diatel.com",
  },
] as const

type TopicId = (typeof topics)[number]["id"]

const topicIds = new Set<string>(topics.map((topic) => topic.id))

function isTopicId(value: string | undefined): value is TopicId {
  return value !== undefined && topicIds.has(value)
}

export function ContactPage({ initialTopic }: { initialTopic?: string }) {
  const startingTopic: TopicId = isTopicId(initialTopic) ? initialTopic : "support"
  const [topic, setTopic] = useState<TopicId>(startingTopic)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [sent, setSent] = useState<{ name: string; email: string } | null>(null)

  const active = useMemo(
    () => topics.find((item) => item.id === topic) ?? topics[0],
    [topic],
  )

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmedName = name.trim()
    const trimmedEmail = email.trim()
    const trimmedMessage = message.trim()

    if (trimmedName.length < 2) {
      setError("Add your name so we know who to reply to.")
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError("Enter an email we can reply to.")
      return
    }
    if (trimmedMessage.length < 12) {
      setError("Tell us a little more so we can help.")
      return
    }

    setError("")
    setSent({ name: trimmedName, email: trimmedEmail })
  }

  return (
    <div className="page-shell about-page relative min-h-svh bg-white">
      <SiteHeader />

      <div className="relative">
        <PageGrid>
          <section className="contact-page">
            <div className="contact-copy">
              <span className="about-eyebrow">Contact</span>
              <h1 className="contact-title">Get in touch.</h1>
              <p className="about-section-body">
                Tell us what you need. We read every note and reply on
                weekdays, 8:00–18:00 GMT.
              </p>

              <div className="contact-paths">
                {topics.map((item) => {
                  const selected = item.id === topic
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className={
                        selected ? "contact-path is-selected" : "contact-path"
                      }
                      aria-pressed={selected}
                      onClick={() => {
                        setTopic(item.id)
                        setSent(null)
                      }}
                    >
                      <strong>{item.label}</strong>
                      <span>{item.body}</span>
                      <em>{item.email}</em>
                    </button>
                  )
                })}
              </div>

              <p className="contact-where">
                Accra, Ghana
                <span>Monday–Friday, 8:00–18:00 GMT</span>
              </p>
            </div>

            <div className="contact-panel">
              {sent ? (
                <div className="contact-success">
                  <span className="about-eyebrow">Sent</span>
                  <h2>Thanks, {sent.name.split(" ")[0]}.</h2>
                  <p>
                    Your {active.label.toLowerCase()} note is in. We&apos;ll
                    reply at {sent.email}.
                  </p>
                  <button
                    type="button"
                    className="about-hero-link"
                    onClick={() => {
                      setSent(null)
                      setMessage("")
                    }}
                  >
                    Send another
                    <ChevronRight />
                  </button>
                </div>
              ) : (
                <form className="contact-form" onSubmit={onSubmit} noValidate>
                  <div className="contact-form-head">
                    <h2>{active.label}</h2>
                    <p>Goes to {active.email}</p>
                  </div>

                  <label className="contact-field">
                    <span>Name</span>
                    <input
                      name="name"
                      autoComplete="name"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                    />
                  </label>

                  <label className="contact-field">
                    <span>Email</span>
                    <input
                      name="email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                    />
                  </label>

                  <label className="contact-field">
                    <span>Phone</span>
                    <input
                      name="phone"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      placeholder="Optional"
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                    />
                  </label>

                  <label className="contact-field">
                    <span>Message</span>
                    <textarea
                      name="message"
                      rows={5}
                      value={message}
                      onChange={(event) => setMessage(event.target.value)}
                    />
                  </label>

                  {error ? (
                    <p className="contact-error" role="alert">
                      {error}
                    </p>
                  ) : null}

                  <button type="submit" className="btn btn-primary contact-submit">
                    Send message
                    <ChevronRight />
                  </button>
                </form>
              )}
            </div>
          </section>

          <GridRule />
          <SiteFooter />
        </PageGrid>
      </div>
    </div>
  )
}

<svelte:options runes={false} />

<script lang="ts">
  import { parseAttendees, type Attendee } from "$lib/csv";
  import {
    buildEmailHtml,
    personalizeText,
    renderBlocks,
    type ContentBlock,
    type ContentBlockType,
  } from "$lib/email-template";

  type SendResponse = {
    sentCount: number;
    totalRecipients: number;
    failures: { email: string; reason: string }[];
    error?: string;
  };

  const placeholderTokens = ["first_name", "last_name", "email"];
  const blockTypes: ContentBlockType[] = [
    "heading",
    "paragraph",
    "button",
    "divider",
  ];

  let csvText = "";
  let attendees: Attendee[] = [];
  let csvError = "";
  let subject = "You are invited, {{first_name}}";
  let fromName = "Haven Brisbane";
  let fromEmail = "";
  let selectedAttendee = 0;
  let blocks: ContentBlock[] = [
    { id: createBlockId(), type: "heading", text: "Hi {{first_name}}," },
    {
      id: createBlockId(),
      type: "paragraph",
      text: "We're excited to welcome you to Haven Brisbane. See event details below.",
    },
    {
      id: createBlockId(),
      type: "button",
      text: "View your pass",
      url: "https://example.org/pass",
    },
  ];
  let sendResponse: SendResponse | null = null;
  let sendError = "";
  let isSending = false;

  const sampleAttendee: Attendee = {
    email: "attendee@example.org",
    first_name: "Jane",
    last_name: "Doe",
  };

  $: previewAttendee = attendees[selectedAttendee] ?? sampleAttendee;
  $: previewSubject = personalizeText(subject, previewAttendee);
  $: previewHtml = buildEmailHtml(renderBlocks(blocks, previewAttendee));

  function createBlockId(): string {
    return Math.random().toString(36).slice(2, 11);
  }

  function parseCsvInput(nextCsvText: string): void {
    csvText = nextCsvText;
    sendResponse = null;
    sendError = "";

    if (!csvText.trim()) {
      attendees = [];
      csvError = "";
      return;
    }

    try {
      attendees = parseAttendees(csvText);
      csvError = "";
      if (selectedAttendee >= attendees.length) {
        selectedAttendee = 0;
      }
    } catch (error) {
      attendees = [];
      csvError =
        error instanceof Error ? error.message : "Unable to parse CSV.";
    }
  }

  async function onCsvFileUpload(event: Event): Promise<void> {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    parseCsvInput(await file.text());
  }

  function updateBlock(
    blockId: string,
    key: keyof ContentBlock,
    value: string | ContentBlockType,
  ): void {
    blocks = blocks.map((block) =>
      block.id === blockId ? { ...block, [key]: value } : block,
    );
  }

  function addBlock(type: ContentBlockType): void {
    blocks = [
      ...blocks,
      {
        id: createBlockId(),
        type,
        text:
          type === "divider"
            ? ""
            : type === "button"
              ? "Click here"
              : "New content",
        url: type === "button" ? "https://example.org" : "",
      },
    ];
  }

  function removeBlock(blockId: string): void {
    if (blocks.length === 1) {
      return;
    }
    blocks = blocks.filter((block) => block.id !== blockId);
  }

  function appendSubjectToken(token: string): void {
    subject = `${subject} {{${token}}}`;
  }

  function appendBlockToken(blockId: string, token: string): void {
    const block = blocks.find((item) => item.id === blockId);
    if (!block || block.type === "divider") {
      return;
    }
    updateBlock(blockId, "text", `${block.text ?? ""} {{${token}}}`.trim());
  }

  async function sendEmails(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    sendResponse = null;
    sendError = "";

    if (csvError) {
      sendError = "Please fix the CSV errors before sending.";
      return;
    }

    if (attendees.length === 0) {
      sendError = "Upload a valid attendee CSV before sending.";
      return;
    }

    isSending = true;
    try {
      const response = await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          csvText,
          subject,
          fromName,
          fromEmail,
          blocks,
        }),
      });
      const data = (await response.json()) as SendResponse;
      if (!response.ok) {
        sendError = data.error ?? "Failed to send emails.";
        return;
      }
      sendResponse = data;
    } catch {
      sendError = "Network error while sending emails.";
    } finally {
      isSending = false;
    }
  }
</script>

<svelte:head>
  <title>Haven Brisbane Email Sender</title>
</svelte:head>

<main>
  <section class="panel">
    <h1>Haven Brisbane Email Sender</h1>
    <p class="hint">
      Upload attendees as CSV, build blocks, preview personalization, and send
      with Gmail API.
    </p>

    <form on:submit={sendEmails}>
      <div class="group">
        <label for="csv-file">Upload attendee CSV</label>
        <input
          id="csv-file"
          type="file"
          accept=".csv,text/csv"
          on:change={onCsvFileUpload}
        />
        <textarea
          rows="8"
          placeholder="email,first_name,last_name"
          value={csvText}
          on:input={(event) =>
            parseCsvInput((event.currentTarget as HTMLTextAreaElement).value)}
        ></textarea>
        {#if csvError}
          <p class="error">{csvError}</p>
        {:else if attendees.length > 0}
          <p class="ok">Loaded {attendees.length} attendees.</p>
        {/if}
      </div>

      <div class="group split">
        <div>
          <label for="from-name">From name</label>
          <input id="from-name" bind:value={fromName} />
        </div>
        <div>
          <label for="from-email">From email (optional)</label>
          <input
            id="from-email"
            bind:value={fromEmail}
            placeholder="organiser@example.org"
          />
        </div>
      </div>

      <div class="group">
        <label for="subject">Email subject</label>
        <input id="subject" bind:value={subject} />
        <div class="tokens">
          {#each placeholderTokens as token}
            <button type="button" on:click={() => appendSubjectToken(token)}
              >{`{{${token}}}`}</button
            >
          {/each}
        </div>
      </div>

      <div class="group">
        <p class="section-title">Content blocks</p>
        <div class="builder-actions">
          {#each blockTypes as type}
            <button type="button" on:click={() => addBlock(type)}
              >Add {type}</button
            >
          {/each}
        </div>

        {#each blocks as block, index (block.id)}
          <div class="block-card">
            <div class="block-header">
              <strong>Block {index + 1}</strong>
              <button type="button" on:click={() => removeBlock(block.id)}
                >Remove</button
              >
            </div>
            <select
              value={block.type}
              on:change={(event) =>
                updateBlock(
                  block.id,
                  "type",
                  (event.currentTarget as HTMLSelectElement)
                    .value as ContentBlockType,
                )}
            >
              {#each blockTypes as type}
                <option value={type}>{type}</option>
              {/each}
            </select>

            {#if block.type === "paragraph"}
              <textarea
                rows="6"
                value={block.text ?? ""}
                on:input={(event) =>
                  updateBlock(
                    block.id,
                    "text",
                    (event.currentTarget as HTMLTextAreaElement).value,
                  )}
                placeholder="Write your paragraph..."></textarea>
            {:else}
              <input
                type="text"
                value={block.text ?? ""}
                on:input={(event) =>
                  updateBlock(
                    block.id,
                    "text",
                    (event.currentTarget as HTMLInputElement).value,
                  )}
              />
            {/if}

            {#if block.type === "button"}
              <input
                placeholder="https://example.org"
                value={block.url}
                on:input={(event) =>
                  updateBlock(
                    block.id,
                    "url",
                    (event.currentTarget as HTMLInputElement).value,
                  )}
              />
            {/if}
          </div>
        {/each}
      </div>

      <button class="send" type="submit" disabled={isSending}
        >{isSending ? "Sending..." : "Send emails"}</button
      >
    </form>

    {#if sendError}
      <p class="error">{sendError}</p>
    {/if}
    {#if sendResponse}
      <p class="ok">
        Sent {sendResponse.sentCount} of {sendResponse.totalRecipients} emails.
      </p>
      {#if sendResponse.failures.length > 0}
        <ul class="error-list">
          {#each sendResponse.failures as failure}
            <li><strong>{failure.email}:</strong> {failure.reason}</li>
          {/each}
        </ul>
      {/if}
    {/if}
  </section>

  <section class="panel preview">
    <h2>Personalized preview</h2>
    {#if attendees.length > 0}
      <label for="preview-attendee">Preview attendee</label>
      <select id="preview-attendee" bind:value={selectedAttendee}>
        {#each attendees as attendee, index}
          <option value={index}
            >{attendee.first_name}
            {attendee.last_name} ({attendee.email})</option
          >
        {/each}
      </select>
    {/if}
    <p><strong>Subject:</strong> {previewSubject}</p>
    <iframe title="Email preview" srcdoc={previewHtml}></iframe>
  </section>
</main>

<style>
  :global(body) {
    margin: 0;
    font-family: Inter, Arial, sans-serif;
    background: #edf5f2;
    color: #173040;
  }

  main {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: 1rem;
    padding: 1rem;
  }

  .panel {
    background: white;
    border: 1px solid #d3e3df;
    border-radius: 14px;
    padding: 1rem;
  }

  h1,
  h2 {
    margin: 0 0 0.5rem;
    color: #0f2f44;
  }

  .hint {
    margin-top: 0;
    color: #496270;
  }

  .group {
    display: grid;
    gap: 0.45rem;
    margin-bottom: 1rem;
  }

  .split {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 0.75rem;
  }

  label {
    font-weight: 600;
    font-size: 0.95rem;
  }

  .section-title {
    margin: 0;
    font-weight: 600;
    font-size: 0.95rem;
  }

  input,
  textarea,
  select,
  button {
    font: inherit;
  }

  input,
  textarea,
  select {
    padding: 0.6rem;
    border-radius: 8px;
    border: 1px solid #c7d7d9;
  }

  textarea {
    resize: vertical;
  }

  .tokens,
  .builder-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  button {
    padding: 0.45rem 0.7rem;
    border-radius: 8px;
    border: 1px solid #b7cdca;
    background: #f5faf8;
    cursor: pointer;
  }

  button:hover:not(:disabled) {
    background: #e6f4ef;
  }

  .send {
    background: #1e8f68;
    color: white;
    border-color: #1e8f68;
    font-weight: 700;
  }

  .send:disabled {
    opacity: 0.7;
    cursor: wait;
  }

  .block-card {
    display: grid;
    gap: 0.45rem;
    border: 1px solid #dde8ea;
    border-radius: 10px;
    padding: 0.75rem;
    margin-top: 0.65rem;
  }

  .block-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .preview iframe {
    width: 100%;
    height: 500px;
    border: 1px solid #dbe7e8;
    border-radius: 8px;
    background: white;
  }

  .ok {
    color: #0d7a4e;
  }

  .error {
    color: #aa2435;
  }

  .error-list {
    margin: 0;
    padding-left: 1rem;
    color: #aa2435;
  }
</style>

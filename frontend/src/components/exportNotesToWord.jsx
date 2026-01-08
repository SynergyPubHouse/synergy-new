import { Document, Packer, Paragraph, TextRun } from "docx";


const resolveAuthorName = (manuscript) => {
  const buildName = (parts = []) =>
    parts.filter((part) => part && part.trim && part.trim().length > 0).join(" ").trim();

  const candidates = [
    manuscript?.authorName,
    manuscript?.correspondingAuthorName,
    manuscript?.correspondingAuthor?.name,
    buildName([
      manuscript?.correspondingAuthor?.firstName,
      manuscript?.correspondingAuthor?.middleName,
      manuscript?.correspondingAuthor?.lastName,
    ]),
    buildName([manuscript?.firstName, manuscript?.middleName, manuscript?.lastName]),
  ]
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter((value) => value.length > 0);

  return candidates[0] || "Unknown";
};

export const exportNotesToWord = async (manuscript, user) => {

  console.log("manuscript", manuscript)
  const authorDisplayName = resolveAuthorName(manuscript);



  // 1️⃣ Create the Word document
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            text: `Manuscript: ${manuscript.title}`,
            heading: "Heading1",
          }),
          new Paragraph({ text: `ID: ${manuscript.customId || manuscript._id}` }),
          new Paragraph({ text: `Author: ${authorDisplayName}` }),
          new Paragraph({ text: "" }),
          new Paragraph({
            text: "Notes & Reviews History:",
            heading: "Heading2",
          }),
          ...generateNotesParagraphs(manuscript),
        ],
      },
    ],
  });

  // 2️⃣ Convert document to Blob
  const blob = await Packer.toBlob(doc);

  // 3️⃣ Prepare FormData to send to backend
  const formData = new FormData();
  formData.append("file", blob, `${manuscript.title}-Notes.docx`);

  // 4️⃣ Make API call to upload Word file
  try {
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/manuscripts/${manuscript._id}/upload-notes-word`,
      {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      }
    );


    const data = await response.json();

    if (data.success) {
      alert(`Review comments document uploaded successfully! Authors have been notified via email with the download link.`);
    } else {
      console.error("Upload failed:", data);
      alert("Failed to upload notes. Try again.");
    }
  } catch (err) {
    console.error("Error uploading notes:", err);
    alert("An error occurred while uploading notes.");
  }
};

// Helper function to convert notes into Word paragraphs
const generateNotesParagraphs = (manuscript) => {
  const allNotes = [
    ...(manuscript.editorNotes || []).map((n) => ({ ...n, type: "Editor" })),
    ...(manuscript.editorNotesForAuthor || []).map((n) => ({ ...n, type: "EditorForAuthor" })),
    ...(manuscript.reviewerNotes || []).map((n) => ({ ...n, type: "Reviewer" })),
  ];

  return allNotes.map(
    (note) =>
      new Paragraph({
        children: [
          new TextRun({
            text: `[${note.type}] ${note.addedBy?.name || "Unknown"} - ${new Date(
              note.addedAt
            ).toLocaleDateString()}: `,
            bold: true,
          }),
          new TextRun({ text: note.text }),
        ],
      })
  );
};

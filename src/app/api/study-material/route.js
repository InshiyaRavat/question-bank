import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@clerk/nextjs/server";

const prisma = new PrismaClient();

// Dynamic import for PDF generation
let jsPDF, autoTable;

async function loadPDFLibs() {
  if (!jsPDF) {
    const jsPDFModule = await import('jspdf');
    jsPDF = jsPDFModule.default;
  }
  if (!autoTable) {
    const autoTableModule = await import('jspdf-autotable');
    autoTable = autoTableModule.default;
  }
}

// Dynamic import for Word generation
let docx;

async function loadWordLibs() {
  if (!docx) {
    const docxModule = await import('docx');
    docx = docxModule;
  }
}

export async function POST(req) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      format,
      topicIds,
      includeAllTopics,
      onlyWrongAnswers,
      includeExplanations
    } = await req.json();

    // Get user info
    const { clerkClient } = await import('@clerk/nextjs/server');
    const clerk = await clerkClient();
    const user = await clerk.users.getUser(userId);

    const userName = user.fullName ||
      user.firstName + (user.lastName ? ` ${user.lastName}` : '') ||
      user.username ||
      user.emailAddresses?.[0]?.emailAddress?.split('@')[0] ||
      "User";

    // Get topics
    let topics;
    if (includeAllTopics) {
      topics = await prisma.topic.findMany({
        orderBy: { name: 'asc' }
      });
    } else {
      topics = await prisma.topic.findMany({
        where: { id: { in: topicIds } },
        orderBy: { name: 'asc' }
      });
    }

    if (topics.length === 0) {
      return NextResponse.json({ error: "No topics found" }, { status: 400 });
    }

    // Get questions for each topic
    const topicsWithQuestions = await Promise.all(
      topics.map(async (topic) => {
        let questions;

        if (onlyWrongAnswers) {
          // Get questions the user got wrong
          const wrongQuestionIds = await prisma.solvedQuestion.findMany({
            where: {
              userId,
              isCorrect: false,
              question: { topicId: topic.id }
            },
            select: { questionId: true }
          });

          const questionIds = wrongQuestionIds.map(sq => sq.questionId);

          if (questionIds.length === 0) {
            return { ...topic, questions: [] };
          }

          questions = await prisma.question.findMany({
            where: {
              id: { in: questionIds },
              deletedAt: null
            },
            orderBy: { id: 'asc' }
          });
        } else {
          // Get all questions for the topic
          questions = await prisma.question.findMany({
            where: {
              topicId: topic.id,
              deletedAt: null
            },
            orderBy: { id: 'asc' }
          });
        }

        return { ...topic, questions };
      })
    );

    // Filter out topics with no questions
    const filteredTopics = topicsWithQuestions.filter(topic => topic.questions.length > 0);

    if (filteredTopics.length === 0) {
      return NextResponse.json({
        error: onlyWrongAnswers ? "No wrong answers found for selected topics" : "No questions found for selected topics"
      }, { status: 400 });
    }

    if (format === 'pdf') {
      return await generatePDF(filteredTopics, userName, includeExplanations);
    } else if (format === 'word') {
      return await generateWord(filteredTopics, userName, includeExplanations);
    } else {
      return NextResponse.json({ error: "Invalid format" }, { status: 400 });
    }

  } catch (error) {
    console.error("Study material generation error:", error);
    return NextResponse.json({ error: "Failed to generate study material" }, { status: 500 });
  }
}

async function generatePDF(topics, userName, includeExplanations) {
  await loadPDFLibs();
  
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  
  // Professional margins: 1.5cm = 42.5 points (1cm = 28.35 points)
  const margin = 42.5;
  const contentWidth = pageWidth - (margin * 2);
  const headerSpace = 50; // Space for header
  const footerSpace = 30; // Space for footer
  const contentHeight = pageHeight - headerSpace - footerSpace;
  
  let currentY = margin + headerSpace;

  // Helper function to add text with word wrapping
  const addText = (text, x, y, maxWidth, fontSize = 12, isBold = false) => {
    doc.setFontSize(fontSize);
    doc.setFont(undefined, isBold ? 'bold' : 'normal');
    const lines = doc.splitTextToSize(text, maxWidth);
    doc.text(lines, x, y);
    return y + (lines.length * fontSize * 0.4) + 5;
  };

  // Helper function to check if we need a new page
  const checkPage = (requiredSpace = 30) => {
    if (currentY + requiredSpace > pageHeight - footerSpace) {
      doc.addPage();
      currentY = margin + headerSpace;
    }
  };

  // Cover Page
  doc.setFontSize(24);
  doc.setFont(undefined, 'bold');
  doc.text('Study Material', pageWidth / 2, 60, { align: 'center' });
  
  doc.setFontSize(16);
  doc.setFont(undefined, 'normal');
  doc.text('Question Bank System', pageWidth / 2, 80, { align: 'center' });
  
  doc.setFontSize(14);
  doc.text(`Student: ${userName}`, pageWidth / 2, 100, { align: 'center' });
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, 115, { align: 'center' });
  
  doc.setFontSize(12);
  doc.text(`Total Topics: ${topics.length}`, pageWidth / 2, 135, { align: 'center' });
  doc.text(`Total Questions: ${topics.reduce((sum, topic) => sum + topic.questions.length, 0)}`, pageWidth / 2, 150, { align: 'center' });

  // Start from page 2 with professional format
  doc.addPage();
  currentY = margin + headerSpace;

  // Generate content for each topic
  topics.forEach((topic, topicIndex) => {
    // Each topic starts on a new page (except the first one)
    if (topicIndex > 0) {
      doc.addPage();
      currentY = margin + headerSpace;
    }

    // Topic name with professional header
    doc.setFillColor(52, 152, 219);
    doc.rect(margin, currentY - 10, contentWidth, 25, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text(`${topicIndex + 1}. ${topic.name}`, margin + 10, currentY + 5);
    
    currentY += 35;
    doc.setTextColor(0, 0, 0);

    // Questions for this topic
    topic.questions.forEach((question, questionIndex) => {
      checkPage(50);

      // Question text
      currentY = addText(`Q${questionIndex + 1}. ${question.questionText}`, margin, currentY, contentWidth, 12, false);
      currentY += 5;

      // Options
      question.options.forEach((option, optionIndex) => {
        const optionLabel = String.fromCharCode(65 + optionIndex);
        const isCorrect = optionIndex === question.correctOptionIdx;
        const optionText = `${optionLabel}) ${option}`;
        
        if (isCorrect) {
          doc.setTextColor(0, 128, 0); // Green for correct answer
          doc.setFont(undefined, 'bold');
        } else {
          doc.setTextColor(0, 0, 0); // Black for other options
          doc.setFont(undefined, 'normal');
        }
        
        currentY = addText(optionText, margin + 10, currentY, contentWidth - 10, 11, isCorrect);
        doc.setTextColor(0, 0, 0); // Reset color
      });

      currentY += 5;

      // Correct answer
      const correctOption = String.fromCharCode(65 + question.correctOptionIdx);
      currentY = addText(`Correct Answer: ${correctOption}) ${question.options[question.correctOptionIdx]}`, margin, currentY, contentWidth, 11, true);
      currentY += 5;

      // Explanation
      if (includeExplanations && question.explanation) {
        currentY = addText(`Explanation: ${question.explanation}`, margin, currentY, contentWidth, 10, false);
        currentY += 5;
      }

      currentY += 10; // Space between questions
    });
  });

  // Professional footer on all pages
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    
    // Footer line
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, pageHeight - footerSpace + 5, pageWidth - margin, pageHeight - footerSpace + 5);
    
    // Footer text
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(`Page ${i} of ${pageCount}`, margin, pageHeight - 15);
    doc.text('Question Bank System', pageWidth - margin - 60, pageHeight - 15);
  }

  const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
  
  return new NextResponse(pdfBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="study-material-${userName.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf"`
    }
  });
}

async function generateWord(topics, userName, includeExplanations) {
  await loadWordLibs();

  const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = docx;

  const children = [];

  // Cover Page
  children.push(
    new Paragraph({
      text: "Study Material",
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 }
    }),
    new Paragraph({
      text: "Question Bank System",
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 }
    }),
    new Paragraph({
      text: `Student: ${userName}`,
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 }
    }),
    new Paragraph({
      text: `Generated: ${new Date().toLocaleDateString()}`,
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 }
    }),
    new Paragraph({
      text: `Total Topics: ${topics.length}`,
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 }
    }),
    new Paragraph({
      text: `Total Questions: ${topics.reduce((sum, topic) => sum + topic.questions.length, 0)}`,
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 }
    })
  );

  // Table of Contents
  children.push(
    new Paragraph({
      text: "Table of Contents",
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 200 }
    })
  );

  topics.forEach((topic, index) => {
    children.push(
      new Paragraph({
        text: `${index + 1}. ${topic.name} (${topic.questions.length} questions)`,
        spacing: { after: 100 }
      })
    );
  });

  // Add page break
  children.push(
    new Paragraph({
      text: "",
      pageBreakBefore: true
    })
  );

  // Generate content for each topic
  topics.forEach((topic, topicIndex) => {
    // Topic header
    children.push(
      new Paragraph({
        text: `${topicIndex + 1}. ${topic.name}`,
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 }
      }),
      new Paragraph({
        text: `Total Questions: ${topic.questions.length}`,
        spacing: { after: 200 }
      })
    );

    // Questions
    topic.questions.forEach((question, questionIndex) => {
      // Question text
      children.push(
        new Paragraph({
          text: `Q${questionIndex + 1}. ${question.questionText}`,
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 100 }
        })
      );

      // Options
      question.options.forEach((option, optionIndex) => {
        const optionLabel = String.fromCharCode(65 + optionIndex);
        const isCorrect = optionIndex === question.correctOptionIdx;

        children.push(
          new Paragraph({
            text: `${optionLabel}) ${option}`,
            spacing: { after: 50 },
            children: isCorrect ? [
              new TextRun({
                text: `${optionLabel}) ${option}`,
                bold: true,
                color: "008000"
              })
            ] : undefined
          })
        );
      });

      // Correct answer
      const correctOption = String.fromCharCode(65 + question.correctOptionIdx);
      children.push(
        new Paragraph({
          text: `Correct Answer: ${correctOption}) ${question.options[question.correctOptionIdx]}`,
          spacing: { after: 100 },
          children: [
            new TextRun({
              text: `Correct Answer: `,
              bold: true
            }),
            new TextRun({
              text: `${correctOption}) ${question.options[question.correctOptionIdx]}`,
              bold: true,
              color: "008000"
            })
          ]
        })
      );

      // Explanation
      if (includeExplanations && question.explanation) {
        children.push(
          new Paragraph({
            text: `Explanation: ${question.explanation}`,
            spacing: { after: 100 },
            children: [
              new TextRun({
                text: "Explanation: ",
                bold: true
              }),
              new TextRun({
                text: question.explanation
              })
            ]
          })
        );
      }

      // Difficulty and tags
      if (question.difficulty || question.tags.length > 0) {
        let metaText = '';
        if (question.difficulty) metaText += `Difficulty: ${question.difficulty}`;
        if (question.tags.length > 0) {
          if (metaText) metaText += ' | ';
          metaText += `Tags: ${question.tags.join(', ')}`;
        }

        children.push(
          new Paragraph({
            text: metaText,
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: metaText,
                size: 18 // 9pt
              })
            ]
          })
        );
      }
    });

    // Add page break between topics (except for the last one)
    if (topicIndex < topics.length - 1) {
      children.push(
        new Paragraph({
          text: "",
          pageBreakBefore: true
        })
      );
    }
  });

  const doc = new Document({
    sections: [{
      properties: {},
      children: children
    }]
  });

  const buffer = await Packer.toBuffer(doc);

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="study-material-${userName.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.docx"`
    }
  });
}

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

    // Check if user has permission to download study materials
    const permission = await prisma.userStudyMaterialPermission.findUnique({
      where: { userId },
      select: { canDownload: true }
    });

    if (!permission?.canDownload) {
      return NextResponse.json({ 
        error: "Access denied. You don't have permission to download study materials. Please contact your administrator." 
      }, { status: 403 });
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
    const userEmail = user.emailAddresses?.[0]?.emailAddress || "";

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
      return await generatePDF(filteredTopics, { name: userName, email: userEmail }, includeExplanations);
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

async function generatePDF(topics, userInfo, includeExplanations) {
  await loadPDFLibs();

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  // Optimized margins and spacing for compact layout
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  const headerHeight = 15;
  const footerHeight = 15;
  const contentHeight = pageHeight - headerHeight - footerHeight - (margin * 2);

  let currentY = margin + headerHeight;

  // Professional color scheme
  const colors = {
    primary: { r: 37, g: 99, b: 235 },
    secondary: { r: 75, g: 85, b: 99 },
    success: { r: 16, g: 185, b: 129 },
    background: { r: 249, g: 250, b: 251 },
    border: { r: 229, g: 231, b: 235 },
    text: { r: 17, g: 24, b: 39 },
    lightText: { r: 107, g: 114, b: 128 }
  };

  // Helper functions
  const addText = (text, x, y, options = {}) => {
    const {
      maxWidth = contentWidth,
      fontSize = 10,
      fontStyle = 'normal',
      color = colors.text,
      align = 'left',
      lineHeight = 1.2
    } = options;

    doc.setFontSize(fontSize);
    doc.setFont('helvetica', fontStyle);
    doc.setTextColor(color.r, color.g, color.b);

    const lines = doc.splitTextToSize(text, maxWidth);

    if (align === 'center') {
      doc.text(lines, pageWidth / 2, y, { align: 'center' });
    } else if (align === 'right') {
      doc.text(lines, x + maxWidth, y, { align: 'right' });
    } else {
      doc.text(lines, x, y);
    }

    return y + (lines.length * fontSize * lineHeight) + 2;
  };

  const checkNewPage = (requiredSpace = 30) => {
    if (currentY + requiredSpace > pageHeight - footerHeight - margin) {
      addNewPage();
      return true;
    }
    return false;
  };

  const addNewPage = () => {
    doc.addPage();
    currentY = margin + headerHeight + 5;
  };

  const drawCard = (x, y, width, height, fillColor = colors.background, borderColor = colors.border) => {
    doc.setFillColor(fillColor.r, fillColor.g, fillColor.b);
    doc.setDrawColor(borderColor.r, borderColor.g, borderColor.b);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, y, width, height, 2, 2, 'FD');
  };

  // COVER PAGE - More compact
  doc.setFillColor(colors.primary.r, colors.primary.g, colors.primary.b);
  doc.rect(0, 0, pageWidth, 45, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(26);
  doc.setFont('helvetica', 'bold');
  doc.text('Practice Questions Report', pageWidth / 2, 28, { align: 'center' });

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Knowledge Assessment & Progress Review', pageWidth / 2, 40, { align: 'center' });

  // Compact user info card
  const cardY = 60;
  const cardHeight = 35;
  drawCard(margin, cardY, contentWidth, cardHeight);

  doc.setTextColor(colors.text.r, colors.text.g, colors.text.b);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(userInfo.name || 'Student', pageWidth / 2, cardY + 15, { align: 'center' });

  if (userInfo.email) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(colors.secondary.r, colors.secondary.g, colors.secondary.b);
    doc.text(userInfo.email, pageWidth / 2, cardY + 28, { align: 'center' });
  }

  // Compact stats
  const totalQuestions = topics.reduce((sum, topic) => sum + topic.questions.length, 0);
  const statsY = cardY + cardHeight + 20;

  const statCardWidth = (contentWidth - 20) / 3;
  const statCards = [
    { label: 'Topics', value: topics.length.toString() },
    { label: 'Questions', value: totalQuestions.toString() },
    { label: 'Generated', value: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) }
  ];

  statCards.forEach((stat, index) => {
    const cardX = margin + (index * (statCardWidth + 10));
    drawCard(cardX, statsY, statCardWidth, 25, colors.background);

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(colors.primary.r, colors.primary.g, colors.primary.b);
    doc.text(stat.value, cardX + statCardWidth / 2, statsY + 12, { align: 'center' });

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(colors.secondary.r, colors.secondary.g, colors.secondary.b);
    doc.text(stat.label, cardX + statCardWidth / 2, statsY + 20, { align: 'center' });
  });

  // TABLE OF CONTENTS - Much more compact
  addNewPage();
  currentY = margin + headerHeight + 5;

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(colors.text.r, colors.text.g, colors.text.b);
  doc.text('Table of Contents', margin, currentY);

  currentY += 15;
  doc.setDrawColor(colors.primary.r, colors.primary.g, colors.primary.b);
  doc.setLineWidth(1);
  doc.line(margin, currentY - 3, margin + 60, currentY - 3);
  currentY += 8;

  const tocEntries = [];

  topics.forEach((topic, index) => {
    checkNewPage(12);

    const topicNumber = `${(index + 1).toString().padStart(2, '0')}.`;
    const topicTitle = topic.name;
    const questionCount = `${topic.questions.length}Q`;

    tocEntries.push({
      number: topicNumber,
      title: topicTitle,
      count: questionCount,
      y: currentY,
      page: null
    });

    // More compact TOC layout
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(colors.primary.r, colors.primary.g, colors.primary.b);
    doc.text(topicNumber, margin, currentY);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(colors.text.r, colors.text.g, colors.text.b);

    // Truncate long titles if needed
    const maxTitleWidth = contentWidth - 50;
    const titleLines = doc.splitTextToSize(topicTitle, maxTitleWidth);
    const displayTitle = titleLines[0] + (titleLines.length > 1 ? '...' : '');

    doc.text(displayTitle, margin + 18, currentY);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(colors.secondary.r, colors.secondary.g, colors.secondary.b);
    doc.text(`(${questionCount})`, pageWidth - margin - 25, currentY);

    currentY += 11;
  });

  // CONTENT PAGES - Much more compact
  topics.forEach((topic, topicIndex) => {
    // Don't always start new page - only if needed
    if (topicIndex === 0) {
      addNewPage();
    } else {
      checkNewPage(60); // Only new page if not enough space
    }

    const currentPage = doc.internal.getCurrentPageInfo().pageNumber;
    if (tocEntries[topicIndex]) {
      tocEntries[topicIndex].page = currentPage;
    }

    // Compact topic header
    const headerHeight = 25;
    doc.setFillColor(colors.primary.r, colors.primary.g, colors.primary.b);
    doc.rect(margin, currentY - 3, contentWidth, headerHeight, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    const topicNumber = `${(topicIndex + 1).toString().padStart(2, '0')}.`;
    doc.text(topicNumber, margin + 8, currentY + 10);
    doc.text(topic.name, margin + 25, currentY + 10);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const questionCountText = `${topic.questions.length}Q`;
    doc.text(questionCountText, pageWidth - margin - 8, currentY + 10, { align: 'right' });

    currentY += headerHeight + 8;

    // Compact questions layout
    topic.questions.forEach((question, questionIndex) => {
      checkNewPage(50);

      // Question header - more compact
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(colors.text.r, colors.text.g, colors.text.b);
      doc.text(`Q${questionIndex + 1}:`, margin, currentY);

      currentY += 12;

      // Question text - compact
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const questionLines = doc.splitTextToSize(question.questionText, contentWidth - 5);
      doc.text(questionLines, margin, currentY);
      currentY += questionLines.length * 10 * 0.6 + 8;

      // Options - much more compact
      question.options.forEach((option, optionIndex) => {
        checkNewPage(15);

        const optionLabel = String.fromCharCode(65 + optionIndex);
        const isCorrect = optionIndex === question.correctOptionIdx;

        if (isCorrect) {
          doc.setFillColor(240, 253, 244);
          doc.rect(margin, currentY - 2, contentWidth, 10, 'F');
        }

        doc.setFontSize(9);
        if (isCorrect) {
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(colors.success.r, colors.success.g, colors.success.b);
        } else {
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(colors.text.r, colors.text.g, colors.text.b);
        }

        doc.text(`${optionLabel}.`, margin + 2, currentY + 5);

        // Wrap long options
        const optionLines = doc.splitTextToSize(option, contentWidth - 15);
        doc.text(optionLines, margin + 10, currentY + 5);

        currentY += Math.max(10, optionLines.length * 9);
      });

      currentY += 5;

      // Compact correct answer
      const correctLabel = String.fromCharCode(65 + question.correctOptionIdx);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(colors.success.r, colors.success.g, colors.success.b);
      doc.text(`✓ Answer: ${correctLabel}`, margin, currentY);
      currentY += 12;

      // Compact explanation
      if (includeExplanations && question.explanation) {
        checkNewPage(20);

        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(colors.primary.r, colors.primary.g, colors.primary.b);
        doc.text('Explanation:', margin, currentY);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(colors.text.r, colors.text.g, colors.text.b);
        const explanationLines = doc.splitTextToSize(question.explanation, contentWidth - 5);
        doc.text(explanationLines, margin, currentY + 8);
        currentY += explanationLines.length * 8 * 0.6 + 10;
      }

      currentY += 8; // Reduced space between questions
    });

    currentY += 10; // Small space between topics
  });

  // Update TOC with page numbers - fixed overlapping
  doc.setPage(2);

  tocEntries.forEach(entry => {
    if (entry && entry.page) {
      const pageNumText = entry.page.toString();

      // Simple dot leader without overlapping
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(colors.secondary.r, colors.secondary.g, colors.secondary.b);

      // Calculate available space for dots
      const numberWidth = doc.getTextWidth(entry.number);
      const titleWidth = doc.getTextWidth(entry.title.length > 35 ? entry.title.substring(0, 35) + '...' : entry.title);
      const countWidth = doc.getTextWidth(`(${entry.count})`);
      const pageWidth = doc.getTextWidth(pageNumText);

      const dotsStartX = margin + numberWidth + 18 + titleWidth + 5;
      const dotsEndX = pageWidth - margin - countWidth - pageWidth - 10;

      // Add dots if there's space
      if (dotsEndX > dotsStartX) {
        const dotCount = Math.floor((dotsEndX - dotsStartX) / 2);
        const dots = '.'.repeat(Math.max(0, Math.min(dotCount, 20)));
        doc.text(dots, dotsStartX, entry.y);
      }

      // Page number
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(colors.primary.r, colors.primary.g, colors.primary.b);
      doc.text(pageNumText, pageWidth - margin - 8, entry.y, { align: 'right' });
    }
  });

  // Compact headers and footers
  const totalPages = doc.internal.getNumberOfPages();
  const dateStr = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    if (i > 1) {
      // Compact header
      doc.setDrawColor(colors.border.r, colors.border.g, colors.border.b);
      doc.setLineWidth(0.3);
      doc.line(margin, margin + headerHeight - 2, pageWidth - margin, margin + headerHeight - 2);

      doc.setFontSize(8);
      doc.setTextColor(colors.secondary.r, colors.secondary.g, colors.secondary.b);
      doc.setFont('helvetica', 'normal');
      doc.text('Practice Questions Report', margin, margin + headerHeight - 5);
      doc.text(`${i}/${totalPages}`, pageWidth - margin, margin + headerHeight - 5, { align: 'right' });

      // Compact footer
      const footerY = pageHeight - margin - 3;
      doc.line(margin, footerY - 3, pageWidth - margin, footerY - 3);
      doc.text(`${dateStr} • ${userInfo.name || 'Student'}`, pageWidth / 2, footerY, { align: 'center' });
    }
  }

  const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

  return new NextResponse(pdfBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="practice-questions-${userInfo.name ? userInfo.name.replace(/\s+/g, '-') : 'user'}-${new Date().toISOString().split('T')[0]}.pdf"`
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

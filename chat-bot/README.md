# Purplefish Interview Chatbot

A mobile-first AI-powered interview chatbot for screening nursing candidates, built with Next.js and the AI SDK.

## Features

### Core Functionality

- **Mobile-First Design**: Optimized for smartphone interviews
- **Dynamic Conversation Flow**: Follows nursing-specific interview script with conditional logic
- **Early Exit Scenarios**: Handles salary mismatches, licensing issues, and disinterest
- **Follow-up Questions**: Pushes for clarifications and additional details
- **Company Q&A**: Answers basic questions about the role and company
- **Conversation History**: View and resume past interview sessions

### Interview Flow

1. **Interest Check**: Confirms candidate availability
2. **Basic Information**: Collects name and position interest
3. **Salary Discussion**: Validates salary expectations ($72k max)
4. **License Verification**: Checks RN license status and timeline
5. **Experience Review**: Assesses ICU and acute care background
6. **Completion**: Provides next steps and timeline

## Technology Stack

- **Frontend**: Next.js 14 with App Router
- **AI Integration**: Vercel AI SDK with OpenAI GPT-4o
- **UI Components**: shadcn/ui with Tailwind CSS
- **State Management**: React hooks with localStorage persistence
- **Mobile Optimization**: Touch-friendly interface with responsive design

## Setup Instructions

### Prerequisites

- Node.js 18+
- OpenAI API key

### Installation

1. **Clone the repository**
   \`\`\`bash
   git clone <repository-url>
   cd interview-chatbot
   \`\`\`

2. **Install dependencies**
   \`\`\`bash
   npm install
   \`\`\`

3. **Set up environment variables**
   \`\`\`bash
   cp .env.example .env.local
   \`\`\`
   Add your OpenAI API key:
   \`\`\`
   OPENAI_API_KEY=your_openai_api_key_here
   \`\`\`

4. **Run the development server**
   \`\`\`bash
   npm run dev
   \`\`\`

5. **Open in browser**
   Navigate to `http://localhost:3000`

## Design Decisions

### Mobile-First Approach

- **Single Column Layout**: Eliminates desktop sidebar complexity
- **Touch Optimization**: Large buttons (48px) and input fields
- **Sticky Header**: Always-visible progress and navigation
- **Conversation History**: Slide-in panel for past interviews

### Conversation Logic

- **State Machine**: Clear progression through interview stages
- **Pattern Matching**: Robust extraction of names, salaries, and responses
- **Conditional Branching**: Different paths based on candidate responses
- **Error Handling**: Graceful handling of unexpected inputs

### Data Persistence

- **localStorage**: Client-side conversation history
- **State Embedding**: Interview state hidden in message metadata
- **Resume Capability**: Load and continue previous conversations

### AI Integration

- **Streaming Responses**: Real-time message delivery
- **Context Awareness**: Maintains conversation context throughout
- **Professional Tone**: Consistent, encouraging interview style
- **Company Knowledge**: Built-in responses about role and benefits

## Key Assumptions

1. **Single Interview Script**: Focused on ICU nursing positions
2. **California Licensing**: RN license verification for CA
3. **Salary Cap**: $72,000 maximum compensation
4. **Experience Threshold**: 2+ years ICU experience preferred
5. **Mobile Usage**: Primary interface is smartphone-based

## Technical Highlights

### Intelligent Data Extraction

\`\`\`typescript
function extractStructuredData(text: string, currentState: InterviewState) {
// Pattern matching for names, salaries, license info
// Context-aware parsing based on interview stage
// Robust handling of natural language variations
}
\`\`\`

### Conditional Flow Management

\`\`\`typescript
const stagePrompts = {
salary_negotiation: `Their desired salary is above our max. Ask if they'd accept $${MAX_SALARY}.`,
license_timeline: "Ask when they expect to get their RN license.",
// ... stage-specific prompts
}
\`\`\`

### Mobile-Optimized UI

\`\`\`tsx
// Touch-friendly input with proper sizing
<Input className="h-12 text-base rounded-full" />
// Sticky positioning for mobile navigation

<div className="sticky top-0 z-10 bg-white border-b">
\`\`\`

## Future Enhancements

- **Database Integration**: Replace localStorage with proper database
- **Authentication**: User accounts and secure access
- **Analytics Dashboard**: Interview completion rates and insights
- **Multi-Position Support**: Configurable interview scripts
- **Voice Integration**: Speech-to-text for hands-free interviews

## Testing

The chatbot handles various scenarios:

- ✅ Interested candidates with valid credentials
- ✅ Salary negotiations and rejections
- ✅ License verification and timelines
- ✅ Experience assessment and follow-ups
- ✅ Early exits for unqualified candidates
- ✅ Company questions and role inquiries

## Support

For questions or issues, please refer to the code comments or create an issue in the repository.
